"use client";

import { useEffect, useMemo, useState } from "react";

import {
  getMarketProvider,
  getMarketsProviderKind,
  isMarketOddsAvailable,
  type MarketStatus,
  type OddsSnapshot,
} from "@/lib/markets";

export interface UseMarketOddsOptions {
  marketId?: string | null;
  marketStatus?: MarketStatus;
  redElo?: number | null;
  blueElo?: number | null;
}

export interface UseMarketOddsResult {
  modelOdds: OddsSnapshot;
  marketOdds: OddsSnapshot | null;
  marketAvailable: boolean;
  loading: boolean;
}

/** Client hook — model odds from ELO; market odds from provider when status allows. */
export function useMarketOdds({
  marketId,
  marketStatus = "pending",
  redElo,
  blueElo,
}: UseMarketOddsOptions): UseMarketOddsResult {
  const provider = useMemo(() => getMarketProvider(), []);
  const modelOdds = useMemo(
    () => provider.getModelOdds({ redElo, blueElo }),
    [provider, redElo, blueElo]
  );

  // In mock mode, simulate an open market for any bout with a matchup id.
  const effectiveStatus: MarketStatus =
    marketStatus === "pending" &&
    marketId &&
    getMarketsProviderKind() === "mock"
      ? "trading_open"
      : marketStatus;

  const marketAvailable = Boolean(marketId) && isMarketOddsAvailable(effectiveStatus);
  const [marketOdds, setMarketOdds] = useState<OddsSnapshot | null>(null);
  const [loading, setLoading] = useState(marketAvailable);

  useEffect(() => {
    if (!marketId || !marketAvailable) {
      setMarketOdds(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    provider
      .getOdds(marketId)
      .then((odds) => {
        if (!cancelled) {
          setMarketOdds(odds);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setMarketOdds(null);
          setLoading(false);
        }
      });

    const unsubscribe = provider.subscribePrices(marketId, (odds) => {
      if (!cancelled) setMarketOdds(odds);
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [marketAvailable, marketId, provider]);

  return { modelOdds, marketOdds, marketAvailable, loading };
}
