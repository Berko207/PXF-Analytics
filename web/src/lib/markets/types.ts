import type { Bout, MarketStatus } from "@/types/fight-card";

export type { MarketStatus };

export interface OddsSnapshot {
  red: number;
  blue: number;
}

export interface CreateMarketInput {
  matchupId: string;
  boutNumber: number;
  redFighterId: string;
  blueFighterId: string;
  redElo?: number | null;
  blueElo?: number | null;
}

export interface BuyOptionParams {
  marketId: string;
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
  createMarket(input: CreateMarketInput): Promise<{ marketId: string }>;
  getOdds(marketId: string): Promise<OddsSnapshot>;
  getModelOdds(input: {
    redElo?: number | null;
    blueElo?: number | null;
  }): OddsSnapshot;
  buildBuy(params: BuyOptionParams): Promise<unknown>;
  getPositions(address: string): Promise<MarketPosition[]>;
  resolve(marketId: string, winner: "red" | "blue"): Promise<void>;
  buildClaim(marketId: string, address: string): Promise<unknown>;
  subscribePrices(
    marketId: string,
    onUpdate: (odds: OddsSnapshot) => void
  ): () => void;
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
