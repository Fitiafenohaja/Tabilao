import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

import { isLockEnabled, lockDelay, shouldRelock } from '@/services/security';

import { useLock } from './lockStore';

/** Reverrouille l'application si elle est restée en arrière-plan plus longtemps que le délai choisi. */
export function useAutoLock() {
  const backgroundedAt = useRef<number | null>(null);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      const { busy, locked, lock } = useLock.getState();
      if (state === 'background') {
        backgroundedAt.current = busy || locked ? null : Date.now();
      } else if (state === 'active') {
        if (isLockEnabled() && shouldRelock(backgroundedAt.current, Date.now(), lockDelay())) lock();
        backgroundedAt.current = null;
      }
    });
    return () => sub.remove();
  }, []);
}
