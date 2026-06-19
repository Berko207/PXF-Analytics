import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface DashboardSkeletonProps {
  className?: string;
}

/** Loading placeholder for dashboard sections (future API integration). */
export function DashboardSkeleton({ className }: DashboardSkeletonProps) {
  return (
    <div className={cn("space-y-8 animate-pulse", className)}>
      <div className="h-40 rounded-2xl bg-muted/40" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <Card key={index}>
            <CardContent className="pt-4">
              <div className="h-4 w-20 rounded bg-muted/60" />
              <div className="mt-3 h-8 w-12 rounded bg-muted/60" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <div className="h-5 w-40 rounded bg-muted/60" />
        </CardHeader>
        <CardContent>
          <div className="h-64 rounded-xl bg-muted/30" />
        </CardContent>
      </Card>
    </div>
  );
}
