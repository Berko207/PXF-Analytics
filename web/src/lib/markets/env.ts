/**
 * Rain / prediction-market environment configuration.
 *
 * Everything here is read server-side. Markets are only ever broadcast onchain
 * when `MARKETS_LIVE === "true"`; otherwise the app builds and persists market
 * definitions without sending a transaction ("prep mode").
 */

import type { Hex, RainEnvironmentName } from "@/lib/markets/types";

/** Default base token = USDT on Arbitrum One (6 decimals), per the Rain docs. */
const DEFAULT_BASE_TOKEN: Hex = "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9";
const DEFAULT_TOKEN_DECIMALS = 6;
/** 10 USDT minimum seed liquidity (Rain create-market minimum). */
const DEFAULT_SEED_LIQUIDITY_WEI = "10000000";

export interface MarketsEnv {
  /** Provider selection (client-readable). */
  provider: "mock" | "rain";
  /** Onchain broadcasting allowed. Off by default — prep only. */
  live: boolean;
  /** Custody model for execution. */
  custody: "custodial" | "connected";
  rainEnvironment: RainEnvironmentName;
  rpcUrl?: string;
  wsRpcUrl?: string;
  subgraphUrl?: string;
  subgraphApiKey?: string;
  alchemyApiKey?: string;
  paymasterPolicyId?: string;
  /** Wallet that creates/owns markets (custodial smart account or ops EOA). */
  creator?: Hex;
  baseToken: Hex;
  tokenDecimals: number;
  seedLiquidityWei: string;
}

export function getMarketsEnv(): MarketsEnv {
  return {
    provider: process.env.NEXT_PUBLIC_MARKETS_PROVIDER === "rain" ? "rain" : "mock",
    live: process.env.MARKETS_LIVE === "true",
    custody: process.env.RAIN_CUSTODY === "connected" ? "connected" : "custodial",
    rainEnvironment: (process.env.RAIN_ENVIRONMENT as RainEnvironmentName) || "development",
    rpcUrl: process.env.RAIN_RPC_URL || undefined,
    wsRpcUrl: process.env.RAIN_WS_RPC_URL || undefined,
    subgraphUrl: process.env.RAIN_SUBGRAPH_URL || undefined,
    subgraphApiKey: process.env.RAIN_SUBGRAPH_API_KEY || undefined,
    alchemyApiKey: process.env.ALCHEMY_API_KEY || undefined,
    paymasterPolicyId: process.env.RAIN_PAYMASTER_POLICY_ID || undefined,
    creator: (process.env.RAIN_CREATOR_ADDRESS as Hex) || undefined,
    baseToken: (process.env.RAIN_BASE_TOKEN as Hex) || DEFAULT_BASE_TOKEN,
    tokenDecimals: Number(process.env.RAIN_TOKEN_DECIMALS) || DEFAULT_TOKEN_DECIMALS,
    seedLiquidityWei: process.env.RAIN_SEED_LIQUIDITY_WEI || DEFAULT_SEED_LIQUIDITY_WEI,
  };
}
