import { Suspense } from "react";

import { DashboardBoutSection } from "@/components/dashboard/dashboard-bout-section";
import { EventHeader } from "@/components/dashboard/event-header";
import { StatsOverview } from "@/components/dashboard/stats-overview";
import { DashboardSkeleton } from "@/components/ui/loading-skeleton";
import { getFightCard } from "@/lib/data";

export default function DashboardPage() {
  const card = getFightCard();

  return (
    <div className="space-y-8">
      <Suspense fallback={<DashboardSkeleton />}>
        <EventHeader event={card.event} />
        <StatsOverview />
        <DashboardBoutSection />
      </Suspense>
    </div>
  );
}
