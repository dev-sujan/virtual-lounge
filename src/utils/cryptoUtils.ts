// WebCrypto API AES-256-GCM End-to-End Encryption (E2EE)

// Cache derived keys per secret/passphrase
const keyCache: Record<string, CryptoKey> = {};

async function getEncryptionKey(passphrase: string): Promise<CryptoKey> {
  if (keyCache[passphrase]) return keyCache[passphrase];

  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  const salt = enc.encode(`synclounge_salt_${passphrase}`);
  const key = await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 1000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );

  keyCache[passphrase] = key;
  return key;
}

function arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}


function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = window.atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export interface EncryptedPackage {
  __e2ee: true;
  iv: string; // Base64 12-byte IV
  ciphertext: string; // Base64 ciphertext
}

export async function encryptPayload(payload: any, secretKey: string): Promise<EncryptedPackage> {
  if (!secretKey) {
    return payload; // Fallback if no secret key provided
  }

  try {
    const key = await getEncryptionKey(secretKey);
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const enc = new TextEncoder();
    const encodedPayload = enc.encode(JSON.stringify(payload));

    const encryptedBuffer = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encodedPayload
    );

    return {
      __e2ee: true,
      iv: arrayBufferToBase64(iv),
      ciphertext: arrayBufferToBase64(encryptedBuffer),
    };
  } catch (err) {
    console.warn('E2EE Encryption fallback:', err);
    return payload;
  }
}

export async function decryptPayload(data: any, secretKey: string): Promise<any> {
  if (!data || typeof data !== 'object' || !data.__e2ee || !secretKey) {
    return data;
  }

  try {
    const key = await getEncryptionKey(secretKey);
    const iv = base64ToArrayBuffer(data.iv);
    const ciphertext = base64ToArrayBuffer(data.ciphertext);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: new Uint8Array(iv) },
      key,
      ciphertext
    );

    const dec = new TextDecoder();
    return JSON.parse(dec.decode(decryptedBuffer));
  } catch (err) {
    console.warn('E2EE Decryption error (invalid key or tampered data):', err);
    return data;
  }
}
