import { CryptoDigestAlgorithm, digestStringAsync, getRandomBytes } from 'expo-crypto';
import * as LocalAuthentication from 'expo-local-authentication';

import { logRepo, metaRepo } from '@/data/repositories';

import {
  cooldownFor,
  DEFAULT_LOCK_DELAY,
  isValidPin,
  LOCK_DELAYS,
  parsePinRecord,
  serializePinRecord,
  type LockDelay,
} from './policy';

export * from './policy';

const toHex = (bytes: Uint8Array) => [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');

// SHA-256 salé : le code n'est jamais stocké. Le verrou protège l'accès à l'application,
// pas le fichier de base lui-même (le chiffrement des sauvegardes est un chantier séparé).
const digest = (salt: string, pin: string) => digestStringAsync(CryptoDigestAlgorithm.SHA256, `tabilao:${salt}:${pin}`);

export const isLockEnabled = (): boolean => parsePinRecord(metaRepo.get('pin_hash')) !== null;
export const pinLength = (): number | null => parsePinRecord(metaRepo.get('pin_hash'))?.length ?? null;

export async function setPin(pin: string): Promise<void> {
  if (!isValidPin(pin)) throw new Error('Code invalide');
  const salt = toHex(getRandomBytes(16));
  metaRepo.set('pin_hash', serializePinRecord({ length: pin.length, salt, hash: await digest(salt, pin) }));
  resetFailures();
  logRepo.add('update', 'security', null, { pin: 'set' });
}

export function disableLock(): void {
  for (const key of ['pin_hash', 'biometric_enabled', 'lock_failures', 'lock_until'] as const) metaRepo.remove(key);
  logRepo.add('update', 'security', null, { pin: 'removed' });
}

export async function checkPin(pin: string): Promise<boolean> {
  const record = parsePinRecord(metaRepo.get('pin_hash'));
  return record !== null && pin.length === record.length && (await digest(record.salt, pin)) === record.hash;
}

// Échecs et blocage persistés : fermer et rouvrir l'application ne remet pas le compteur à zéro.
export const failures = (): number => Number(metaRepo.get('lock_failures') ?? 0);
export const lockedUntil = (): number => Number(metaRepo.get('lock_until') ?? 0);

export function resetFailures(): void {
  metaRepo.remove('lock_failures');
  metaRepo.remove('lock_until');
}

/** Enregistre un échec ; renvoie le nombre d'échecs et la fin du blocage éventuel. */
export function recordFailure(now = Date.now()): { failures: number; until: number } {
  const count = failures() + 1;
  metaRepo.set('lock_failures', String(count));
  const cooldown = cooldownFor(count);
  const until = cooldown ? now + cooldown : 0;
  if (until) metaRepo.set('lock_until', String(until));
  logRepo.add('error', 'security', null, { failedUnlock: count });
  return { failures: count, until };
}

/** Code PIN vérifié : remet le compteur à zéro. */
export async function tryUnlock(pin: string): Promise<'ok' | 'wrong' | 'blocked'> {
  if (lockedUntil() > Date.now()) return 'blocked';
  if (await checkPin(pin)) {
    resetFailures();
    return 'ok';
  }
  recordFailure();
  return 'wrong';
}

export const lockDelay = (): LockDelay => {
  const value = Number(metaRepo.get('lock_delay'));
  return (LOCK_DELAYS as readonly number[]).includes(value) ? (value as LockDelay) : DEFAULT_LOCK_DELAY;
};
export const setLockDelay = (delay: LockDelay) => metaRepo.set('lock_delay', String(delay));

// --- Empreinte / reconnaissance faciale (alternative non cognitive au code) ---

/** Le téléphone a un capteur et au moins une empreinte enregistrée. */
export async function biometricAvailable(): Promise<boolean> {
  try {
    return (await LocalAuthentication.hasHardwareAsync()) && (await LocalAuthentication.isEnrolledAsync());
  } catch {
    return false;
  }
}

export const isBiometricEnabled = (): boolean => metaRepo.get('biometric_enabled') === '1';
export const setBiometricEnabled = (on: boolean) =>
  on ? metaRepo.set('biometric_enabled', '1') : metaRepo.remove('biometric_enabled');

export async function authenticateBiometric(prompt: { title: string; cancel: string }): Promise<boolean> {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: prompt.title,
      cancelLabel: prompt.cancel,
      // Le code Tabilao sert de secours, pas le code de déverrouillage du téléphone.
      disableDeviceFallback: true,
    });
    if (result.success) resetFailures();
    return result.success;
  } catch {
    return false;
  }
}
