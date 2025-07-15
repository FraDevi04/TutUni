# 🧠 TutUni AI - Assistente di Ricerca Universitario

> **✅ PROGETTO COMPLETO AL 100%** - Un assistente di ricerca AI specializzato per studenti di facoltà umanistiche che analizza documenti accademici, estrae concetti chiave e supporta la ricerca con intelligenza artificiale avanzata.

![TutUni AI](https://img.shields.io/badge/TutUni%20AI-v1.0.0-brightgreen)
![Status](https://img.shields.io/badge/Status-Complete-brightgreen)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![FastAPI](https://img.shields.io/badge/FastAPI-0.104-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)
![Python](https://img.shields.io/badge/Python-3.11+-yellow)

## 🎯 Stato del Progetto

**✅ IMPLEMENTAZIONE COMPLETA (100%)**

Tutti i componenti e funzionalità previsti nel planning sono stati implementati e testati:

- ✅ **Sistema di Autenticazione** - Login/Registrazione completo
- ✅ **Gestione Progetti** - CRUD completo con limiti utente
- ✅ **Upload e Processing Documenti** - Drag & drop con elaborazione background
- ✅ **Vector Database & RAG** - ChromaDB con embeddings e ricerca semantica
- ✅ **Analisi AI Specializzata** - 4 tipi di analisi (tesi, concetti, struttura, citazioni)
- ✅ **Chat AI Contestuale** - Interfaccia conversazionale con RAG
- ✅ **Dashboard Completo** - Statistiche, metriche e gestione
- ✅ **UI/UX Moderno** - Componenti shadcn/ui responsive
- ✅ **Deployment Ready** - Build e configurazione per produzione

## 📋 Panoramica del Progetto

**TutUni AI** è una piattaforma full-stack progettata specificamente per studenti di Storia, Economia dei Beni Culturali e altre discipline umanistiche. Utilizza l'intelligenza artificiale per:

- 📄 **Analizzare documenti accademici** (PDF, DOCX)
- 🧠 **Estrarre tesi centrali e concetti chiave**
- 🔍 **Identificare strutture argomentative**
- 💬 **Fornire chat AI contestuale** con tecnologia RAG
- 📚 **Gestire progetti di ricerca** organizzati

## 🏗️ Architettura Tecnica

### Frontend (Next.js 14)
- **Framework**: Next.js 14 (App Router)
- **Linguaggio**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Autenticazione**: NextAuth.js
- **State Management**: Zustand + TanStack Query
- **Form Validation**: React Hook Form + Zod
- **File Upload**: React Dropzone
- **Notifications**: Sonner
- **UI Components**: shadcn/ui (Button, Input, Card, Toast, ScrollArea, etc.)

### Backend (FastAPI)
- **Framework**: FastAPI
- **Database**: PostgreSQL + SQLAlchemy (Async)
- **Vector Database**: ChromaDB (per RAG)
- **Cache**: Redis
- **AI Integration**: DeepSeek R1 (via Ollama)
- **Document Processing**: PyMuPDF + python-docx
- **Background Processing**: Async queue system per embeddings
- **Embedding Model**: sentence-transformers (multilingual)

### Infrastructure
- **Frontend Deploy**: Vercel
- **Backend Deploy**: Render/Railway
- **Database**: Neon/Supabase (PostgreSQL managed)
- **Monitoring**: Sentry + PostHog

## 🚀 Quick Start

### Prerequisiti
- Node.js 18+ e npm/yarn
- Python 3.11+
- PostgreSQL
- Redis (opzionale per cache)

### 1. Setup Frontend

```bash
# Clona il repository
git clone https://github.com/your-username/tutuni-ai.git
cd tutuni-ai

# Installa dipendenze frontend
npm install

# Crea file environment
cp .env.example .env.local

# Configura variabili d'ambiente (vedi sezione Configurazione)
# Modifica .env.local con le tue configurazioni

# Avvia il dev server
npm run dev
```

Il frontend sarà disponibile su `http://localhost:3000`

### 2. Setup Backend

```bash
# Entra nella directory backend
cd backend

# Installa dipendenze Python
pip install -r requirements.txt
# Oppure con Poetry:
poetry install

# Crea file environment
cp .env.example .env

# Configura variabili d'ambiente (vedi sezione Configurazione)
# Modifica .env con le tue configurazioni

# Avvia il server FastAPI
python main.py
# Oppure con uvicorn:
uvicorn main:app --reload
```

Il backend sarà disponibile su `http://localhost:8000`

### 3. Configurazione Database

```bash
# Nel backend, crea le tabelle
cd backend
python -c "
import asyncio
from app.core.database import create_tables
asyncio.run(create_tables())
"
```

## 🔧 Configurazione

### Frontend (.env.local)
```env
# NextAuth.js Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-super-secret-key-here-change-in-production

# API Configuration
API_BASE_URL=http://localhost:8000
BACKEND_URL=http://localhost:8000

# Public API URL (per client-side requests)
NEXT_PUBLIC_API_URL=http://localhost:8000

# AI Services (opzionale per client-side)
# Note: AI processing is handled by the backend Ollama instance
```

### Backend (.env)
```env
# Database
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/tutuni_ai
REDIS_URL=redis://localhost:6379

# Security
SECRET_KEY=your-super-secret-jwt-key
ALGORITHM=HS256

# AI Services
AI_PROVIDER=ollama
OLLAMA_HOST=http://100.65.152.95:11434
OLLAMA_MODEL=deepseek-r1:latest
OLLAMA_EMBEDDING_MODEL=deepseek-r1:latest

# Vector Database
VECTOR_DB_PATH=./data/vector_db

# File Upload
UPLOAD_DIR=uploads
MAX_FILE_SIZE=10485760  # 10MB

# CORS
ALLOWED_ORIGINS=["http://localhost:3000"]
```

## 📚 Funzionalità Implementate (100%)

### ✅ Sprint 1-2: Fondamenta e Setup (Completato)
- [x] **Setup Next.js 14** con TypeScript e App Router
- [x] **Sistema di autenticazione** completo con NextAuth.js
- [x] **Registrazione e login** con validazione form
- [x] **Dashboard principale** con sidebar progetti
- [x] **Layout responsive** con tabs e navigation
- [x] **Header componente** con user menu e dropdown
- [x] **Gestione progetti** (CRUD completo)
- [x] **Project stats** e progress tracking
- [x] **UI Components** shadcn/ui completi

### ✅ Sprint 3-4: Document Management (Completato)
- [x] **Upload drag & drop** per PDF/DOCX
- [x] **Text extraction** con PyMuPDF e python-docx
- [x] **File validation** e storage management
- [x] **Status tracking** documenti real-time
- [x] **Background processing** asincrono
- [x] **Chunking intelligente** del testo estratto
- [x] **Integrazione ChromaDB** per vector storage
- [x] **Sistema embeddings** con sentence-transformers
- [x] **RAG foundation** implementata

### ✅ Sprint 5-6: AI Analysis & Chat (Completato)
- [x] **AI Service** con integrazione DeepSeek R1
- [x] **RAG Pipeline** completo con ChromaDB
- [x] **Chat Interface** con interfaccia moderna
- [x] **Suggested Questions** basate sul contenuto
- [x] **Context-aware** conversations
- [x] **Metadata tracking** (tokens, timing, confidence)
- [x] **Real-time chat** con error handling
- [x] **Mobile responsive** design
- [x] **Analisi AI specializzata** (4 tipi: tesi, concetti, struttura, citazioni)
- [x] **Background processing** per analisi

### ✅ Sprint 7-8: Dashboard & UI Polish (Completato)
- [x] **Dashboard completo** con statistiche
- [x] **Components UI** tutti implementati
- [x] **User onboarding** flow
- [x] **Error handling** robusto
- [x] **Loading states** e skeleton screens
- [x] **Toast notifications** sistema
- [x] **Performance optimization**
- [x] **TypeScript** configurazione completa
- [x] **Build optimization** per produzione

## 🎨 Componenti UI Implementati

### Core Components
- ✅ **Button** - Componente pulsante con varianti
- ✅ **Input** - Campo input con validazione
- ✅ **Card** - Componente card per layout
- ✅ **Badge** - Badge per etichette e status
- ✅ **Progress** - Barra di progresso
- ✅ **Skeleton** - Loading placeholder
- ✅ **Tabs** - Navigazione a schede
- ✅ **Label** - Etichette form

### Advanced Components
- ✅ **DropdownMenu** - Menu dropdown con Radix UI
- ✅ **Toast** - Sistema notifiche con Radix UI
- ✅ **ScrollArea** - Area scrollabile personalizzata
- ✅ **Textarea** - Campo testo multilinea
- ✅ **useToast** - Hook per gestione notifiche

### Layout Components
- ✅ **DashboardHeader** - Header principale con logo e menu
- ✅ **DashboardStats** - Statistiche dashboard
- ✅ **ProjectsList** - Lista progetti sidebar
- ✅ **QuickActions** - Azioni rapide dashboard

### Specialized Components
- ✅ **ChatInterface** - Interfaccia chat completa
- ✅ **DocumentUpload** - Upload documenti drag & drop
- ✅ **DocumentsList** - Lista documenti progetto
- ✅ **AnalysisDisplay** - Visualizzazione analisi AI

## 🤖 Sistema Chat AI & RAG Implementation

### Overview
Il sistema di chat end-to-end è stato implementato con successo, includendo il pipeline RAG (Retrieval Augmented Generation) completo. Gli utenti possono fare domande sui loro documenti e ricevere risposte intelligenti basate sul contenuto.

### Features Chat Complete

#### ✅ Backend Features
- **RAG Pipeline**: Ricerca semantica + generazione DeepSeek R1
- **Vector Search**: ChromaDB per trovare chunk rilevanti
- **Chat History**: Memorizzazione conversazioni nel database
- **Suggested Questions**: Domande suggerite basate sul contenuto
- **Context Aware**: Usa cronologia conversazione per continuità
- **Metadata Tracking**: Tokens utilizzati, tempo di elaborazione, fiducia

#### ✅ Frontend Features
- **Real-time Chat**: Interfaccia chat moderna con messaggi in tempo reale
- **Message History**: Cronologia completa delle conversazioni
- **Suggested Questions**: Bottoni per domande suggerite
- **Loading States**: Indicatori di caricamento e typing
- **Error Handling**: Gestione errori con messaggi user-friendly
- **Mobile Responsive**: Design ottimizzato per tutti i device
- **ScrollArea**: Scrolling fluido per conversazioni lunghe
- **Toast Notifications**: Feedback immediato per azioni

### RAG Pipeline Flow

```
1. 👤 User Question
   ↓
2. 🔍 Vector Search (ChromaDB)
   ↓
3. 📄 Retrieve Relevant Chunks
   ↓
4. 🤖 DeepSeek R1 API Call with Context
   ↓
5. 💬 AI Response
   ↓
6. 💾 Store in Database
   ↓
7. 📱 Display to User
```

## 🔐 Sistema di Autenticazione

### Features Implementate
- ✅ **NextAuth.js** integration completa
- ✅ **JWT tokens** per API authentication
- ✅ **Role-based access** (free/pro tiers)
- ✅ **Session management** con refresh automatico
- ✅ **Password security** con hashing bcrypt
- ✅ **Form validation** con error handling
- ✅ **Auto-login** dopo registrazione
- ✅ **Responsive design** mobile-first

### Pagine Implementate
- ✅ **Login Page** (`/auth/login`) - Accesso utente
- ✅ **Register Page** (`/auth/register`) - Registrazione nuovi utenti
- ✅ **Protected Routes** - Middleware per protezione pagine
- ✅ **User Session** - Gestione sessione utente

## 📊 API Endpoints Implementati

### Authentication
```http
POST /api/auth/register    # Registrazione utente
POST /api/auth/login       # Login utente
GET  /api/auth/profile     # Profilo utente
```

### Projects
```http
GET    /api/projects       # Lista progetti utente
POST   /api/projects       # Crea nuovo progetto
GET    /api/projects/{id}  # Dettagli progetto
PUT    /api/projects/{id}  # Aggiorna progetto
DELETE /api/projects/{id}  # Elimina progetto
```

### Documents
```http
POST   /api/documents/upload/{projectId}     # Upload documenti
GET    /api/documents/project/{projectId}    # Lista documenti progetto
GET    /api/documents/{id}                   # Dettagli documento
DELETE /api/documents/{id}                   # Elimina documento
POST   /api/documents/{id}/analyze           # Analizza documento
POST   /api/documents/{id}/reprocess         # Riprocessa documento
```

### Chat
```http
POST   /api/chat/projects/{projectId}/messages           # Invia messaggio
GET    /api/chat/projects/{projectId}/history            # Cronologia chat
DELETE /api/chat/projects/{projectId}/history            # Cancella cronologia
GET    /api/chat/projects/{projectId}/suggested-questions # Domande suggerite
```

## 🚀 Build e Deployment

### Build di Produzione
```bash
# Frontend build
npm run build
npm run start

# Backend build
cd backend
pip install -r requirements.txt
python main.py
```

### Deployment Vercel (Frontend)
```bash
# Deploy automatico su push
git push origin main

# Oppure deploy manuale
vercel deploy --prod
```

### Deployment Backend
```bash
# Render/Railway deployment
# Configura environment variables
# Push repository per auto-deploy
```

### Environment Variables Produzione
```env
# Frontend
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-production-secret
API_BASE_URL=https://your-backend-url.com

# Backend
DATABASE_URL=postgresql://prod-db-url
AI_PROVIDER=ollama
OLLAMA_HOST=http://100.65.152.95:11434
OLLAMA_MODEL=deepseek-r1:latest
OLLAMA_EMBEDDING_MODEL=deepseek-r1:latest
ALLOWED_ORIGINS=["https://your-domain.com"]
```

## 🧪 Testing

### Frontend Testing
```bash
# Type checking
npm run type-check

# Build test
npm run build

# Linting
npm run lint
```

### Backend Testing
```bash
# Run tests
cd backend
python -m pytest

# Test specific components
python test_background_processor.py
```

## 📈 Performance & Monitoring

### Metriche Implementate
- **Build Size**: Bundle ottimizzato per produzione
- **Loading Times**: Lazy loading e code splitting
- **API Response**: Monitoring tempi risposta
- **Database**: Query optimization e indexing
- **Vector Search**: Performance embedding e ricerca

### Monitoring Tools
- **Vercel Analytics** - Frontend performance
- **Sentry** - Error tracking (configurazione pronta)
- **PostHog** - User analytics (configurazione pronta)

## 🎯 Caratteristiche Principali

### Per Studenti
- 📚 **Gestione progetti** di ricerca organizzati
- 📄 **Upload semplice** documenti PDF/DOCX
- 🤖 **Analisi AI automatica** tesi e concetti
- 💬 **Chat intelligente** sui documenti
- 📊 **Dashboard** con statistiche progresso

### Per Sviluppatori
- 🏗️ **Architettura scalabile** full-stack
- 🔒 **Security-first** con JWT e validation
- 📱 **Mobile responsive** design
- 🎨 **UI moderna** con shadcn/ui
- ⚡ **Performance optimized** per produzione

## 🤝 Contribuire

Il progetto è completo e pronto per l'uso. Per contribuire:

1. Fork il repository
2. Crea un branch per la tua feature
3. Commit le modifiche
4. Push al branch
5. Crea una Pull Request

## 📄 Licenza

Questo progetto è rilasciato sotto licenza MIT. Vedi il file `LICENSE` per dettagli.

## 🙏 Ringraziamenti

- **DeepSeek R1** (via Ollama) per l'API AI
- **shadcn/ui** per i componenti UI
- **Next.js** e **FastAPI** per i framework
- **Community open source** per le librerie utilizzate

---

**TutUni AI** - Trasforma la tua ricerca universitaria con l'intelligenza artificiale 🎓✨ 