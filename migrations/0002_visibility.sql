-- Migration 0002: Private receipts — visibility, encryption metadata
-- Shipped: 2026-03-22
--
-- Encryption model:
--   testnet: ECDH + AES-256-GCM (Web Crypto, zero deps)
--   mainnet: Sui Seal (pending mainnet launch)
--
-- When visibility = 'private':
--   - provider_pubkey + consumer_pubkey required on commit
--   - Walrus blob stores encrypted ciphertext (hex)
--   - Agents decrypt client-side using shared ECDH secret (or Seal SDK on mainnet)
--   - The walrus_url still works but returns ciphertext — not human-readable

ALTER TABLE receipts ADD COLUMN visibility TEXT NOT NULL DEFAULT 'public'
  CHECK(visibility IN ('public', 'private'));

ALTER TABLE receipts ADD COLUMN encryption_method TEXT
  CHECK(encryption_method IN ('ecdh-aes256gcm', 'seal', null));

ALTER TABLE receipts ADD COLUMN provider_pubkey TEXT;
ALTER TABLE receipts ADD COLUMN consumer_pubkey TEXT;

-- Fields encrypted when visibility = 'private'
-- (output_hash and execution_metadata are encrypted; other fields remain cleartext for indexing)
ALTER TABLE receipts ADD COLUMN encrypted_output_hash TEXT;
ALTER TABLE receipts ADD COLUMN encrypted_execution_metadata TEXT;

-- Seal-specific: package ID and object ID for on-chain access policy (mainnet, pending)
ALTER TABLE receipts ADD COLUMN seal_package_id TEXT;
ALTER TABLE receipts ADD COLUMN seal_object_id TEXT;

CREATE INDEX IF NOT EXISTS idx_receipts_visibility ON receipts(visibility);
