import React, { useState } from 'react';
import { X, Type, Loader2 } from 'lucide-react';

const FONT_OPTIONS = [
    { value: 'Verdana', label: 'Verdana' },
    { value: 'Arial', label: 'Arial' },
    { value: 'Impact', label: 'Impact' },
    { value: 'Helvetica', label: 'Helvetica' },
    { value: 'Georgia', label: 'Georgia' },
    { value: 'Courier New', label: 'Courier New' },
];

const COLOR_PRESETS = [
    { color: '#FFFFFF', label: 'White' },
    { color: '#FFFF00', label: 'Yellow' },
    { color: '#00FFFF', label: 'Cyan' },
    { color: '#00FF00', label: 'Green' },
    { color: '#FF0000', label: 'Red' },
    { color: '#FF69B4', label: 'Pink' },
];

export default function SubtitleModal({ isOpen, onClose, onGenerate, isProcessing, videoUrl }) {
    const [position, setPosition] = useState('bottom');
    const [fontSize, setFontSize] = useState(24);
    const [fontName, setFontName] = useState('Verdana');
    const [fontColor, setFontColor] = useState('#FFFFFF');
    const [borderColor, setBorderColor] = useState('#000000');
    const [borderWidth, setBorderWidth] = useState(2);
    const [bgColor, setBgColor] = useState('#000000');
    const [bgOpacity, setBgOpacity] = useState(0.0);

    if (!isOpen) return null;

    // Scale border width for preview (preview font is small, so amplify the effect)
    const bw = Math.max(borderWidth, 0);
    const bc = borderColor;
    // Build outline text-shadow (8-direction) — always applied for visibility
    const outlineShadow = bw > 0 ? [ `-${bw}px -${bw}px 0 ${bc}`, `${bw}px -${bw}px 0 ${bc}`, `-${bw}px ${bw}px 0 ${bc}`, `${bw}px ${bw}px 0 ${bc}`, `0 -${bw}px 0 ${bc}`, `0 ${bw}px 0 ${bc}`, `-${bw}px 0 0 ${bc}`, `${bw}px 0 0 ${bc}`,
    ].join(', ') : 'none';

    const previewStyle = {
        fontFamily: fontName,
        color: fontColor,
        fontSize: `${fontSize}px`,
        fontWeight: 'bold',
        maxWidth: '85%',
        padding: '6px 12px',
        borderRadius: '4px',
        textAlign: 'center',
        lineHeight: '1.3',
        ...(bgOpacity > 0
            ? {
                backgroundColor: `${bgColor}${Math.round(bgOpacity * 255).toString(16).padStart(2, '0')}`,
                textShadow: 'none',
            }
            : { textShadow: outlineShadow }
        ),
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/90">
            <div className="bg-surface border border-line p-6 rounded-xl w-full max-w-4xl relative flex flex-col md:flex-row gap-6 max-h-[90vh]">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-ink3 hover:text-ink z-10"
                >
                    <X size={20} />
                </button>

                {/* Left: Preview */}
                <div className="flex-1 flex flex-col items-center justify-center bg-black rounded-lg border border-line overflow-hidden relative aspect-[9/16] max-h-[600px]">
                     <video src={videoUrl} className="w-full h-full object-contain opacity-50" muted playsInline />

                     {/* Subtitle Overlay Preview */}
                     <div className={`absolute w-full px-8 text-center transition-colors duration-300 pointer-events-none flex flex-col items-center justify-center
                        ${position === 'top' ? 'top-20' : ''}
                        ${position === 'middle' ? 'top-0 bottom-0' : ''}
                        ${position === 'bottom' ? 'bottom-20' : ''} `}>
                        <span style={previewStyle}>
                            This is how your subtitles<br/>will appear on the video
                        </span>
                     </div>
                </div>

                {/* Right: Controls */}
                <div className="w-full md:w-80 flex flex-col overflow-y-auto custom-scrollbar">
                    <h3 className="text-xl font-medium text-ink mb-6 flex items-center gap-2">
                        <Type className="text-primary" /> Auto Subtitles
                    </h3>

                    <div className="space-y-5 flex-1">
                        {/* Position Selector */}
                        <div>
                            <label className="text-xs font-medium text-ink2 mb-2 block">Position</label>
                            <div className="grid grid-cols-3 gap-2">
                                {['top', 'middle', 'bottom'].map((pos) => (
                                    <button
                                        key={pos}
                                        onClick={() => setPosition(pos)}
                                        className={`p-2 rounded-lg border text-center text-xs font-medium transition-colors ${position === pos ? 'bg-primary/20 border-primary text-ink' : 'bg-raised border-line text-ink2 hover:bg-raised'}`}
                                    >
                                        {pos.charAt(0).toUpperCase() + pos.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Font Family */}
                        <div>
                            <label className="text-xs font-medium text-ink2 mb-2 block">Font</label>
                            <select
                                value={fontName}
                                onChange={(e) => setFontName(e.target.value)}
                                className="w-full bg-raised border border-line rounded-lg p-2 text-sm text-ink focus:outline-none focus:border-ink3"
                            >
                                {FONT_OPTIONS.map((f) => (
                                    <option key={f.value} value={f.value} style={{ fontFamily: f.value }}>{f.label}</option>
                                ))}
                            </select>
                        </div>

                        {/* Font Size */}
                        <div>
                            <label className="text-xs font-medium text-ink2 mb-2 block">Font Size</label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="range"
                                    min="16"
                                    max="48"
                                    value={fontSize}
                                    onChange={(e) => setFontSize(parseInt(e.target.value))}
                                    className="w-full accent-primary"
                                />
                                <span className="w-10 text-right text-xs text-ink2">{fontSize}px</span>
                            </div>
                        </div>

                        {/* Text Color */}
                        <div>
                            <label className="text-xs font-medium text-ink2 mb-2 block">Text Color</label>
                            <div className="flex flex-wrap gap-2">
                                {COLOR_PRESETS.map((c) => (
                                    <button
                                        key={c.color}
                                        onClick={() => setFontColor(c.color)}
                                        className={`w-7 h-7 rounded-full border-2 transition-colors ${fontColor === c.color ? 'border-white scale-110' : 'border-line hover:border-line0'}`}
                                        style={{ backgroundColor: c.color }}
                                        title={c.label}
                                    />
                                ))}
                                <label className="w-7 h-7 rounded-full border-2 border-dashed border-line cursor-pointer flex items-center justify-center hover:border-line0 transition-colors overflow-hidden relative" title="Custom color">
                                    <span className="text-[11px] text-ink2">+</span>
                                    <input type="color" value={fontColor} onChange={(e) => setFontColor(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer" />
                                </label>
                            </div>
                        </div>

                        {/* Border / Outline */}
                        <div>
                            <label className="text-xs font-medium text-ink2 mb-2 block">Border</label>
                            <div className="flex items-center gap-3">
                                <label className="relative w-8 h-8 rounded-lg border border-line cursor-pointer overflow-hidden shrink-0" title="Border color">
                                    <div className="w-full h-full" style={{ backgroundColor: borderColor }} />
                                    <input type="color" value={borderColor} onChange={(e) => setBorderColor(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer" />
                                </label>
                                <div className="flex-1">
                                    <input
                                        type="range"
                                        min="0"
                                        max="5"
                                        value={borderWidth}
                                        onChange={(e) => setBorderWidth(parseInt(e.target.value))}
                                        className="w-full accent-primary"
                                    />
                                    <div className="flex justify-between text-[11px] text-ink3">
                                        <span>None</span>
                                        <span>Thick</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Background Box */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-xs font-medium text-ink2">Background Box</label>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" checked={bgOpacity > 0} onChange={(e) => setBgOpacity(e.target.checked ? 0.5 : 0)} className="sr-only peer" />
                                    <div className="w-8 h-4 bg-raised peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[0px] after:left-[0px] after:bg-white after:border-line after:border after:rounded-full after:h-4 after:w-4 after:transition-colors peer-checked:bg-primary"></div>
                                </label>
                            </div>
                            {bgOpacity > 0 && (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <label className="relative w-8 h-8 rounded-lg border border-line cursor-pointer overflow-hidden shrink-0" title="Background color">
                                            <div className="w-full h-full" style={{ backgroundColor: bgColor }} />
                                            <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer" />
                                        </label>
                                        <div className="flex-1">
                                            <input
                                                type="range"
                                                min="10"
                                                max="100"
                                                value={Math.round(bgOpacity * 100)}
                                                onChange={(e) => setBgOpacity(parseInt(e.target.value) / 100)}
                                                className="w-full accent-primary"
                                            />
                                            <div className="flex justify-between text-[11px] text-ink3">
                                                <span>Transparent</span>
                                                <span>{Math.round(bgOpacity * 100)}%</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <button
                        onClick={() => onGenerate({ position, fontSize, fontName, fontColor, borderColor, borderWidth, bgColor, bgOpacity })}
                        disabled={isProcessing}
                        className="btn-primary w-full mt-6"
                    >
                        {isProcessing ? <Loader2 size={20} className="animate-spin" /> : <Type size={20} />}
                        {isProcessing ? 'Generating...' : 'Generate Subtitles'}
                    </button>

                    <p className="text-[11px] text-ink3 text-center mt-3">
                        Uses AI word-level timestamps to sync perfectly.
                    </p>
                </div>
            </div>
        </div>
    );
}
