import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AudioState {
  isSoundEnabled: boolean;
  volume: number;
  toggleSound: () => void;
  setVolume: (volume: number) => void;
  playActivationSound: () => void;
}

const celebrationSounds = [
  '/sfx/celebrate1.mp3',
  '/sfx/celebrate2.mp3',
  '/sfx/celebrate3.mp3',
];

export const useAudioStore = create<AudioState>()(
  persist(
    (set, get) => ({
      isSoundEnabled: true,
      volume: 0.7,
      toggleSound: () => {
        set(state => ({ isSoundEnabled: !state.isSoundEnabled }));
      },
      setVolume: (volume) => {
        set({ volume: Math.max(0, Math.min(1, volume)) });
      },
      playActivationSound: () => {
        const { isSoundEnabled, volume } = get();
        if (!isSoundEnabled) return;
        
        try {
          const randomSound = celebrationSounds[Math.floor(Math.random() * celebrationSounds.length)];
          const audio = new Audio(randomSound);
          audio.volume = volume;
          audio.play().catch(console.error);
        } catch (error) {
          console.error('Failed to play activation sound:', error);
        }
      },
    }),
    {
      name: 'audio-settings',
    }
  )
);
