"use client";

import { BoutOddsMini, OddsSplitBar } from "@/components/markets/odds-ui";
import { MarketStatusChip } from "@/components/charts/prediction-insight";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { favoriteCorner, probToAmerican } from "@/lib/odds";
import { getBoutMarketContext, getMarketsProviderKind } from "@/lib/markets";
import { confidenceLabel } from "@/lib/ratings";
import type { Bout, FightCard } from "@/types/fight-card";

interface CardOddsOverviewProps {
  card: FightCard;
}

/** At-a-glance model vs market scan for every bout on the card. */
export function CardOddsOverview({ card }: CardOddsOverviewProps) {
  const provider = getMarketsProviderKind();
  const marketCol = provider === "rain" ? "Rain" : "Market";

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Fight Card Odds</CardTitle>
        <CardDescription>
          Model predictions vs {marketCol.toLowerCase()} implied prices — scan edges before
          markets go live on Rain.
        </CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-10">#</TableHead>
              <TableHead>Matchup</TableHead>
              <TableHead>Model</TableHead>
              <TableHead>{marketCol}</TableHead>
              <TableHead className="w-28">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {card.bouts.map((bout) => (
              <OverviewRow key={bout.bout_number} bout={bout} />
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function OverviewRow({ bout }: { bout: Bout }) {
  const model = bout.win_probability;
  const fav = favoriteCorner(model);
  const favName =
    fav === "red" ? bout.red_corner.display_name : bout.blue_corner.display_name;
  const ctx = getBoutMarketContext(bout);

  return (
    <TableRow>
      <TableCell className="font-mono text-muted-foreground">{bout.bout_number}</TableCell>
      <TableCell>
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{bout.label}</span>
          {bout.is_title_fight ? (
            <Badge variant="outline" className="border-amber-500/30 text-[10px] text-amber-400">
              Title
            </Badge>
          ) : null}
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {bout.red_corner.display_name} vs {bout.blue_corner.display_name}
        </p>
        <p className="mt-1 text-[10px] text-muted-foreground">
          Pick: <span className="text-foreground">{favName}</span>
          {model.confidence != null ? (
            <> · {confidenceLabel(model.confidence)} conf</>
          ) : null}
        </p>
      </TableCell>
      <TableCell>
        <div className="space-y-1">
          <p className="font-mono text-xs tabular-nums">
            <span className="text-red-400">{model.red}%</span>
            <span className="text-muted-foreground"> / </span>
            <span className="text-blue-400">{model.blue}%</span>
          </p>
          <OddsSplitBar red={model.red} blue={model.blue} height="h-1.5" />
          <p className="font-mono text-[10px] text-muted-foreground">
            {probToAmerican(fav === "red" ? model.red : model.blue)} fav
          </p>
        </div>
      </TableCell>
      <TableCell>
        <BoutOddsMini bout={bout} />
      </TableCell>
      <TableCell>
        <MarketStatusChip status={ctx.marketStatus} />
      </TableCell>
    </TableRow>
  );
}
