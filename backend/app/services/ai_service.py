import logging
import time
from typing import List, Dict, Any, Optional, Tuple
import asyncio
from datetime import datetime

from app.core.config import settings
from app.services.vector_service import vector_service
from app.services.ai_providers import get_ai_provider, generate_ai_response, generate_embedding
from app.schemas.chat import ChatContextChunk

logger = logging.getLogger(__name__)


class AIService:
    def __init__(self):
        # The AI provider will be determined automatically based on configuration
        logger.info(f"Initializing AI Service with provider: {settings.AI_PROVIDER}")
        if settings.AI_PROVIDER == "ollama":
            logger.info(f"Using Ollama model: {settings.OLLAMA_MODEL} at {settings.OLLAMA_HOST}")
        
        self.max_tokens = 4096
        self.temperature = 0.7
        
    def _format_context_chunks(self, chunks: List[ChatContextChunk]) -> str:
        """Format retrieved chunks into context for DeepSeek R1"""
        if not chunks:
            return ""
            
        context_parts = []
        for i, chunk in enumerate(chunks, 1):
            context_parts.append(f"[Documento {chunk.document_id} - Sezione {i}]")
            context_parts.append(chunk.chunk_text)
            context_parts.append("")  # Empty line for separation
            
        return "\n".join(context_parts)
    
    def _build_system_prompt(self) -> str:
        """Build system prompt for the AI assistant"""
        return """Sei un assistente AI specializzato per studenti universitari di facoltà umanistiche, 
in particolare Storia e Economia dei Beni Culturali. Il tuo compito è aiutare gli studenti 
ad analizzare documenti accademici, estrarre concetti chiave e rispondere a domande specifiche.

Caratteristiche del tuo comportamento:
- Rispondi sempre in italiano
- Sii preciso e accademicamente rigoroso
- Cita sempre le fonti quando possibile
- Fornisci spiegazioni chiare e strutturate
- Aiuta a identificare tesi centrali, concetti chiave e strutture argomentative
- Suggerisci collegamenti tra diversi documenti quando rilevanti

Quando ti vengono forniti documenti come contesto, utilizzali per rispondere alle domande 
dell'utente in modo accurato e dettagliato."""

    def _build_user_prompt(self, user_query: str, context_chunks: List[ChatContextChunk]) -> str:
        """Build user prompt with context and query"""
        if not context_chunks:
            return user_query
            
        formatted_context = self._format_context_chunks(context_chunks)
        
        return f"""Basandoti sui seguenti documenti, rispondi alla domanda dell'utente:

CONTESTO DAI DOCUMENTI:
{formatted_context}

DOMANDA DELL'UTENTE:
{user_query}

Per favore, rispondi alla domanda utilizzando le informazioni del contesto fornito. 
Se la risposta non è direttamente disponibile nei documenti, indica chiaramente 
quali parti dei documenti sono più rilevanti e fornisci una risposta ragionata."""

    async def retrieve_context(
        self, 
        project_id: int, 
        query: str, 
        max_chunks: int = 5
    ) -> List[ChatContextChunk]:
        """Retrieve relevant context chunks for a query using RAG"""
        try:
            # Use vector service to search for relevant chunks
            search_results = vector_service.search_similar_chunks(
                project_id=project_id,
                query=query,
                n_results=max_chunks
            )
            
            if not search_results or not search_results.get('documents'):
                logger.info(f"No relevant chunks found for query in project {project_id}")
                return []
            
            # Convert search results to ChatContextChunk objects
            context_chunks = []
            documents = search_results['documents'][0]
            metadatas = search_results['metadatas'][0]
            distances = search_results['distances'][0]
            
            for i, (doc_text, metadata, distance) in enumerate(zip(documents, metadatas, distances)):
                if doc_text and metadata:
                    # Convert distance to similarity score (lower distance = higher similarity)
                    similarity_score = 1.0 - distance if distance < 1.0 else 0.0
                    
                    chunk = ChatContextChunk(
                        document_id=metadata.get('document_id', 0),
                        chunk_text=doc_text,
                        similarity_score=similarity_score,
                        metadata=metadata
                    )
                    context_chunks.append(chunk)
            
            logger.info(f"Retrieved {len(context_chunks)} context chunks for query")
            return context_chunks
            
        except Exception as e:
            logger.error(f"Error retrieving context: {e}")
            return []
    
    async def generate_response(
        self, 
        user_query: str, 
        context_chunks: List[ChatContextChunk],
        conversation_history: Optional[List[Dict[str, str]]] = None
    ) -> Tuple[str, Dict[str, Any]]:
        """Generate AI response using configured AI provider with RAG context"""
        start_time = time.time()
        
        try:
            # Build context from conversation history and current query
            context_text = ""
            
            # Add conversation history if provided
            if conversation_history:
                for msg in conversation_history[-4:]:  # Last 4 messages for context
                    context_text += f"{msg['role']}: {msg['content']}\n"
            
            # Add current context chunks
            context_text += self._format_context_chunks(context_chunks)
            
            # Build the complete prompt with system instructions + context + query
            system_prompt = self._build_system_prompt()
            full_context = f"{system_prompt}\n\n{context_text}" if context_text else system_prompt
            
            # Use the new AI provider system
            response_content = await generate_ai_response(
                prompt=user_query,
                context=full_context,
                temperature=self.temperature,
                max_tokens=self.max_tokens
            )
            
            # Calculate metadata
            processing_time = int((time.time() - start_time) * 1000)
            
            # Calculate confidence score based on context relevance
            confidence_score = self._calculate_confidence_score(context_chunks)
            
            # Get current model info
            current_model = settings.OLLAMA_MODEL if settings.AI_PROVIDER == "ollama" else settings.AI_PROVIDER
            
            metadata = {
                "ai_model": current_model,
                "ai_provider": settings.AI_PROVIDER,
                "tokens_used": len(response_content.split()) * 1.3,  # Rough estimate
                "processing_time_ms": processing_time,
                "confidence_score": confidence_score,
                "context_chunks_used": len(context_chunks)
            }
            
            logger.info(f"Generated AI response in {processing_time}ms using {current_model}")
            return response_content, metadata
            
        except Exception as e:
            logger.error(f"Error generating AI response: {e}")
            processing_time = int((time.time() - start_time) * 1000)
            
            # Return fallback response
            fallback_response = f"Mi dispiace, si è verificato un errore nella generazione della risposta. Errore: {str(e)}"
            current_model = settings.OLLAMA_MODEL if settings.AI_PROVIDER == "ollama" else settings.AI_PROVIDER
            metadata = {
                "ai_model": current_model,
                "ai_provider": settings.AI_PROVIDER,
                "tokens_used": 0,
                "processing_time_ms": processing_time,
                "confidence_score": 0.0,
                "context_chunks_used": 0,
                "error": str(e)
            }
            
            return fallback_response, metadata
    
    def _calculate_confidence_score(self, context_chunks: List[ChatContextChunk]) -> float:
        """Calculate confidence score based on context relevance"""
        if not context_chunks:
            return 0.0
            
        # Average similarity scores of retrieved chunks
        avg_similarity = sum(chunk.similarity_score for chunk in context_chunks) / len(context_chunks)
        
        # Boost confidence if we have multiple relevant chunks
        chunk_count_boost = min(len(context_chunks) / 5.0, 1.0)
        
        # Final confidence score (0.0 to 1.0)
        confidence = (avg_similarity * 0.7) + (chunk_count_boost * 0.3)
        
        return min(confidence, 1.0)
    
    async def generate_suggested_questions(
        self, 
        project_id: int, 
        recent_documents: List[str] = None
    ) -> List[str]:
        """Generate suggested questions based on project content"""
        try:
            # Get collection stats to understand project content
            stats = vector_service.get_collection_stats(project_id)
            
            if stats.get('total_chunks', 0) == 0:
                return [
                    "Quali sono i concetti chiave in questo documento?",
                    "Puoi riassumere la tesi principale?",
                    "Quali sono le fonti principali citate?",
                    "Come si struttura l'argomentazione?",
                    "Ci sono collegamenti con altri documenti?"
                ]
            
            # For now, return static suggestions
            # In the future, this could use DeepSeek R1 to generate dynamic suggestions
            return [
                "Analizza la tesi centrale dei documenti caricati",
                "Elenca i concetti chiave più importanti",
                "Confronta le diverse argomentazioni presenti",
                "Identifica le fonti bibliografiche principali",
                "Quali sono i punti di forza e debolezza dell'argomentazione?",
                "Suggerisci collegamenti con altri argomenti di studio"
            ]
            
        except Exception as e:
            logger.error(f"Error generating suggested questions: {e}")
            return [
                "Puoi aiutarmi a capire questo documento?",
                "Quali sono i punti principali?",
                "Come posso approfondire questo argomento?"
            ]

    async def analyze_document(self, document_text: str, filename: str) -> Dict[str, Any]:
        """Analyze a document to extract thesis, key concepts, structure, and citations"""
        if not document_text or len(document_text.strip()) < 100:
            raise ValueError("Document text is too short for meaningful analysis")
        
        start_time = time.time()
        
        try:
            # Run all analyses in parallel for efficiency
            central_thesis_task = self._extract_central_thesis(document_text, filename)
            key_concepts_task = self._extract_key_concepts(document_text, filename)
            structure_task = self._analyze_argumentative_structure(document_text, filename)
            citations_task = self._extract_citations(document_text, filename)
            
            # Wait for all analyses to complete
            central_thesis = await central_thesis_task
            key_concepts = await key_concepts_task
            argumentative_structure = await structure_task
            cited_sources = await citations_task
            
            processing_time = int((time.time() - start_time) * 1000)
            
            current_model = settings.OLLAMA_MODEL if settings.AI_PROVIDER == "ollama" else settings.AI_PROVIDER
            
            analysis_result = {
                "central_thesis": central_thesis,
                "key_concepts": key_concepts,
                "argumentative_structure": argumentative_structure,
                "cited_sources": cited_sources,
                "analysis_metadata": {
                    "ai_model": current_model,
                    "ai_provider": settings.AI_PROVIDER,
                    "processing_time_ms": processing_time,
                    "analyzed_at": datetime.now().isoformat(),
                    "document_length": len(document_text),
                    "filename": filename
                }
            }
            
            logger.info(f"Completed document analysis in {processing_time}ms for {filename}")
            return analysis_result
            
        except Exception as e:
            logger.error(f"Error analyzing document {filename}: {e}")
            raise

    async def _extract_central_thesis(self, document_text: str, filename: str) -> str:
        """Extract the central thesis from the document"""
        try:
            prompt = f"""Analizza il seguente documento accademico e identifica la tesi centrale.

DOCUMENTO: {filename}

TESTO:
{document_text[:3000]}...

ISTRUZIONI:
1. Identifica la tesi centrale o argomentazione principale del documento
2. Riassumi in 2-3 frasi la tesi centrale
3. Sii preciso e accademicamente rigoroso
4. Se il documento non ha una tesi chiara, spiega qual è l'obiettivo principale

RISPOSTA (solo la tesi centrale, senza introduzioni):"""

            response = await generate_ai_response(
                prompt=prompt,
                context="",
                temperature=0.3,
                max_tokens=800
            )
            
            return response if response else "Tesi centrale non identificata"
            
        except Exception as e:
            logger.error(f"Error extracting central thesis: {e}")
            return "Errore nell'estrazione della tesi centrale"

    async def _extract_key_concepts(self, document_text: str, filename: str) -> List[str]:
        """Extract key concepts from the document"""
        try:
            prompt = f"""Analizza il seguente documento accademico e identifica i concetti chiave.

DOCUMENTO: {filename}

TESTO:
{document_text[:3000]}...

ISTRUZIONI:
1. Identifica i 5-8 concetti più importanti del documento
2. Concentrati su concetti specifici e significativi
3. Evita termini troppo generici o ovvi
4. Ordina per importanza

RISPOSTA (solo i concetti separati da virgole, senza numerazione):"""

            response = await generate_ai_response(
                prompt=prompt,
                context="",
                temperature=0.2,
                max_tokens=400
            )
            
            if response:
                concepts_text = response
                # Parse concepts from response
                concepts = [concept.strip() for concept in concepts_text.split(',') if concept.strip()]
                return concepts[:8]  # Limit to max 8 concepts
            
            return []
            
        except Exception as e:
            logger.error(f"Error extracting key concepts: {e}")
            return []

    async def _analyze_argumentative_structure(self, document_text: str, filename: str) -> Dict[str, Any]:
        """Analyze the argumentative structure of the document"""
        try:
            prompt = f"""Analizza la struttura argomentativa del seguente documento accademico.

DOCUMENTO: {filename}

TESTO:
{document_text[:3000]}...

ISTRUZIONI:
1. Identifica l'introduzione, sviluppo e conclusione
2. Individua i passaggi logici principali dell'argomentazione
3. Identifica le transizioni e i collegamenti tra le sezioni
4. Descrivi la strategia argomentativa usata

RISPOSTA in formato JSON:
{{
    "introduction": "descrizione dell'introduzione",
    "main_arguments": ["argomento 1", "argomento 2", "argomento 3"],
    "logical_flow": "descrizione del flusso logico",
    "conclusion": "descrizione della conclusione",
    "argumentative_strategy": "strategia argomentativa utilizzata"
}}"""

            response = await generate_ai_response(
                prompt=prompt,
                context="",
                temperature=0.3,
                max_tokens=1000
            )
            
            if response:
                response_text = response
                try:
                    # Try to parse JSON response
                    import json
                    # Extract JSON from response (in case there's extra text)
                    json_start = response_text.find('{')
                    json_end = response_text.rfind('}') + 1
                    if json_start >= 0 and json_end > json_start:
                        json_str = response_text[json_start:json_end]
                        return json.loads(json_str)
                except:
                    # If JSON parsing fails, return structured text
                    return {
                        "introduction": "Struttura non identificata",
                        "main_arguments": [],
                        "logical_flow": response_text,
                        "conclusion": "Conclusione non identificata",
                        "argumentative_strategy": "Strategia non identificata"
                    }
            
            return {
                "introduction": "Analisi non disponibile",
                "main_arguments": [],
                "logical_flow": "Analisi non disponibile",
                "conclusion": "Analisi non disponibile",
                "argumentative_strategy": "Analisi non disponibile"
            }
            
        except Exception as e:
            logger.error(f"Error analyzing argumentative structure: {e}")
            return {
                "introduction": "Errore nell'analisi",
                "main_arguments": [],
                "logical_flow": "Errore nell'analisi",
                "conclusion": "Errore nell'analisi",
                "argumentative_strategy": "Errore nell'analisi"
            }

    async def _extract_citations(self, document_text: str, filename: str) -> List[Dict[str, Any]]:
        """Extract citations and sources from the document"""
        try:
            prompt = f"""Identifica tutte le citazioni e fonti bibliografiche nel seguente documento.

DOCUMENTO: {filename}

TESTO:
{document_text[:3000]}...

ISTRUZIONI:
1. Identifica citazioni dirette e indirette
2. Trova riferimenti bibliografici
3. Identifica autori, opere e date quando possibile
4. Distingui tra fonti primarie e secondarie

RISPOSTA in formato JSON array:
[
    {{
        "author": "nome autore",
        "title": "titolo opera",
        "year": "anno pubblicazione",
        "type": "primaria/secondaria",
        "citation_context": "contesto della citazione"
    }}
]"""

            response = await generate_ai_response(
                prompt=prompt,
                context="",
                temperature=0.2,
                max_tokens=1000
            )
            
            if response:
                response_text = response
                try:
                    # Try to parse JSON response
                    import json
                    # Extract JSON from response
                    json_start = response_text.find('[')
                    json_end = response_text.rfind(']') + 1
                    if json_start >= 0 and json_end > json_start:
                        json_str = response_text[json_start:json_end]
                        citations = json.loads(json_str)
                        return citations[:10]  # Limit to max 10 citations
                except:
                    # If JSON parsing fails, return empty list
                    pass
            
            return []
            
        except Exception as e:
            logger.error(f"Error extracting citations: {e}")
            return []

    async def reanalyze_document(self, document_text: str, filename: str, focus_areas: List[str] = None) -> Dict[str, Any]:
        """Re-analyze a document with optional focus on specific areas"""
        if not focus_areas:
            return await self.analyze_document(document_text, filename)
        
        # For focused re-analysis, we could implement specific analysis for requested areas
        # For now, we'll run the full analysis and return all results
        return await self.analyze_document(document_text, filename)


# Singleton instance
ai_service = AIService() 