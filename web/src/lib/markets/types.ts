import type { Bout, MarketStatus } from "@/types/fight-card";

export type { MarketStatus };

export type Hex = `0x${string}`;

export type RainEnvironmentName = "development" | "stage" | "production";

/** Unsigned transaction (shape returned by every Rain tx-builder). */
export interface RawTx {
  to: Hex;
  data: Hex;
  value?: bigint;
}

export interface OddsSnapshot {
  red: number;
  blue: number;
  /** 0–100 model confidence (present on model odds, absent on market prices). */
  confidence?: number;
}

/**
 * Exact Rain create-market parameters. Persisted to
 * `pxf.prediction_markets.market_config` so a prepared market is fully
 * reproducible and one broadcast away from going live. bigints are stored as
 * decimal strings for JSON/DB safety.
 */
export interface RainMarketConfig {
  question: string;
  description: string;
  /** [red label, blue label]. */
  options: [string, string];
  tags: string[];
  /** Initial probability seed (%) — this is where the MODEL seeds the price. */
  barValues: [number, number];
  baseToken: Hex;
  tokenDecimals: number;
  seedLiquidityWei: string;
  startTime: number;
  endTime: number;
}

export interface CreateMarketInput {
  matchupId: string;
  boutNumber: number;
  redFighterId: string;
  blueFighterId: string;
  redElo?: number | null;
  blueElo?: number | null;
  /** Model seed odds (with confidence). */
  modelOdds?: OddsSnapshot;
  /** Full Rain market config (built by mapping.ts). */
  config?: RainMarketConfig;
  /** Creator wallet (custodial smart account or connected EOA). */
  creator?: Hex;
}

export interface CreateMarketResult {
  /** External Rain id — known only after broadcast + indexing. */
  marketId: string | null;
  /** Unsigned transactions to broadcast; empty when not buildable in prep mode. */
  transactions: RawTx[];
  config: RainMarketConfig | null;
}

export interface BuyOptionParams {
  marketId: string;
  contractAddress?: Hex;
  outcome: "red" | "blue";
  amount: bigint;
  walletAddress: string;
}

export interface MarketPosition {
  marketId: string;
  outcome: "red" | "blue";
  shares: bigint;
}

export interface MarketProvider {
  /** Lightweight client-side fallback (plain Elo). The real prediction is
   *  computed server-side and lives on `bout.win_probability`. */
  getModelOdds(input: { redElo?: number | null; blueElo?: number | null }): OddsSnapshot;
  createMarket(input: CreateMarketInput): Promise<CreateMarketResult>;
  getOdds(marketId: string): Promise<OddsSnapshot>;
  buildBuy(params: BuyOptionParams): Promise<unknown>;
  getPositions(address: string): Promise<MarketPosition[]>;
  resolve(marketId: string, winner: "red" | "blue"): Promise<unknown>;
  buildClaim(marketId: string, address: string): Promise<unknown>;
  subscribePrices(marketId: string, onUpdate: (odds: OddsSnapshot) => void): () => void;
}

export interface BoutMarketContext {
  bout: Bout;
  marketId: string | null;
  marketStatus: MarketStatus;
  rainMarketId: string | null;
}

export function getBoutMarketContext(bout: Bout): BoutMarketContext {
  const market = bout.market;
  return {
    bout,
    marketId: market?.rain_market_id ?? market?.id ?? bout.matchup_id ?? null,
    marketStatus: market?.status ?? "pending",
    rainMarketId: market?.rain_market_id ?? null,
  };
}

/** Market odds are displayable once a Rain id exists and status is past pending. */
export function isMarketOddsAvailable(status: MarketStatus): boolean {
  return status !== "pending" && status !== "cancelled";
}

/** Map a red/blue outcome to a Rain option index (red = 0, blue = 1). */
export function outcomeToOptionIndex(outcome: "red" | "blue"): number {
  return outcome === "red" ? 0 : 1;
}
