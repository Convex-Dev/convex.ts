// Core client
export { Convex, type AccountKey, type SignerLike } from './convex.js';

// Key management
export { KeyPair } from './KeyPair.js';
export { type Signer } from './Signer.js';
export { KeyPairSigner } from './KeyPairSigner.js';

// Handle APIs
export { AssetHandle } from './AssetHandle.js';
export { FungibleToken } from './FungibleToken.js';
export { CnsHandle } from './CnsHandle.js';

// Error handling
export { ConvexError } from './ConvexError.js';

// Formatting utilities
export { toAddress, toNumericAddress, formatBalance, throwIfError } from './format.js';

// Types
export type {
  AddressLike,
  BalanceLike,
  ClientOptions,
  Hex,
  AccountInfo,
  Result,
  ResultInfo,
  Query,
} from './types.js';

// Cryptographic utilities
export { bytesToHex, hexToBytes, sign, verify } from './crypto.js';

// Visual identifiers
export { generateIdenticonGrid } from './identicon.js';

// Key storage
export {
  KeyStore,
  LocalStorageKeyStore,
  type EncryptedPayload,
} from './keystore.js';
