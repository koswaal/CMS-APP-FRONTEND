import React, { useState, useContext, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { ThemeContext } from './ThemeContext';
import { API_URL } from './config';

const DEFAULT_MODEL = 'mistralai/mistral-small-4-119b-2603';

function CodeBlock({ language, children, isDark }) {
  const [copied, setCopied] = useState(false);
  const code = String(children).replace(/\n$/, '');
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="relative group my-2">
      <div className={`absolute right-2 top-2 z-10 transition-opacity duration-200 ${copied ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
        <button
          onClick={handleCopy}
          className={`px-2 py-1 text-xs rounded border transition-colors ${
            copied
              ? 'bg-green-500/20 border-green-500 text-green-400'
              : isDark ? 'bg-gray-800 border-gray-600 text-gray-400 hover:text-white hover:border-gray-400' : 'bg-white border-gray-300 text-gray-500 hover:text-gray-700 hover:border-gray-400'
          }`}
        >
          {copied ? '✓ Copiado' : 'Copiar'}
        </button>
      </div>
      <SyntaxHighlighter
        style={isDark ? oneDark : oneLight}
        language={language}
        PreTag="div"
        customStyle={{ margin: 0, borderRadius: '8px', fontSize: '13px' }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}

function MarkdownContentInner({ content, isDark }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        code({ node, inline, className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || '');
          if (!inline) {
            return <CodeBlock language={match ? match[1] : 'text'} isDark={isDark}>{children}</CodeBlock>;
          }
          return (
            <code className={`px-1.5 py-0.5 rounded text-sm ${isDark ? 'bg-gray-700 text-[#c8f135]' : 'bg-gray-200 text-green-800'}`} {...props}>
              {children}
            </code>
          );
        },
        h1: ({ children }) => <h1 className={`text-lg font-bold mt-3 mb-1 ${isDark ? 'text-[#c8f135]' : 'text-green-700'}`}>{children}</h1>,
        h2: ({ children }) => <h2 className={`text-base font-bold mt-3 mb-1 ${isDark ? 'text-[#c8f135]' : 'text-green-700'}`}>{children}</h2>,
        h3: ({ children }) => <h3 className={`text-sm font-bold mt-2 mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{children}</h3>,
        p: ({ children }) => <div className="text-sm leading-relaxed mb-2 last:mb-0">{children}</div>,
        ul: ({ children }) => <ul className="text-sm mb-2 list-disc pl-5 space-y-1">{children}</ul>,
        ol: ({ children }) => <ol className="text-sm mb-2 list-decimal pl-5 space-y-1">{children}</ol>,
        li: ({ children }) => <li>{children}</li>,
        strong: ({ children }) => <strong className="font-bold">{children}</strong>,
        em: ({ children }) => <em className="italic">{children}</em>,
        blockquote: ({ children }) => (
          <blockquote className={`border-l-4 ${isDark ? 'border-[#c8f135] text-gray-400' : 'border-green-500 text-gray-600'} pl-3 my-2 text-sm italic`}>
            {children}
          </blockquote>
        ),
        a: ({ href, children }) => (
          <a href={href} target="_blank" rel="noopener noreferrer" className={`underline ${isDark ? 'text-[#c8f135] hover:text-[#d4f54d]' : 'text-green-600 hover:text-green-800'}`}>
            {children}
          </a>
        ),
        hr: () => <hr className={`my-3 ${isDark ? 'border-gray-700' : 'border-gray-200'}`} />,
        table: ({ children }) => (
          <div className="overflow-x-auto my-2">
            <table className={`w-full text-sm border-collapse ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>{children}</table>
          </div>
        ),
        th: ({ children }) => <th className={`border ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-300 bg-gray-100'} px-3 py-1.5 text-left font-bold`}>{children}</th>,
        td: ({ children }) => <td className={`border ${isDark ? 'border-gray-700' : 'border-gray-300'} px-3 py-1.5`}>{children}</td>,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

const MarkdownContent = React.memo(MarkdownContentInner);

function MessageBubbleInner({ msg, isDark, compact, onEdit }) {
  return (
    <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
      <div className={`${compact ? 'max-w-[75%] rounded-lg px-3 py-2' : 'max-w-[85%] rounded-[28px] px-5 py-4'} backdrop-blur-md bg-white/6 border ${
        msg.role === 'user'
          ? isDark
            ? 'from-[#c8f135]/12 to-[#c8f135]/4 bg-gradient-to-br border-[#c8f135]/18 text-[#c8f135] rounded-br-[18px] shadow-[0_8px_22px_rgba(200,209,53,0.12)]'
            : 'from-green-400/16 to-green-500/12 bg-gradient-to-br border-green-400/16 text-white rounded-br-[18px] shadow-[0_8px_22px_rgba(34,197,94,0.12)]'
          : isDark
            ? 'from-white/12 via-white/8 to-white/4 bg-gradient-to-br border-white/12 text-gray-100 rounded-bl-[18px] shadow-[0_8px_28px_rgba(0,0,0,0.12)]'
            : 'from-white/60 via-white/36 to-white/20 bg-gradient-to-br border-gray-200/30 text-gray-800 rounded-bl-[18px] shadow-[0_8px_24px_rgba(15,23,42,0.08)]'
      }`}>
        <MarkdownContent content={msg.content} isDark={isDark} />
        {msg.role === 'user' && onEdit && (
          <div className="mt-2 text-right">
            <button className="text-xs text-gray-400 hover:text-gray-200" title="Editar" onClick={onEdit}>
              Editar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const MessageBubble = React.memo(MessageBubbleInner);

export default function AiChat() {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === 'dark';

  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showSidebar, setShowSidebar] = useState(true);
  const [editingTitle, setEditingTitle] = useState(null);
  const [titleInput, setTitleInput] = useState('');
  const [availableModels, setAvailableModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState(() => localStorage.getItem('ai_model') || DEFAULT_MODEL);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [showSystemPrompt, setShowSystemPrompt] = useState(false);
  const chatEndRef = useRef(null);
  const modelDropdownRef = useRef(null);
  const abortRef = useRef(null);
  const audioContextRef = useRef(null);
  const messagesRef = useRef(messages);
  useEffect(() => { messagesRef.current = messages; }, [messages]);
  const [typingMsgIndex, setTypingMsgIndex] = useState(null);
  const [typingFullContent, setTypingFullContent] = useState('');
  const queueRef = useRef([]);
  const [queueLen, setQueueLen] = useState(0);
  const [compactMode, setCompactMode] = useState(false);
  const [editingMessageIndex, setEditingMessageIndex] = useState(null);

  const getAudioContext = () => {
    if (!audioContextRef.current && typeof window !== 'undefined') {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) audioContextRef.current = new AudioContext();
    }
    if (audioContextRef.current?.state === 'suspended') {
      audioContextRef.current.resume().catch(() => {});
    }
    return audioContextRef.current;
  };

  const playTone = (frequency, duration = 0.08, type = 'triangle', volume = 0.12, delay = 0) => {
    const ctx = getAudioContext();
    if (!ctx) return;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    const now = ctx.currentTime + delay;
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(volume, now + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.02);
  };

  const playResponseCompleteSound = () => {
    playTone(900, 0.08, 'triangle', 0.12);
    playTone(1400, 0.05, 'square', 0.08, 0.03);
  };

  const playResponsePausedSound = () => {
    playTone(520, 0.1, 'sine', 0.1);
    playTone(720, 0.12, 'triangle', 0.07, 0.04);
  };

  const token = () => localStorage.getItem('session_token');
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` };

  useEffect(() => {
    const handleClick = (e) => {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(e.target)) {
        setShowModelDropdown(false);
      }
    };
    if (showModelDropdown) {
      document.addEventListener('mousedown', handleClick);
    }
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showModelDropdown]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversations = useCallback(async () => {
    try {
      setLoadingList(true);
      const res = await fetch(`${API_URL}/ai/conversations`, { headers });
      const data = await res.json();
      if (data.success) setConversations(data.conversations || []);
    } catch {} finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  // Guardar última conversación activa en localStorage
  useEffect(() => {
    if (activeConvId) localStorage.setItem('ai_active_conv_id', activeConvId);
  }, [activeConvId]);

  // Restaurar última conversación al montar el componente
  useEffect(() => {
    const savedId = localStorage.getItem('ai_active_conv_id');
    if (savedId) loadConversation(savedId);
  }, []);

  useEffect(() => {
    fetch(`${API_URL}/ai/models`, { headers })
      .then(r => r.json())
      .then(d => { if (d.success) setAvailableModels(d.models || []); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    localStorage.setItem('ai_model', selectedModel);
  }, [selectedModel]);

  const saveMessages = useCallback(async (convId, msgs, title) => {
    if (!convId) return;
    try {
      setSaving(true);
      const stored = systemPrompt
        ? [{ role: 'system', content: systemPrompt }, ...msgs]
        : msgs;
      const body = { messages: stored };
      if (title) body.title = title;
      await fetch(`${API_URL}/ai/conversations/${convId}`, {
        method: 'PUT', headers, body: JSON.stringify(body),
      });
    } catch {} finally {
      setSaving(false);
    }
  }, [systemPrompt]);

  const loadConversation = async (id) => {
    try {
      setTypingMsgIndex(null);
      setTypingFullContent('');
      setLoading(true);
      const res = await fetch(`${API_URL}/ai/conversations/${id}`, { headers });
      const data = await res.json();
      if (data.success) {
        const msgs = data.conversation.messages || [];
        if (msgs.length > 0 && msgs[0].role === 'system') {
          setSystemPrompt(msgs[0].content);
          setMessages(msgs.slice(1));
        } else {
          setSystemPrompt('');
          setMessages(msgs);
        }
        setActiveConvId(data.conversation.id);
      }
    } catch {
      setError('Error al cargar conversación');
    } finally {
      setLoading(false);
    }
  };

  const stopResponse = () => {
    setTypingMsgIndex(null);
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setLoading(false);
    playResponsePausedSound();
  };

  const resumeResponse = () => {
    if (!typingFullContent) return;
    setTypingMsgIndex(messages.length - 1);
  };

  const isResponsePaused = !loading && typingFullContent && typingMsgIndex === null;

  const clearPausedResponse = (currentMessages = messages, paused = !!typingFullContent) => {
    if (currentMessages.length === 0) return currentMessages;
    const last = currentMessages[currentMessages.length - 1];
    // If there is a paused assistant response, keep it visible.
    // Remove trailing empty assistant placeholders only when not paused.
    if (!paused && last.role === 'assistant' && (!last.content || last.content === '')) {
      return currentMessages.slice(0, -1);
    }
    return currentMessages;
  };

  const createConversation = async () => {
    try {
      setTypingMsgIndex(null);
      setTypingFullContent('');
      setError('');
      const res = await fetch(`${API_URL}/ai/conversations`, {
        method: 'POST', headers, body: JSON.stringify({ title: 'Nueva conversación' }),
      });
      const data = await res.json();
      if (data.success) {
        setConversations(prev => [data.conversation, ...prev]);
        setActiveConvId(data.conversation.id);
        setMessages([]);
        setShowSidebar(true);
      }
    } catch {
      setError('Error al crear conversación');
    }
  };

  const enqueueMessage = (text) => {
    queueRef.current.push(text);
    setQueueLen(queueRef.current.length);
  };

  const processQueue = useCallback(() => {
    if (loading) return;
    const next = queueRef.current.shift();
    setQueueLen(queueRef.current.length);
    if (next) {
      // start sending next queued message
      sendMessageImmediate(next).catch(() => {});
    }
  }, [loading]);

  useEffect(() => {
    // if queue has items and we're idle, process
    if (!loading && queueRef.current.length > 0) processQueue();
  }, [loading, processQueue]);

  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const deleteConversation = (id, e) => {
    e.stopPropagation();
    setDeleteConfirmId(id);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      const res = await fetch(`${API_URL}/ai/conversations/${deleteConfirmId}`, { method: 'DELETE', headers });
      const data = await res.json();
      if (data.success) {
        setConversations(prev => prev.filter(c => c.id !== deleteConfirmId));
        if (activeConvId === deleteConfirmId) {
          setActiveConvId(null);
          setMessages([]);
        }
      }
    } catch {
      setError('Error al eliminar conversación');
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const renameConversation = async (id) => {
    if (!titleInput.trim() || titleInput === editingTitle?.title) {
      setEditingTitle(null);
      return;
    }
    try {
      await fetch(`${API_URL}/ai/conversations/${id}`, {
        method: 'PUT', headers, body: JSON.stringify({ title: titleInput.trim() }),
      });
      setConversations(prev => prev.map(c => c.id === id ? { ...c, title: titleInput.trim() } : c));
      setEditingTitle(null);
    } catch {}
  };

  useEffect(() => {
    if (typingMsgIndex === null) return;
    let i = messagesRef.current[typingMsgIndex]?.content?.length || 0;
    const speed = 10;
    const step = 3;
    const timer = setInterval(() => {
      i += step;
      if (i >= typingFullContent.length) {
        setMessages(prev => {
          const updated = [...prev];
          updated[typingMsgIndex] = { role: 'assistant', content: typingFullContent };
          return updated;
        });
        setTypingMsgIndex(null);
        setTypingFullContent('');
        clearInterval(timer);
        playResponseCompleteSound();
        // procesar siguiente en cola
        setTimeout(() => processQueue(), 50);
      } else {
        setMessages(prev => {
          const updated = [...prev];
          updated[typingMsgIndex] = { role: 'assistant', content: typingFullContent.slice(0, i) };
          return updated;
        });
      }
    }, speed);
    return () => clearInterval(timer);
  }, [typingMsgIndex, typingFullContent]);

  // enviar de forma inmediata (sin encolar)
  const sendMessageImmediate = async (textParam) => {
    const text = (typeof textParam === 'string' ? textParam : textParam?.text) || '';
    if (!text) return;
    setError('');
    let convId = activeConvId;
    if (!convId) {
      const res = await fetch(`${API_URL}/ai/conversations`, {
        method: 'POST', headers, body: JSON.stringify({ title: text.slice(0, 50) }),
      });
      const data = await res.json();
      if (!data.success) { setError('Error al crear conversación'); return; }
      convId = data.conversation.id;
      setActiveConvId(convId);
      setConversations(prev => [data.conversation, ...prev]);
    }

    const userMsg = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    saveMessages(convId, [...messagesRef.current, userMsg]);

    setLoading(true);
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const history = [...messagesRef.current, userMsg].map(m => ({ role: m.role, content: m.content }));
      const body = { message: text, history, model: selectedModel };
      if (systemPrompt) body.system_prompt = systemPrompt;
      const chatRes = await fetch(`${API_URL}/ai/chat`, {
        method: 'POST', headers,
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      const chatData = await chatRes.json();

      if (chatData.success) {
        const assistantMsg = { role: 'assistant', content: chatData.reply };
        const assistantIdx = messagesRef.current.length + 1; // after adding userMsg
        setMessages(prev => [...prev, { role: 'assistant', content: '' }]);
        setTypingMsgIndex(assistantIdx);
        setTypingFullContent(chatData.reply);
        saveMessages(convId, [...messagesRef.current, userMsg, assistantMsg]);
      } else {
        const errMsg = chatData.errors ? Object.entries(chatData.errors).map(([k, v]) => `${k}: ${v.join(', ')}`).join('; ') : '';
        setError((chatData.message || 'Error al obtener respuesta') + (errMsg ? ' — ' + errMsg : ''));
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      setError('Error de conexión con el servidor');
    } finally {
      abortRef.current = null;
      setLoading(false);
    }
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text) return;
    setInput('');
    setError('');
    const wasPaused = isResponsePaused;

    // si ya hay una respuesta en curso, encolamos
    if (loading || typingMsgIndex !== null) {
      // mantener el mensaje pausado visible
      const cleaned = clearPausedResponse(messages, wasPaused);
      const userMsg = { role: 'user', content: text };
      const updated = [...cleaned, userMsg];
      setMessages(updated);
      saveMessages(activeConvId, updated);
      enqueueMessage(text);
      return;
    }

    // si estamos editando un mensaje, reemplazamos y reenviamos
    if (editingMessageIndex !== null && messages[editingMessageIndex]?.role === 'user') {
      const updated = [...messages];
      updated[editingMessageIndex] = { ...updated[editingMessageIndex], content: text };
      setMessages(updated);
      saveMessages(activeConvId, updated);
      setEditingMessageIndex(null);
      // enviar como nuevo
      await sendMessageImmediate(text);
      return;
    }

    // enviar inmediatamente
    await sendMessageImmediate(text);
  };

  const handleKeyDown = (e) => {
    if ((e.key === 'Enter' && !e.shiftKey) || (e.key === 'Enter' && (e.ctrlKey || e.metaKey))) { e.preventDefault(); handleSend(); }
    if (e.key === 'Escape') { e.preventDefault(); stopResponse(); }
  };

  const startNewChat = () => {
    setTypingMsgIndex(null);
    setTypingFullContent('');
    if (activeConvId && messages.length > 0) {
      createConversation();
    } else {
      setMessages([]);
      setActiveConvId(null);
      localStorage.removeItem('ai_active_conv_id');
    }
    setError('');
  };

  const toggleSystemPrompt = () => setShowSystemPrompt(v => !v);

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4 gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200 text-gray-600'}`}
            title={showSidebar ? 'Ocultar conversaciones' : 'Mostrar conversaciones'}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div>
            <h1 className={`text-2xl font-bold ${isDark ? 'text-[#c8f135]' : 'text-green-700'}`}>Asistente IA</h1>
            <div className="relative mt-1" ref={modelDropdownRef}>
              <button
                onClick={() => setShowModelDropdown(!showModelDropdown)}
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-xs border transition-colors ${
                  isDark
                    ? 'bg-[#0f0f0f] border-gray-700 text-gray-400 hover:text-gray-200'
                    : 'bg-white border-gray-200 text-gray-500 hover:text-gray-700'
                }`}
              >
                <span className="truncate max-w-[160px]">{availableModels.find(m => m.id === selectedModel)?.name || selectedModel}</span>
                <svg className={`w-3 h-3 shrink-0 transition-transform ${showModelDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showModelDropdown && (
                <div className={`absolute z-10 mt-1 w-72 rounded-lg border shadow-lg ${isDark ? 'bg-[#1a1a1a] border-gray-700' : 'bg-white border-gray-200'}`}>
                  <div className="p-1 space-y-0.5">
                    {availableModels.map(m => (
                      <button
                        key={m.id}
                        onClick={() => { setSelectedModel(m.id); setShowModelDropdown(false); }}
                        className={`w-full text-left px-3 py-2 rounded text-xs transition-colors ${
                          selectedModel === m.id
                            ? 'bg-[#c8f135]/20 text-[#c8f135]'
                            : isDark ? 'text-gray-300 hover:bg-gray-700/50' : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <div className="font-medium">{m.name}</div>
                        <div className={`mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{m.desc} — Contexto: {m.context}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={startNewChat}
          className="px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-[#c8f135] text-black hover:bg-[#d4f54d]"
        >
          + Nueva
        </button>
      </div>

      <div className="mb-3 flex items-center justify-between gap-3">
        <button
          onClick={toggleSystemPrompt}
          className={`text-xs font-medium transition-colors ${isDark ? 'text-gray-500 hover:text-[#c8f135]' : 'text-gray-400 hover:text-green-600'}`}
        >
          {showSystemPrompt ? '− Ocultar instrucciones del sistema' : '+ Instrucciones del sistema'}
        </button>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Compacto</label>
            <button
              onClick={() => setCompactMode(v => !v)}
              aria-pressed={compactMode}
              className={`relative inline-flex items-center h-6 w-11 rounded-full transition-colors focus:outline-none ${compactMode ? 'bg-[#c8f135]' : isDark ? 'bg-gray-700' : 'bg-gray-300'}`}
            >
              <span className={`inline-block w-4 h-4 bg-white rounded-full transform transition-transform ${compactMode ? 'translate-x-5' : 'translate-x-1'}`} />
            </button>
          </div>
          <button onClick={() => {
            const md = messages.map(m => `**${m.role}**: ${m.content}\n`).join('\n');
            const blob = new Blob([md], { type: 'text/markdown' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = 'conversacion.md'; a.click(); URL.revokeObjectURL(url);
          }} className={`px-3 py-1 text-xs rounded border transition-colors ${isDark ? 'bg-transparent border-gray-600 text-gray-200 hover:bg-gray-800' : 'bg-transparent border-gray-300 text-gray-700 hover:bg-gray-100'}`}>Exportar MD</button>
          <button onClick={() => {
            const data = JSON.stringify(messages, null, 2);
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = 'conversacion.json'; a.click(); URL.revokeObjectURL(url);
          }} className={`px-3 py-1 text-xs rounded border transition-colors ${isDark ? 'bg-transparent border-gray-600 text-gray-200 hover:bg-gray-800' : 'bg-transparent border-gray-300 text-gray-700 hover:bg-gray-100'}`}>Exportar JSON</button>
        </div>
      </div>

      {showSystemPrompt && (
        <div className={`mb-3 rounded-lg border ${isDark ? 'bg-[#0f0f0f] border-gray-700' : 'bg-white border-gray-200'}`}>
          <textarea
            value={systemPrompt}
            onChange={e => setSystemPrompt(e.target.value)}
            placeholder="Instrucciones del sistema (opcional). Ej: Sos un asistente experto en Laravel que responde en español."
            rows={2}
            className={`w-full px-3 py-2 text-xs rounded-t-lg border-b outline-none resize-none focus:ring-0 ${
              isDark ? 'bg-[#0f0f0f] border-gray-700 text-gray-300 placeholder-gray-600' : 'bg-white border-gray-200 text-gray-700 placeholder-gray-400'
            }`}
          />
          <div className={`flex justify-between items-center px-3 py-1.5 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            <span>Se antepone como mensaje de sistema en cada consulta</span>
            {systemPrompt && (
              <span className={`font-medium ${isDark ? 'text-[#c8f135]' : 'text-green-600'}`}>Activo</span>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="mb-3 p-2 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-xs">{error}</div>
      )}

      <div className="flex-1 flex gap-4 min-h-0">
        {showSidebar && (
          <div className={`w-56 shrink-0 rounded-lg border overflow-hidden flex flex-col ${isDark ? 'bg-[#1a1a1a] border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className={`px-3 py-2 text-xs font-semibold uppercase tracking-wider border-b ${isDark ? 'text-gray-400 border-gray-700' : 'text-gray-500 border-gray-200'}`}>
              Conversaciones
            </div>
            <div className="flex-1 overflow-y-auto">
              {loadingList ? (
                <div className="text-xs text-center py-4 text-gray-500">Cargando...</div>
              ) : conversations.length === 0 ? (
                <div className="text-xs text-center py-4 text-gray-500">Sin conversaciones</div>
              ) : (
                conversations.map(conv => (
                  <div key={conv.id}>
                    {editingTitle?.id === conv.id ? (
                      <div className="px-2 py-1">
                        <input
                          autoFocus
                          value={titleInput}
                          onChange={e => setTitleInput(e.target.value)}
                          onBlur={() => renameConversation(conv.id)}
                          onKeyDown={e => { if (e.key === 'Enter') renameConversation(conv.id); if (e.key === 'Escape') setEditingTitle(null); }}
                          className={`w-full px-2 py-1 text-xs rounded border outline-none focus:ring-1 focus:ring-[#c8f135] ${isDark ? 'bg-[#0f0f0f] border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                          onClick={e => e.stopPropagation()}
                        />
                      </div>
                    ) : (
                      <div
                        onClick={() => loadConversation(conv.id)}
                        className={`group flex items-center gap-1 px-3 py-2 cursor-pointer text-xs border-l-2 transition-colors ${
                          activeConvId === conv.id
                            ? 'bg-[#c8f135]/10 text-[#c8f135] border-l-[#c8f135]'
                            : `text-gray-400 border-l-transparent hover:bg-[#c8f135]/5 ${isDark ? 'hover:text-gray-200' : 'hover:text-gray-700'}`
                        }`}
                      >
                        <span className="flex-1 truncate">{conv.title}</span>
                        <button
                          onClick={e => { e.stopPropagation(); setEditingTitle(conv); setTitleInput(conv.title); }}
                          className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-blue-400"
                          title="Renombrar"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={e => deleteConversation(conv.id, e)}
                          className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-red-400"
                          title="Eliminar"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col min-w-0">
          <div className={`flex-1 rounded-lg border overflow-y-auto p-4 space-y-3 mb-3 ${isDark ? 'bg-[#1a1a1a] border-gray-700' : 'bg-white border-gray-200'}`}
            style={{ minHeight: 350, maxHeight: 'calc(100vh - 360px)' }}
          >
            {loading && messages.length === 0 ? (
              <div className="text-center py-8 text-sm text-gray-500">Cargando conversación...</div>
            ) : messages.length === 0 ? (
              <div className={`text-center py-8 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                <p className="text-sm">Escribí un mensaje para empezar</p>
              </div>
            ) : (
              messages.map((msg, i) => (
                <MessageBubble
                  key={i}
                  msg={msg}
                  isDark={isDark}
                  compact={compactMode}
                  onEdit={msg.role === 'user' ? () => { setInput(msg.content); setEditingMessageIndex(i); } : undefined}
                />
              ))
            )}
            {loading && messages.length > 0 && <div className="flex justify-start">
                <div className={`max-w-[80%] rounded-xl px-4 py-3 ${isDark ? 'bg-[#0f0f0f] border border-gray-700' : 'bg-gray-100 border border-gray-200'}`}>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#c8f135] animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 rounded-full bg-[#c8f135] animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 rounded-full bg-[#c8f135] animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>}
            <div ref={chatEndRef} />
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1">
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribí tu mensaje..."
                rows={1}
                className={`w-full px-4 py-3 rounded-lg border resize-none outline-none focus:ring-2 focus:ring-[#c8f135] focus:border-[#c8f135] ${
                  isDark ? 'bg-[#0f0f0f] border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                }`}
              />
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {(loading || typingMsgIndex !== null) ? (
                <button
                  onClick={stopResponse}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                    isDark ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                  }`}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="2" /></svg>
                  Detener
                </button>
              ) : isResponsePaused ? (
                <>
                  <button
                    onClick={resumeResponse}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                      isDark ? 'bg-[#c8f135]/18 text-[#c8f135] hover:bg-[#c8f135]/28' : 'bg-green-100/90 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Reanudar
                  </button>
                  <button
                    onClick={handleSend}
                    disabled={!input.trim()}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      !input.trim() ? 'opacity-50 cursor-not-allowed bg-gray-600 text-gray-400' : 'bg-[#c8f135] text-black hover:bg-[#d4f54d]'
                    }`}
                  >Enviar</button>
                </>
              ) : (
                <button
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    !input.trim() ? 'opacity-50 cursor-not-allowed bg-gray-600 text-gray-400' : 'bg-[#c8f135] text-black hover:bg-[#d4f54d]'
                  }`}
                >Enviar</button>
              )}
            </div>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <button
              onClick={() => {
                setMessages(prev => {
                  for (let i = prev.length - 1; i >= 0; i--) {
                    if (prev[i].role === 'user') {
                      const updated = [...prev.slice(0, i), ...prev.slice(i + 1)];
                      saveMessages(activeConvId, updated);
                      return updated;
                    }
                  }
                  return prev;
                });
              }}
              className={`px-3 py-1 text-xs rounded border transition-colors ${isDark ? 'bg-transparent border-gray-600 text-gray-200 hover:bg-gray-800' : 'bg-transparent border-gray-300 text-gray-700 hover:bg-gray-100'}`}
            >Deshacer</button>
          </div>
        </div>
      </div>

      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in bg-black/50">
          <div className={`rounded-xl shadow-2xl p-6 max-w-md w-full mx-4 transition-all duration-300 ease-out transform scale-100 ${
            isDark ? 'bg-[#1a1a1a] border border-gray-700' : 'bg-white'
          }`}>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Eliminar conversación
              </h3>
              <p className={`text-sm mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                ¿Estás seguro de eliminar esta conversación? Esta acción no se puede deshacer.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                    isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-6 py-2 rounded-lg bg-red-500 text-white font-medium hover:bg-red-600 transition-colors"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
