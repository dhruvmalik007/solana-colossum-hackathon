import { PrivyClaims } from "../types";

/**
 * AuthVerifier
 *
 * Verifies a Privy JWT and returns minimal claims. The concrete verification
 * should be performed server-side using Privy's SDK or your identity provider.
 */
export interface AuthVerifier {
  /**
   * Verify the provided JWT and return strongly typed claims.
   * Implementations must throw on invalid or expired tokens.
   */
  verifyPrivyToken(jwt: string): Promise<PrivyClaims>;
}
