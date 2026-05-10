# NotebookLM Clone — RAG Powered Document Chat

> One-line description: Upload any PDF and chat with it using AI — answers come strictly from your document, never hallucinated.

---

## Demo

![App Screenshot](./demo.png)

---

## What This Does
This app acts as your personal document assistant. You can upload a PDF or text file, and it instantly "reads" and organizes the information into small chunks. You can then ask any question about the content, and the AI will provide precise answers based **only** on the text you provided, complete with source citations to show exactly where the info came from.

---

## Tech Stack
| Layer | Technology |
|---|---|
| Frontend | React + Vite |
| Backend | Node.js + Express |
| Embeddings | HuggingFace (all-MiniLM-L6-v2) — free, no key |
| LLM | Groq (llama-3.1-8b-instant) — free |
| Vector DB | Qdrant Cloud — free tier |
| Deployment | Vercel (frontend) + Render (backend) |

---

## RAG Pipeline — How It Works

```text
Upload → Parse PDF → Chunk Text → Embed Chunks → Store in Qdrant
                                                        ↓
                          Answer ← Generate (Groq) ← Retrieve Top 5
```

1. **Ingestion**: When you upload a file, the server reads the PDF/TXT and extracts the raw text while keeping track of page numbers.
2. **Chunking**: The text is split using a `RecursiveCharacterTextSplitter` into chunks of 1000 characters with a 200-character overlap. This ensures the AI has manageable "snippets" to look through without losing context between sections.
3. **Embedding**: We use a local HuggingFace model to turn these text snippets into "vectors" (mathematical representations of meaning). This allows the computer to understand which parts of your document are similar to your question.
4. **Storage**: These vectors are stored in Qdrant Cloud. Unlike a normal database that searches for exact words, a Vector DB searches for "meaning" and "concepts."
5. **Retrieval**: When you ask a question, the app finds the top 5 most relevant chunks from your document using Cosine Similarity search.
6. **Generation**: These 5 chunks are sent to the Groq Llama 3.1 model. The model is strictly instructed to use **ONLY** these snippets to answer, ensuring no outside knowledge or hallucinations.

---

## Project Structure
```text
.
├── client/                 # React frontend (Vite)
│   ├── src/
│   │   ├── App.jsx         # Main UI and chat logic
│   │   ├── index.css       # Premium styles (glassmorphism)
│   │   └── main.jsx        # App entry point
│   └── index.html          # HTML template with Google Fonts
├── server/                 # Node.js backend (Express)
│   ├── uploads/            # Temporary storage for uploaded files
│   ├── index.js            # Server entry, routes, and middleware
│   ├── ingest.js           # Logic for chunking and embedding
│   └── retrieve.js         # Logic for search and LLM generation
├── .env                    # Local environment variables
├── .env.example            # Template for environment variables
├── .gitignore              # Files excluded from Git
└── README.md               # Project documentation
```

---

## Environment Variables
| Variable | Where to get it | Required |
|----------|----------------|----------|
| GROQ_API_KEY | console.groq.com | Yes |
| QDRANT_URL | cloud.qdrant.io | Yes |
| QDRANT_API_KEY | cloud.qdrant.io | Yes |
| COLLECTION_NAME | any name you choose | Yes |
| VITE_API_URL | your Render backend URL | Frontend only |

---

## How to Run Locally — Step by Step

### Prerequisites
- Node.js 18+ installed
- Git installed
- Groq API key (free at console.groq.com)
- Qdrant Cloud account (free at cloud.qdrant.io)

### Step 1 — Clone the repo
```bash
git clone <your-repo-url>
cd <repo-folder>
```

### Step 2 — Set up environment variables
```bash
cp .env.example .env
# Now open .env and fill in your keys
```

### Step 3 — Install backend dependencies
```bash
cd server
npm install
```

### Step 4 — Install frontend dependencies
```bash
cd ../client
npm install
```

### Step 5 — Run backend
```bash
cd ../server
npm run dev
# Server runs on http://localhost:8000
```

### Step 6 — Run frontend (new terminal)
```bash
cd client
npm run dev
# App opens on http://localhost:5173
```

### Step 7 — Test it
- Upload any PDF using the upload panel
- Wait for "Indexing complete" message
- Ask a question about your document
- See the answer + sources

---

## How to Push to GitHub — Step by Step

### First time setup:
1. Go to github.com → New Repository
2. Name it: `notebooklm-clone`
3. Set it to **PUBLIC** (required for submission)
4. Do **NOT** initialize with README (we already have one)
5. Click **Create Repository**

### Push your code:
```bash
# Inside your project root folder
git init
git add .
git status   
# verify .env is NOT in the list — if it is, stop and fix .gitignore

git commit -m "Initial commit — NotebookLM RAG clone"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/notebooklm-clone.git
git push -u origin main
```

### Verify:
- Go to your GitHub repo
- Confirm `.env` file is **NOT** visible
- Confirm `node_modules` is **NOT** visible
- Confirm all your files are there

---

## How to Deploy — Step by Step

### Deploy Backend on Render (free):
1. Go to render.com → New → Web Service
2. Connect your GitHub account
3. Select your `notebooklm-clone` repo
4. Settings:
   - Root Directory: `server`
   - Build Command: `npm install`
   - Start Command: `node index.js`
   - Instance Type: Free
5. Add environment variables (click "Environment"):
   - `GROQ_API_KEY`
   - `QDRANT_URL`
   - `QDRANT_API_KEY`
   - `COLLECTION_NAME`
6. Click **Deploy**
7. Wait ~3 mins — copy the URL it gives you (looks like: `https://your-app.onrender.com`)

### Deploy Frontend on Vercel (free):
1. Go to vercel.com → New Project
2. Import your GitHub repo
3. Settings:
   - Root Directory: `client`
   - Framework Preset: `Vite`
4. Add environment variable:
   - `VITE_API_URL` = `https://your-app.onrender.com` (the Render URL from above)
5. Click **Deploy**
6. Wait ~2 mins — Vercel gives you a live URL

### Test your live app:
- Open the Vercel URL
- Upload a PDF
- Ask a question
- If it works — you're done ✅

---

## Submission Checklist
- [ ] GitHub repo is PUBLIC
- [ ] .env is not visible in the repo
- [ ] Live Vercel link works without any local setup
- [ ] PDF upload works on the live site
- [ ] Questions get answered from document content
- [ ] README has live link and GitHub link

---

## Author
Anushka Jain | 24BCS10193 | GenAI
