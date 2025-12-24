import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAudioStore } from '@/store/audioStore';

interface CelebrationData {
  agentId: string;
  agentName: string;
  photoUrl: string;
  teamName?: string;
  teamId?: string;
  newActivationCount: number;
  timestamp: string;
  celebrationAudioUrl?: string; // Custom music URL for the team
}

interface CelebrationPopupProps {
  isVisible: boolean;
  data: CelebrationData | null;
  onClose: () => void;
  musicVolume?: number;
  duckedVolume?: number;
  countdownSeconds?: number;
  autoCloseMs?: number;
}

// Mock audio store removed

export default function CelebrationPopup({
  isVisible,
  data,
  onClose,
  musicVolume = 0.25,
  duckedVolume = 0.08,
  countdownSeconds = 3,
  autoCloseMs = 12000,
}: CelebrationPopupProps) {
  const { isSoundEnabled, toggleSound } = useAudioStore();

  const [countdown, setCountdown] = useState(countdownSeconds);
  const [showCard, setShowCard] = useState(false);

  const musicRef = useRef<HTMLAudioElement | null>(null);
  const voiceRef = useRef<HTMLAudioElement | null>(null);
  const voiceUrlRef = useRef<string | null>(null);

  const agentDisplay = (data?.agentName || 'ഏജന്റ്').trim();
  const buildSentence = () => `${agentDisplay} ഒരു സെയിൽ ഇട്ടു, നന്ദി!`;

  // ✅ Same style as your old working code, but accepts a URL
  const startMusic = async (musicUrl: string) => {
    if (!musicUrl) return;

    if (!musicRef.current) {
      musicRef.current = new Audio(musicUrl);
      musicRef.current.loop = true;
      musicRef.current.preload = 'auto';
      musicRef.current.volume = musicVolume;
    } else {
      musicRef.current.src = musicUrl;
      musicRef.current.loop = true;
      musicRef.current.volume = musicVolume;
    }

    try {
      await musicRef.current.play();
    } catch {
      // ignore autoplay errors
    }
  };

  const stopMusic = () => {
    if (musicRef.current) {
      musicRef.current.pause();
      musicRef.current.currentTime = 0;
      musicRef.current.src = '';
      musicRef.current = null;
    }
  };

  const playVoice = async () => {
    try {
      const res = await fetch(`/api/tts?text=${encodeURIComponent(buildSentence())}`);
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      voiceUrlRef.current = url;

      if (!voiceRef.current) voiceRef.current = new Audio();
      const v = voiceRef.current;
      v.src = url;
      v.preload = 'auto';

      v.onplay = () => {
        if (musicRef.current) musicRef.current.volume = duckedVolume;
      };
      const restore = () => {
        if (musicRef.current) musicRef.current.volume = musicVolume;
      };
      v.onended = restore;
      v.onpause = restore;
      v.onerror = restore;

      await v.play();
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (!isVisible || !data) return;

    setCountdown(countdownSeconds);
    setShowCard(false);

    // Use uploaded music for the team only; no static fallback.
    const musicUrlToUse = data.celebrationAudioUrl || undefined;


    if (isSoundEnabled && musicUrlToUse) {
      startMusic(musicUrlToUse);
    }

    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const showCardTimer = setTimeout(() => {
      setShowCard(true);
      if (isSoundEnabled) setTimeout(() => playVoice(), 250);
    }, countdownSeconds * 1000);

    const closeTimer = setTimeout(onClose, countdownSeconds * 1000 + autoCloseMs);

    return () => {
      clearInterval(countdownInterval);
      clearTimeout(showCardTimer);
      clearTimeout(closeTimer);

      if (voiceRef.current) {
        try {
          voiceRef.current.pause();
        } catch { }
        voiceRef.current.src = '';
        voiceRef.current = null;
      }
      if (voiceUrlRef.current) {
        URL.revokeObjectURL(voiceUrlRef.current);
        voiceUrlRef.current = null;
      }
      stopMusic();
    };
  }, [isVisible, data, isSoundEnabled, onClose, autoCloseMs, countdownSeconds]);

  if (!isVisible || !data) return null;

  return (
    <>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .fade-in {
          animation: fadeIn 0.3s ease-out;
        }
        .scale-in {
          animation: scaleIn 0.4s ease-out;
        }
      `}</style>

      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm fade-in">
        {/* Sound Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSound}
          className="absolute top-4 right-4 text-white hover:text-white hover:bg-white/10 w-10 h-10 p-0 rounded-full z-[65]"
          data-testid="celebration-sound-toggle"
          title={isSoundEnabled ? 'Mute' : 'Unmute'}
        >
          {isSoundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
        </Button>

        {/* Countdown Screen */}
        {!showCard && countdown > 0 && (
          <div className="text-white text-center">
            <div className="text-9xl font-bold mb-4" key={countdown}>
              {countdown}
            </div>
          </div>
        )}

        {/* Celebration Card */}
        {showCard && (
          <div className="relative w-full max-w-5xl mx-4 scale-in">
            <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-10 relative">
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                data-testid="celebration-close"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="grid grid-cols-1 md:grid-cols-[48%,1fr] gap-8 md:gap-10 items-stretch min-h-[800px]">
                {/* LEFT: Large rectangular image */}
                <div className="md:self-stretch">
                  <div className="relative h-full w-full overflow-hidden rounded-xl shadow-lg">
                    <img
                      src={data.photoUrl}
                      alt={agentDisplay}
                      className="h-full w-full object-cover object-center"
                      data-testid="celebration-agent-photo"
                    />
                  </div>
                </div>

                {/* RIGHT: Content */}
                <div className="flex items-center">
                  <div className="w-full text-center">
                    {/* Badge */}
                    <div className="inline-block px-5 py-2 rounded-full bg-gradient-to-r from-yellow-400 to-orange-400 text-black text-sm font-bold mb-6 shadow-md">
                      <span>🏆</span>
                      <span className="mx-2">
                        {Math.max(1, data.newActivationCount)} Activation
                        {data.newActivationCount > 1 ? 's' : ''}
                      </span>
                      <span>🏆</span>
                    </div>

                    {/* Agent Name */}
                    <h3 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">
                      {agentDisplay}
                    </h3>

                    {/* Team Name */}
                    {data.teamName && (
                      <p className="text-lg md:text-xl text-gray-600 font-semibold mb-6">
                        Team {data.teamName}
                      </p>
                    )}

                    {/* Message */}
                    <div className="bg-gradient-to-r from-purple-50 via-pink-50 to-purple-50 rounded-xl p-5 md:p-6 mb-6 shadow-sm inline-block">
                      <p className="text-2xl md:text-3xl font-bold mb-2">
                        🎊 Congratulations! 🎊
                      </p>
                      <p className="text-sm md:text-base font-semibold text-purple-600">
                        Outstanding Achievement!
                      </p>
                      <p className="text-xs md:text-sm text-gray-500 mt-2">
                        {new Date(data.timestamp).toLocaleString('en-US', {
                          dateStyle: 'long',
                          timeStyle: 'short',
                        })}
                      </p>
                    </div>

                    {/* Close button */}
                    <Button
                      onClick={onClose}
                      className="bg-gradient-to-r from-yellow-400 to-orange-400 hover:from-yellow-500 hover:to-orange-500 text-black font-bold text-lg px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      Awesome! Keep It Up!
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
