import React, { useEffect, useState } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

export const OfflineBanner: React.FC = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    const handleOffline = () => {
      setIsOffline(true);
      setShowReconnected(false);
    };

    const handleOnline = () => {
      setIsOffline(false);
      setShowReconnected(true);
      setTimeout(() => setShowReconnected(false), 3000);
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  if (!isOffline && !showReconnected) return null;

  return (
    <div className="fixed top-2 left-1/2 -translate-x-1/2 z-50 animate-fadeIn">
      {isOffline ? (
        <div className="glass-card px-4 py-2 rounded-full border border-amber-500/40 bg-amber-950/80 backdrop-blur-xl text-amber-200 text-xs font-semibold flex items-center space-x-2 shadow-2xl">
          <WifiOff className="w-4 h-4 text-amber-400 animate-pulse" />
          <span>⚡ Offline Mode - Cached PWA active. Reconnecting to P2P network...</span>
        </div>
      ) : (
        <div className="glass-card px-4 py-2 rounded-full border border-emerald-500/40 bg-emerald-950/80 backdrop-blur-xl text-emerald-200 text-xs font-semibold flex items-center space-x-2 shadow-2xl">
          <Wifi className="w-4 h-4 text-emerald-400" />
          <span>🌐 Network Restored - Reconnected to Lounge</span>
        </div>
      )}
    </div>
  );
};
