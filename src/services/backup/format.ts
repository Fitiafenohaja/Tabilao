// Format des fichiers .tabilao — logique pure, testable sans module natif.
//
// Sauvegarde simple   : fichier SQLite tel quel (commence par « SQLite format 3\0 »).
// Sauvegarde protégée : en-tête de 28 octets + données AES-256-GCM.
//   [0..8)   « TBLENC01 »                     identifie le format et sa version
//   [8..12)  itérations PBKDF2 (uint32, BE)   permet de les augmenter plus tard
//   [12..28) sel aléatoire (16 octets)
//   [28..)   nonce (12) + chiffré + étiquette d'authentification (16)
// L'en-tête est authentifié (données associées GCM) : le modifier rend le fichier illisible.

export const ENCRYPTED_MAGIC = 'TBLENC01';
export const SALT_BYTES = 16;
export const HEADER_BYTES = ENCRYPTED_MAGIC.length + 4 + SALT_BYTES;
export const DEFAULT_ITERATIONS = 120_000;
export const MIN_ITERATIONS = 10_000;
export const MIN_PASSWORD_LENGTH = 8;

const SQLITE_MAGIC = 'SQLite format 3\u0000';

const ascii = (bytes: Uint8Array, start: number, length: number) =>
  String.fromCharCode(...bytes.subarray(start, start + length));

export type BackupKind = 'sqlite' | 'encrypted' | 'unknown';

export function detectBackupKind(bytes: Uint8Array): BackupKind {
  if (bytes.length >= SQLITE_MAGIC.length && ascii(bytes, 0, SQLITE_MAGIC.length) === SQLITE_MAGIC) return 'sqlite';
  if (bytes.length > HEADER_BYTES && ascii(bytes, 0, ENCRYPTED_MAGIC.length) === ENCRYPTED_MAGIC) return 'encrypted';
  return 'unknown';
}

export function encodeHeader(iterations: number, salt: Uint8Array): Uint8Array {
  if (salt.length !== SALT_BYTES) throw new Error('Sel invalide');
  const header = new Uint8Array(HEADER_BYTES);
  for (let i = 0; i < ENCRYPTED_MAGIC.length; i++) header[i] = ENCRYPTED_MAGIC.charCodeAt(i);
  new DataView(header.buffer).setUint32(ENCRYPTED_MAGIC.length, iterations, false);
  header.set(salt, ENCRYPTED_MAGIC.length + 4);
  return header;
}

export type EncryptedParts = { header: Uint8Array; iterations: number; salt: Uint8Array; sealed: Uint8Array };

export function splitEncrypted(bytes: Uint8Array): EncryptedParts | null {
  if (detectBackupKind(bytes) !== 'encrypted') return null;
  const header = bytes.subarray(0, HEADER_BYTES);
  const iterations = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(ENCRYPTED_MAGIC.length, false);
  if (iterations < MIN_ITERATIONS) return null;
  return {
    header,
    iterations,
    salt: bytes.subarray(ENCRYPTED_MAGIC.length + 4, HEADER_BYTES),
    sealed: bytes.subarray(HEADER_BYTES),
  };
}

export function concatBytes(...parts: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let offset = 0;
  for (const p of parts) {
    out.set(p, offset);
    offset += p.length;
  }
  return out;
}

export type PasswordProblem = 'too_short' | 'mismatch' | null;

/** Règle volontairement simple : 8 caractères minimum, confirmés. Une phrase est plus facile à retenir. */
export function passwordProblem(password: string, confirmation?: string): PasswordProblem {
  if (password.length < MIN_PASSWORD_LENGTH) return 'too_short';
  if (confirmation !== undefined && confirmation !== password) return 'mismatch';
  return null;
}
