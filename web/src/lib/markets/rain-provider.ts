import { Rain } from "@buidlrrr/rain-sdk";

import { eloWinProbability } from "@/lib/ratings/glicko";
import { getMarketsEnv } from "@/lib/markets/env";
import {
  outcomeToOptionIndex,
  type BuyOptionParams,
  type CreateMarketInput,
  type CreateMarketResult,
  type Hex,
  type MarketPosition,
  type MarketProvider,
  type OddsSnapshot,
  type RawTx,
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

/**
 * Rain market provider. Every write path is a *builder* — it returns unsigned
 * transactions and never broadcasts. Execution is the caller's job (a
 * MarketExecutor: custodial RainAA or a connected wallet), so the same provider
 * works for both custody models.
 */
export class RainProvider implements MarketProvider {
  private readonly rain: Rain;

  constructor() {
    const env = getMarketsEnv();
    this.rain = new Rain({
      environment: env.rainEnvironment,
      rpcUrl: env.rpcUrl,
      wsRpcUrl: env.wsRpcUrl,
      subgraphUrl: env.subgraphUrl,
      subgraphApiKey: env.subgraphApiKey,
    });
  }

  getModelOdds(input: { redElo?: number | null; blueElo?: number | null }): OddsSnapshot {
    return eloWinProbability(input.redElo ?? undefined, input.blueElo ?? undefined);
  }

  /** Build the create-market tx(s) from a prepared config. Does not broadcast. */
  async createMarket(input: CreateMarketInput): Promise<CreateMarketResult> {
    const { config, creator } = input;
    if (!config) {
      throw new Error("RainProvider.createMarket requires input.config (use boutToMarketInput).");
    }
    if (!creator) {
      // Prep without a creator wallet: persist the config, build nothing yet.
      return { marketId: null, transactions: [], config };
    }

    const txs = await this.rain.buildCreateMarketTx({
      marketQuestion: config.question,
      marketOptions: config.options,
      marketTags: config.tags,
      marketDescription: config.description,
      isPublic: true,
      isPublicPoolResolverAi: false,
      creator,
      startTime: BigInt(config.startTime),
      endTime: BigInt(config.endTime),
      no_of_options: BigInt(config.options.length),
      disputeTimer: 0,
      inputAmountWei: BigInt(config.seedLiquidityWei),
      barValues: config.barValues,
      baseToken: config.baseToken,
      tokenDecimals: config.tokenDecimals,
    });

    return { marketId: null, transactions: txs as RawTx[], config };
  }

  async getOdds(marketId: string): Promise<OddsSnapshot> {
    const prices = await this.rain.getMarketPrices(marketId);
    return pricesToOdds(prices);
  }

  /** Build a market-buy tx. Resolves the contract address from the id if absent. */
  async buildBuy(params: BuyOptionParams): Promise<RawTx> {
    const contractAddress =
      params.contractAddress ?? (await this.rain.getMarketAddress(params.marketId));
    return this.rain.buildBuyOptionRawTx({
      marketContractAddress: contractAddress,
      selectedOption: BigInt(outcomeToOptionIndex(params.outcome)),
      buyAmountInWei: params.amount,
    }) as RawTx;
  }

  async getPositions(address: string): Promise<MarketPosition[]> {
    const result = await this.rain.getPositions(address as Hex);
    return result.markets.flatMap((market) =>
      market.options.map((option) => ({
        marketId: market.marketId,
        outcome: option.choiceIndex === 0 ? ("red" as const) : ("blue" as const),
        shares: option.shares,
      }))
    );
  }

  /** Build close + choose-winner tx(s). Winner maps to a 1-indexed option. */
  async resolve(marketId: string, winner: "red" | "blue"): Promise<RawTx[]> {
    const txs = await this.rain.buildResolveMarketTx({
      marketId,
      winningOption: outcomeToOptionIndex(winner) + 1,
    });
    return txs as RawTx[];
  }

  async buildClaim(marketId: string, address: string): Promise<RawTx> {
    return (await this.rain.buildClaimTx({
      marketId,
      walletAddress: address as Hex,
    })) as RawTx;
  }

  /** Live price feed. Resolves the contract address, then streams updates. */
  subscribePrices(marketId: string, onUpdate: (odds: OddsSnapshot) => void): () => void {
    let unsubscribe: (() => void) | null = null;
    let cancelled = false;

    this.rain
      .getMarketDetails(marketId)
      .then((details) => {
        if (cancelled) return;
        unsubscribe = this.rain.subscribePriceUpdates({
          marketAddress: details.contractAddress,
          onPriceUpdate: (update) => onUpdate(pricesToOdds(update.prices)),
          onError: (err) => console.warn("[RainProvider] price stream error", err),
        });
      })
      .catch((err) => console.warn("[RainProvider] subscribePrices failed", err));

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }
}

let singleton: RainProvider | null = null;

export function getRainProvider(): RainProvider {
  if (!singleton) singleton = new RainProvider();
  return singleton;
}
