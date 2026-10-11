// Obfuscation for secrets kept at rest in localStorage (API key, provider base
// URL). This is NOT real encryption: the masking key ships in the client bundle,
// so the only goal is to keep the value from sitting in plaintext where it is
// trivially read from DevTools or a shared screen. The UI never claims browser
// storage is secure or encrypted.
//
// Strategy: prefer the Web Crypto API (AES-GCM with a random IV) when available;
// fall back to a simple XOR cipher when `crypto.subtle` is missing (e.g. some
// insecure origins). Each stored value is tagged with its scheme so the correct
// decoder is chosen on read, and unprefixed legacy values are returned as-is for
// a transparent migration.

const SCHEME_WEBCRYPTO = 'wc1:';
const SCHEME_XOR = 'xor1:';

// Static obfuscation passphrase. Not secret — only hides the value from casual
// inspection. Same constant is used on every device, so this is reversible for
// the same app build.
const MASK_PASSPHRASE = 'lingva-local-obfuscation-seed-v1';

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function xorKeyBytes(): Uint8Array {
  return new TextEncoder().encode(MASK_PASSPHRASE);
}

function xorTransform(data: Uint8Array): Uint8Array {
  const key = xorKeyBytes();
  const out = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i += 1) out[i] = data[i] ^ key[i % key.length];
  return out;
}

function xorMask(plain: string): string {
  const data = new TextEncoder().encode(plain);
  return SCHEME_XOR + bytesToBase64(xorTransform(data));
}

function xorUnmask(payload: string): string {
  const data = base64ToBytes(payload.slice(SCHEME_XOR.length));
  return new TextDecoder().decode(xorTransform(data));
}

async function deriveAesKey(): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw', enc.encode(MASK_PASSPHRASE), { name: 'PBKDF2' }, false, ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: enc.encode('lingva-static-salt'), iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

async function webCryptoMask(plain: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await deriveAesKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(plain)));
  const packed = new Uint8Array(iv.length + ciphertext.length);
  packed.set(iv, 0);
  packed.set(ciphertext, iv.length);
  return SCHEME_WEBCRYPTO + bytesToBase64(packed);
}

async function webCryptoUnmask(payload: string): Promise<string> {
  const packed = base64ToBytes(payload.slice(SCHEME_WEBCRYPTO.length));
  const iv = packed.slice(0, 12);
  const ciphertext = packed.slice(12);
  const key = await deriveAesKey();
  const plain = new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext));
  return new TextDecoder().decode(plain);
}

function webCryptoAvailable(): boolean {
  return typeof crypto !== 'undefined' && Boolean(crypto.subtle) && typeof crypto.getRandomValues === 'function';
}

export async function maskSecret(plain: string): Promise<string> {
  if (!plain) return '';
  if (webCryptoAvailable()) {
    try {
      return await webCryptoMask(plain);
    } catch {
      // Fall back to XOR if the subtle API unexpectedly rejects.
    }
  }
  return xorMask(plain);
}

export async function unmaskSecret(masked: string): Promise<string> {
  if (!masked) return '';
  if (masked.startsWith(SCHEME_WEBCRYPTO)) {
    if (!webCryptoAvailable()) return '';
    try {
      return await webCryptoUnmask(masked);
    } catch {
      return '';
    }
  }
  if (masked.startsWith(SCHEME_XOR)) {
    try {
      return xorUnmask(masked);
    } catch {
      return '';
    }
  }
  // Legacy plaintext (un-migrated value): return as-is.
  return masked;
}
