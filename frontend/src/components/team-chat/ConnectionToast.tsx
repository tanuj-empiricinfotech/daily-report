/**
 * ConnectionToast — Native app-style toast for chat connection status.
 *
 * Shows a slide-down toast when the SSE connection status changes.
 * Auto-dismisses the "connected" toast after a delay.
 */

import { useEffect, useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import { AnimatePresence, motion } from 'framer-motion';
import { IconWifi, IconWifiOff, IconLoader2 } from '@tabler/icons-react';
import type { RootState } from '@/store/store';

const CONNECTED_DISMISS_MS = 2000;

interface ToastConfig {
  message: string;
  icon: React.ReactNode;
  className: string;
  autoDismiss: boolean;
}

const TOAST_CONFIGS: Record<string, ToastConfig> = {
  connecting: {
    message: 'Connecting...',
    icon: <IconLoader2 className="h-3 w-3 animate-spin" />,
    className: 'bg-muted text-muted-foreground border border-border',
    autoDismiss: false,
  },
  reconnecting: {
    message: 'Reconnecting...',
    icon: <IconLoader2 className="h-3 w-3 animate-spin" />,
    className: 'bg-muted text-muted-foreground border border-border',
    autoDismiss: false,
  },
  disconnected: {
    message: 'Offline',
    icon: <IconWifiOff className="h-3 w-3" />,
    className: 'bg-muted text-destructive border border-border',
    autoDismiss: false,
  },
  connected: {
    message: 'Online',
    icon: <IconWifi className="h-3 w-3" />,
    className: 'bg-muted text-emerald-500 border border-border',
    autoDismiss: true,
  },
};

export function ConnectionToast() {
  const connectionStatus = useSelector(
    (state: RootState) => state.teamChat.connectionStatus
  );
  const [visible, setVisible] = useState(false);
  const [currentConfig, setCurrentConfig] = useState<ToastConfig | null>(null);
  const prevStatusRef = useRef(connectionStatus);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const prevStatus = prevStatusRef.current;
    prevStatusRef.current = connectionStatus;

    // Don't show toast on initial "disconnected" (before first connection)
    if (prevStatus === 'disconnected' && connectionStatus === 'connecting') {
      // First connection attempt — show connecting
      setCurrentConfig(TOAST_CONFIGS.connecting);
      setVisible(true);
      return;
    }

    // Don't show anything for the initial connection flow
    if (prevStatus === 'connecting' && connectionStatus === 'connected') {
      // First successful connection — briefly show "connected" then dismiss
      setCurrentConfig(TOAST_CONFIGS.connected);
      setVisible(true);
    } else if (connectionStatus === 'disconnected' || connectionStatus === 'reconnecting') {
      setCurrentConfig(TOAST_CONFIGS[connectionStatus]);
      setVisible(true);
    } else if (connectionStatus === 'connected' && prevStatus === 'reconnecting') {
      // Reconnected after being offline — show "back online"
      setCurrentConfig(TOAST_CONFIGS.connected);
      setVisible(true);
    }

    // Clear any existing dismiss timer
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }

    // Auto-dismiss "connected" toast
    if (connectionStatus === 'connected') {
      dismissTimerRef.current = setTimeout(() => {
        setVisible(false);
      }, CONNECTED_DISMISS_MS);
    }

    return () => {
      if (dismissTimerRef.current) {
        clearTimeout(dismissTimerRef.current);
      }
    };
  }, [connectionStatus]);

  return (
    <AnimatePresence>
      {visible && currentConfig && (
        <motion.div
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 60, opacity: 0 }}
          transition={{ type: 'spring', damping: 30, stiffness: 400 }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[60]"
        >
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full shadow-sm text-xs font-medium ${currentConfig.className}`}
          >
            {currentConfig.icon}
            <span>{currentConfig.message}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
