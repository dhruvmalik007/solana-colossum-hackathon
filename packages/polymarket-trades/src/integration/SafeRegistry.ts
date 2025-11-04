/**
 * SafeRegistry
 *
 * Abstract persistence layer for mapping application users to EVM Safe addresses.
 * Provide a concrete implementation using your database package (e.g., @repo/database).
 */
export interface SafeRegistry {
  /** Lookup the Safe address for a given userId. */
  getSafe(userId: string): Promise<string | undefined>;

  /** Persist or update the Safe address for a userId. */
  setSafe(userId: string, safeAddress: string): Promise<void>;
}
