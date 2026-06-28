// Server-only: imported exclusively from route handlers.
import { getMarketsEnv } from "@/lib/markets/env";
import { CustodialExecutor } from "@/lib/markets/execution/custodial";
import type { MarketExecutor } from "@/lib/markets/execution/types";

export type { MarketExecutor } from "@/lib/markets/execution/types";
export { CustodialExecutor } from "@/lib/markets/execution/custodial";
export { ConnectedWalletExecutor } from "@/lib/markets/execution/connected";

/**
 * Server-side executor. Only the custodial path can run on the server; the
 * connected-wallet path executes in the browser and is constructed there with
 * the user's WalletClient.
 */
export function getServerExecutor(): MarketExecutor {
  const env = getMarketsEnv();
  if (env.custody === "connected") {
    throw new Error("Connected-wallet custody executes client-side; no server executor.");
  }
  return new CustodialExecutor();
}
