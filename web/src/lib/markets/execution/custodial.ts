// Server-only: imported exclusively from route handlers (uses secret env vars).
import { RainAA } from "@buidlrrr/rain-sdk";
import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";

import { getActiveChain } from "@/lib/wallet/chains";
import { getMarketsEnv } from "@/lib/markets/env";
import type { MarketExecutor } from "@/lib/markets/execution/types";
import type { Hex, RawTx } from "@/lib/markets/types";

/**
 * Custodial executor — app-managed Alchemy smart account with gas sponsorship.
 * Scaffolded: it only initializes when MARKETS_LIVE and the AA secrets are
 * present, so importing it is always safe. Until then `send()` throws a clear,
 * actionable error instead of touching the chain.
 */
export class CustodialExecutor implements MarketExecutor {
  private aa: RainAA | null = null;
  private connected = false;

  private async ensure(): Promise<RainAA> {
    const env = getMarketsEnv();
    if (!env.live) {
      throw new Error("Custodial execution is off (set MARKETS_LIVE=true to broadcast).");
    }
    const pk = process.env.RAIN_SIGNER_PRIVATE_KEY as Hex | undefined;
    if (!pk || !env.alchemyApiKey || !env.paymasterPolicyId) {
      throw new Error(
        "Custodial executor not configured — need RAIN_SIGNER_PRIVATE_KEY, ALCHEMY_API_KEY, RAIN_PAYMASTER_POLICY_ID."
      );
    }
    if (!this.aa) {
      const chain = getActiveChain();
      const account = privateKeyToAccount(pk);
      const walletClient = createWalletClient({
        account,
        chain,
        transport: http(env.rpcUrl),
      });
      this.aa = new RainAA({
        walletClient,
        alchemyApiKey: env.alchemyApiKey,
        paymasterPolicyId: env.paymasterPolicyId,
        chain,
        rpcUrl: env.rpcUrl,
      });
    }
    if (!this.connected) {
      await this.aa.connect();
      this.connected = true;
    }
    return this.aa;
  }

  async address(): Promise<string> {
    return (await this.ensure()).address;
  }

  async send(txs: RawTx[]): Promise<string[]> {
    const aa = await this.ensure();
    const hashes: string[] = [];
    for (const tx of txs) {
      hashes.push(await aa.sendTransaction(tx));
    }
    return hashes;
  }
}
