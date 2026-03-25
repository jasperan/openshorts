import React, { useState } from 'react';
import { Youtube, Upload, FileVideo, X, Layers } from 'lucide-react';

export default function MediaInput({ onProcess, onBatch, isProcessing }) {
    const [mode, setMode] = useState('url'); // 'url' | 'file' | 'batch'
    const [url, setUrl] = useState('');
    const [file, setFile] = useState(null);
    const [batchUrls, setBatchUrls] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (mode === 'url' && url) {
            onProcess({ type: 'url', payload: url });
        } else if (mode === 'file' && file) {
            onProcess({ type: 'file', payload: file });
        } else if (mode === 'batch' && batchUrls.trim()) {
            const urls = batchUrls.split('\n').map(u => u.trim()).filter(u => u.length > 0);
            if (urls.length > 0 && onBatch) {
                onBatch(urls);
            }
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
            setMode('file');
        }
    };

    return (
        <div className="bg-surface border border-white/5 rounded-2xl p-6 animate-[fadeIn_0.6s_ease-out]">
            <div className="flex gap-4 mb-6 border-b border-white/5 pb-4">
                <button
                    onClick={() => setMode('url')}
                    className={`flex items-center gap-2 pb-2 px-2 transition-all ${mode === 'url'
                        ? 'text-primary border-b-2 border-primary -mb-[17px]'
                        : 'text-zinc-400 hover:text-white'
                        }`}
                >
                    <Youtube size={18} />
                    YouTube URL
                </button>
                <button
                    onClick={() => setMode('file')}
                    className={`flex items-center gap-2 pb-2 px-2 transition-all ${mode === 'file'
                        ? 'text-primary border-b-2 border-primary -mb-[17px]'
                        : 'text-zinc-400 hover:text-white'
                        }`}
                >
                    <Upload size={18} />
                    Upload File
                </button>
                <button
                    onClick={() => setMode('batch')}
                    className={`flex items-center gap-2 pb-2 px-2 transition-all ${mode === 'batch'
                        ? 'text-primary border-b-2 border-primary -mb-[17px]'
                        : 'text-zinc-400 hover:text-white'
                        }`}
                >
                    <Layers size={18} />
                    Batch URLs
                </button>
            </div>

            <form onSubmit={handleSubmit}>
                {mode === 'url' ? (
                    <div className="space-y-4">
                        <input
                            type="url"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://www.youtube.com/watch?v=..."
                            className="input-field"
                            required
                        />
                    </div>
                ) : mode === 'batch' ? (
                    <div className="space-y-4">
                        <textarea
                            value={batchUrls}
                            onChange={(e) => setBatchUrls(e.target.value)}
                            placeholder={"Paste one URL per line:\nhttps://www.youtube.com/watch?v=abc\nhttps://www.youtube.com/watch?v=def\nhttps://www.youtube.com/watch?v=ghi"}
                            className="input-field min-h-[120px] resize-y font-mono text-sm"
                            rows={5}
                        />
                        <p className="text-xs text-zinc-500">
                            {batchUrls.split('\n').filter(u => u.trim()).length} URLs queued
                        </p>
                    </div>
                ) : (
                    <div
                        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${file ? 'border-primary/50 bg-primary/5' : 'border-zinc-700 hover:border-zinc-500 bg-white/5'
                            }`}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={handleDrop}
                    >
                        {file ? (
                            <div className="flex items-center justify-center gap-3 text-white">
                                <FileVideo className="text-primary" />
                                <span className="font-medium">{file.name}</span>
                                <button
                                    type="button"
                                    onClick={() => setFile(null)}
                                    className="p-1 hover:bg-white/10 rounded-full"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        ) : (
                            <label className="cursor-pointer block">
                                <input
                                    type="file"
                                    accept="video/*"
                                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                                    className="hidden"
                                />
                                <Upload className="mx-auto mb-3 text-zinc-500" size={24} />
                                <p className="text-zinc-400">Click to upload or drag and drop</p>
                                <p className="text-xs text-zinc-600 mt-1">MP4, MOV up to 500MB</p>
                            </label>
                        )}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isProcessing || (mode === 'url' && !url) || (mode === 'file' && !file) || (mode === 'batch' && !batchUrls.trim())}
                    className="w-full btn-primary mt-6 flex items-center justify-center gap-2"
                >
                    {isProcessing ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Processing Video...
                        </>
                    ) : (
                        <>
                            {mode === 'batch' ? `Process ${batchUrls.split('\n').filter(u => u.trim()).length} Videos` : 'Generate Clips'}
                        </>
                    )}
                </button>
            </form>
        </div>
    );
}
