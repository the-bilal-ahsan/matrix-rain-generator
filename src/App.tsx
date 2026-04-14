/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useRef } from 'react';
import { MatrixRain } from './components/MatrixRain';
import { useMatrixSound } from './hooks/useMatrixSound';
import {
  Maximize2,
  Settings2,
  Volume2,
  VolumeX,
  Zap,
  Play,
  Pause,
  Monitor,
  Image as ImageIcon,
  RotateCcw,
  Video,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [color, setColor] = useState('#00FF41');
  const [speed, setSpeed] = useState(1);
  const [glitchIntensity, setGlitchIntensity] = useState(0.02);
  const [fontSize, setFontSize] = useState(16);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingProgress, setRecordingProgress] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useMatrixSound(isAudioEnabled && isPlaying);

  const startRecording = async () => {
    if (!canvasRef.current || isRecording) return;

    try {
      setIsRecording(true);
      setRecordingProgress(0);

      const canvas = canvasRef.current;
      const stream = canvas.captureStream(30); // 30 FPS
      const recorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: 5000000 // 5Mbps for high quality
      });

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `matrix-rain-${Date.now()}.webm`;
        a.click();
        URL.revokeObjectURL(url);
        setIsRecording(false);
        setRecordingProgress(0);
      };

      recorder.start();

      // Record for 10 seconds
      const duration = 10000;
      const interval = 100;
      let elapsed = 0;

      const timer = setInterval(() => {
        elapsed += interval;
        setRecordingProgress((elapsed / duration) * 100);
        if (elapsed >= duration) {
          clearInterval(timer);
          recorder.stop();
        }
      }, interval);

    } catch (err) {
      console.error('Recording failed:', err);
      setIsRecording(false);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        canvas.width = 1;
        canvas.height = 1;
        ctx.drawImage(img, 0, 0, 1, 1);
        const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
        const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
        setColor(hex);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const toggleFullScreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }, []);

  return (
    <div className="relative w-full h-screen bg-black text-white font-sans overflow-hidden">
      {/* Main Animation Layer */}
      <div className="absolute inset-0 z-0">
        <MatrixRain
          ref={canvasRef}
          color={color}
          speed={isPlaying ? speed : 0}
          glitchIntensity={glitchIntensity}
          fontSize={fontSize}
        />
      </div>

      {/* UI Overlay */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 w-full max-w-2xl px-4"
          >
            <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
              {isRecording && (
                <div className="mb-6 space-y-2">
                  <div className="flex justify-between text-[10px] uppercase tracking-[0.2em] text-red-500 animate-pulse font-bold">
                    <span>Recording in Progress...</span>
                    <span>{recordingProgress.toFixed(0)}%</span>
                  </div>
                  <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-red-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${recordingProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <Zap className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <h1 className="text-sm font-bold tracking-widest uppercase text-white/90">Matrix Engine v4.0</h1>
                    <p className="text-[10px] text-white/40 uppercase tracking-tighter">Infinite Binary Stream • 4K Render Mode</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsAudioEnabled(!isAudioEnabled)}
                    className={`p-2 rounded-lg transition-colors ${isAudioEnabled ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
                  >
                    {isAudioEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                  </button>
                  <button
                    onClick={toggleFullScreen}
                    className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/60 transition-colors"
                  >
                    <Maximize2 size={18} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] uppercase tracking-widest text-white/40">
                      <span>Stream Speed</span>
                      <span className="text-green-400">{speed.toFixed(1)}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="5"
                      step="0.1"
                      value={speed}
                      onChange={(e) => setSpeed(parseFloat(e.target.value))}
                      className="w-full accent-green-500 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] uppercase tracking-widest text-white/40">
                      <span>Glitch Intensity</span>
                      <span className="text-green-400">{(glitchIntensity * 100).toFixed(0)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="0.2"
                      step="0.01"
                      value={glitchIntensity}
                      onChange={(e) => setGlitchIntensity(parseFloat(e.target.value))}
                      className="w-full accent-green-500 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] uppercase tracking-widest text-white/40">
                      <span>Font Size</span>
                      <span className="text-green-400">{fontSize}px</span>
                    </div>
                    <input
                      type="range"
                      min="8"
                      max="32"
                      step="1"
                      value={fontSize}
                      onChange={(e) => setFontSize(parseInt(e.target.value))}
                      className="w-full accent-green-500 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] uppercase tracking-widest text-white/40">
                      <span>Core Color</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="p-1 bg-white/5 hover:bg-white/10 rounded text-white/40 transition-colors"
                          title="Extract color from image"
                        >
                          <ImageIcon size={14} />
                        </button>
                        <input
                          type="color"
                          value={color}
                          onChange={(e) => setColor(e.target.value)}
                          className="w-6 h-6 rounded bg-transparent cursor-pointer border-none"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {['#00FF41', '#008F11', '#003B00', '#FFFFFF', '#FF0000'].map(c => (
                        <button
                          key={c}
                          onClick={() => setColor(c)}
                          className="w-full h-4 rounded transition-transform hover:scale-110"
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                className="hidden"
                accept="image/*"
              />

              <div className="mt-8 flex items-center gap-4">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-white text-black rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-green-400 transition-colors disabled:opacity-50"
                  disabled={isRecording}
                >
                  {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
                  {isPlaying ? 'Pause Stream' : 'Resume Stream'}
                </button>
                <button
                  onClick={startRecording}
                  disabled={isRecording}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm uppercase tracking-widest transition-all ${isRecording ? 'bg-red-500/20 text-red-500 cursor-not-allowed' : 'bg-green-500 text-black hover:bg-green-400'}`}
                >
                  {isRecording ? <Loader2 size={18} className="animate-spin" /> : <Video size={18} />}
                  {isRecording ? 'Recording...' : 'Record 10s'}
                </button>
                <button
                  onClick={() => setShowControls(false)}
                  className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-white/60 transition-colors"
                  title="Hide Controls (Press H to toggle)"
                >
                  <Monitor size={20} />
                </button>
                <button
                  onClick={() => {
                    setColor('#00FF41');
                    setSpeed(1);
                    setGlitchIntensity(0.02);
                    setFontSize(16);
                  }}
                  className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-white/60 transition-colors"
                  title="Reset to Defaults"
                >
                  <RotateCcw size={20} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Controls Hint */}
      {/* {!showControls && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setShowControls(true)}
          className="absolute bottom-8 right-8 z-20 p-4 bg-white/5 hover:bg-white/10 rounded-full text-white/40 backdrop-blur-md transition-all border border-white/10"
        >
          <Settings2 size={24} />
        </motion.button>
      )} */}

      {/* Decorative Overlays */}
      <div className="absolute top-8 left-8 z-10 pointer-events-none">
        <div className="flex items-center gap-4 text-[10px] font-mono text-green-500/60 uppercase tracking-[0.3em]">
          <div className="w-2 h-2 bg-green-500 animate-pulse rounded-full" />
          <span>System Online // Buffer: 4096kb</span>
          <span className="text-white/20">|</span>
          <span>FPS: 30.0</span>
        </div>
      </div>

      <div className="absolute top-8 right-8 z-10 pointer-events-none text-right">
        <div className="text-[10px] font-mono text-white/20 uppercase tracking-[0.2em]">
          Sector 7-G // Node 0x4F2
        </div>
      </div>
    </div>
  );
}


