import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import {
  Upload,
  Send,
  FileText,
  ChevronDown,
  ChevronUp,
  Loader2,
  MessageSquare,
  Info,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function App() {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null); // 'success', 'error'
  const [chunkCount, setChunkCount] = useState(0);
  const [question, setQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      uploadFile(selectedFile);
    }
  };

  const uploadFile = async (fileToUpload) => {
    setIsUploading(true);
    setUploadStatus(null);
    const formData = new FormData();
    formData.append('file', fileToUpload);

    try {
      const response = await axios.post(`${API_BASE_URL}/upload`, formData);
      setFile(fileToUpload);
      setChunkCount(response.data.chunks);
      setUploadStatus('success');
    } catch (error) {
      console.error('Upload failed:', error);
      setUploadStatus('error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleChat = async (e) => {
    e.preventDefault();
    if (!question.trim() || !file || isGenerating) return;

    const userMsg = { role: 'user', content: question };
    setChatHistory(prev => [...prev, userMsg]);
    const currentQuestion = question;
    setQuestion('');
    setIsGenerating(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/chat`, { question: currentQuestion });
      const assistantMsg = {
        role: 'assistant',
        content: response.data.answer,
        sources: response.data.sources
      };
      setChatHistory(prev => [...prev, assistantMsg]);
    } catch (error) {
      console.error('Chat failed:', error);
      const errorMsg = { role: 'assistant', content: 'Sorry, I encountered an error processing your request.', isError: true };
      setChatHistory(prev => [...prev, errorMsg]);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="logo">NotebookLM</div>

        <div
          className={`upload-area ${isDragging ? 'dragging' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            const droppedFile = e.dataTransfer.files[0];
            if (droppedFile) uploadFile(droppedFile);
          }}
          onClick={() => fileInputRef.current.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf,.txt"
          />
          {isUploading ? (
            <div className="flex-center column gap-1">
              <Loader2 className="loading-spinner" />
              <p>Indexing Document...</p>
            </div>
          ) : (
            <div className="flex-center column gap-1">
              <Upload size={32} className="text-primary" />
              <p>Click or drag PDF/TXT</p>
              <span className="text-muted" style={{ fontSize: '0.7rem' }}>Max 10MB</span>
            </div>
          )}
        </div>

        {uploadStatus === 'success' && (
          <div className="stats-card">
            <div className="flex align-center gap-1 mb-1">
              <CheckCircle2 size={16} className="text-success" />
              <h3 style={{ fontSize: '0.9rem' }}>Document Ready</h3>
            </div>
            <div className="stats-item">
              <span>File:</span>
              <span className="text-muted">{file?.name}</span>
            </div>
            <div className="stats-item">
              <span>Chunks:</span>
              <span className="text-muted">{chunkCount}</span>
            </div>
          </div>
        )}

        {uploadStatus === 'error' && (
          <div className="error-msg flex align-center gap-0-5">
            <AlertCircle size={14} />
            Failed to process document
          </div>
        )}

        <div style={{ marginTop: 'auto', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <div className="flex align-center gap-0-5">
            <Info size={14} />
            <span>Answers only from provided context.</span>
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="chat-container">
        <header className="chat-header">
          <h2 style={{ fontSize: '1.2rem' }}>Knowledge Assistant</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {file ? `Chatting with ${file.name}` : 'Upload a document to start'}
          </p>
        </header>

        <div className="messages-list">
          {chatHistory.length === 0 && (
            <div style={{ margin: 'auto', textAlign: 'center', opacity: 0.5 }}>
              <MessageSquare size={48} style={{ marginBottom: '1rem' }} />
              <p>No messages yet. Ask something about your document!</p>
            </div>
          )}
          {chatHistory.map((msg, idx) => (
            <div key={idx} className={`message ${msg.role}`}>
              <div>{msg.content}</div>

              {msg.sources && msg.sources.length > 0 && (
                <SourceDropdown sources={msg.sources} />
              )}
            </div>
          ))}
          {isGenerating && (
            <div className="message assistant">
              <Loader2 className="loading-spinner" />
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form className="input-area" onSubmit={handleChat}>
          <div className="input-wrapper">
            <input
              type="text"
              placeholder={file ? "Ask a question..." : "Please upload a document first"}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              disabled={!file || isGenerating}
            />
            <button
              type="submit"
              className="send-btn"
              disabled={!file || isGenerating || !question.trim()}
            >
              <Send size={18} />
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

function SourceDropdown({ sources }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="sources-dropdown">
      <div className="sources-toggle" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        <span>Sources ({sources.length})</span>
      </div>
      {isOpen && (
        <div className="sources-content">
          {sources.map((src, i) => (
            <div key={i} className="source-item">
              <div className="flex justify-between" style={{ marginBottom: '0.25rem', fontWeight: 600 }}>
                <span>Page {src.page}</span>
                <span style={{ opacity: 0.6 }}>{src.source}</span>
              </div>
              <p style={{ fontStyle: 'italic', opacity: 0.8 }}>"{src.content}"</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;
