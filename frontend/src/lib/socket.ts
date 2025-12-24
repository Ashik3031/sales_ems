import { useAuthStore } from '@/store/authStore';
import { useLeaderboardStore } from '@/store/leaderboardStore';
import { useNotificationStore } from '@/store/notificationStore';
import { useAudioStore } from '@/store/audioStore';

class SocketManager {
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnecting = false;

  connect() {
    if (this.socket?.readyState === WebSocket.OPEN || this.isConnecting) return;

    this.isConnecting = true;

    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;

      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        this.isConnecting = false;
        this.reconnectAttempts = 0;

        // Join leaderboard room
        this.send({
          type: 'join',
          room: 'leaderboard'
        });
      };

      this.socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.socket.onclose = () => {
        this.isConnecting = false;
        this.socket = null;
        this.scheduleReconnect();
      };

      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.isConnecting = false;
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  private handleMessage(message: any) {
    switch (message.type) {
      case 'leaderboard:update':
        useLeaderboardStore.getState().updateFromSocket(message.data);
        break;

      case 'sale:activation':
        // Trigger celebration popup and sound
        const celebrationData = message.data;
        useAudioStore.getState().playActivationSound();

        // Show celebration popup
        window.dispatchEvent(new CustomEvent('show-celebration', {
          detail: celebrationData
        }));
        break;

      case 'notification:active':
        useNotificationStore.getState().setActiveNotification(message.data);
        break;

      case 'settings:update':
        // Let any interested client component react to settings changes
        window.dispatchEvent(new CustomEvent('settings:update', { detail: message.data }));
        break;

      case 'notification:clear':
        useNotificationStore.getState().clearNotification();
        break;

      case 'booking:update':
        window.dispatchEvent(new CustomEvent('booking-update', {
          detail: message.data
        }));
        break;

      default:
        // Unknown message - intentionally ignored
    }
  }

  send(data: any) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data));
    }
  }

  sendWithAuth(data: any) {
    const token = useAuthStore.getState().token;
    if (token) {
      this.send({
        ...data,
        token
      });
    }
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);


      setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  isConnected() {
    return this.socket?.readyState === WebSocket.OPEN;
  }
}

export const socketManager = new SocketManager();
