import React, { useState, useRef, useEffect } from 'react';
import { LavaLampBackground, LavaPalette } from './components/LavaLamp';
import { SettingsModal, PersonaType } from './components/SettingsModal';
import { HistoryDrawer, ChatSession, Message } from './components/HistoryDrawer';
import { ImageStudioModal } from './components/ImageStudioModal';
import { LiveVoiceModal } from './components/LiveVoiceModal';
import { BloomingFlower } from './components/BloomingFlower';
import { startAmbientLavaSound, stopAmbientLavaSound, playLavaBubblePop } from './utils/lavaSound';
import { startMechanicalKeyboardLoop, stopMechanicalKeyboardLoop } from './utils/keyboardSound';
import { Send, Sparkles, RotateCcw, Bot, User, Loader2, Zap, Sliders, Brain, Code, Globe, Compass, Palette, ArrowDown, Volume2, VolumeX, Mic, MicOff, Layers, BookOpen, Plus, Wand2, PhoneCall, MapPin, Search, Image as ImageIcon } from 'lucide-react';
import Markdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';

const INITIAL_MESSAGES: Message[] = [
  {
    id: '1',
    role: 'assistant',
    content: "Name's **JaggedGem**. I'm your completely free, zero-nonsense AI companion. No subscriptions, no paywalls, just raw wisdom, code intelligence, and deep web research while the lava lamp flows smoothly in the background. What's on your mind?",
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    personaUsed: 'jaggedgem'
  }
];

const SUGGESTED_PROMPTS = [
  "Roast my startup idea",
  "How do I optimize React state rendering?",
  "Search the web for recent breakthrough discoveries",
  "Why is reality so delightfully weird?"
];

export default function App() {
  // Chat Pages / Sessions State
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const savedSessions = localStorage.getItem('jaggedgem_chat_sessions');
      if (savedSessions) {
        const parsed = JSON.parse(savedSessions);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }

      // Legacy migration from single list
      const legacyHistory = localStorage.getItem('jaggedgem_chat_history') || localStorage.getItem('jagged_jim_chat_history');
      let initialMsgs = INITIAL_MESSAGES;
      if (legacyHistory) {
        const parsedLegacy = JSON.parse(legacyHistory);
        if (Array.isArray(parsedLegacy) && parsedLegacy.length > 0) {
          initialMsgs = parsedLegacy;
        }
      }

      return [
        {
          id: 'session-1',
          title: 'Main Chat',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          messages: initialMsgs,
        },
      ];
    } catch (e) {
      console.error(e);
    }
    return [
      {
        id: 'session-1',
        title: 'Main Chat',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: INITIAL_MESSAGES,
      },
    ];
  });

  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    return localStorage.getItem('jaggedgem_active_session_id') || 'session-1';
  });

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Sync sessions to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('jaggedgem_chat_sessions', JSON.stringify(sessions));
    } catch (e) {
      console.error(e);
    }
  }, [sessions]);

  useEffect(() => {
    localStorage.setItem('jaggedgem_active_session_id', activeSessionId);
  }, [activeSessionId]);

  // Derived current session and messages
  const activeSessionIndex = sessions.findIndex(s => s.id === activeSessionId);
  const currentSession = activeSessionIndex !== -1 ? sessions[activeSessionIndex] : (sessions[0] || {
    id: 'session-1',
    title: 'Main Chat',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messages: INITIAL_MESSAGES
  });
  const messages = currentSession.messages;

  // Setter wrapper for updating active session messages
  const setMessages = (action: Message[] | ((prev: Message[]) => Message[])) => {
    setSessions(prevSessions => {
      return prevSessions.map(sess => {
        if (sess.id === currentSession.id) {
          const newMsgs = typeof action === 'function' ? action(sess.messages) : action;
          return {
            ...sess,
            messages: newMsgs,
            updatedAt: new Date().toISOString()
          };
        }
        return sess;
      });
    });
  };

  // Settings & Theme State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activePersona, setActivePersona] = useState<PersonaType>(() => {
    return (localStorage.getItem('jaggedgem_persona') as PersonaType) || 'jaggedgem';
  });

  const [activePalette, setActivePalette] = useState<LavaPalette>(() => {
    return (localStorage.getItem('jaggedgem_lava_palette') as LavaPalette) || 'cosmic';
  });

  const [coreMemories, setCoreMemories] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('jaggedgem_core_memories');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      "Prefers clean, production-grade TypeScript & React solutions",
      "Values zero-fluff, honest and witty technical insights"
    ];
  });

  const [memoryEnabled, setMemoryEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('jaggedgem_memory_enabled');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [ambientSoundEnabled, setAmbientSoundEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('jaggedgem_ambient_sound');
    return saved !== null ? JSON.parse(saved) : false;
  });

  const [keyboardSoundEnabled, setKeyboardSoundEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('jaggedgem_keyboard_sound');
    return saved !== null ? JSON.parse(saved) : true;
  });

  // Gemini Intelligence State
  const [selectedModel, setSelectedModel] = useState<string>('gemini-3.5-flash');
  const [enableThinking, setEnableThinking] = useState<boolean>(false);
  const [enableSearchGrounding, setEnableSearchGrounding] = useState<boolean>(false);
  const [enableMapsGrounding, setEnableMapsGrounding] = useState<boolean>(false);

  // Modals
  const [isImageStudioOpen, setIsImageStudioOpen] = useState<boolean>(false);
  const [isLiveVoiceOpen, setIsLiveVoiceOpen] = useState<boolean>(false);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);

  useEffect(() => {
    localStorage.setItem('jaggedgem_ambient_sound', JSON.stringify(ambientSoundEnabled));
    if (ambientSoundEnabled) {
      startAmbientLavaSound();
    } else {
      stopAmbientLavaSound();
    }
  }, [ambientSoundEnabled]);

  useEffect(() => {
    localStorage.setItem('jaggedgem_keyboard_sound', JSON.stringify(keyboardSoundEnabled));
  }, [keyboardSoundEnabled]);

  useEffect(() => {
    if (loading && keyboardSoundEnabled) {
      startMechanicalKeyboardLoop();
    } else {
      stopMechanicalKeyboardLoop();
    }
    return () => {
      stopMechanicalKeyboardLoop();
    };
  }, [loading, keyboardSoundEnabled]);

  const recognitionRef = useRef<any>(null);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const speechQueueRef = useRef<{ id: string; utterances: SpeechSynthesisUtterance[] }>({ id: '', utterances: [] });
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);

  // Session Handlers
  const handleNewSession = () => {
    const newId = 'session-' + Date.now();
    const newTitle = `Page ${sessions.length + 1}`;
    const newSess: ChatSession = {
      id: newId,
      title: newTitle,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: INITIAL_MESSAGES,
    };
    setSessions(prev => [newSess, ...prev]);
    setActiveSessionId(newId);
  };

  const handleDeleteSession = (id: string) => {
    if (sessions.length <= 1) return;
    const filtered = sessions.filter(s => s.id !== id);
    setSessions(filtered);
    if (activeSessionId === id) {
      setActiveSessionId(filtered[0].id);
    }
  };

  const handleRenameSession = (id: string, newTitle: string) => {
    setSessions(prev => prev.map(s => s.id === id ? { ...s, title: newTitle, updatedAt: new Date().toISOString() } : s));
  };

  const handleCombineAllSessions = () => {
    const allMsgs: Message[] = [];
    const seenIds = new Set<string>();

    sessions.forEach(sess => {
      sess.messages.forEach(m => {
        if (!seenIds.has(m.id)) {
          seenIds.add(m.id);
          allMsgs.push(m);
        }
      });
    });

    const combinedId = 'session-combined-' + Date.now();
    const combinedSession: ChatSession = {
      id: combinedId,
      title: `Combined Conversation (${sessions.length} Pages)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: allMsgs,
    };

    setSessions(prev => [combinedSession, ...prev]);
    setActiveSessionId(combinedId);
  };

  // Speech Read Actions
  const handleReadMyMessage = () => {
    const userMsgs = messages.filter(m => m.role === 'user');
    const lastUserMsg = userMsgs.length > 0 ? userMsgs[userMsgs.length - 1] : messages[messages.length - 1];
    if (lastUserMsg) {
      handleToggleReadAloud('last-user-msg', lastUserMsg.content, lastUserMsg.personaUsed);
    }
  };

  const handleReadAllHistory = () => {
    if (messages.length === 0) return;

    const fullHistoryText = messages.map(m => {
      const speaker = m.role === 'user' ? 'User said:' : `${m.personaUsed || 'JaggedGem'} said:`;
      return `${speaker} ${m.content}`;
    }).join('. ');

    handleToggleReadAloud('history-all', fullHistoryText, activePersona);
  };

  const handleToggleVoiceInput = () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      alert("Voice input (Speech Recognition) is not supported in this browser. Please try Google Chrome, Microsoft Edge, or Safari.");
      return;
    }

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognitionClass();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      let initialInput = input;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }

        const lower = transcript.toLowerCase().trim();
        if (lower.includes('read my message') || lower.includes('read message')) {
          recognition.stop();
          setIsListening(false);
          setInput('');
          handleReadMyMessage();
          return;
        }
        if (lower.includes('read all history') || lower.includes('read history')) {
          recognition.stop();
          setIsListening(false);
          setInput('');
          handleReadAllHistory();
          return;
        }

        const combined = initialInput ? `${initialInput.trim()} ${transcript.trim()}` : transcript;
        setInput(combined);
      };

      recognition.onerror = (event: any) => {
        console.warn("[VoiceToText] Recognition error:", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error("[VoiceToText] Failed to start speech recognition:", err);
      setIsListening(false);
    }
  };

  // Preload and cache browser speech synthesis voices
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        setAvailableVoices(voices);
      }
    };

    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      if (typeof window !== 'undefined') {
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
        }
        if (activeAudioRef.current) {
          activeAudioRef.current.pause();
          activeAudioRef.current = null;
        }
      }
    };
  }, []);

  // Helper to select the highest quality neural/realistic AI voice
  const getBestVoice = (persona: PersonaType): SpeechSynthesisVoice | null => {
    const voices = availableVoices.length > 0 ? availableVoices : (typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis.getVoices() : []);
    if (!voices || voices.length === 0) return null;

    const englishVoices = voices.filter(v => v.lang.toLowerCase().startsWith('en'));
    const pool = englishVoices.length > 0 ? englishVoices : voices;

    const neuralKeywords = ['natural', 'online (natural)', 'neural', 'google us english', 'google uk english', 'premium', 'enhanced', 'studio', 'wavenet', 'ava', 'evan', 'samantha', 'daniel', 'serena', 'guy'];

    for (const kw of neuralKeywords) {
      const matched = pool.find(v => v.name.toLowerCase().includes(kw));
      if (matched) return matched;
    }

    const googleVoice = pool.find(v => v.name.toLowerCase().includes('google'));
    if (googleVoice) return googleVoice;

    return pool.find(v => v.lang.toLowerCase() === 'en-us') || pool[0] || null;
  };

  const stopAllSpeech = () => {
    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    speechQueueRef.current = { id: '', utterances: [] };
    setSpeakingMsgId(null);
  };

  const fallbackBrowserSpeech = (msgId: string, cleanText: string, persona: PersonaType) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setSpeakingMsgId(null);
      return;
    }

    const sentences = cleanText.match(/[^.!?]+[.!?]+/g) || [cleanText];
    const bestVoice = getBestVoice(persona);
    const utterances: SpeechSynthesisUtterance[] = [];

    sentences.forEach((sentence, idx) => {
      const textChunk = sentence.trim();
      if (!textChunk) return;

      const utterance = new SpeechSynthesisUtterance(textChunk);
      if (bestVoice) utterance.voice = bestVoice;

      if (persona === 'jaggedgem') {
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
      } else if (persona === 'codegem') {
        utterance.rate = 1.02;
        utterance.pitch = 0.98;
      } else if (persona === 'deepdive') {
        utterance.rate = 0.95;
        utterance.pitch = 0.96;
      } else if (persona === 'creative') {
        utterance.rate = 1.03;
        utterance.pitch = 1.04;
      }

      if (idx === sentences.length - 1) {
        utterance.onend = () => setSpeakingMsgId(null);
        utterance.onerror = () => setSpeakingMsgId(null);
      }

      utterances.push(utterance);
    });

    if (utterances.length === 0) {
      setSpeakingMsgId(null);
      return;
    }

    speechQueueRef.current = { id: msgId, utterances };
    utterances.forEach(u => window.speechSynthesis.speak(u));
  };

  const handleToggleReadAloud = async (msgId: string, content: string, personaUsed?: PersonaType) => {
    // Stop current speech if clicking active message
    if (speakingMsgId === msgId) {
      stopAllSpeech();
      return;
    }

    stopAllSpeech();

    // Clean and normalize text for fluent conversational reading
    let cleanText = content
      .replace(/```[\s\S]*?```/g, '. Code snippet provided below. ')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
      .replace(/[*_~#>-]/g, ' ')
      .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
      .replace(/&/g, ' and ')
      .replace(/\+/g, ' plus ')
      .replace(/=/g, ' equals ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) return;

    setSpeakingMsgId(msgId);
    const persona = personaUsed || activePersona;

    // 1. Try Gemini Neural Voice TTS API
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: cleanText.length > 800 ? cleanText.substring(0, 800) + '...' : cleanText,
          persona
        })
      });

      if (res.ok) {
        const blob = await res.blob();
        if (blob && blob.size > 100) {
          const audioUrl = URL.createObjectURL(blob);
          const audio = new Audio(audioUrl);
          activeAudioRef.current = audio;

          audio.onended = () => {
            setSpeakingMsgId(null);
            URL.revokeObjectURL(audioUrl);
            activeAudioRef.current = null;
          };

          audio.onerror = () => {
            console.warn("[TTS] Gemini audio element error, falling back to browser speech");
            fallbackBrowserSpeech(msgId, cleanText, persona);
          };

          await audio.play();
          return;
        }
      }
    } catch (e) {
      console.warn("[TTS] Gemini Neural Voice API failed, falling back to browser speech:", e);
    }

    // 2. Fallback to browser SpeechSynthesis
    fallbackBrowserSpeech(msgId, cleanText, persona);
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    // Show button if user scrolled up more than 100px from the bottom
    const isScrolledUp = scrollHeight - scrollTop - clientHeight > 100;
    setShowScrollBottom(isScrolledUp);
  };

  useEffect(() => {
    try {
      localStorage.setItem('jaggedgem_chat_history', JSON.stringify(messages));
    } catch (e) {
      console.error(e);
    }
  }, [messages]);

  useEffect(() => {
    try {
      localStorage.setItem('jaggedgem_persona', activePersona);
    } catch (e) {}
  }, [activePersona]);

  useEffect(() => {
    try {
      localStorage.setItem('jaggedgem_lava_palette', activePalette);
    } catch (e) {}
  }, [activePalette]);

  useEffect(() => {
    try {
      localStorage.setItem('jaggedgem_core_memories', JSON.stringify(coreMemories));
    } catch (e) {}
  }, [coreMemories]);

  useEffect(() => {
    try {
      localStorage.setItem('jaggedgem_memory_enabled', JSON.stringify(memoryEnabled));
    } catch (e) {}
  }, [memoryEnabled]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || loading) return;

    const trimmedInput = text.trim().toLowerCase();
    if (trimmedInput === 'read my message' || trimmedInput === 'read message' || trimmedInput === 'read my last message') {
      setInput('');
      handleReadMyMessage();
      return;
    }
    if (trimmedInput === 'read all history' || trimmedInput === 'read history' || trimmedInput === 'read full history') {
      setInput('');
      handleReadAllHistory();
      return;
    }

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    if (ambientSoundEnabled) {
      playLavaBubblePop();
    }

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);
    setError(null);

    try {
      const chatHistory = [...messages, userMsg].map(m => ({
        role: m.role,
        content: m.content
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: chatHistory,
          persona: activePersona,
          coreMemory: memoryEnabled ? coreMemories : [],
          modelOverride: selectedModel,
          enableThinking,
          enableSearchGrounding,
          enableMapsGrounding,
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to get response from JaggedGem.');
      }

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        personaUsed: activePersona
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Something went sideways.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendImageToChat = (imageUrl: string, prompt: string) => {
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: `[Gemini Studio Image Prompt]: "${prompt}"`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const assistantMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: `Here is the AI image generated with Gemini Studio for **"${prompt}"**:\n\n![Generated Image](${imageUrl})`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      personaUsed: activePersona
    };

    setMessages(prev => [...prev, userMsg, assistantMsg]);
  };

  const handleReset = () => {
    setMessages(INITIAL_MESSAGES);
    try {
      localStorage.removeItem('jaggedgem_chat_history');
      localStorage.removeItem('jagged_jim_chat_history');
    } catch (e) {}
    setError(null);
  };

  const handleAddMemory = (memory: string) => {
    setCoreMemories(prev => [...prev, memory]);
  };

  const handleDeleteMemory = (index: number) => {
    setCoreMemories(prev => prev.filter((_, i) => i !== index));
  };

  const handleClearMemories = () => {
    setCoreMemories([]);
  };

  const getPersonaBadge = (persona?: PersonaType) => {
    switch (persona) {
      case 'codegem':
        return { label: 'CodeGem', icon: Code, color: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/30' };
      case 'deepdive':
        return { label: 'Deep Dive', icon: Compass, color: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30' };
      default:
        return { label: 'JaggedGem', icon: Sparkles, color: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-400/30' };
    }
  };

  const currentPersonaBadge = getPersonaBadge(activePersona);

  return (
    <div className="fixed inset-0 h-screen h-[100dvh] w-full flex flex-col font-sans text-slate-100 overflow-hidden selection:bg-fuchsia-500 selection:text-white">
      {/* Dynamic Animated Lava Lamp Background */}
      <LavaLampBackground palette={activePalette} />

      {/* Glassmorphic Header - Pinned at top, shrink-0 */}
      <header className="shrink-0 relative z-20 backdrop-blur-2xl bg-slate-950/60 border-b border-white/10 shadow-xl">
        <div className="max-w-[460px] w-full mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="relative flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-2xl bg-gradient-to-tr from-fuchsia-500 via-purple-500 to-cyan-400 shadow-[0_0_20px_rgba(236,72,153,0.5)] border border-white/30 animate-pulse">
              <Zap className="w-4.5 h-4.5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-1.5 flex-wrap">
                <h1 className="text-xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-fuchsia-300 to-pink-300 font-display">JAGGEDGEM</h1>
                
                {/* Active Persona Badge */}
                <span className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider border rounded-full backdrop-blur-md flex items-center space-x-1 ${currentPersonaBadge.color}`}>
                  <currentPersonaBadge.icon className="w-2.5 h-2.5" />
                  <span>{currentPersonaBadge.label}</span>
                </span>
              </div>
              <p className="text-[11px] text-fuchsia-200/80 font-medium truncate">Pure frosted AI intelligence</p>
            </div>
          </div>

          {/* Right Action Controls - Compact Phone Toolbar */}
          <div className="flex items-center space-x-1.5 flex-shrink-0">
            <button
              onClick={() => setIsHistoryOpen(true)}
              className="flex items-center space-x-1 px-2.5 py-1.5 text-xs font-semibold bg-gradient-to-r from-fuchsia-500/20 to-cyan-500/20 hover:from-fuchsia-500/30 hover:to-cyan-500/30 border border-fuchsia-400/40 rounded-xl transition-all shadow-md cursor-pointer backdrop-blur-xl text-slate-100 hover:text-white"
              title="Open Chat Pages & History"
            >
              <Layers className="w-3.5 h-3.5 text-fuchsia-300" />
              <span className="text-[11px]">Pages</span>
            </button>

            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-1.5 bg-white/10 hover:bg-white/20 active:bg-white/30 border border-white/20 rounded-xl transition-all shadow-md cursor-pointer backdrop-blur-xl text-slate-100 hover:text-white"
              title="Open Settings & Memory"
            >
              <Sliders className="w-4 h-4 text-cyan-300" />
            </button>

            <button
              onClick={handleReset}
              className="p-1.5 bg-white/10 hover:bg-white/20 active:bg-white/30 border border-white/20 rounded-xl transition-all shadow-md cursor-pointer backdrop-blur-xl text-slate-100 hover:text-white"
              title="Reset Conversation"
            >
              <RotateCcw className="w-4 h-4 text-pink-300" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Chat Container - Mobile Phone Frame Constrained (Max-W 460px) */}
      <main className="relative z-10 flex-1 max-w-[460px] w-full mx-auto px-3 py-3 sm:px-4 sm:py-4 flex flex-col min-h-0 overflow-hidden">
        {/* Chat Messages Scroll Area - Independent Scroll Container */}
        <div 
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto pr-1 sm:pr-2 space-y-6 no-scrollbar min-h-0 scroll-smooth"
        >
          <AnimatePresence>
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              const badge = getPersonaBadge(msg.personaUsed || activePersona);

              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
                  transition={{
                    type: "spring",
                    stiffness: 380,
                    damping: 22,
                    mass: 0.85
                  }}
                  className={`flex items-start space-x-3 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}
                >
                  {/* Avatar - Bird's Eye View Blooming Flower */}
                  <div className={`flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shadow-lg border backdrop-blur-md transition-transform duration-300 hover:scale-110 ${
                    isUser
                      ? 'bg-gradient-to-tr from-cyan-950/80 via-sky-900/80 to-indigo-900/80 border-cyan-400/70 shadow-cyan-500/30'
                      : 'bg-gradient-to-tr from-fuchsia-950/80 via-purple-900/80 to-pink-900/80 border-fuchsia-400/70 shadow-fuchsia-500/35'
                  }`}>
                    <BloomingFlower className="w-5.5 h-5.5 sm:w-6 sm:h-6" isUser={isUser} />
                  </div>

                  {/* Pure 3D See-Through Glass Bubble - Fully Round Corners with Popping 3D Drop Shadow */}
                  <div className={`group relative max-w-[84%] sm:max-w-[72%] rounded-[26px] px-5 py-3.5 sm:px-5.5 sm:py-4 backdrop-blur-2xl transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-[1.01] ${
                    isUser
                      ? 'bg-slate-900/50 border border-t-white/90 border-l-white/70 border-r-cyan-400/50 border-b-black/80 shadow-[0_22px_50px_-10px_rgba(0,0,0,0.85),0_12px_28px_-6px_rgba(6,182,212,0.45),inset_0_2.5px_2px_rgba(255,255,255,0.95),inset_0_-3px_8px_rgba(0,0,0,0.65),inset_2px_0_3px_rgba(255,255,255,0.5)] hover:border-cyan-300 hover:shadow-[0_30px_65px_-10px_rgba(0,0,0,0.95),0_18px_40px_-6px_rgba(6,182,212,0.65),inset_0_3px_2px_rgba(255,255,255,1),inset_0_-3px_8px_rgba(0,0,0,0.75)]'
                      : 'bg-slate-950/55 border border-t-white/90 border-l-white/70 border-r-fuchsia-400/50 border-b-black/80 shadow-[0_22px_50px_-10px_rgba(0,0,0,0.85),0_12px_28px_-6px_rgba(217,70,239,0.45),inset_0_2.5px_2px_rgba(255,255,255,0.95),inset_0_-3px_8px_rgba(0,0,0,0.65),inset_2px_0_3px_rgba(255,255,255,0.5)] hover:border-fuchsia-300 hover:shadow-[0_30px_65px_-10px_rgba(0,0,0,0.95),0_18px_40px_-6px_rgba(217,70,239,0.65),inset_0_3px_2px_rgba(255,255,255,1),inset_0_-3px_8px_rgba(0,0,0,0.75)]'
                  }`}>
                    {/* 3D Glass Surface Specular Glare & Refraction Neon Rim */}
                    <div className={`absolute top-0 inset-x-4 h-[2px] rounded-t-full bg-gradient-to-r ${isUser ? 'from-transparent via-cyan-200 to-transparent' : 'from-transparent via-fuchsia-200 to-transparent'} pointer-events-none z-20 opacity-95`} />
                    <div className="absolute inset-0 rounded-[26px] bg-gradient-to-br from-white/[0.16] via-transparent to-black/35 pointer-events-none z-10" />

                    <div className="relative z-10 text-xs sm:text-sm leading-relaxed font-sans font-medium text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
                      {isUser ? (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      ) : (
                        <div className="markdown-body prose prose-invert max-w-none text-white text-xs sm:text-sm">
                          <Markdown>{msg.content}</Markdown>
                        </div>
                      )}
                    </div>

                    <div className={`relative z-10 mt-2 flex items-center text-[10px] font-semibold tracking-wide ${isUser ? 'justify-end text-slate-200' : 'justify-between text-slate-200'}`}>
                      {!isUser && (
                        <div className="flex items-center space-x-2">
                          <span className={`px-2.5 py-0.5 rounded-full border flex items-center space-x-1 ${badge.color}`}>
                            <badge.icon className="w-2.5 h-2.5" />
                            <span>{badge.label}</span>
                          </span>

                          <button
                            type="button"
                            onClick={() => handleToggleReadAloud(msg.id, msg.content, msg.personaUsed)}
                            title={speakingMsgId === msg.id ? "Stop reading aloud" : "Read message aloud"}
                            aria-label={speakingMsgId === msg.id ? "Stop reading aloud" : "Read message aloud"}
                            className={`p-1.5 rounded-full border transition-all duration-200 flex items-center justify-center cursor-pointer ${
                              speakingMsgId === msg.id
                                ? 'bg-fuchsia-500/35 border-fuchsia-300 text-fuchsia-200 shadow-[0_0_12px_rgba(232,121,249,0.6)] animate-pulse'
                                : 'bg-slate-800/50 border-white/20 text-slate-300 hover:text-white hover:bg-slate-700/60 hover:border-white/40 shadow-sm'
                            }`}
                          >
                            {speakingMsgId === msg.id ? (
                              <VolumeX className="w-3 h-3 text-fuchsia-300" />
                            ) : (
                              <Volume2 className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      )}
                      <span className="text-slate-300 font-mono drop-shadow">{msg.timestamp}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Loading Indicator */}
          {loading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start space-x-3"
            >
              <div className="flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-fuchsia-950/80 via-purple-900/80 to-pink-900/80 border border-fuchsia-400/70 shadow-lg shadow-fuchsia-500/35 flex items-center justify-center backdrop-blur-md">
                <BloomingFlower className="w-5.5 h-5.5 sm:w-6 sm:h-6" isUser={false} />
              </div>
              <div className="rounded-[26px] px-5 py-3.5 bg-slate-950/55 border border-t-white/90 border-l-white/70 border-r-fuchsia-400/50 border-b-black/80 shadow-[0_22px_50px_-10px_rgba(0,0,0,0.85),0_12px_28px_-6px_rgba(217,70,239,0.45),inset_0_2.5px_2px_rgba(255,255,255,0.95),inset_0_-3px_8px_rgba(0,0,0,0.65)] backdrop-blur-2xl flex items-center space-x-3">
                {/* Glowing Bouncing Typing Dots */}
                <div className="flex items-center space-x-1.5 px-1 py-0.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-300 shadow-[0_0_10px_#22d3ee] animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2.5 h-2.5 rounded-full bg-fuchsia-300 shadow-[0_0_10px_#e879f9] animate-bounce" style={{ animationDelay: '200ms' }} />
                  <span className="w-2.5 h-2.5 rounded-full bg-pink-300 shadow-[0_0_10px_#f472b6] animate-bounce" style={{ animationDelay: '400ms' }} />
                </div>
                <span className="text-xs sm:text-sm text-white/95 font-medium drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
                  {activePersona === 'codegem'
                    ? 'CodeGem is compiling logic & analyzing dependencies...'
                    : activePersona === 'deepdive'
                    ? 'Deep Dive is querying web knowledge & synthesizing facts...'
                    : 'JaggedGem is flowing through the lava lamp and thinking...'}
                </span>
              </div>
            </motion.div>
          )}

          {error && (
            <div className="p-4 rounded-2xl bg-red-500/20 border border-red-500/30 backdrop-blur-xl text-red-200 text-sm text-center shadow-lg">
              {error}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Floating Scroll to Bottom Button */}
        <AnimatePresence>
          {showScrollBottom && (
            <motion.button
              initial={{ opacity: 0, y: 12, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              onClick={scrollToBottom}
              className="absolute bottom-20 right-6 sm:bottom-24 sm:right-8 z-30 flex items-center space-x-2 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900/50 hover:bg-slate-900/70 active:bg-slate-900/90 border border-t-white/80 border-l-white/50 border-r-white/30 border-b-black/80 shadow-[0_12px_30px_rgba(0,0,0,0.8),inset_0_1.5px_1px_rgba(255,255,255,0.8)] backdrop-blur-xl rounded-full transition-all cursor-pointer group"
              title="Scroll to latest message"
            >
              <ArrowDown className="w-3.5 h-3.5 text-cyan-300 group-hover:translate-y-0.5 transition-transform" />
              <span className="drop-shadow">Scroll to bottom</span>
            </motion.button>
          )}
        </AnimatePresence>

        {/* Bottom Dock Area: Quick Prompts, Quick Feature Toolbar & Input Bar - Pinned at Bottom */}
        <div className="shrink-0 relative z-10 pt-2 mt-auto">
          {messages.length <= 1 && (
            <div className="mb-3">
              <p className="text-xs text-fuchsia-200/90 mb-2 font-semibold flex items-center space-x-1.5 drop-shadow">
                <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
                <span>Tap a quick prompt to test JaggedGem:</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_PROMPTS.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(prompt)}
                    className="px-3.5 py-2 text-xs font-semibold rounded-2xl bg-white/10 hover:bg-white/20 active:bg-white/30 border border-white/20 text-cyan-100 backdrop-blur-xl shadow-sm transition-all hover:scale-[1.02] cursor-pointer"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick Gemini Intelligence Toolbar */}
          <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar mb-2.5 pb-1">
            {/* Image Studio Button */}
            <button
              type="button"
              onClick={() => setIsImageStudioOpen(true)}
              className="px-3 py-1.5 rounded-full bg-slate-900/60 hover:bg-slate-900/80 border border-fuchsia-400/30 hover:border-fuchsia-400 text-xs font-semibold text-fuchsia-200 flex items-center space-x-1.5 backdrop-blur-xl shadow-sm transition-all cursor-pointer flex-shrink-0"
              title="Open Gemini Studio Image Generator & Editor"
            >
              <Wand2 className="w-3.5 h-3.5 text-fuchsia-400" />
              <span>Image Studio</span>
            </button>

            {/* Live Voice Mode Button */}
            <button
              type="button"
              onClick={() => setIsLiveVoiceOpen(true)}
              className="px-3 py-1.5 rounded-full bg-slate-900/60 hover:bg-slate-900/80 border border-cyan-400/30 hover:border-cyan-400 text-xs font-semibold text-cyan-200 flex items-center space-x-1.5 backdrop-blur-xl shadow-sm transition-all cursor-pointer flex-shrink-0"
              title="Start Gemini 2-Way Live Voice Session"
            >
              <PhoneCall className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>Live Voice</span>
            </button>

            {/* High Thinking Toggle */}
            <button
              type="button"
              onClick={() => setEnableThinking(!enableThinking)}
              className={`px-3 py-1.5 rounded-full border text-xs font-semibold flex items-center space-x-1.5 backdrop-blur-xl shadow-sm transition-all cursor-pointer flex-shrink-0 ${
                enableThinking
                  ? 'bg-fuchsia-500/30 border-fuchsia-400 text-fuchsia-200'
                  : 'bg-slate-900/60 border-white/10 text-slate-400 hover:text-slate-200'
              }`}
              title="Toggle ThinkingLevel.HIGH mode"
            >
              <Brain className="w-3.5 h-3.5 text-fuchsia-300" />
              <span>Thinking {enableThinking ? 'ON' : 'OFF'}</span>
            </button>

            {/* Maps Grounding Toggle */}
            <button
              type="button"
              onClick={() => setEnableMapsGrounding(!enableMapsGrounding)}
              className={`px-3 py-1.5 rounded-full border text-xs font-semibold flex items-center space-x-1.5 backdrop-blur-xl shadow-sm transition-all cursor-pointer flex-shrink-0 ${
                enableMapsGrounding
                  ? 'bg-emerald-500/30 border-emerald-400 text-emerald-200'
                  : 'bg-slate-900/60 border-white/10 text-slate-400 hover:text-slate-200'
              }`}
              title="Toggle Google Maps place search grounding"
            >
              <MapPin className="w-3.5 h-3.5 text-emerald-300" />
              <span>Maps {enableMapsGrounding ? 'ON' : 'OFF'}</span>
            </button>

            {/* Search Grounding Toggle */}
            <button
              type="button"
              onClick={() => setEnableSearchGrounding(!enableSearchGrounding)}
              className={`px-3 py-1.5 rounded-full border text-xs font-semibold flex items-center space-x-1.5 backdrop-blur-xl shadow-sm transition-all cursor-pointer flex-shrink-0 ${
                enableSearchGrounding
                  ? 'bg-cyan-500/30 border-cyan-400 text-cyan-200'
                  : 'bg-slate-900/60 border-white/10 text-slate-400 hover:text-slate-200'
              }`}
              title="Toggle real-time Google Search web grounding"
            >
              <Search className="w-3.5 h-3.5 text-cyan-300" />
              <span>Search {enableSearchGrounding ? 'ON' : 'OFF'}</span>
            </button>

            {/* Model Pill */}
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="px-3 py-1.5 rounded-full bg-slate-900/40 hover:bg-slate-900/60 border border-white/10 text-xs font-medium text-slate-400 hover:text-slate-200 flex items-center space-x-1 backdrop-blur-xl transition-colors cursor-pointer flex-shrink-0"
            >
              <Zap className="w-3 h-3 text-purple-400" />
              <span className="capitalize">{selectedModel.replace('gemini-', '')}</span>
            </button>
          </div>

          {/* Input Bar with 3D Frosted Glass Surface */}
          <div className={`relative rounded-3xl bg-slate-950/70 border transition-all duration-300 backdrop-blur-2xl p-2.5 flex items-center space-x-2 ${
            isInputFocused
              ? 'border-cyan-400/80 shadow-[0_0_25px_rgba(34,211,238,0.45),0_0_50px_rgba(217,70,239,0.25),inset_0_1px_1px_rgba(255,255,255,0.4)]'
              : 'border-t-white/30 border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.65),inset_0_1px_1px_rgba(255,255,255,0.3)]'
          }`}>
            {/* Animated Glow Ring on Focus */}
            <AnimatePresence>
              {isInputFocused && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.25 }}
                  className="absolute -inset-1 rounded-[28px] bg-gradient-to-r from-cyan-400/40 via-fuchsia-500/40 to-pink-500/40 blur-md pointer-events-none z-0 animate-pulse"
                />
              )}
            </AnimatePresence>

            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !loading && handleSend()}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setIsInputFocused(false)}
              placeholder={isListening ? "Listening... Speak now..." : `Ask ${activePersona === 'codegem' ? 'CodeGem' : activePersona === 'deepdive' ? 'Deep Dive' : 'JaggedGem'} anything (100% free)...`}
              disabled={loading}
              className="flex-1 bg-transparent px-4 py-3 text-sm sm:text-base text-white placeholder-slate-400 focus:outline-none relative z-10 font-medium"
            />

            {/* Voice-to-Text Microphone Toggle Button */}
            <button
              type="button"
              onClick={handleToggleVoiceInput}
              title={isListening ? "Stop voice listening" : "Voice to text (Speak to type)"}
              aria-label={isListening ? "Stop voice listening" : "Voice to text"}
              className={`relative z-10 flex items-center justify-center w-11 h-11 rounded-2xl transition-all duration-300 shadow-lg cursor-pointer ${
                isListening
                  ? 'bg-rose-500/90 border border-rose-300 text-white shadow-[0_0_25px_rgba(244,63,94,0.9)]'
                  : 'bg-white/10 hover:bg-white/20 active:bg-white/30 border border-white/15 text-cyan-300 hover:text-white hover:scale-105'
              }`}
            >
              {/* Audio Listening Ripple Wave Rings */}
              {isListening && (
                <>
                  <motion.span
                    className="absolute -inset-1.5 rounded-2xl border-2 border-rose-400/80 pointer-events-none z-0"
                    initial={{ scale: 0.9, opacity: 1 }}
                    animate={{ scale: 1.6, opacity: 0 }}
                    transition={{ repeat: Infinity, duration: 1.4, ease: "easeOut" }}
                  />
                  <motion.span
                    className="absolute -inset-1.5 rounded-2xl border-2 border-fuchsia-400/80 pointer-events-none z-0"
                    initial={{ scale: 0.9, opacity: 1 }}
                    animate={{ scale: 1.9, opacity: 0 }}
                    transition={{ repeat: Infinity, duration: 1.4, ease: "easeOut", delay: 0.45 }}
                  />
                  <motion.span
                    className="absolute -inset-1.5 rounded-2xl border border-cyan-300/70 pointer-events-none z-0"
                    initial={{ scale: 0.9, opacity: 1 }}
                    animate={{ scale: 2.2, opacity: 0 }}
                    transition={{ repeat: Infinity, duration: 1.4, ease: "easeOut", delay: 0.9 }}
                  />
                  <motion.span
                    className="absolute -inset-1 rounded-2xl bg-rose-500/40 blur-sm pointer-events-none z-0"
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.9, 0.5] }}
                    transition={{ repeat: Infinity, duration: 0.9, ease: "easeInOut" }}
                  />
                </>
              )}

              {isListening ? <MicOff className="w-5 h-5 text-rose-100 relative z-10 animate-bounce" /> : <Mic className="w-5 h-5 text-cyan-300 relative z-10" />}
            </button>

            <button
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              className={`relative z-10 flex items-center justify-center w-11 h-11 rounded-2xl transition-all duration-300 shadow-lg cursor-pointer ${
                loading || !input.trim()
                  ? 'bg-white/10 text-slate-500 cursor-not-allowed border border-white/10'
                  : 'bg-gradient-to-tr from-fuchsia-500 via-purple-600 to-cyan-400 text-white hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(217,70,239,0.6)] border border-white/30'
              }`}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </div>
          <div className="text-center mt-2 flex items-center justify-center space-x-2">
            <p className="text-[11px] text-fuchsia-200/70 font-medium">
              Powered by Gemini 3.6 Flash • 100% Free Forever • No paywalls
            </p>
          </div>
        </div>
      </main>

      {/* Settings & Core Memory Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        activePersona={activePersona}
        onSelectPersona={setActivePersona}
        activePalette={activePalette}
        onSelectPalette={setActivePalette}
        coreMemories={coreMemories}
        onAddMemory={handleAddMemory}
        onDeleteMemory={handleDeleteMemory}
        onClearMemories={handleClearMemories}
        memoryEnabled={memoryEnabled}
        onToggleMemoryEnabled={setMemoryEnabled}
        ambientSoundEnabled={ambientSoundEnabled}
        onToggleAmbientSound={setAmbientSoundEnabled}
        keyboardSoundEnabled={keyboardSoundEnabled}
        onToggleKeyboardSound={setKeyboardSoundEnabled}
        selectedModel={selectedModel}
        onSelectModel={setSelectedModel}
        enableThinking={enableThinking}
        onToggleThinking={setEnableThinking}
        enableSearchGrounding={enableSearchGrounding}
        onToggleSearchGrounding={setEnableSearchGrounding}
        enableMapsGrounding={enableMapsGrounding}
        onToggleMapsGrounding={setEnableMapsGrounding}
      />

      {/* Gemini Studio Image Generator & Editor Modal */}
      <ImageStudioModal
        isOpen={isImageStudioOpen}
        onClose={() => setIsImageStudioOpen(false)}
        onSendToChat={handleSendImageToChat}
      />

      {/* Gemini Live Voice Session Modal */}
      <LiveVoiceModal
        isOpen={isLiveVoiceOpen}
        onClose={() => setIsLiveVoiceOpen(false)}
      />

      {/* Chat Pages & History Drawer */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={(id) => {
          setActiveSessionId(id);
          setIsHistoryOpen(false);
        }}
        onNewSession={handleNewSession}
        onDeleteSession={handleDeleteSession}
        onRenameSession={handleRenameSession}
        onCombineAllSessions={handleCombineAllSessions}
        onReadMyMessage={handleReadMyMessage}
        onReadAllHistory={handleReadAllHistory}
        speakingMsgId={speakingMsgId}
      />
    </div>
  );
}
