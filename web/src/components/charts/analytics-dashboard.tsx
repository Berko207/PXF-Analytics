"use client";

import { useState } from "react";

import { BoutProbabilityChart } from "@/components/charts/bout-probability-chart";
import { OddsMovementChart } from "@/components/charts/odds-movement-chart";
import { WinProbabilityGauge } from "@/components/charts/win-probability-gauge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMarketOdds } from "@/hooks/use-market-odds";
import { getBoutMarketContext } from "@/lib/markets";
import { cn } from "@/lib/utils";
import type { Bout, FightCard } from "@/types/fight-card";

interface AnalyticsDashboardProps {
  card: FightCard;
}

export function AnalyticsDashboard({ card }: AnalyticsDashboardProps) {
  const mainEvent = card.bouts[0];
  const [selectedBout, setSelectedBout] = useState<Bout>(mainEvent);

  return (
    <div className="space-y-8">
      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Main Event Probability</CardTitle>
            <CardDescription>Model vs market odds — {mainEvent.label}</CardDescription>
          </CardHeader>
          <CardContent>
            <WinProbabilityGauge
              bout={mainEvent}
              redName={mainEvent.red_corner.display_name}
              blueName={mainEvent.blue_corner.display_name}
            />
            <BoutOddsLegend bout={mainEvent} className="mt-4" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Card-Wide Probabilities</CardTitle>
            <CardDescription>Stacked model probability by bout number</CardDescription>
          </CardHeader>
          <CardContent>
            <BoutProbabilityChart card={card} />
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Odds Movement</CardTitle>
          <CardDescription>
            Simulated market drift through fight week (placeholder data)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs
            value={String(selectedBout.bout_number)}
            onValueChange={(value) => {
              const bout = card.bouts.find((item) => item.bout_number === Number(value));
              if (bout) setSelectedBout(bout);
            }}
          >
            <TabsList className="mb-4 flex h-auto flex-wrap justify-start gap-1 bg-muted/40">
              {card.bouts.map((bout) => (
                <TabsTrigger key={bout.bout_number} value={String(bout.bout_number)}>
                  #{bout.bout_number}
                </TabsTrigger>
              ))}
            </TabsList>

            {card.bouts.map((bout) => (
              <TabsContent key={bout.bout_number} value={String(bout.bout_number)}>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">{bout.label}</p>
                    <p className="text-sm text-muted-foreground">
                      {bout.red_corner.display_name} vs {bout.blue_corner.display_name}
                    </p>
                  </div>
                  <BoutOddsInline bout={bout} />
                </div>
                <OddsMovementChart
                  boutNumber={bout.bout_number}
                  redName={bout.red_corner.display_name}
                  blueName={bout.blue_corner.display_name}
                />
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function BoutOddsInline({ bout }: { bout: Bout }) {
  const ctx = getBoutMarketContext(bout);
  const { modelOdds, marketOdds, marketAvailable, loading } = useMarketOdds({
    marketId: ctx.marketId,
    marketStatus: ctx.marketStatus,
    redElo: bout.red_elo ?? bout.red_corner.elo,
    blueElo: bout.blue_elo ?? bout.blue_corner.elo,
  });

  return (
    <p className="font-mono text-sm">
      <span className="text-muted-foreground">Model </span>
      <span className="text-red-400">{modelOdds.red}%</span>
      <span className="text-muted-foreground"> / </span>
      <span className="text-blue-400">{modelOdds.blue}%</span>
      <span className="mx-2 text-muted-foreground">·</span>
      <span className="text-muted-foreground">Market </span>
      {marketAvailable && marketOdds && !loading ? (
        <>
          <span className="text-red-400">{marketOdds.red}%</span>
          <span className="text-muted-foreground"> / </span>
          <span className="text-blue-400">{marketOdds.blue}%</span>
        </>
      ) : (
        <span className="text-muted-foreground">Pending</span>
      )}
    </p>
  );
}

function BoutOddsLegend({ bout, className }: { bout: Bout; className?: string }) {
  const ctx = getBoutMarketContext(bout);
  const { modelOdds, marketOdds, marketAvailable, loading } = useMarketOdds({
    marketId: ctx.marketId,
    marketStatus: ctx.marketStatus,
    redElo: bout.red_elo ?? bout.red_corner.elo,
    blueElo: bout.blue_elo ?? bout.blue_corner.elo,
  });

  return (
    <div className={cn("grid grid-cols-2 gap-3 text-center text-sm", className)}>
      <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3">
        <p className="text-red-400">{bout.red_corner.display_name}</p>
        <p className="mt-1 font-mono text-xl">{modelOdds.red}%</p>
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Model</p>
      </div>
      <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3">
        <p className="text-blue-400">{bout.blue_corner.display_name}</p>
        <p className="mt-1 font-mono text-xl">{modelOdds.blue}%</p>
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Model</p>
      </div>
      <div className="col-span-2 rounded-lg border border-border/60 bg-muted/20 p-3">
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Market</p>
        {marketAvailable && marketOdds && !loading ? (
          <p className="mt-1 font-mono">
            <span className="text-red-400">{marketOdds.red}%</span>
            <span className="text-muted-foreground"> / </span>
            <span className="text-blue-400">{marketOdds.blue}%</span>
          </p>
        ) : (
          <p className="mt-1 text-muted-foreground">Pending — no on-chain market yet</p>
        )}
      </div>
    </div>
  );
}
