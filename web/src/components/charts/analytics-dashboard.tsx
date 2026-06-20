"use client";

import { useState } from "react";

import { BoutProbabilityChart } from "@/components/charts/bout-probability-chart";
import { OddsMovementChart } from "@/components/charts/odds-movement-chart";
import { WinProbabilityGauge } from "@/components/charts/win-probability-gauge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getFightCard } from "@/lib/data";
import type { Bout } from "@/types/fight-card";

export function AnalyticsDashboard() {
  const card = getFightCard();
  const mainEvent = card.bouts[0];
  const [selectedBout, setSelectedBout] = useState<Bout>(mainEvent);

  return (
    <div className="space-y-8">
      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Main Event Probability</CardTitle>
            <CardDescription>
              Implied win probability — placeholder model data for {mainEvent.label}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <WinProbabilityGauge
              probability={mainEvent.win_probability}
              redName={mainEvent.red_corner.display_name}
              blueName={mainEvent.blue_corner.display_name}
            />
            <div className="mt-4 grid grid-cols-2 gap-3 text-center text-sm">
              <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3">
                <p className="text-red-400">{mainEvent.red_corner.display_name}</p>
                <p className="mt-1 font-mono text-xl">{mainEvent.win_probability.red}%</p>
              </div>
              <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3">
                <p className="text-blue-400">{mainEvent.blue_corner.display_name}</p>
                <p className="mt-1 font-mono text-xl">{mainEvent.win_probability.blue}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Card-Wide Probabilities</CardTitle>
            <CardDescription>Stacked implied probability by bout number</CardDescription>
          </CardHeader>
          <CardContent>
            <BoutProbabilityChart />
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
                  <p className="font-mono text-sm">
                    <span className="text-red-400">{bout.win_probability.red}%</span>
                    <span className="text-muted-foreground"> / </span>
                    <span className="text-blue-400">{bout.win_probability.blue}%</span>
                  </p>
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
