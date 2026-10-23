import { pbkdf2Async } from '@noble/hashes/pbkdf2.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { aesDecryptAsync, aesEncryptAsync, AESEncryptionKey, AESSealedData, getRandomBytes } from 'expo-crypto';

import { concatBytes, DEFAULT_ITERATIONS, encodeHeader, SALT_BYTES, splitEncrypted } from './format';

/** Mot de passe incorrect ou fichier modifié : AES-GCM refuse de déchiffrer (rien n'est écrit). */
export class WrongPasswordError extends Error {
  constructor() {
    super('Mot de passe incorrect ou fichier endommagé');
    this.name = 'WrongPasswordError';
  }
}

// Clé AES-256 dérivée du mot de passe (PBKDF2-HMAC-SHA256). `asyncTick` rend la main à l'interface
// régulièrement : l'écran reste fluide pendant les quelques secondes de calcul.
async function deriveKey(password: string, salt: Uint8Array, iterations: number): Promise<AESEncryptionKey> {
  const bytes = await pbkdf2Async(sha256, password.normalize('NFC'), salt, { c: iterations, dkLen: 32, asyncTick: 16 });
  return AESEncryptionKey.import(bytes);
}

/** Chiffre une copie SQLite : en-tête (authentifié) + AES-256-GCM. */
export async function encryptBackup(plain: Uint8Array, password: string, iterations = DEFAULT_ITERATIONS): Promise<Uint8Array> {
  const salt = getRandomBytes(SALT_BYTES);
  const header = encodeHeader(iterations, salt);
  const key = await deriveKey(password, salt, iterations);
  const sealed = await aesEncryptAsync(plain, key, { additionalData: header });
  return concatBytes(header, await sealed.combined());
}

export async function decryptBackup(bytes: Uint8Array, password: string): Promise<Uint8Array> {
  const parts = splitEncrypted(bytes);
  if (!parts) throw new WrongPasswordError();
  const key = await deriveKey(password, parts.salt, parts.iterations);
  try {
    return await aesDecryptAsync(AESSealedData.fromCombined(parts.sealed), key, { additionalData: parts.header });
  } catch {
    throw new WrongPasswordError();
  }
}
