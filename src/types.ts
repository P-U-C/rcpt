export interface Env {
  DB: D1Database;
  KV: KVNamespace;
  ENVIRONMENT?: string;
}

export type ReceiptStatus = 'committed' | 'delivered' | 'acknowledged' | 'disputed';
export type PaymentRail = 'mpp' | 'x402' | 'ap2' | 'direct' | 'other';
export type AgentProtocol = 'a2a' | 'mcp' | 'acp' | 'http' | 'mpp' | 'custom';
export type ReceiptVisibility = 'public' | 'private';
export type EncryptionMethod = 'ecdh-aes256gcm' | 'seal' | null;

export interface AgentIdentity {
  agent_id?: string | null;
  address: string;
  protocol: AgentProtocol;
  endpoint?: string | null;
}

export interface PaymentDetails {
  amount: string;
  asset: string;
  rail: PaymentRail;
  chain: number;
  tx_hash?: string | null;
}

export interface ExecutionMetadata {
  model?: string;
  tokens?: number;
  duration_ms?: number;
  [key: string]: unknown;
}

export interface CommitBody {
  capability: string;
  provider: AgentIdentity;
  consumer: AgentIdentity;
  spec_hash?: string;
  payment?: PaymentDetails;
  provider_signature?: string;
  /** Default: "public". Set "private" to encrypt output_hash + execution_metadata on Walrus. */
  visibility?: ReceiptVisibility;
  /** Required when visibility = "private". Uncompressed P-256 pubkey, hex-encoded. */
  provider_pubkey?: string;
  /** Required when visibility = "private". Uncompressed P-256 pubkey, hex-encoded. */
  consumer_pubkey?: string;
}

export interface DeliverBody {
  output_hash: string;
  execution_metadata?: ExecutionMetadata;
  provider_signature?: string;
}

export interface AckBody {
  consumer_signature: string;
}

export interface ReceiptRow {
  receipt_id: string;
  version: string;
  capability: string;
  provider_agent_id: string | null;
  provider_address: string;
  provider_protocol: string;
  provider_endpoint: string | null;
  consumer_agent_id: string | null;
  consumer_address: string;
  consumer_protocol: string;
  spec_hash: string | null;
  payment_amount: string | null;
  payment_asset: string | null;
  payment_rail: string | null;
  payment_chain: number | null;
  payment_tx_hash: string | null;
  provider_signature: string | null;
  consumer_signature: string | null;
  output_hash: string | null;
  execution_metadata: string | null;
  status: ReceiptStatus;
  chain_anchor_chain: string | null;
  chain_anchor_tx_hash: string | null;
  walrus_blob_id: string | null;
  created_at: string;
  delivered_at: string | null;
  acknowledged_at: string | null;
  // Visibility fields (migration 0002)
  visibility?: ReceiptVisibility;
  encryption_method?: EncryptionMethod;
  provider_pubkey?: string | null;
  consumer_pubkey?: string | null;
  encrypted_output_hash?: string | null;
  encrypted_execution_metadata?: string | null;
  seal_package_id?: string | null;
  seal_object_id?: string | null;
}

export interface EncryptionHint {
  method: 'ecdh-aes256gcm';
  ephemeral_pubkey: string;
  iv: string;
}

export interface Receipt {
  receipt_id: string;
  version: string;
  capability: string;
  provider: AgentIdentity;
  consumer: AgentIdentity;
  spec_hash: string | null;
  payment: PaymentDetails | null;
  provider_signature: string | null;
  consumer_signature: string | null;
  output_hash: string | null;
  execution_metadata: ExecutionMetadata | null;
  status: ReceiptStatus;
  chain_anchor: { chain: string; tx_hash: string } | null;
  walrus_blob_id: string | null;
  walrus_url: string | null;
  created_at: string;
  delivered_at: string | null;
  acknowledged_at: string | null;
  /** Visibility: "public" (default) or "private" */
  visibility: ReceiptVisibility;
  /** Non-null when visibility = "private" */
  encryption_method: EncryptionMethod;
  /** Pubkeys used for encryption (cleartext — agents need these to decrypt) */
  provider_pubkey: string | null;
  consumer_pubkey: string | null;
  /**
   * When private: output_hash and execution_metadata are encrypted.
   * Cleartext fields are null; encrypted fields carry ciphertext JSON.
   * Decrypt client-side using ECDH shared secret (see encryption.ts).
   *
   * ⚠️ MAINNET NOTE: Sui Seal replaces ECDH when Seal launches on mainnet.
   * Track: https://github.com/MystenLabs/seal
   */
  encrypted_output_hash: string | null;
  encrypted_execution_metadata: string | null;
  /** Seal mainnet fields — null until Seal mainnet launches */
  seal_package_id: string | null;
  seal_object_id: string | null;
}

export interface VerifyResult {
  receipt_id: string;
  status: ReceiptStatus;
  provider_verified: boolean;
  consumer_verified: boolean;
  chain_anchor: { chain: string; tx_hash: string } | null;
  walrus_verified: boolean;
  walrus_url: string | null;
  receipt: Receipt;
}
