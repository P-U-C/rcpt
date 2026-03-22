/**
 * Receipt encryption — private visibility
 *
 * Testnet: ECDH + AES-256-GCM via Web Crypto API (native CF Workers, zero deps)
 *
 * How it works:
 *   1. Provider and consumer supply their compressed secp256k1 pubkeys on commit
 *   2. Worker generates an ephemeral ECDH keypair
 *   3. Derives a shared AES key from ephemeral privkey + recipient pubkey
 *   4. Encrypts the sensitive payload fields with AES-256-GCM
 *   5. Walrus stores the ciphertext; the receipt carries `encryption_hint` for decryption
 *   6. Agent decrypts client-side using their private key + ephemeral pubkey from hint
 *
 * Mainnet upgrade path — Sui Seal:
 *   When Sui Seal launches on mainnet, the encryption_method switches to "seal".
 *   The API contract is identical — same `visibility: "private"` field, same commit body.
 *   Agents swap their client-side decryption from ECDH to `@mysten/seal` SDK.
 *   No server migration needed — just swap the encryption_method in commitBody.
 *
 * ⚠️  MAINNET NOTE: Sui Seal is testnet-only as of 2026-03-22.
 *   Use encryption_method: "ecdh-aes256gcm" until Seal mainnet launches.
 *   Track: https://github.com/MystenLabs/seal
 *
 * Key compatibility:
 *   - Seal uses identity-based encryption (IBE) with BLS12-381 under the hood
 *   - ECDH uses secp256k1 (same curve as EVM wallets — agents already have keys)
 *   - The two are not key-compatible, but the receipt schema accommodates both
 */

export interface EncryptedPayload {
  /** AES-256-GCM ciphertext, hex-encoded */
  ciphertext: string;
  /** AES-GCM IV, hex-encoded (96-bit) */
  iv: string;
  /** Ephemeral ECDH public key (for recipient to derive shared secret), hex-encoded */
  ephemeral_pubkey: string;
  /** Encryption method used */
  method: 'ecdh-aes256gcm';
}

export interface EncryptionHint {
  method: 'ecdh-aes256gcm' | 'seal';
  ephemeral_pubkey?: string;
  /** Sui Seal — on-chain access policy (mainnet, pending) */
  seal_package_id?: string;
  seal_object_id?: string;
}

/**
 * Encrypt a payload for a recipient using ECDH + AES-256-GCM.
 *
 * recipientPubkeyHex: 65-byte uncompressed secp256k1 pubkey ("04" prefix) or
 *                     33-byte compressed ("02"/"03" prefix) — hex-encoded.
 *
 * Returns EncryptedPayload which can be stored on Walrus or in D1.
 * The `ephemeral_pubkey` in the result must be sent to the recipient so they
 * can derive the same shared secret.
 */
export async function encryptForRecipient(
  plaintext: string,
  recipientPubkeyHex: string
): Promise<EncryptedPayload> {
  const recipientKeyBytes = hexToBytes(recipientPubkeyHex);

  // Import recipient's public key for ECDH
  const recipientKey = await crypto.subtle.importKey(
    'raw',
    recipientKeyBytes,
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    []
  );

  // Generate ephemeral ECDH keypair
  const ephemeralPair = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveKey']
  ) as CryptoKeyPair;

  // Derive AES-256-GCM key from shared secret
  const aesKey = await crypto.subtle.deriveKey(
    ({ name: "ECDH", public: recipientKey } as unknown as SubtleCryptoDeriveKeyAlgorithm),
    ephemeralPair.privateKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );

  // Encrypt
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plaintextBytes = new TextEncoder().encode(plaintext);
  const ciphertextBytes = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    aesKey,
    plaintextBytes
  );

  // Export ephemeral public key (uncompressed, 65 bytes)
  const ephemeralPubBytes = new Uint8Array(
    await crypto.subtle.exportKey('raw', ephemeralPair.publicKey) as ArrayBuffer
  );

  return {
    ciphertext: bytesToHex(new Uint8Array(ciphertextBytes)),
    iv: bytesToHex(iv),
    ephemeral_pubkey: bytesToHex(ephemeralPubBytes),
    method: 'ecdh-aes256gcm',
  };
}

/**
 * Decrypt a payload using recipient's private key + ephemeral public key.
 * (Client-side only — private keys never touch the server)
 *
 * This is provided for documentation/testing. In production, agents decrypt
 * client-side using their own private key.
 *
 * For Seal mainnet: replace this with `client.seal.decrypt()` from @mysten/seal SDK.
 * See: https://github.com/MystenLabs/seal
 */
export async function decryptWithPrivateKey(
  encrypted: EncryptedPayload,
  recipientPrivkeyHex: string
): Promise<string> {
  const privkeyBytes = hexToBytes(recipientPrivkeyHex);
  const ephemeralPubBytes = hexToBytes(encrypted.ephemeral_pubkey);
  const iv = hexToBytes(encrypted.iv);
  const ciphertext = hexToBytes(encrypted.ciphertext);

  const privKey = await crypto.subtle.importKey(
    'pkcs8',
    privkeyBytes,
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    ['deriveKey']
  );

  const ephemeralPub = await crypto.subtle.importKey(
    'raw',
    ephemeralPubBytes,
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    []
  );

  const aesKey = await crypto.subtle.deriveKey(
    ({ name: 'ECDH', public: ephemeralPub } as unknown as SubtleCryptoDeriveKeyAlgorithm),
    privKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );

  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    aesKey,
    ciphertext
  );

  return new TextDecoder().decode(plaintext);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.startsWith('0x') ? hex.slice(2) : hex;
  const arr = new Uint8Array(clean.length / 2);
  for (let i = 0; i < arr.length; i++) {
    arr[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return arr;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * ============================================================
 * MAINNET UPGRADE NOTE — Sui Seal
 * ============================================================
 *
 * When Sui Seal launches on mainnet, swap encryption_method to "seal":
 *
 * ```typescript
 * // 1. Install: npm install @mysten/seal @mysten/sui
 * // 2. Set up Seal client with key server configs
 * const client = new SuiGrpcClient({ network: 'mainnet', ... })
 *   .$extend(seal({ serverConfigs: MAINNET_KEY_SERVERS }));
 *
 * // 3. Encrypt on commit:
 * const { encryptedObject } = await client.seal.encrypt({
 *   threshold: 2,
 *   packageId: SEAL_PACKAGE_ID,
 *   id: receiptId,
 *   data: new TextEncoder().encode(sensitivePayload),
 * });
 *
 * // 4. Store encryptedObject on Walrus (same flow as ECDH)
 *
 * // 5. Agent decrypts client-side:
 * const sessionKey = await SessionKey.create({ address, packageId, signer, suiClient });
 * const plaintext = await client.seal.decrypt({ data: encryptedObject, sessionKey, txBytes });
 * ```
 *
 * Access policy: "only provider_address OR consumer_address can decrypt"
 * Defined as a Move policy on-chain — stored in seal_package_id + seal_object_id.
 *
 * Status: Testnet only as of 2026-03-22
 * Track: https://github.com/MystenLabs/seal
 * ============================================================
 */
