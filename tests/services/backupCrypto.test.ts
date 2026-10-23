import { decryptBackup, encryptBackup, WrongPasswordError } from '@/services/backup/crypto';
import { detectBackupKind, HEADER_BYTES } from '@/services/backup/format';

// expo-crypto est natif : on le remplace par WebCrypto (AES-256-GCM, même disposition nonce | chiffré | étiquette).
jest.mock('expo-crypto', () => {
  const { webcrypto: wc } = jest.requireActual<typeof import('node:crypto')>('node:crypto');
  type MockKey = { key: import('node:crypto').webcrypto.CryptoKey };
  type MockBytes = Uint8Array<ArrayBuffer>;
  const mockSealed = (mockBytes: MockBytes) => ({ mockBytes, combined: async () => mockBytes });
  type MockSealed = ReturnType<typeof mockSealed>;
  return {
    getRandomBytes: (n: number) => wc.getRandomValues(new Uint8Array(n)),
    AESSealedData: { fromCombined: mockSealed },
    AESEncryptionKey: {
      import: async (bytes: MockBytes): Promise<MockKey> => ({
        key: await wc.subtle.importKey('raw', bytes, 'AES-GCM', false, ['encrypt', 'decrypt']),
      }),
    },
    aesEncryptAsync: async (plain: MockBytes, { key }: MockKey, { additionalData }: { additionalData: MockBytes }) => {
      const iv = wc.getRandomValues(new Uint8Array(12));
      const out = new Uint8Array(await wc.subtle.encrypt({ name: 'AES-GCM', iv, additionalData }, key, plain));
      const combined = new Uint8Array(12 + out.length);
      combined.set(iv);
      combined.set(out, 12);
      return mockSealed(combined);
    },
    aesDecryptAsync: async (sealed: MockSealed, { key }: MockKey, { additionalData }: { additionalData: MockBytes }) =>
      new Uint8Array(
        await wc.subtle.decrypt({ name: 'AES-GCM', iv: sealed.mockBytes.subarray(0, 12), additionalData }, key, sealed.mockBytes.subarray(12)),
      ),
  };
});

const FAST = 10_000; // itérations réduites pour la vitesse des tests (le minimum accepté)
const plain = new TextEncoder().encode('SQLite format 3\u0000 … ventes du jour : 245 000 Ar');

describe('sauvegardes protégées par mot de passe', () => {
  it('chiffre puis déchiffre à l’identique', async () => {
    const encrypted = await encryptBackup(plain, 'ma boutique 2026', FAST);
    expect(detectBackupKind(encrypted)).toBe('encrypted');
    expect(new TextDecoder().decode(encrypted)).not.toContain('245 000');
    expect(await decryptBackup(encrypted, 'ma boutique 2026')).toEqual(plain);
  });

  it('produit un fichier différent à chaque fois (sel et nonce aléatoires)', async () => {
    const a = await encryptBackup(plain, 'ma boutique 2026', FAST);
    const b = await encryptBackup(plain, 'ma boutique 2026', FAST);
    expect(Buffer.from(a).equals(Buffer.from(b))).toBe(false);
  });

  it('refuse un mauvais mot de passe', async () => {
    const encrypted = await encryptBackup(plain, 'ma boutique 2026', FAST);
    await expect(decryptBackup(encrypted, 'ma boutique 2025')).rejects.toBeInstanceOf(WrongPasswordError);
  });

  it('refuse un fichier modifié, y compris dans l’en-tête', async () => {
    const encrypted = await encryptBackup(plain, 'ma boutique 2026', FAST);
    const body = encrypted.slice();
    body[body.length - 20] = body[body.length - 20]! ^ 1;
    await expect(decryptBackup(body, 'ma boutique 2026')).rejects.toBeInstanceOf(WrongPasswordError);
    const header = encrypted.slice();
    header[HEADER_BYTES - 1] = header[HEADER_BYTES - 1]! ^ 1; // dernier octet du sel
    await expect(decryptBackup(header, 'ma boutique 2026')).rejects.toBeInstanceOf(WrongPasswordError);
  });

  it('normalise le mot de passe (accents saisis différemment)', async () => {
    const encrypted = await encryptBackup(plain, 'trésor', FAST);
    expect(await decryptBackup(encrypted, 'trésor')).toEqual(plain);
  });
});

