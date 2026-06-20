"use client";

import { useState } from "react";

import { BoutTable } from "@/components/dashboard/bout-table";
import { FighterDetailSheet } from "@/components/fighters/fighter-detail-sheet";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getFightCard } from "@/lib/data";
import type { Bout, Fighter } from "@/types/fight-card";

export function DashboardBoutSection() {
  const card = getFightCard();
  const [selectedFighter, setSelectedFighter] = useState<Fighter | null>(null);
  const [selectedBout, setSelectedBout] = useState<Bout | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const handleFighterSelect = (fighter: Fighter, bout: Bout) => {
    setSelectedFighter(fighter);
    setSelectedBout(bout);
    setSheetOpen(true);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Fight Card Overview</CardTitle>
          <CardDescription>
            Click a fighter for details and head-to-head comparison
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BoutTable bouts={card.bouts} onFighterSelect={handleFighterSelect} />
        </CardContent>
      </Card>

      <FighterDetailSheet
        fighter={selectedFighter}
        bout={selectedBout}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </>
  );
}
