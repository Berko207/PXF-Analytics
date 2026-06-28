import type { RawTx } from "@/lib/markets/types";

/**
 * Sends unsigned transactions built by the provider. Two implementations plug
 * in behind this interface — custodial (RainAA smart accounts, server-side,
 * gas-sponsored) and connected (a user's viem wallet, client-side) — so the
 * rest of the app never hard-codes a custody model.
 */
export interface MarketExecutor {
  /** The address that will sign/execute (creator or trader). */
  address(): Promise<string>;
  /** Broadcast txs sequentially; returns their tx hashes in order. */
  send(txs: RawTx[]): Promise<string[]>;
}
