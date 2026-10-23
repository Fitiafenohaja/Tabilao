import { create } from 'zustand';

import { isLockEnabled } from '@/services/security';

type LockState = {
  locked: boolean;
  /** Invite d'empreinte ou sélecteur système ouvert : ne pas reverrouiller pendant ce temps. */
  busy: boolean;
  lock: () => void;
  unlock: () => void;
  setBusy: (busy: boolean) => void;
};

export const useLock = create<LockState>((set) => ({
  locked: false,
  busy: false,
  lock: () => set({ locked: isLockEnabled() }),
  unlock: () => set({ locked: false }),
  setBusy: (busy) => set({ busy }),
}));
