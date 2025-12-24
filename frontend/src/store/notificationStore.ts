import { create } from 'zustand';

interface Notification {
  id: string;
  type: 'text' | 'image' | 'video' | 'audio';
  title?: string;
  message?: string;
  mediaUrl?: string;
  notificationSoundUrl?: string;
  isActive: boolean;
  duration: number;
  createdAt: Date;
}

interface NotificationState {
  activeNotification: Notification | null;
  isVisible: boolean;
  remainingTime: number;
  setActiveNotification: (notification: Notification | null) => void;
  clearNotification: () => void;
  setRemainingTime: (time: number) => void;
  decrementTime: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  activeNotification: null,
  isVisible: false,
  remainingTime: 0,
  setActiveNotification: (notification) => {
    set({ 
      activeNotification: notification,
      isVisible: !!notification,
      remainingTime: notification?.duration ? Math.floor(notification.duration / 1000) : 0
    });
  },
  clearNotification: () => {
    set({ 
      activeNotification: null,
      isVisible: false,
      remainingTime: 0
    });
  },
  setRemainingTime: (time) => set({ remainingTime: time }),
  decrementTime: () => {
    const { remainingTime } = get();
    if (remainingTime > 0) {
      set({ remainingTime: remainingTime - 1 });
    } else {
      get().clearNotification();
    }
  },
}));
