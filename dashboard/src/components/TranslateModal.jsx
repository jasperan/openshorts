import React, { useState } from 'react';
import { X, Loader2, Globe, Languages } from 'lucide-react';

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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/90">
            <div className="bg-surface border border-line p-6 rounded-xl w-full max-w-md relative">
                <button
                    onClick={onClose}
                    disabled={isProcessing}
                    className="absolute top-4 right-4 text-ink3 hover:text-ink disabled:opacity-50"
                >
                    <X size={20} />
                </button>

                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-raised flex items-center justify-center">
                        <Languages size={20} className="text-ink" />
                    </div>
                    <div>
                        <h3 className="text-lg font-medium text-ink">Dub Voice</h3>
                        <p className="text-xs text-ink3">Local AI voice translation (no API key needed)</p>
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
                    <div className="absolute inset-0 bg-background/80 pointer-events-none" />
                </div>

                {/* Language Selection */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-ink2 mb-2">
                        <Globe size={14} className="inline mr-2" />
                        Target Language
                    </label>
                    <select
                        value={targetLanguage}
                        onChange={(e) => setTargetLanguage(e.target.value)}
                        className="w-full bg-raised border border-line rounded-lg p-3 text-sm text-ink focus:outline-none focus:border-green-500/50 appearance-none cursor-pointer"
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
                <div className="mb-6 p-3 bg-positive/10 border border-positive/25 rounded-lg">
                    <p className="text-xs text-positive">
                        Audio will be transcribed, translated, and re-dubbed locally using AI. No cloud APIs or keys needed.
                    </p>
                </div>

                {/* Processing State */}
                {isProcessing && (
                    <div className="mb-4 p-4 bg-raised rounded-lg border border-line">
                        <div className="flex items-center gap-3">
                            <Loader2 size={20} className="text-positive animate-spin" />
                            <div>
                                <p className="text-sm text-ink font-medium">Dubbing audio...</p>
                                <p className="text-xs text-ink3">This may take a few minutes</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        disabled={isProcessing}
                        className="flex-1 py-3 bg-raised hover:bg-raised text-ink2 rounded-xl font-medium transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isProcessing}
                        className="btn-primary flex-1"
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
