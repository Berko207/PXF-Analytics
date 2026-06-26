import { Suspense } from "react";

import { DashboardBoutSection } from "@/components/dashboard/dashboard-bout-section";
import { EventHeader } from "@/components/dashboard/event-header";
import { StatsOverview } from "@/components/dashboard/stats-overview";
import { MarketsTeaser } from "@/components/layout/markets-teaser";
import { DashboardSkeleton } from "@/components/ui/loading-skeleton";
import { getFightCardAsync } from "@/lib/data";

export default async function DashboardPage() {
  const card = await getFightCardAsync();

  return (
    <div className="space-y-8">
      <Suspense fallback={<DashboardSkeleton />}>
        <EventHeader event={card.event} />
        <StatsOverview />
        <MarketsTeaser />
        <DashboardBoutSection />
      </Suspense>
    </div>
  );
}
