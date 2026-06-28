import type { WalletClient } from "viem";

import type { MarketExecutor } from "@/lib/markets/execution/types";
import type { RawTx } from "@/lib/markets/types";

/**
 * Connected-wallet executor — runs client-side with the fan's own viem
 * WalletClient (e.g. from wagmi). The user signs and pays gas. Scaffolded for
 * the day the UI ships a wallet connect flow; not wired into any route yet.
 */
export class ConnectedWalletExecutor implements MarketExecutor {
  constructor(private readonly walletClient: WalletClient) {}

  async address(): Promise<string> {
    const [addr] = await this.walletClient.getAddresses();
    if (!addr) throw new Error("No connected wallet account.");
    return addr;
  }

  async send(txs: RawTx[]): Promise<string[]> {
    const [account] = await this.walletClient.getAddresses();
    if (!account) throw new Error("No connected wallet account.");
    const hashes: string[] = [];
    for (const tx of txs) {
      // viem's overloaded sendTransaction types are awkward across versions;
      // the runtime shape (account/to/data/value) is what matters.
      const hash = await this.walletClient.sendTransaction({
        account,
        to: tx.to,
        data: tx.data,
        value: tx.value,
      } as Parameters<WalletClient["sendTransaction"]>[0]);
      hashes.push(hash);
    }
    return hashes;
  }
}
