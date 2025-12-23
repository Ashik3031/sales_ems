import { useEffect } from 'react';
import { socketManager } from '@/lib/socket';

export const useSocket = () => {
  useEffect(() => {
    socketManager.connect();
    
    return () => {
      // Don't disconnect on unmount in case other components need it
    };
  }, []);

  return {
    isConnected: socketManager.isConnected(),
    send: socketManager.send.bind(socketManager),
    sendWithAuth: socketManager.sendWithAuth.bind(socketManager),
  };
};
