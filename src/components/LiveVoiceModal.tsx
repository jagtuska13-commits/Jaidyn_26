import React, { useEffect, useState, useRef } from 'react';
import { X, Mic, MicOff, Volume2, Radio, PhoneOff, Sparkles, Activity } from 'lucide-react';
import { motion } from 'motion/react';

interface LiveVoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LiveVoiceModal({ isOpen, onClose }: LiveVoiceModalProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [statusText, setStatusText] = useState('Connecting to Gemini Live...');
  const [errorText, setErrorText] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);

  useEffect(() => {
    if (isOpen) {
      startLiveSession();
    } else {
      cleanupLiveSession();
    }

    return () => {
      cleanupLiveSession();
    };
  }, [isOpen]);

  const pcmToBase64 = (float32Array: Float32Array): string => {
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    const uint8 = new Uint8Array(int16Array.buffer);
    let binary = '';
    for (let i = 0; i < uint8.length; i++) {
      binary += String.fromCharCode(uint8[i]);
    }
    return btoa(binary);
  };

  const playPcmAudioChunk = (base64Audio: string) => {
    try {
      if (!outputAudioCtxRef.current) {
        outputAudioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }

      const audioCtx = outputAudioCtxRef.current;
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }

      const binaryStr = atob(base64Audio);
      const len = binaryStr.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }

      const int16 = new Int16Array(bytes.buffer);
      const float32 = new Float32Array(int16.length);
      for (let i = 0; i < int16.length; i++) {
        float32[i] = int16[i] / (int16[i] < 0 ? 32768 : 32767);
      }

      const audioBuffer = audioCtx.createBuffer(1, float32.length, 24000);
      audioBuffer.getChannelData(0).set(float32);

      const source = audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioCtx.destination);

      const currentTime = audioCtx.currentTime;
      if (nextStartTimeRef.current < currentTime) {
        nextStartTimeRef.current = currentTime;
      }

      source.start(nextStartTimeRef.current);
      nextStartTimeRef.current += audioBuffer.duration;
    } catch (err) {
      console.error('[Live Voice] Playback error:', err);
    }
  };

  const startLiveSession = async () => {
    setIsConnecting(true);
    setErrorText(null);
    setStatusText('Requesting microphone access...');

    try {
      // 1. Microphone Access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      // 2. Setup Input Audio Context (16kHz for Gemini Live API)
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      inputAudioCtxRef.current = inputCtx;

      const source = inputCtx.createMediaStreamSource(stream);
      const processor = inputCtx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      // 3. Connect WebSocket
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/live`;
      setStatusText('Connecting to Gemini Live API...');

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnecting(false);
        setIsConnected(true);
        setStatusText('Gemini Live Voice Active - Speak naturally!');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.audio) {
            playPcmAudioChunk(data.audio);
          }
          if (data.interrupted) {
            // Stop scheduled audio on interrupt
            if (outputAudioCtxRef.current) {
              nextStartTimeRef.current = outputAudioCtxRef.current.currentTime;
            }
          }
          if (data.error) {
            setErrorText(data.error);
          }
        } catch (e) {
          console.error('[Live Voice] WS parse error:', e);
        }
      };

      ws.onerror = (err) => {
        console.error('[Live Voice] WS error:', err);
        setErrorText('WebSocket connection error');
        setIsConnected(false);
        setIsConnecting(false);
      };

      ws.onclose = () => {
        setIsConnected(false);
        setIsConnecting(false);
        setStatusText('Session disconnected');
      };

      // 4. Send audio PCM
      processor.onaudioprocess = (e) => {
        if (ws.readyState === WebSocket.OPEN && !isMuted) {
          const channelData = e.inputBuffer.getChannelData(0);
          const base64Pcm = pcmToBase64(channelData);
          ws.send(JSON.stringify({ audio: base64Pcm }));
        }
      };

      source.connect(processor);
      processor.connect(inputCtx.destination);
    } catch (err: any) {
      console.error('[Live Voice] Setup error:', err);
      setErrorText(err.message || 'Failed to initialize live voice.');
      setIsConnecting(false);
      setIsConnected(false);
    }
  };

  const cleanupLiveSession = () => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }
    if (inputAudioCtxRef.current) {
      inputAudioCtxRef.current.close().catch(() => {});
      inputAudioCtxRef.current = null;
    }
    if (outputAudioCtxRef.current) {
      outputAudioCtxRef.current.close().catch(() => {});
      outputAudioCtxRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
    setIsConnecting(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-xl">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 15 }}
        className="relative w-full max-w-md bg-slate-900/90 border border-fuchsia-400/30 rounded-3xl shadow-2xl backdrop-blur-3xl p-8 text-slate-100 flex flex-col items-center text-center overflow-hidden"
      >
        {/* Background Glowing Orb */}
        <div className="absolute -top-20 -left-20 w-60 h-60 rounded-full bg-fuchsia-600/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-60 h-60 rounded-full bg-cyan-500/20 blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="w-full flex items-center justify-between mb-6 z-10">
          <div className="flex items-center space-x-2 text-xs font-bold text-fuchsia-300">
            <Radio className="w-4 h-4 text-fuchsia-400 animate-pulse" />
            <span>Gemini Live Voice Mode</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Animated Ripple Voice Orb */}
        <div className="relative my-6 flex items-center justify-center z-10">
          {isConnected && (
            <>
              <motion.div
                className="absolute w-36 h-36 rounded-full border-2 border-fuchsia-500/60"
                animate={{ scale: [1, 1.4, 1], opacity: [0.8, 0.2, 0.8] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              />
              <motion.div
                className="absolute w-44 h-44 rounded-full border-2 border-cyan-400/50"
                animate={{ scale: [1, 1.6, 1], opacity: [0.6, 0.1, 0.6] }}
                transition={{ repeat: Infinity, duration: 2, delay: 0.5, ease: "easeInOut" }}
              />
            </>
          )}

          <div className="relative z-10 p-6 rounded-full bg-gradient-to-tr from-fuchsia-600 via-purple-600 to-cyan-500 shadow-[0_0_40px_rgba(217,70,239,0.5)] border border-white/30 text-white">
            <Activity className="w-12 h-12 animate-pulse" />
          </div>
        </div>

        {/* Status Text */}
        <div className="z-10 mb-6">
          <h3 className="text-base font-bold text-white tracking-wide">{statusText}</h3>
          <p className="text-xs text-slate-400 mt-1">Real-time low latency conversation powered by gemini-3.1-flash-live-preview</p>
          {errorText && (
            <p className="text-xs text-rose-400 font-semibold mt-2 p-2 rounded-xl bg-rose-500/10 border border-rose-400/20">{errorText}</p>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center space-x-4 z-10">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-lg ${
              isMuted
                ? 'bg-rose-500/30 border-rose-400 text-rose-200'
                : 'bg-white/10 hover:bg-white/20 border-white/20 text-white'
            }`}
            title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
          >
            {isMuted ? <MicOff className="w-6 h-6 text-rose-400" /> : <Mic className="w-6 h-6 text-cyan-300" />}
          </button>

          <button
            onClick={onClose}
            className="px-6 py-4 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-2xl shadow-xl flex items-center space-x-2 transition-all cursor-pointer"
          >
            <PhoneOff className="w-5 h-5" />
            <span>End Call</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
