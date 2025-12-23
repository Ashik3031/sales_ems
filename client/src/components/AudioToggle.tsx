import { Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAudioStore } from '@/store/audioStore';

export default function AudioToggle() {
  const { isSoundEnabled, toggleSound } = useAudioStore();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleSound}
      className="text-muted-foreground hover:text-foreground"
      title={isSoundEnabled ? 'Mute sounds' : 'Enable sounds'}
      data-testid="audio-toggle"
    >
      {isSoundEnabled ? (
        <Volume2 className="w-5 h-5" />
      ) : (
        <VolumeX className="w-5 h-5" />
      )}
    </Button>
  );
}
