import React, { useState } from 'react';
import { Youtube, Upload, FileVideo, X, Layers } from 'lucide-react';

const TABS = [
    { id: 'url', label: 'YouTube URL', icon: Youtube },
    { id: 'file', label: 'Upload file', icon: Upload },
    { id: 'batch', label: 'Batch URLs', icon: Layers },
];

export default function MediaInput({ onProcess, onBatch, isProcessing }) {
    const [mode, setMode] = useState('url'); // 'url' | 'file' | 'batch'
    const [url, setUrl] = useState('');
    const [file, setFile] = useState(null);
    const [batchUrls, setBatchUrls] = useState('');

    const batchCount = batchUrls.split('\n').filter(u => u.trim()).length;

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
        <div className="panel p-6">
            <div className="flex gap-6 border-b border-line mb-5">
                {TABS.map((tab) => {
                    const active = mode === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setMode(tab.id)}
                            className={`flex items-center gap-2 h-10 -mb-px border-b text-[13px] transition-colors ${
                                active
                                    ? 'text-ink border-ink'
                                    : 'text-ink3 border-transparent hover:text-ink2'
                            }`}
                        >
                            <tab.icon size={15} />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            <form onSubmit={handleSubmit}>
                {mode === 'url' ? (
                    <input
                        type="url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://www.youtube.com/watch?v=..."
                        className="input-field h-10"
                        aria-label="Video URL"
                        required
                    />
                ) : mode === 'batch' ? (
                    <div className="space-y-2">
                        <textarea
                            value={batchUrls}
                            onChange={(e) => setBatchUrls(e.target.value)}
                            placeholder={"One URL per line\nhttps://www.youtube.com/watch?v=abc\nhttps://www.youtube.com/watch?v=def"}
                            className="input-field min-h-[112px] resize-y font-mono text-[12px]"
                            rows={5}
                            aria-label="Batch URLs"
                        />
                        <p className="timecode">{batchCount} queued</p>
                    </div>
                ) : (
                    <div
                        className={`border border-dashed rounded-lg p-8 text-center transition-colors ${file ? 'border-ink3 bg-raised' : 'border-line hover:border-ink3'
                            }`}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={handleDrop}
                    >
                        {file ? (
                            <div className="flex items-center justify-center gap-3 text-ink">
                                <FileVideo size={16} className="text-ink3" />
                                <span className="text-[13px]">{file.name}</span>
                                <button
                                    type="button"
                                    onClick={() => setFile(null)}
                                    className="p-1 rounded text-ink3 hover:text-ink transition-colors"
                                    aria-label="Remove file"
                                >
                                    <X size={14} />
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
                                <Upload className="mx-auto mb-3 text-ink3" size={20} />
                                <p className="text-[13px] text-ink2">Drop a video here, or click to choose one</p>
                                <p className="text-[11px] text-ink3 mt-1">MP4 or MOV, up to 500MB</p>
                            </label>
                        )}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isProcessing || (mode === 'url' && !url) || (mode === 'file' && !file) || (mode === 'batch' && !batchUrls.trim())}
                    className="btn-primary w-full mt-5"
                >
                    {isProcessing ? (
                        <>
                            <span className="w-3.5 h-3.5 rounded-full border-2 border-[#111113]/30 border-t-[#111113] animate-spin" />
                            Processing
                        </>
                    ) : mode === 'batch' ? (
                        `Process ${batchCount} videos`
                    ) : (
                        'Generate clips'
                    )}
                </button>
            </form>
        </div>
    );
}
