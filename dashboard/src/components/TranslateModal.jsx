import React, { useState, useEffect } from 'react';
import { X, Loader2, Globe, Languages } from 'lucide-react';
import { getApiUrl } from '../config';

const LANGUAGES = {
    "es": "Spanish",
    "fr": "French",
    "de": "German",
    "it": "Italian",
    "pt": "Portuguese",
    "pl": "Polish",
    "hi": "Hindi",
    "ja": "Japanese",
    "ko": "Korean",
    "zh": "Chinese",
    "ar": "Arabic",
    "ru": "Russian",
    "tr": "Turkish",
    "nl": "Dutch",
    "sv": "Swedish",
    "id": "Indonesian",
    "fil": "Filipino",
    "ms": "Malay",
    "vi": "Vietnamese",
    "th": "Thai",
    "uk": "Ukrainian",
    "el": "Greek",
    "cs": "Czech",
    "fi": "Finnish",
    "ro": "Romanian",
    "da": "Danish",
    "bg": "Bulgarian",
    "hr": "Croatian",
    "sk": "Slovak",
    "ta": "Tamil",
    "en": "English",
};

export default function TranslateModal({ isOpen, onClose, onTranslate, isProcessing, videoUrl }) {
    const [targetLanguage, setTargetLanguage] = useState('es');

    if (!isOpen) return null;

    const handleSubmit = () => {
        console.log('[TranslateModal] handleSubmit called, targetLanguage:', targetLanguage);
        onTranslate({ targetLanguage });
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
            <div className="bg-[#121214] border border-white/10 p-6 rounded-2xl w-full max-w-md shadow-2xl relative">
                <button
                    onClick={onClose}
                    disabled={isProcessing}
                    className="absolute top-4 right-4 text-zinc-500 hover:text-white disabled:opacity-50"
                >
                    <X size={20} />
                </button>

                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center">
                        <Languages size={20} className="text-white" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white">Dub Voice</h3>
                        <p className="text-xs text-zinc-500">Local AI voice translation (no API key needed)</p>
                    </div>
                </div>

                {/* Preview */}
                <div className="mb-6 rounded-xl overflow-hidden bg-black aspect-video relative">
                    <video
                        src={videoUrl}
                        className="w-full h-full object-contain"
                        muted
                        playsInline
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                </div>

                {/* Language Selection */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-zinc-400 mb-2">
                        <Globe size={14} className="inline mr-2" />
                        Target Language
                    </label>
                    <select
                        value={targetLanguage}
                        onChange={(e) => setTargetLanguage(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-green-500/50 appearance-none cursor-pointer"
                        disabled={isProcessing}
                    >
                        {Object.entries(LANGUAGES).sort((a, b) => a[1].localeCompare(b[1])).map(([code, name]) => (
                            <option key={code} value={code}>
                                {name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Info */}
                <div className="mb-6 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <p className="text-xs text-green-400">
                        Audio will be transcribed, translated, and re-dubbed locally using AI. No cloud APIs or keys needed.
                    </p>
                </div>

                {/* Processing State */}
                {isProcessing && (
                    <div className="mb-4 p-4 bg-white/5 rounded-lg border border-white/10">
                        <div className="flex items-center gap-3">
                            <Loader2 size={20} className="text-green-400 animate-spin" />
                            <div>
                                <p className="text-sm text-white font-medium">Dubbing audio...</p>
                                <p className="text-xs text-zinc-500">This may take a few minutes</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        disabled={isProcessing}
                        className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-zinc-300 rounded-xl font-medium transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isProcessing}
                        className="flex-1 py-3 bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-400 hover:to-teal-500 text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isProcessing ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                Dubbing...
                            </>
                        ) : (
                            <>
                                <Languages size={16} />
                                Dub Voice
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
