import { getMockProvider } from "@/lib/markets/mock-provider";
import type { MarketProvider } from "@/lib/markets/types";

export type MarketsProviderKind = "mock" | "rain";

export function getMarketsProviderKind(): MarketsProviderKind {
  return process.env.NEXT_PUBLIC_MARKETS_PROVIDER === "rain" ? "rain" : "mock";
}

let rainSingleton: MarketProvider | null = null;

/** Factory — returns MockProvider unless NEXT_PUBLIC_MARKETS_PROVIDER=rain. */
export function getMarketProvider(): MarketProvider {
  if (getMarketsProviderKind() === "rain") {
    if (!rainSingleton) {
      // Lazy require keeps optional Rain peer deps out of the default client bundle.
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { getRainProvider } = require("@/lib/markets/rain-provider") as typeof import("@/lib/markets/rain-provider");
      rainSingleton = getRainProvider();
    }
    return rainSingleton;
  }
  return getMockProvider();
}

export * from "@/lib/markets/types";
export { eloWinProbability } from "@/lib/markets/elo";
