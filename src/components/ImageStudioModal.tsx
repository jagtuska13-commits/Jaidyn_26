import React, { useState, useRef } from 'react';
import { X, Image as ImageIcon, Sparkles, Download, Send, Sliders, Wand2, Upload, Trash2, Check, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';

interface ImageStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendToChat?: (imageUrl: string, prompt: string) => void;
}

export function ImageStudioModal({ isOpen, onClose, onSendToChat }: ImageStudioModalProps) {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<string>('1:1');
  const [imageSize, setImageSize] = useState<string>('1K');
  const [selectedModel, setSelectedModel] = useState<string>('gemini-3.1-flash-image');
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const ASPECT_RATIOS = [
    { id: '1:1', label: '1:1 Square' },
    { id: '16:9', label: '16:9 Wide' },
    { id: '9:16', label: '9:16 Story' },
    { id: '4:3', label: '4:3 Classic' },
    { id: '3:4', label: '3:4 Portrait' },
    { id: '3:2', label: '3:2 Photo' },
    { id: '2:3', label: '2:3 Poster' },
    { id: '21:9', label: '21:9 Cinema' },
  ];

  const IMAGE_SIZES = [
    { id: '512px', label: '512px Fast' },
    { id: '1K', label: '1K HD (Default)' },
    { id: '2K', label: '2K Ultra HD' },
    { id: '4K', label: '4K Studio Quality' },
  ];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        // Strip data:image/...;base64, prefix for backend inlineData usage
        const base64Data = result.split(',')[1] || result;
        setSourceImage(base64Data);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/generate_image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          image: sourceImage,
          aspectRatio,
          imageSize,
          model: selectedModel,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate image.');
      }

      setGeneratedImage(data.imageUrl);
    } catch (err: any) {
      console.error('[ImageStudio] Error:', err);
      setError(err.message || 'Image generation failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;
    const a = document.createElement('a');
    a.href = generatedImage;
    a.download = `jaggedgem-ai-image-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleSendToChat = () => {
    if (!generatedImage || !onSendToChat) return;
    onSendToChat(generatedImage, prompt);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/75 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-md bg-slate-900/95 border border-white/15 rounded-3xl shadow-2xl backdrop-blur-3xl overflow-hidden flex flex-col max-h-[90vh] text-slate-100"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-950/40">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-fuchsia-600 to-cyan-500 text-white shadow-md">
              <Wand2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">Gemini Studio Image Generator & Editor</h2>
              <p className="text-xs text-slate-400">Powered by gemini-3.1-flash-image with custom resolutions & aspect ratios</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* Prompt Input & Edit Image Upload */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-200">
              {sourceImage ? 'Editing Instruction / Prompt' : 'Image Prompt'}
            </label>
            <div className="relative">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={3}
                placeholder={
                  sourceImage
                    ? 'Describe what you want to add, modify, or edit in the uploaded image (e.g., "Add glowing cyber neon wings behind the character")...'
                    : 'Describe the image you want to generate in detail (e.g., "A majestic crystal dragon soaring through a cosmic nebula with purple starlight")...'
                }
                className="w-full px-4 py-3 rounded-2xl bg-slate-950/60 border border-white/15 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-fuchsia-400/60 transition-colors resize-none"
              />
            </div>

            {/* Source Image for Editing */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/40 border border-white/10">
              <div className="flex items-center space-x-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/15 rounded-xl text-xs font-semibold text-slate-200 flex items-center space-x-2 transition-colors cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-cyan-300" />
                  <span>{sourceImage ? 'Change Edit Image' : 'Upload Image to Edit'}</span>
                </button>
                <span className="text-[11px] text-slate-400">
                  {sourceImage ? 'Source image attached for AI editing' : 'Optional: Combine image + prompt for editing'}
                </span>
              </div>

              {sourceImage && (
                <button
                  type="button"
                  onClick={() => setSourceImage(null)}
                  className="p-1.5 text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
                  title="Remove image"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Aspect Ratio Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-200 mb-2">Aspect Ratio</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {ASPECT_RATIOS.map((ar) => (
                <button
                  key={ar.id}
                  type="button"
                  onClick={() => setAspectRatio(ar.id)}
                  className={`px-3 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                    aspectRatio === ar.id
                      ? 'bg-fuchsia-500/25 border-fuchsia-400 text-fuchsia-200 shadow-md'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  {ar.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quality / Resolution & Model Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-200 mb-2">Image Quality & Size</label>
              <div className="grid grid-cols-2 gap-2">
                {IMAGE_SIZES.map((sz) => (
                  <button
                    key={sz.id}
                    type="button"
                    onClick={() => setImageSize(sz.id)}
                    className={`px-3 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      imageSize === sz.id
                        ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200 shadow-md'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    {sz.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-200 mb-2">Gemini Model Engine</label>
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => setSelectedModel('gemini-3.1-flash-image')}
                  className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                    selectedModel === 'gemini-3.1-flash-image'
                      ? 'bg-purple-500/25 border-purple-400 text-purple-200'
                      : 'bg-white/5 border-white/10 text-slate-400'
                  }`}
                >
                  <span>gemini-3.1-flash-image (High Quality)</span>
                  {selectedModel === 'gemini-3.1-flash-image' && <Check className="w-3.5 h-3.5 text-purple-300" />}
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedModel('gemini-3.1-flash-lite-image')}
                  className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                    selectedModel === 'gemini-3.1-flash-lite-image'
                      ? 'bg-purple-500/25 border-purple-400 text-purple-200'
                      : 'bg-white/5 border-white/10 text-slate-400'
                  }`}
                >
                  <span>gemini-3.1-flash-lite-image (Fast)</span>
                  {selectedModel === 'gemini-3.1-flash-lite-image' && <Check className="w-3.5 h-3.5 text-purple-300" />}
                </button>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
            className="w-full py-3 bg-gradient-to-r from-fuchsia-600 via-purple-600 to-cyan-500 hover:opacity-95 disabled:opacity-40 text-white font-bold text-sm rounded-2xl shadow-xl transition-all cursor-pointer flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>Creating Studio Image with Gemini...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>{sourceImage ? 'Edit Source Image' : 'Generate High Quality Image'}</span>
              </>
            )}
          </button>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-400/30 text-rose-200 text-xs text-center">
              {error}
            </div>
          )}

          {/* Image Display */}
          {generatedImage && (
            <div className="space-y-3 pt-2">
              <div className="relative rounded-2xl overflow-hidden border border-white/20 bg-slate-950/80 group">
                <img
                  src={generatedImage}
                  alt={prompt}
                  className="w-full max-h-[400px] object-contain mx-auto rounded-2xl shadow-2xl"
                />
              </div>

              <div className="flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleDownload}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/15 rounded-xl text-xs font-semibold text-slate-200 flex items-center space-x-2 transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4 text-cyan-300" />
                  <span>Download Image</span>
                </button>

                {onSendToChat && (
                  <button
                    type="button"
                    onClick={handleSendToChat}
                    className="px-4 py-2 bg-gradient-to-r from-fuchsia-600 to-cyan-500 hover:opacity-90 rounded-xl text-xs font-bold text-white flex items-center space-x-2 shadow-lg transition-all cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>Send to Chat Thread</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
