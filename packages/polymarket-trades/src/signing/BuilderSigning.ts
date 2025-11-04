import { BuilderConfig, BuilderApiKeyCreds } from "@polymarket/builder-signing-sdk";
import { BuilderLocalCreds, BuilderRemoteSigning } from "../types";

/**
 * BuilderSigning encapsulates configuration for builder attribution headers.
 *
 * Usage:
 * - Local creds (server-only): keep API keys in env and construct BuilderConfig with localBuilderCreds.
 * - Remote signing: point to your signing server URL; credentials never reach client.
 */
export interface BuilderSigningOptions {
  localCreds?: BuilderLocalCreds;
  remote?: BuilderRemoteSigning;
}

/**
 * Create a BuilderConfig instance suitable for both CLOB and Relayer clients.
 */
export class BuilderSigning {
  private readonly local?: BuilderLocalCreds;
  private readonly remote?: BuilderRemoteSigning;

  /**
   * Initialize with either local credentials or a remote signing server URL.
   */
  constructor(opts: BuilderSigningOptions) {
    this.local = opts.localCreds;
    this.remote = opts.remote;
  }

  /**
   * Build a @polymarket/builder-signing-sdk BuilderConfig according to provided options.
   */
  toBuilderConfig(): BuilderConfig {
    if (this.remote) {
      return new BuilderConfig({ remoteBuilderConfig: { url: this.remote.url } });
    }
    if (this.local) {
      const creds: BuilderApiKeyCreds = {
        key: this.local.key,
        secret: this.local.secret,
        passphrase: this.local.passphrase,
      };
      return new BuilderConfig({ localBuilderCreds: creds });
    }
    // Default to no builder attribution
    return new BuilderConfig({});
  }
}
