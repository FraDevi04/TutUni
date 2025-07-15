"""
AI Providers - Support for multiple AI services including free alternatives
"""

import os
from typing import Any, Dict, List, Optional, Union
from abc import ABC, abstractmethod
import asyncio
import httpx
from anthropic import Anthropic
from app.core.config import settings

class AIProvider(ABC):
    """Abstract base class for AI providers"""
    
    @abstractmethod
    async def generate_response(self, prompt: str, context: str = "", **kwargs) -> str:
        pass
    
    @abstractmethod
    async def generate_embedding(self, text: str) -> List[float]:
        pass

class AnthropicProvider(AIProvider):
    """Anthropic Claude provider"""
    
    def __init__(self, api_key: str):
        self.client = Anthropic(api_key=api_key)
    
    async def generate_response(self, prompt: str, context: str = "", **kwargs) -> str:
        try:
            full_prompt = f"{context}\n\n{prompt}" if context else prompt
            
            message = self.client.messages.create(
                model="deepseek-r1:latest",  # Using deepseek-r1 model
                max_tokens=1000,
                messages=[{"role": "user", "content": full_prompt}]
            )
            
            return message.content[0].text
        except Exception as e:
            raise Exception(f"Anthropic API error: {str(e)}")
    
    async def generate_embedding(self, text: str) -> List[float]:
        # Anthropic doesn't provide embeddings, fallback to local model
        return await LocalTransformersProvider().generate_embedding(text)

class GroqProvider(AIProvider):
    """Groq API provider (Free tier available)"""
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://api.groq.com/openai/v1"
    
    async def generate_response(self, prompt: str, context: str = "", **kwargs) -> str:
        try:
            full_prompt = f"{context}\n\n{prompt}" if context else prompt
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": "deepseek-r1:latest",  # Using deepseek-r1 model
                        "messages": [{"role": "user", "content": full_prompt}],
                        "max_tokens": 1000,
                        "temperature": 0.7
                    }
                )
                
                if response.status_code != 200:
                    raise Exception(f"Groq API error: {response.text}")
                
                data = response.json()
                return data["choices"][0]["message"]["content"]
                
        except Exception as e:
            raise Exception(f"Groq API error: {str(e)}")
    
    async def generate_embedding(self, text: str) -> List[float]:
        # Groq doesn't provide embeddings, fallback to local model
        return await LocalTransformersProvider().generate_embedding(text)

class OllamaProvider(AIProvider):
    """Ollama local provider (Completely free)"""
    
    def __init__(self, host: str = "http://100.65.152.95:11434"):
        self.host = host
    
    async def generate_response(self, prompt: str, context: str = "", **kwargs) -> str:
        try:
            full_prompt = f"{context}\n\n{prompt}" if context else prompt
            
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    f"{self.host}/api/generate",
                    json={
                        "model": kwargs.get("model", settings.OLLAMA_MODEL),  # Use configured model
                        "prompt": full_prompt,
                        "stream": False,
                        "options": {
                            "temperature": 0.7,
                            "top_p": 0.9,
                            "max_tokens": 1000
                        }
                    }
                )
                
                if response.status_code != 200:
                    raise Exception(f"Ollama API error: {response.text}")
                
                data = response.json()
                return data["response"]
                
        except Exception as e:
            raise Exception(f"Ollama API error: {str(e)}")
    
    async def generate_embedding(self, text: str) -> List[float]:
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.host}/api/embeddings",
                    json={
                        "model": settings.OLLAMA_EMBEDDING_MODEL,  # Use configured embedding model
                        "prompt": text
                    }
                )
                
                if response.status_code != 200:
                    # Fallback to local transformers
                    return await LocalTransformersProvider().generate_embedding(text)
                
                data = response.json()
                return data["embedding"]
                
        except Exception as e:
            # Fallback to local transformers
            return await LocalTransformersProvider().generate_embedding(text)

class LocalTransformersProvider(AIProvider):
    """Local Hugging Face Transformers provider (Completely free)"""
    
    def __init__(self):
        self._model = None
        self._tokenizer = None
        self._embedding_model = None
    
    async def _load_model(self):
        """Load model lazily"""
        if self._model is None:
            try:
                from transformers import AutoTokenizer, AutoModelForCausalLM
                import torch
                
                model_name = "microsoft/DialoGPT-medium"  # Small conversational model
                
                self._tokenizer = AutoTokenizer.from_pretrained(model_name)
                self._model = AutoModelForCausalLM.from_pretrained(model_name)
                
                # Set pad token
                if self._tokenizer.pad_token is None:
                    self._tokenizer.pad_token = self._tokenizer.eos_token
                    
            except ImportError:
                raise Exception("Transformers library not installed. Run: pip install transformers torch")
    
    async def _load_embedding_model(self):
        """Load embedding model lazily"""
        if self._embedding_model is None:
            try:
                from sentence_transformers import SentenceTransformer
                
                # Use a multilingual model
                self._embedding_model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')
                
            except ImportError:
                raise Exception("Sentence-transformers library not installed. Run: pip install sentence-transformers")
    
    async def generate_response(self, prompt: str, context: str = "", **kwargs) -> str:
        try:
            await self._load_model()
            
            full_prompt = f"{context}\n\n{prompt}" if context else prompt
            
            # Tokenize input
            inputs = self._tokenizer.encode(full_prompt, return_tensors="pt")
            
            # Generate response
            with torch.no_grad():
                outputs = self._model.generate(
                    inputs,
                    max_length=inputs.shape[1] + 100,
                    num_return_sequences=1,
                    temperature=0.7,
                    pad_token_id=self._tokenizer.pad_token_id,
                    do_sample=True
                )
            
            # Decode response
            response = self._tokenizer.decode(outputs[0], skip_special_tokens=True)
            
            # Remove the input prompt from response
            response = response[len(full_prompt):].strip()
            
            return response if response else "Mi dispiace, non riesco a generare una risposta appropriata."
            
        except Exception as e:
            raise Exception(f"Local Transformers error: {str(e)}")
    
    async def generate_embedding(self, text: str) -> List[float]:
        try:
            await self._load_embedding_model()
            
            # Generate embedding
            embedding = self._embedding_model.encode(text)
            
            return embedding.tolist()
            
        except Exception as e:
            raise Exception(f"Local embedding error: {str(e)}")

class AIProviderFactory:
    """Factory for creating AI providers"""
    
    @staticmethod
    def create_provider(provider_type: str = None) -> AIProvider:
        """Create AI provider based on configuration"""
        
        if provider_type is None:
            provider_type = settings.AI_PROVIDER
        
        if provider_type == "anthropic" and settings.ANTHROPIC_API_KEY:
            return AnthropicProvider(settings.ANTHROPIC_API_KEY)
        
        elif provider_type == "groq" and settings.GROQ_API_KEY:
            return GroqProvider(settings.GROQ_API_KEY)
        
        elif provider_type == "ollama":
            return OllamaProvider(settings.OLLAMA_HOST)
        
        elif provider_type == "local":
            return LocalTransformersProvider()
        
        else:
            # Default fallback order
            if settings.ANTHROPIC_API_KEY:
                return AnthropicProvider(settings.ANTHROPIC_API_KEY)
            elif settings.GROQ_API_KEY:
                return GroqProvider(settings.GROQ_API_KEY)
            else:
                # Try Ollama first (if available), then local transformers
                try:
                    return OllamaProvider(settings.OLLAMA_HOST)
                except:
                    return LocalTransformersProvider()

# Global AI provider instance
_ai_provider: Optional[AIProvider] = None

async def get_ai_provider() -> AIProvider:
    """Get the configured AI provider"""
    global _ai_provider
    
    if _ai_provider is None:
        _ai_provider = AIProviderFactory.create_provider()
    
    return _ai_provider

async def generate_ai_response(prompt: str, context: str = "", **kwargs) -> str:
    """Generate AI response using the configured provider"""
    provider = await get_ai_provider()
    return await provider.generate_response(prompt, context, **kwargs)

async def generate_embedding(text: str) -> List[float]:
    """Generate embedding using the configured provider"""
    provider = await get_ai_provider()
    return await provider.generate_embedding(text) 