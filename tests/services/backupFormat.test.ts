import {
  concatBytes,
  detectBackupKind,
  encodeHeader,
  HEADER_BYTES,
  passwordProblem,
  splitEncrypted,
} from '@/services/backup/format';

const salt = Uint8Array.from({ length: 16 }, (_, i) => i + 1);
const sqlite = concatBytes(new TextEncoder().encode('SQLite format 3\u0000'), new Uint8Array(100));

describe('format des sauvegardes .tabilao', () => {
  it('reconnaît une sauvegarde simple, protégée ou étrangère', () => {
    expect(detectBackupKind(sqlite)).toBe('sqlite');
    expect(detectBackupKind(concatBytes(encodeHeader(120_000, salt), new Uint8Array(40)))).toBe('encrypted');
    expect(detectBackupKind(new TextEncoder().encode('%PDF-1.7 …'))).toBe('unknown');
    expect(detectBackupKind(new Uint8Array(0))).toBe('unknown');
  });

  it('relit l’en-tête : itérations, sel et données chiffrées', () => {
    const sealed = Uint8Array.from([9, 8, 7]);
    const file = concatBytes(encodeHeader(120_000, salt), sealed);
    const parts = splitEncrypted(file)!;
    expect(parts.iterations).toBe(120_000);
    expect([...parts.salt]).toEqual([...salt]);
    expect([...parts.sealed]).toEqual([9, 8, 7]);
    expect(parts.header.length).toBe(HEADER_BYTES);
  });

  it('refuse un en-tête trafiqué avec trop peu d’itérations', () => {
    expect(splitEncrypted(concatBytes(encodeHeader(5, salt), new Uint8Array(40)))).toBeNull();
    expect(splitEncrypted(sqlite)).toBeNull();
  });

  it('impose un mot de passe de 8 caractères, confirmé', () => {
    expect(passwordProblem('court')).toBe('too_short');
    expect(passwordProblem('ma boutique 2026', 'ma boutique 2025')).toBe('mismatch');
    expect(passwordProblem('ma boutique 2026', 'ma boutique 2026')).toBeNull();
  });
});
