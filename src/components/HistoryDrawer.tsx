import React, { useState } from 'react';
import { X, Plus, Layers, Merge, Volume2, BookOpen, Trash2, Edit2, Check, MessageSquare, Sparkles, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PersonaType } from './SettingsModal';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  personaUsed?: PersonaType;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: Message[];
}

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onDeleteSession: (id: string) => void;
  onRenameSession: (id: string, newTitle: string) => void;
  onCombineAllSessions: () => void;
  onReadMyMessage: () => void;
  onReadAllHistory: () => void;
  speakingMsgId: string | null;
}

export function HistoryDrawer({
  isOpen,
  onClose,
  sessions,
  activeSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  onRenameSession,
  onCombineAllSessions,
  onReadMyMessage,
  onReadAllHistory,
  speakingMsgId,
}: HistoryDrawerProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const handleStartRename = (session: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(session.id);
    setEditTitle(session.title);
  };

  const handleSaveRename = (id: string, e: React.FormEvent | React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (editTitle.trim()) {
      onRenameSession(id, editTitle.trim());
    }
    setEditingId(null);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-md">
        {/* Backdrop click to close */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 cursor-pointer"
        />

        {/* Drawer Panel */}
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-md h-full bg-slate-900/95 border-l border-white/10 shadow-2xl backdrop-blur-2xl flex flex-col z-10 overflow-hidden"
        >
          {/* Header */}
          <div className="p-5 border-b border-white/10 flex items-center justify-between bg-slate-950/60">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-fuchsia-500/20 to-cyan-500/20 border border-fuchsia-400/30 text-cyan-300">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                  <span>Chat History Pages</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-400/30">
                    {sessions.length} {sessions.length === 1 ? 'Page' : 'Pages'}
                  </span>
                </h2>
                <p className="text-xs text-slate-300">Manage multiple conversations or combine them into one</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Action Toolbar */}
          <div className="p-4 border-b border-white/10 bg-slate-950/30 space-y-2.5">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  onNewSession();
                }}
                className="flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-fuchsia-500 hover:from-cyan-400 hover:to-fuchsia-400 text-white font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>New Chat Page</span>
              </button>

              <button
                onClick={onCombineAllSessions}
                className="flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-cyan-400/30 text-cyan-300 hover:text-white font-bold text-xs shadow-md transition-all cursor-pointer active:scale-95"
                title="Merge all pages into a single unified conversation"
              >
                <Merge className="w-4 h-4 text-cyan-400" />
                <span>Combine All Pages</span>
              </button>
            </div>

            {/* Quick Speech Controls */}
            <div className="pt-2 border-t border-white/5 flex items-center space-x-2">
              <button
                onClick={onReadMyMessage}
                className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  speakingMsgId === 'last-user-msg'
                    ? 'bg-fuchsia-500/30 border-fuchsia-400 text-fuchsia-200 animate-pulse'
                    : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-200 hover:text-white'
                }`}
              >
                <Volume2 className="w-3.5 h-3.5 text-fuchsia-400" />
                <span>Read My Message</span>
              </button>

              <button
                onClick={onReadAllHistory}
                className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  speakingMsgId === 'history-all'
                    ? 'bg-cyan-500/30 border-cyan-400 text-cyan-200 animate-pulse'
                    : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-200 hover:text-white'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                <span>Read All History</span>
              </button>
            </div>
          </div>

          {/* Pages List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
            {sessions.map((session) => {
              const isActive = session.id === activeSessionId;
              const isEditing = editingId === session.id;

              return (
                <div
                  key={session.id}
                  onClick={() => onSelectSession(session.id)}
                  className={`group relative p-4 rounded-2xl border transition-all cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-fuchsia-500/15 via-purple-500/10 to-cyan-500/15 border-fuchsia-400/50 shadow-lg shadow-fuchsia-500/10'
                      : 'bg-slate-950/40 hover:bg-slate-800/60 border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1 min-w-0 pr-2">
                      <div className={`p-2 rounded-xl mt-0.5 shrink-0 ${isActive ? 'bg-fuchsia-500/20 text-fuchsia-300' : 'bg-white/5 text-slate-400'}`}>
                        <MessageSquare className="w-4 h-4" />
                      </div>

                      <div className="flex-1 min-w-0">
                        {isEditing ? (
                          <div className="flex items-center space-x-2" onClick={e => e.stopPropagation()}>
                            <input
                              type="text"
                              value={editTitle}
                              onChange={e => setEditTitle(e.target.value)}
                              onKeyDown={e => e.key === 'Enter' && handleSaveRename(session.id, e)}
                              className="bg-slate-900 border border-fuchsia-400 rounded-lg px-2 py-1 text-xs text-white focus:outline-none w-full"
                              autoFocus
                            />
                            <button
                              onClick={e => handleSaveRename(session.id, e)}
                              className="p-1 rounded-lg bg-fuchsia-500 text-white hover:bg-fuchsia-400"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <h3 className="text-sm font-bold text-white truncate">{session.title}</h3>
                            {isActive && (
                              <span className="shrink-0 text-[10px] font-bold px-2 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                                Active Page
                              </span>
                            )}
                          </div>
                        )}

                        <div className="flex items-center space-x-3 mt-1.5 text-[11px] text-slate-300">
                          <span className="flex items-center space-x-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{new Date(session.updatedAt || session.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                          </span>
                          <span>•</span>
                          <span>{session.messages.length} messages</span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Session Actions */}
                    <div className="flex items-center space-x-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      {!isEditing && (
                        <button
                          onClick={e => handleStartRename(session, e)}
                          className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-cyan-300 transition-colors"
                          title="Rename page"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {sessions.length > 1 && (
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            onDeleteSession(session.id);
                          }}
                          className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                          title="Delete page"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer Info */}
          <div className="p-4 border-t border-white/10 bg-slate-950/60 text-center">
            <p className="text-[11px] text-slate-300">
              Tip: You can also say <span className="text-cyan-300 font-semibold">"read my message"</span> or <span className="text-fuchsia-300 font-semibold">"read all history"</span> directly into the microphone!
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
