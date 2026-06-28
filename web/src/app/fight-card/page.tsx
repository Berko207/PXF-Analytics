import { EventHeader } from "@/components/dashboard/event-header";
import { FightCardGrid } from "@/components/fight-card/fight-card-grid";
import { Badge } from "@/components/ui/badge";
import { getFightCardAsync } from "@/lib/data";

export default async function FightCardPage() {
  const card = await getFightCardAsync();

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">Fight Card</h1>
          <p className="mt-1 text-muted-foreground">
            Enriched matchups with Tapology links and status badges
          </p>
        </div>
        <Badge variant="outline">{card.bouts.length} bouts</Badge>
      </div>

      <EventHeader event={card.event} />
      <FightCardGrid card={card} />
    </div>
  );
}
