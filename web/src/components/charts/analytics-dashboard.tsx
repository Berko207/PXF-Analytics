"use client";

import { useState } from "react";

import { BoutProbabilityChart } from "@/components/charts/bout-probability-chart";
import { OddsMovementChart } from "@/components/charts/odds-movement-chart";
import { WinProbabilityGauge } from "@/components/charts/win-probability-gauge";
import { CardOddsOverview } from "@/components/markets/card-odds-overview";
import { BoutOddsPanel } from "@/components/markets/odds-ui";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getMarketsProviderKind } from "@/lib/markets";
import type { Bout, FightCard } from "@/types/fight-card";

interface AnalyticsDashboardProps {
  card: FightCard;
}

export function AnalyticsDashboard({ card }: AnalyticsDashboardProps) {
  const mainEvent = card.bouts[0];
  const [selectedBout, setSelectedBout] = useState<Bout>(mainEvent);
  const provider = getMarketsProviderKind();
  const marketLabel = provider === "rain" ? "Rain" : "Market";

  return (
    <div className="space-y-8">
      <CardOddsOverview card={card} />

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Main Event</CardTitle>
            <CardDescription>
              {mainEvent.label} — model vs {marketLabel.toLowerCase()} implied win probability
            </CardDescription>
          </CardHeader>
          <CardContent>
            <WinProbabilityGauge
              bout={mainEvent}
              redName={mainEvent.red_corner.display_name}
              blueName={mainEvent.blue_corner.display_name}
            />
            <BoutOddsPanel bout={mainEvent} className="mt-4" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Card Probabilities</CardTitle>
            <CardDescription>
              Model win share by bout — darker stack = favorite corner
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BoutProbabilityChart card={card} />
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Price History</CardTitle>
          <CardDescription>
            {provider === "rain"
              ? "Live Rain price drift through fight week (updates when markets are open)"
              : "Simulated drift toward model fair value — preview of Rain market movement"}
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
                <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="font-medium">{bout.label}</p>
                    <p className="text-sm text-muted-foreground">
                      {bout.red_corner.display_name} vs {bout.blue_corner.display_name}
                    </p>
                  </div>
                  <BoutOddsPanel bout={bout} variant="inline" className="max-w-md" />
                </div>
                <OddsMovementChart
                  bout={bout}
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
