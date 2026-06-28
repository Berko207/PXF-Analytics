import { Suspense } from "react";

import { AnalyticsDashboard } from "@/components/charts/analytics-dashboard";
import { EventHeader } from "@/components/dashboard/event-header";
import { MarketsTeaser } from "@/components/layout/markets-teaser";
import { DashboardSkeleton } from "@/components/ui/loading-skeleton";
import { getFightCardAsync } from "@/lib/data";

export default async function AnalyticsPage() {
  const card = await getFightCardAsync();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="mt-1 text-muted-foreground">
          Model predictions, market implied prices, and edge vs Rain — practical odds for every
          bout on {card.event.name}.
        </p>
      </div>

      <MarketsTeaser />

      <EventHeader event={card.event} />

      <Suspense fallback={<DashboardSkeleton />}>
        <AnalyticsDashboard card={card} />
      </Suspense>
    </div>
  );
}
