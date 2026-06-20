import { Suspense } from "react";

import { AnalyticsDashboard } from "@/components/charts/analytics-dashboard";
import { EventHeader } from "@/components/dashboard/event-header";
import { DashboardSkeleton } from "@/components/ui/loading-skeleton";
import { getFightCard } from "@/lib/data";

export default function AnalyticsPage() {
  const card = getFightCard();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="mt-1 text-muted-foreground">
          Win probabilities and market-style visualizations for {card.event.name}
        </p>
      </div>

      <EventHeader event={card.event} />

      <Suspense fallback={<DashboardSkeleton />}>
        <AnalyticsDashboard />
      </Suspense>
    </div>
  );
}
