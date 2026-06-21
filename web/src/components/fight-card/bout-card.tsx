"use client";

import { FighterStatusBadge } from "@/components/fight-card/fighter-status-badge";
import { LevelBadge } from "@/components/fight-card/level-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getFighterDisplayName, getTapologyHref, getTapologySearchTerm } from "@/lib/format";
import type { Bout, Fighter } from "@/types/fight-card";
import { ExternalLink } from "lucide-react";

interface FighterRowProps {
  fighter: Fighter;
  corner: "red" | "blue";
  onSelect?: (fighter: Fighter) => void;
}

function FighterRow({ fighter, corner, onSelect }: FighterRowProps) {
  const cornerColor =
    corner === "red"
      ? "border-l-red-500 bg-red-500/5"
      : "border-l-blue-500 bg-blue-500/5";

  return (
    <button
      type="button"
      onClick={() => onSelect?.(fighter)}
      className={`group w-full rounded-lg border border-border/50 border-l-4 p-3 text-left transition-all hover:border-border hover:bg-muted/30 ${cornerColor}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            {corner} corner
          </p>
          <p className="mt-0.5 font-semibold group-hover:text-primary">
            {getFighterDisplayName(fighter)}
          </p>
          {fighter.original_name !== getFighterDisplayName(fighter) ? (
            <p className="text-xs text-muted-foreground">Card: {fighter.original_name}</p>
          ) : null}
        </div>
        <FighterStatusBadge status={fighter.status} />
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span className="font-mono">{fighter.record_display ?? "—"}</span>
        {fighter.gym ? <span>· {fighter.gym}</span> : null}
        {fighter.city ? <span>· {fighter.city}</span> : null}
      </div>

      <a
        href={getTapologyHref(fighter)}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(event) => event.stopPropagation()}
        className="mt-2 inline-flex flex-col items-start gap-0.5 text-xs text-blue-400 hover:underline"
        title={`Search Tapology for ${getTapologySearchTerm(fighter)}`}
      >
        <span className="inline-flex items-center gap-1">
          Tapology
          <ExternalLink className="size-3" />
        </span>
        <span className="font-normal text-muted-foreground">
          Search: {getTapologySearchTerm(fighter)}
        </span>
      </a>
    </button>
  );
}

interface BoutCardProps {
  bout: Bout;
  onFighterSelect?: (fighter: Fighter, bout: Bout) => void;
}

export function BoutCard({ bout, onFighterSelect }: BoutCardProps) {
  return (
    <Card className="overflow-hidden transition-all hover:ring-1 hover:ring-amber-500/20">
      <CardHeader className="border-b border-border/50 pb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="font-mono">
                #{bout.bout_number}
              </Badge>
              <LevelBadge level={bout.level} />
              {bout.is_title_fight ? (
                <Badge className="border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/10">
                  Title
                </Badge>
              ) : null}
            </div>
            <CardTitle className="mt-2 text-lg">{bout.label}</CardTitle>
            <p className="text-sm text-muted-foreground">{bout.weight_class}</p>
          </div>

          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Win probability
            </p>
            <p className="font-mono text-sm">
              <span className="text-red-400">{bout.win_probability.red}%</span>
              <span className="mx-1 text-muted-foreground">/</span>
              <span className="text-blue-400">{bout.win_probability.blue}%</span>
            </p>
          </div>
        </div>
        {bout.notes ? (
          <p className="mt-2 text-xs text-muted-foreground">{bout.notes}</p>
        ) : null}
      </CardHeader>

      <CardContent className="grid gap-3 pt-4 sm:grid-cols-2">
        <FighterRow
          fighter={bout.red_corner}
          corner="red"
          onSelect={(fighter) => onFighterSelect?.(fighter, bout)}
        />
        <FighterRow
          fighter={bout.blue_corner}
          corner="blue"
          onSelect={(fighter) => onFighterSelect?.(fighter, bout)}
        />
      </CardContent>
    </Card>
  );
}
