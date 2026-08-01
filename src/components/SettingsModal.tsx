import React, { useState } from 'react';
import { X, Cpu, Brain, Globe, Plus, Trash2, Check, Sparkles, Code, Compass, Info, Palette, Volume2, VolumeX, Keyboard, Zap, MapPin, Search, Bot } from 'lucide-react';
import { motion } from 'motion/react';
import { LavaPalette } from './LavaLamp';

export type PersonaType = 'jaggedgem' | 'codegem' | 'deepdive';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  activePersona: PersonaType;
  onSelectPersona: (persona: PersonaType) => void;
  activePalette: LavaPalette;
  onSelectPalette: (palette: LavaPalette) => void;
  coreMemories: string[];
  onAddMemory: (memory: string) => void;
  onDeleteMemory: (index: number) => void;
  onClearMemories: () => void;
  memoryEnabled: boolean;
  onToggleMemoryEnabled: (enabled: boolean) => void;
  ambientSoundEnabled: boolean;
  onToggleAmbientSound: (enabled: boolean) => void;
  keyboardSoundEnabled: boolean;
  onToggleKeyboardSound: (enabled: boolean) => void;
  selectedModel: string;
  onSelectModel: (model: string) => void;
  enableThinking: boolean;
  onToggleThinking: (enabled: boolean) => void;
  enableSearchGrounding: boolean;
  onToggleSearchGrounding: (enabled: boolean) => void;
  enableMapsGrounding: boolean;
  onToggleMapsGrounding: (enabled: boolean) => void;
}

export function SettingsModal({
  isOpen,
  onClose,
  activePersona,
  onSelectPersona,
  activePalette,
  onSelectPalette,
  coreMemories,
  onAddMemory,
  onDeleteMemory,
  onClearMemories,
  memoryEnabled,
  onToggleMemoryEnabled,
  ambientSoundEnabled,
  onToggleAmbientSound,
  keyboardSoundEnabled,
  onToggleKeyboardSound,
  selectedModel,
  onSelectModel,
  enableThinking,
  onToggleThinking,
  enableSearchGrounding,
  onToggleSearchGrounding,
  enableMapsGrounding,
  onToggleMapsGrounding,
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'persona' | 'intelligence' | 'theme' | 'memory' | 'deepdive'>('persona');
  const [newMemory, setNewMemory] = useState('');

  if (!isOpen) return null;

  const handleAddMemorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemory.trim()) return;
    onAddMemory(newMemory.trim());
    setNewMemory('');
  };

  const PALETTES: { id: LavaPalette; name: string; desc: string; gradient: string; previewDots: string[] }[] = [
    {
      id: 'cosmic',
      name: 'Cosmic Violet',
      desc: 'Mystical deep fuchsia, violet & sky blue lava flows',
      gradient: 'from-fuchsia-600 via-purple-600 to-cyan-500',
      previewDots: ['bg-fuchsia-500', 'bg-purple-500', 'bg-cyan-400']
    },
    {
      id: 'volcanic',
      name: 'Volcanic Red',
      desc: 'Fiery magma crimson, glowing orange & warm amber',
      gradient: 'from-red-600 via-rose-600 to-amber-500',
      previewDots: ['bg-red-500', 'bg-orange-500', 'bg-amber-400']
    },
    {
      id: 'deepsea',
      name: 'Deep Sea Blue',
      desc: 'Ocean abyss cyan, aqua teal & deep navy blue',
      gradient: 'from-blue-600 via-cyan-500 to-teal-400',
      previewDots: ['bg-blue-500', 'bg-cyan-400', 'bg-emerald-400']
    },
    {
      id: 'cyber',
      name: 'Cyber Neon',
      desc: 'Electric lime, high-voltage magenta & cyber cyan',
      gradient: 'from-lime-400 via-fuchsia-500 to-cyan-400',
      previewDots: ['bg-lime-400', 'bg-fuchsia-500', 'bg-cyan-400']
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-md bg-slate-900/95 border border-white/15 rounded-3xl shadow-2xl backdrop-blur-3xl overflow-hidden flex flex-col max-h-[85vh] text-slate-100"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 bg-slate-950/40">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-fuchsia-500/20 border border-fuchsia-400/30 text-fuchsia-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">JaggedGem AI Settings</h2>
              <p className="text-xs text-slate-400">Configure Theme, Personas, Core Memory & Deep Dive</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="flex border-b border-white/10 bg-slate-950/20 px-6 pt-2 space-x-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('persona')}
            className={`flex items-center space-x-2 px-4 py-3 text-xs font-semibold rounded-t-xl transition-colors cursor-pointer border-t border-x ${
              activeTab === 'persona'
                ? 'bg-slate-900/90 border-white/15 text-fuchsia-300 border-b-transparent'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>AI Personas</span>
          </button>

          <button
            onClick={() => setActiveTab('intelligence')}
            className={`flex items-center space-x-2 px-4 py-3 text-xs font-semibold rounded-t-xl transition-colors cursor-pointer border-t border-x ${
              activeTab === 'intelligence'
                ? 'bg-slate-900/90 border-white/15 text-purple-300 border-b-transparent'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-4 h-4 text-purple-400" />
            <span>Intelligence & Grounding</span>
          </button>

          <button
            onClick={() => setActiveTab('theme')}
            className={`flex items-center space-x-2 px-4 py-3 text-xs font-semibold rounded-t-xl transition-colors cursor-pointer border-t border-x ${
              activeTab === 'theme'
                ? 'bg-slate-900/90 border-white/15 text-pink-300 border-b-transparent'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>Theme Mode</span>
          </button>

          <button
            onClick={() => setActiveTab('memory')}
            className={`flex items-center space-x-2 px-4 py-3 text-xs font-semibold rounded-t-xl transition-colors cursor-pointer border-t border-x ${
              activeTab === 'memory'
                ? 'bg-slate-900/90 border-white/15 text-cyan-300 border-b-transparent'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Brain className="w-4 h-4" />
            <span>Core Memory</span>
            {coreMemories.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 rounded-full font-bold">
                {coreMemories.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('deepdive')}
            className={`flex items-center space-x-2 px-4 py-3 text-xs font-semibold rounded-t-xl transition-colors cursor-pointer border-t border-x ${
              activeTab === 'deepdive'
                ? 'bg-slate-900/90 border-white/15 text-emerald-300 border-b-transparent'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Deep Dive</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: AI GEMS & PERSONAS */}
          {activeTab === 'persona' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-300 leading-relaxed">
                Choose the AI Gem persona for your conversations. Each persona has specialized system capabilities and communication styles.
              </p>

              <div className="grid grid-cols-1 gap-3.5">
                {/* Option 1: JaggedGem */}
                <div
                  onClick={() => onSelectPersona('jaggedgem')}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start space-x-4 ${
                    activePersona === 'jaggedgem'
                      ? 'bg-fuchsia-500/15 border-fuchsia-400/50 shadow-lg shadow-fuchsia-500/10'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className="p-3 rounded-xl bg-gradient-to-tr from-fuchsia-600 to-purple-600 text-white shadow-md flex-shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                        <span>JaggedGem</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-fuchsia-500/20 text-fuchsia-300 font-semibold border border-fuchsia-400/30">Default AI</span>
                      </h3>
                      {activePersona === 'jaggedgem' && <Check className="w-4 h-4 text-fuchsia-300" />}
                    </div>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      Witty, sharp, unfiltered, slightly cynical yet brilliant companion. Gives raw wisdom, clever banter, and honest advice with 100% free access.
                    </p>
                  </div>
                </div>

                {/* Option 2: CodeGem */}
                <div
                  onClick={() => onSelectPersona('codegem')}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start space-x-4 ${
                    activePersona === 'codegem'
                      ? 'bg-cyan-500/15 border-cyan-400/50 shadow-lg shadow-cyan-500/10'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className="p-3 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-white shadow-md flex-shrink-0">
                    <Code className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                        <span>CodeGem</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-400/30">Code Specialist</span>
                      </h3>
                      {activePersona === 'codegem' && <Check className="w-4 h-4 text-cyan-300" />}
                    </div>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      Specialized in full-stack TypeScript, React, Tailwind, API design, debugging, and system integrations. Delivers production-ready code with high craft.
                    </p>
                  </div>
                </div>

                {/* Option 3: Deep Dive */}
                <div
                  onClick={() => onSelectPersona('deepdive')}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start space-x-4 ${
                    activePersona === 'deepdive'
                      ? 'bg-emerald-500/15 border-emerald-400/50 shadow-lg shadow-emerald-500/10'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className="p-3 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white shadow-md flex-shrink-0">
                    <Compass className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                        <span>Deep Dive Persona</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-400/30">Google Grounded</span>
                      </h3>
                      {activePersona === 'deepdive' && <Check className="w-4 h-4 text-emerald-300" />}
                    </div>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      Unrestricted deep research mode backed by real-time Google Search grounding. Queries expansive web sources for up-to-date facts and comprehensive insights.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: INTELLIGENCE & GROUNDING */}
          {activeTab === 'intelligence' && (
            <div className="space-y-5">
              <p className="text-xs text-slate-300 leading-relaxed">
                Configure Gemini models, thinking levels, and real-time grounding sources for your chat experience.
              </p>

              {/* Model Selection */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-200">Gemini Intelligence Model</label>
                <div className="grid grid-cols-1 gap-2.5">
                  <button
                    type="button"
                    onClick={() => onSelectModel('gemini-3.5-flash')}
                    className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                      selectedModel === 'gemini-3.5-flash'
                        ? 'bg-purple-500/20 border-purple-400 text-purple-200 shadow-md'
                        : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-white flex items-center space-x-2">
                        <span>gemini-3.5-flash / gemini-3.6-flash</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/30 text-purple-200 font-semibold">Balanced Default</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">High accuracy, fast response time, ideal for general tasks & chat</p>
                    </div>
                    {selectedModel === 'gemini-3.5-flash' && <Check className="w-4 h-4 text-purple-300 flex-shrink-0" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => onSelectModel('gemini-3.1-pro-preview')}
                    className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                      selectedModel === 'gemini-3.1-pro-preview'
                        ? 'bg-fuchsia-500/20 border-fuchsia-400 text-fuchsia-200 shadow-md'
                        : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-white flex items-center space-x-2">
                        <span>gemini-3.1-pro-preview</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-fuchsia-500/30 text-fuchsia-200 font-semibold">Complex Tasks</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">Advanced reasoning and code architecture capabilities</p>
                    </div>
                    {selectedModel === 'gemini-3.1-pro-preview' && <Check className="w-4 h-4 text-fuchsia-300 flex-shrink-0" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => onSelectModel('gemini-3.1-flash-lite')}
                    className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                      selectedModel === 'gemini-3.1-flash-lite'
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-md'
                        : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-white flex items-center space-x-2">
                        <span>gemini-3.1-flash-lite</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/30 text-cyan-200 font-semibold">Low Latency</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">Ultra-fast responses for quick questions and lightweight interactions</p>
                    </div>
                    {selectedModel === 'gemini-3.1-flash-lite' && <Check className="w-4 h-4 text-cyan-300 flex-shrink-0" />}
                  </button>
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-3 pt-2">
                <label className="block text-xs font-bold text-slate-200">Advanced Intelligence Modes</label>

                {/* High Thinking Mode Toggle */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/5 border border-white/10">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-xl bg-fuchsia-500/20 text-fuchsia-300">
                      <Brain className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">High Thinking Mode (ThinkingLevel.HIGH)</h4>
                      <p className="text-[11px] text-slate-400">Uses deep reasoning step-by-step thinking with gemini-3.1-pro-preview</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onToggleThinking(!enableThinking)}
                    className={`w-12 h-6 rounded-full transition-colors relative p-1 cursor-pointer ${
                      enableThinking ? 'bg-fuchsia-600' : 'bg-slate-700'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition-transform ${
                        enableThinking ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Search Grounding Toggle */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/5 border border-white/10">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300">
                      <Search className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">Google Search Grounding</h4>
                      <p className="text-[11px] text-slate-400">Query live Google Search web sources with clickable citation links</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onToggleSearchGrounding(!enableSearchGrounding)}
                    className={`w-12 h-6 rounded-full transition-colors relative p-1 cursor-pointer ${
                      enableSearchGrounding ? 'bg-cyan-600' : 'bg-slate-700'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition-transform ${
                        enableSearchGrounding ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Maps Grounding Toggle */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/5 border border-white/10">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">Google Maps Grounding</h4>
                      <p className="text-[11px] text-slate-400">Ground responses in real-time location and Google Maps places data</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onToggleMapsGrounding(!enableMapsGrounding)}
                    className={`w-12 h-6 rounded-full transition-colors relative p-1 cursor-pointer ${
                      enableMapsGrounding ? 'bg-emerald-600' : 'bg-slate-700'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition-transform ${
                        enableMapsGrounding ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: THEME MODE / LAVA LAMP PALETTE & SOUND */}
          {activeTab === 'theme' && (
            <div className="space-y-5">
              {/* Ambient Sound Toggle Switch */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-950/50 border border-white/10 shadow-md">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-xl ${ambientSoundEnabled ? 'bg-fuchsia-500/20 text-fuchsia-300' : 'bg-white/5 text-slate-400'}`}>
                    {ambientSoundEnabled ? <Volume2 className="w-5 h-5 text-fuchsia-400 animate-pulse" /> : <VolumeX className="w-5 h-5 text-slate-400" />}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white flex items-center space-x-2">
                      <span>Ambient Lava Sound Effect</span>
                      {ambientSoundEnabled && <span className="text-[10px] px-2 py-0.2 rounded-full bg-fuchsia-500/20 text-fuchsia-300 font-semibold border border-fuchsia-400/30">Active</span>}
                    </h4>
                    <p className="text-[11px] text-slate-300">Plays a soothing, low-frequency relaxing lava bubbling audio loop</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onToggleAmbientSound(!ambientSoundEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                    ambientSoundEnabled ? 'bg-fuchsia-500' : 'bg-slate-800 border border-white/10'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      ambientSoundEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Mechanical Keyboard Typing Sound Toggle Switch */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-950/50 border border-white/10 shadow-md">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-xl ${keyboardSoundEnabled ? 'bg-cyan-500/20 text-cyan-300' : 'bg-white/5 text-slate-400'}`}>
                    <Keyboard className={`w-5 h-5 ${keyboardSoundEnabled ? 'text-cyan-400' : 'text-slate-400'}`} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white flex items-center space-x-2">
                      <span>Mechanical Keyboard Typing Clicks</span>
                      {keyboardSoundEnabled && <span className="text-[10px] px-2 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-400/30">Active</span>}
                    </h4>
                    <p className="text-[11px] text-slate-300">Plays subtle tactile switch clicking sounds while AI generates responses</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onToggleKeyboardSound(!keyboardSoundEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                    keyboardSoundEnabled ? 'bg-cyan-500' : 'bg-slate-800 border border-white/10'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      keyboardSoundEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div>
                <p className="text-xs text-slate-300 leading-relaxed mb-3">
                  Select your preferred lava lamp color palette. The animated fluid background smoothly updates with organic liquid color transitions.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {PALETTES.map((pal) => {
                    const isSelected = activePalette === pal.id;
                    return (
                      <div
                        key={pal.id}
                        onClick={() => onSelectPalette(pal.id)}
                        className={`relative p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                          isSelected
                            ? 'bg-white/10 border-fuchsia-400/60 shadow-xl ring-1 ring-fuchsia-400/40'
                            : 'bg-white/5 border-white/10 hover:bg-white/10'
                        }`}
                      >
                        <div>
                          {/* Gradient Preview Bar */}
                          <div className={`h-3 w-full rounded-full bg-gradient-to-r ${pal.gradient} mb-3 shadow-inner`} />
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-bold text-white">{pal.name}</h4>
                            {isSelected && <Check className="w-4 h-4 text-fuchsia-300" />}
                          </div>
                          <p className="text-xs text-slate-300 mt-1 leading-relaxed">{pal.desc}</p>
                        </div>

                        {/* Color dots preview */}
                        <div className="flex items-center space-x-1.5 pt-1">
                          {pal.previewDots.map((dotClass, idx) => (
                            <span key={idx} className={`w-3.5 h-3.5 rounded-full ${dotClass} shadow-sm border border-white/20`} />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CORE MEMORY */}
          {activeTab === 'memory' && (
            <div className="space-y-5">
              {/* Toggle Switch */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-950/50 border border-white/10">
                <div className="flex items-center space-x-3">
                  <Brain className="w-5 h-5 text-cyan-400" />
                  <div>
                    <h4 className="text-xs font-bold text-white">Enable Core Memory</h4>
                    <p className="text-[11px] text-slate-400">Inject stored memories into AI context on every turn</p>
                  </div>
                </div>
                <button
                  onClick={() => onToggleMemoryEnabled(!memoryEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                    memoryEnabled ? 'bg-cyan-500' : 'bg-slate-800 border border-white/10'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      memoryEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Add Memory Input Form */}
              <form onSubmit={handleAddMemorySubmit} className="flex gap-2">
                <input
                  type="text"
                  value={newMemory}
                  onChange={e => setNewMemory(e.target.value)}
                  placeholder="e.g. My preferred tech stack is React, Vite, and Node.js..."
                  className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950/60 border border-white/15 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400/60"
                />
                <button
                  type="submit"
                  disabled={!newMemory.trim()}
                  className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white rounded-xl text-xs font-semibold flex items-center space-x-1 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add</span>
                </button>
              </form>

              {/* Memory Items List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300">Saved Core Memories ({coreMemories.length})</span>
                  {coreMemories.length > 0 && (
                    <button
                      onClick={onClearMemories}
                      className="text-[11px] text-red-400 hover:text-red-300 flex items-center space-x-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Clear All</span>
                    </button>
                  )}
                </div>

                {coreMemories.length === 0 ? (
                  <div className="p-6 text-center rounded-2xl bg-white/5 border border-white/10 text-slate-400 text-xs">
                    No core memories stored yet. Add memories above to give JaggedGem persistent personal context.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {coreMemories.map((mem, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-950/40 border border-white/10 text-xs text-slate-200"
                      >
                        <span className="flex-1 pr-3">{mem}</span>
                        <button
                          onClick={() => onDeleteMemory(index)}
                          className="p-1 text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
                          title="Delete Memory"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: DEEP DIVE INTERNET */}
          {activeTab === 'deepdive' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-400/30 flex items-start space-x-3 text-emerald-200 text-xs">
                <Globe className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-emerald-300">Unrestricted Real-Time Web Grounding</h4>
                  <p className="mt-1 leading-relaxed text-slate-300">
                    When active, the Deep Dive persona automatically queries Google Search live during chat. It accesses up-to-the-minute web information, documentation, news, and technical data without restrictions or paywalls.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/50 border border-white/10 space-y-3">
                <h4 className="text-xs font-bold text-white flex items-center space-x-2">
                  <Info className="w-4 h-4 text-cyan-400" />
                  <span>Deep Dive Capability Overview</span>
                </h4>
                <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside">
                  <li><strong>Live Search Integration:</strong> Grounded responses with real web URL sources attached to answer blocks.</li>
                  <li><strong>Exhaustive Synthesis:</strong> Analyzes complex topics with structured bullet points and thorough explanations.</li>
                  <li><strong>100% Free Access:</strong> Fully integrated via server-side Gemini 3.6 Flash without hidden fees or API subscriptions.</li>
                </ul>
              </div>

              {activePersona !== 'deepdive' && (
                <button
                  onClick={() => onSelectPersona('deepdive')}
                  className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer"
                >
                  Activate Deep Dive Persona Now
                </button>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-white/10 bg-slate-950/60 flex items-center justify-between">
          <div className="text-[11px] text-slate-400 flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Persona: <strong className="text-white capitalize">{activePersona}</strong> • Palette: <strong className="text-white capitalize">{activePalette}</strong></span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer"
          >
            Done
          </button>
        </div>
      </motion.div>
    </div>
  );
}
