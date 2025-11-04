/**
 * SafeService
 *
 * Ensures an EVM Safe exists for a given user and persists the mapping.
 */
import { RelayerClientWrapper } from "./RelayerClient";
import { SafeRegistry } from "../integration/SafeRegistry";
import { VerifiedUser } from "../types";

export class SafeService {
  private readonly relayer: RelayerClientWrapper;
  private readonly registry: SafeRegistry;

  /**
   * Construct with a relayer client and a persistence registry.
   */
  constructor(relayer: RelayerClientWrapper, registry: SafeRegistry) {
    this.relayer = relayer;
    this.registry = registry;
  }

  /**
   * Ensure that a Safe exists for the user.
   * @param user - Verified user claims
   * @returns The Safe proxy address (checks existing; deploys if missing)
   */
  async ensureUserSafe(user: VerifiedUser): Promise<string> {
    const existing = await this.registry.getSafe(user.userId);
    if (existing && existing.length > 0) return existing;

    const { proxyAddress } = await this.relayer.deploySafe();
    await this.registry.setSafe(user.userId, proxyAddress);
    return proxyAddress;
  }
}
