import { Rain } from "@buidlrrr/rain-sdk";

import { eloWinProbability } from "@/lib/markets/elo";
import type {
  BuyOptionParams,
  CreateMarketInput,
  MarketPosition,
  MarketProvider,
  OddsSnapshot,
} from "@/lib/markets/types";

const SCALE = 1e18;

function pricesToOdds(prices: { choiceIndex: number; currentPrice: bigint }[]): OddsSnapshot {
  const zero = BigInt(0);
  const redRaw = prices.find((p) => p.choiceIndex === 0)?.currentPrice ?? zero;
  const blueRaw = prices.find((p) => p.choiceIndex === 1)?.currentPrice ?? zero;
  const red = Number(redRaw) / SCALE;
  const blue = Number(blueRaw) / SCALE;
  const total = red + blue || 1;
  const redPct = Math.round((red / total) * 100);
  return { red: redPct, blue: 100 - redPct };
}

function todo(method: string): never {
  throw new Error(`RainProvider.${method} is not implemented yet — wire when chain integration lands.`);
}

/** Skeleton Rain provider — read paths compile against @buidlrrr/rain-sdk; writes are TODO. */
export class RainProvider implements MarketProvider {
  private readonly rain: Rain;

  constructor(environment: "development" | "stage" | "production" = "development") {
    this.rain = new Rain({ environment });
  }

  getModelOdds(input: {
    redElo?: number | null;
    blueElo?: number | null;
  }): OddsSnapshot {
    return eloWinProbability(input.redElo ?? undefined, input.blueElo ?? undefined);
  }

  async createMarket(input: CreateMarketInput): Promise<{ marketId: string }> {
    void input;
    todo("createMarket");
  }

  async getOdds(marketId: string): Promise<OddsSnapshot> {
    const prices = await this.rain.getMarketPrices(marketId);
    return pricesToOdds(prices);
  }

  async buildBuy(params: BuyOptionParams): Promise<unknown> {
    void params;
    todo("buildBuy");
  }

  async getPositions(address: string): Promise<MarketPosition[]> {
    const result = await this.rain.getPositions(address as `0x${string}`);
    return result.markets.flatMap((market) =>
      market.options.map((option) => ({
        marketId: market.marketId,
        outcome: option.choiceIndex === 0 ? ("red" as const) : ("blue" as const),
        shares: option.shares,
      }))
    );
  }

  async resolve(marketId: string, winner: "red" | "blue"): Promise<void> {
    void marketId;
    void winner;
    todo("resolve");
  }

  async buildClaim(marketId: string, address: string): Promise<unknown> {
    void marketId;
    void address;
    todo("buildClaim");
  }

  subscribePrices(marketId: string, onUpdate: (odds: OddsSnapshot) => void): () => void {
    void marketId;
    void onUpdate;
    // Rain WS needs contract address — resolve via getMarketDetails when wiring live.
    console.warn("[RainProvider] subscribePrices not wired yet");
    return () => undefined;
  }
}

let singleton: RainProvider | null = null;

export function getRainProvider(): RainProvider {
  if (!singleton) singleton = new RainProvider("development");
  return singleton;
}
