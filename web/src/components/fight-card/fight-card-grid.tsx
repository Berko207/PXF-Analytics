"use client";

import { useState } from "react";

import { BoutCard } from "@/components/fight-card/bout-card";
import { FighterDetailSheet } from "@/components/fighters/fighter-detail-sheet";
import { getFightCard } from "@/lib/data";
import type { Bout, Fighter } from "@/types/fight-card";

export function FightCardGrid() {
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
      <div className="grid gap-6 lg:grid-cols-2">
        {card.bouts.map((bout) => (
          <BoutCard key={bout.bout_number} bout={bout} onFighterSelect={handleFighterSelect} />
        ))}
      </div>

      <FighterDetailSheet
        fighter={selectedFighter}
        bout={selectedBout}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </>
  );
}
