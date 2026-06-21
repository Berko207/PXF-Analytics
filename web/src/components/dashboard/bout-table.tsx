"use client";

import { FighterStatusBadge } from "@/components/fight-card/fighter-status-badge";
import { LevelBadge } from "@/components/fight-card/level-badge";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getFighterDisplayName, getTapologyHref } from "@/lib/format";
import type { Bout, Fighter } from "@/types/fight-card";
import { ExternalLink } from "lucide-react";

interface BoutTableProps {
  bouts: Bout[];
  onFighterSelect?: (fighter: Fighter, bout: Bout) => void;
}

function FighterCell({
  fighter,
  bout,
  onSelect,
}: {
  fighter: Fighter;
  bout: Bout;
  onSelect?: (fighter: Fighter, bout: Bout) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect?.(fighter, bout)}
      className="group w-full text-left"
    >
      <p className="font-medium group-hover:text-primary">{getFighterDisplayName(fighter)}</p>
      {fighter.original_name !== getFighterDisplayName(fighter) ? (
        <p className="text-xs text-muted-foreground">Card: {fighter.original_name}</p>
      ) : null}
      <div className="mt-1 flex flex-wrap items-center gap-1.5">
        <FighterStatusBadge status={fighter.status} />
        <span className="font-mono text-xs text-muted-foreground">
          {fighter.record_display ?? "—"}
        </span>
      </div>
    </button>
  );
}

export function BoutTable({ bouts, onFighterSelect }: BoutTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-border/60">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-12">#</TableHead>
            <TableHead>Bout</TableHead>
            <TableHead>Red</TableHead>
            <TableHead>Blue</TableHead>
            <TableHead>Level</TableHead>
            <TableHead className="text-right">Prob.</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {bouts.map((bout) => (
            <TableRow key={bout.bout_number} className="group">
              <TableCell className="font-mono text-muted-foreground">
                {bout.bout_number}
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{bout.label}</span>
                  {bout.is_title_fight ? (
                    <Badge variant="outline" className="border-amber-500/30 text-amber-400">
                      Title
                    </Badge>
                  ) : null}
                </div>
                <p className="text-xs text-muted-foreground">{bout.weight_class}</p>
              </TableCell>
              <TableCell>
                <FighterCell fighter={bout.red_corner} bout={bout} onSelect={onFighterSelect} />
              </TableCell>
              <TableCell>
                <FighterCell fighter={bout.blue_corner} bout={bout} onSelect={onFighterSelect} />
              </TableCell>
              <TableCell>
                <LevelBadge level={bout.level} />
              </TableCell>
              <TableCell className="text-right font-mono text-xs">
                <span className="text-red-400">{bout.win_probability.red}</span>
                <span className="text-muted-foreground"> / </span>
                <span className="text-blue-400">{bout.win_probability.blue}</span>
              </TableCell>
              <TableCell>
                <a
                  href={getTapologyHref(bout.red_corner)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex text-muted-foreground hover:text-blue-400"
                  aria-label="Open Tapology"
                >
                  <ExternalLink className="size-4" />
                </a>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
