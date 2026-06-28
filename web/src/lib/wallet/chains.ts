import { arbitrum, arbitrumSepolia } from "viem/chains";
import type { Chain } from "viem";

/**
 * Single source of truth for which EVM chain the app talks to. Read by BOTH the
 * client wallet (connect / switch-network) and the server-side custodial
 * executor, so there is never a mismatch between where a market is created and
 * where a fan signs a buy.
 *
 * Flip the whole app between testnet and mainnet with one env var:
 *   NEXT_PUBLIC_CHAIN=arbitrum-sepolia   # testnet — trade with fake-value USDC
 *   NEXT_PUBLIC_CHAIN=arbitrum-one       # mainnet — real money
 *
 * NOTE: confirm Rain's `RAIN_ENVIRONMENT` targets the SAME chain. Rain
 * `development` is expected to be a testnet; set RAIN_RPC_URL accordingly.
 */
export type ChainKey = "arbitrum-one" | "arbitrum-sepolia";

const CHAINS: Record<ChainKey, Chain> = {
  "arbitrum-one": arbitrum,
  "arbitrum-sepolia": arbitrumSepolia,
};

export function getActiveChainKey(): ChainKey {
  return process.env.NEXT_PUBLIC_CHAIN === "arbitrum-one"
    ? "arbitrum-one"
    : "arbitrum-sepolia"; // testnet-first default
}

export function getActiveChain(): Chain {
  return CHAINS[getActiveChainKey()];
}

export function isTestnet(): boolean {
  return getActiveChainKey() === "arbitrum-sepolia";
}

/** Block-explorer base URL for the active chain (for tx-hash links). */
export function explorerTxUrl(txHash: string): string {
  const base = getActiveChain().blockExplorers?.default.url ?? "https://arbiscan.io";
  return `${base}/tx/${txHash}`;
}
