import { useEffect, useRef, useCallback } from 'react';

export const useMatrixSound = (active: boolean) => {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const droneRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  const initAudio = useCallback(() => {
    if (audioCtxRef.current) return;

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioContextClass();
    audioCtxRef.current = ctx;

    // Main gain for volume control
    const mainGain = ctx.createGain();
    mainGain.gain.value = 0.1; // Subtle
    mainGain.connect(ctx.destination);
    gainRef.current = mainGain;

    // Drone oscillator
    const drone = ctx.createOscillator();
    drone.type = 'sine';
    drone.frequency.setValueAtTime(55, ctx.currentTime); // Low A
    
    const droneGain = ctx.createGain();
    droneGain.gain.value = 0.5;
    
    // Low pass filter for that "muffled" futuristic feel
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(200, ctx.currentTime);
    
    drone.connect(droneGain);
    droneGain.connect(filter);
    filter.connect(mainGain);
    
    drone.start();
    droneRef.current = drone;

    // Periodic "blips" or "data" sounds
    const playBlip = () => {
      if (!audioCtxRef.current || !active) return;
      
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      
      osc.type = 'square';
      osc.frequency.setValueAtTime(Math.random() * 1000 + 200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(10, ctx.currentTime + 0.1);
      
      g.gain.setValueAtTime(0.05, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      
      osc.connect(g);
      g.connect(mainGain);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
      
      setTimeout(playBlip, Math.random() * 2000 + 500);
    };

    playBlip();
  }, [active]);

  useEffect(() => {
    if (active) {
      // Audio context needs user interaction to start in most browsers
      const handleInteraction = () => {
        initAudio();
        if (audioCtxRef.current?.state === 'suspended') {
          audioCtxRef.current.resume();
        }
        window.removeEventListener('click', handleInteraction);
      };
      window.addEventListener('click', handleInteraction);
      return () => window.removeEventListener('click', handleInteraction);
    } else {
      if (audioCtxRef.current?.state === 'running') {
        audioCtxRef.current.suspend();
      }
    }
  }, [active, initAudio]);

  return { initAudio };
};
