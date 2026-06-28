import { eloWinProbability } from "@/lib/markets/elo";
import type {
  BuyOptionParams,
  CreateMarketInput,
  CreateMarketResult,
  MarketPosition,
  MarketProvider,
  OddsSnapshot,
} from "@/lib/markets/types";

interface MockMarket {
  id: string;
  input: CreateMarketInput;
  status: "pending" | "trading_open" | "resolved" | "settled";
  odds: OddsSnapshot;
  winner?: "red" | "blue";
}

function clampPercent(value: number): number {
  return Math.min(99, Math.max(1, Math.round(value)));
}

function normalizeOdds(odds: OddsSnapshot): OddsSnapshot {
  const red = clampPercent(odds.red);
  return { red, blue: 100 - red };
}

function nudgeOdds(odds: OddsSnapshot): OddsSnapshot {
  const delta = (Math.random() - 0.5) * 2;
  return normalizeOdds({ red: odds.red + delta, blue: odds.blue - delta });
}

export class MockProvider implements MarketProvider {
  private markets = new Map<string, MockMarket>();
  private positions = new Map<string, MarketPosition[]>();
  private timers = new Map<string, ReturnType<typeof setInterval>>();

  getModelOdds(input: {
    redElo?: number | null;
    blueElo?: number | null;
  }): OddsSnapshot {
    return eloWinProbability(input.redElo ?? undefined, input.blueElo ?? undefined);
  }

  async createMarket(input: CreateMarketInput): Promise<CreateMarketResult> {
    const id = input.matchupId;
    const odds = input.modelOdds ?? this.getModelOdds(input);
    this.markets.set(id, {
      id,
      input,
      status: "trading_open",
      odds,
    });
    return { marketId: id, transactions: [], config: input.config ?? null };
  }

  private ensureMarket(marketId: string): MockMarket {
    let market = this.markets.get(marketId);
    if (market) return market;

    market = {
      id: marketId,
      input: {
        matchupId: marketId,
        boutNumber: 0,
        redFighterId: "red",
        blueFighterId: "blue",
      },
      status: "trading_open",
      odds: { red: 50, blue: 50 },
    };
    this.markets.set(marketId, market);
    return market;
  }

  async getOdds(marketId: string): Promise<OddsSnapshot> {
    return this.ensureMarket(marketId).odds;
  }

  async buildBuy(params: BuyOptionParams): Promise<{ ok: true; txId: string }> {
    const market = this.ensureMarket(params.marketId);
    const positions = this.positions.get(params.walletAddress) ?? [];
    positions.push({
      marketId: params.marketId,
      outcome: params.outcome,
      shares: params.amount,
    });
    this.positions.set(params.walletAddress, positions);

    const bump = params.outcome === "red" ? 1.5 : -1.5;
    market.odds = normalizeOdds({
      red: market.odds.red + bump,
      blue: market.odds.blue - bump,
    });

    return { ok: true, txId: `mock-${Date.now()}` };
  }

  async getPositions(address: string): Promise<MarketPosition[]> {
    return this.positions.get(address) ?? [];
  }

  async resolve(marketId: string, winner: "red" | "blue"): Promise<void> {
    const market = this.ensureMarket(marketId);
    market.status = "resolved";
    market.winner = winner;
    market.odds = winner === "red" ? { red: 100, blue: 0 } : { red: 0, blue: 100 };
    this.clearTimer(marketId);
  }

  async buildClaim(marketId: string, address: string): Promise<{ ok: true }> {
    const market = this.ensureMarket(marketId);
    if (market.status !== "resolved" && market.status !== "settled") {
      throw new Error("Market not resolved");
    }
    market.status = "settled";
    this.positions.set(
      address,
      (this.positions.get(address) ?? []).filter((p) => p.marketId !== marketId)
    );
    return { ok: true };
  }

  subscribePrices(
    marketId: string,
    onUpdate: (odds: OddsSnapshot) => void
  ): () => void {
    const market = this.ensureMarket(marketId);
    onUpdate(market.odds);

    this.clearTimer(marketId);
    const timer = setInterval(() => {
      if (market.status !== "trading_open") return;
      market.odds = nudgeOdds(market.odds);
      onUpdate(market.odds);
    }, 4000);

    this.timers.set(marketId, timer);
    return () => this.clearTimer(marketId);
  }

  private clearTimer(marketId: string) {
    const timer = this.timers.get(marketId);
    if (timer) {
      clearInterval(timer);
      this.timers.delete(marketId);
    }
  }
}

let singleton: MockProvider | null = null;

export function getMockProvider(): MockProvider {
  if (!singleton) singleton = new MockProvider();
  return singleton;
}
