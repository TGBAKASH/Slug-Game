import { blake2b } from '@noble/hashes/blake2.js';

export const generateSalt = (): Uint8Array => {
  const salt = new Uint8Array(32);
  crypto.getRandomValues(salt);
  return salt;
};

// Returns the hex representation of a Uint8Array, useful for debugging
export const bytesToHex = (bytes: Uint8Array): string => {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
};

// slugId is expected to be a 32-byte hex string (with or without 0x)
export const computeSlugHash = (slugId: string, salt: Uint8Array): Uint8Array => {
  const cleanId = slugId.startsWith('0x') ? slugId.slice(2) : slugId;
  const idBytes = new Uint8Array(cleanId.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
  
  const payload = new Uint8Array(idBytes.length + salt.length);
  payload.set(idBytes, 0);
  payload.set(salt, idBytes.length);
  
  // Blake2b with 32 bytes (256 bits) matches sui::hash::blake2b256
  return blake2b(payload, { dkLen: 32 });
};
