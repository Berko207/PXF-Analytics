"use client";

import { FighterStatusBadge } from "@/components/fight-card/fighter-status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { getFighterDisplayName, getTapologyHref, getTapologySearchTerm } from "@/lib/format";
import type { Bout, Fighter } from "@/types/fight-card";
import { Copy, ExternalLink, MapPin, Trophy } from "lucide-react";
import { HeadToHeadComparison } from "./head-to-head";

interface FighterDetailSheetProps {
  fighter: Fighter | null;
  bout: Bout | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FighterDetailSheet({
  fighter,
  bout,
  open,
  onOpenChange,
}: FighterDetailSheetProps) {
  const displayName = fighter ? getFighterDisplayName(fighter) : "";
  const tapologySearchTerm = fighter ? getTapologySearchTerm(fighter) : "";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        {fighter ? (
          <>
            <SheetHeader>
              <SheetTitle className="text-2xl">{displayName}</SheetTitle>
              <SheetDescription>
                {fighter.original_name !== displayName ? `Card name: ${fighter.original_name} · ` : ""}
                {fighter.weight_class ?? "Weight class TBD"}
                {fighter.gym ? ` · ${fighter.gym}` : ""}
              </SheetDescription>
            </SheetHeader>

            <div className="mt-6 space-y-6">
              <div className="flex flex-wrap gap-2">
                <FighterStatusBadge status={fighter.status} />
                {fighter.is_debut ? <Badge variant="outline">First appearance</Badge> : null}
                {fighter.is_matched ? (
                  <Badge variant="outline" className="border-emerald-500/30 text-emerald-400">
                    {fighter.match_score}% match
                  </Badge>
                ) : null}
              </div>

              <div className="grid grid-cols-2 gap-3 rounded-xl border border-border/60 bg-muted/20 p-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Record</p>
                  <p className="mt-1 font-mono text-xl font-semibold">
                    {fighter.record_display ?? "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Card name</p>
                  <p className="mt-1 text-sm">{fighter.original_name}</p>
                </div>
                {fighter.full_name ? (
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Full name</p>
                    <p className="mt-1 text-sm font-medium">{fighter.full_name}</p>
                  </div>
                ) : null}
                {fighter.canonical_name ? (
                  <div className="col-span-2">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Canonical
                    </p>
                    <p className="mt-1 text-sm">{fighter.canonical_name}</p>
                  </div>
                ) : null}
              </div>

              <div className="space-y-2 text-sm">
                {fighter.city ? (
                  <p className="inline-flex items-center gap-2 text-muted-foreground">
                    <MapPin className="size-4" />
                    {fighter.city}, {fighter.country}
                  </p>
                ) : null}
                {fighter.gym ? (
                  <p className="inline-flex items-center gap-2 text-muted-foreground">
                    <Trophy className="size-4" />
                    {fighter.gym}
                  </p>
                ) : null}
              </div>

              <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Tapology search
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <p className="flex-1 text-sm font-medium">{tapologySearchTerm}</p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Copy Tapology search term"
                    onClick={() => navigator.clipboard.writeText(tapologySearchTerm)}
                  >
                    <Copy className="size-4" />
                  </Button>
                </div>
              </div>

              <Button asChild className="w-full" variant="outline">
                <a href={getTapologyHref(fighter)} target="_blank" rel="noopener noreferrer">
                  View on Tapology
                  <ExternalLink className="size-4" />
                </a>
              </Button>

              {bout ? (
                <>
                  <Separator />
                  <HeadToHeadComparison bout={bout} selectedFighter={fighter} />
                </>
              ) : null}
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
