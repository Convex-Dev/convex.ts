import * as ed from '@noble/ed25519';
import { sha512 } from '@noble/hashes/sha2.js';

// Initialise @noble/ed25519 with sha512 — must run before any Ed25519 operations.
// Imported by crypto.ts and KeyPair.ts to ensure init runs exactly once.
ed.etc.sha512Sync = (data: Uint8Array): Uint8Array => sha512(data);

export { ed };
