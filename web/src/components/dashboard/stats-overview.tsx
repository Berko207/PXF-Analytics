import { StatCard } from "@/components/dashboard/stat-card";
import { getEventStats } from "@/lib/stats";
import { Award, Shield, Sparkles, Swords, Users } from "lucide-react";

export function StatsOverview() {
  const stats = getEventStats();

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <StatCard label="Total Bouts" value={stats.totalBouts} icon={Swords} accent="amber" />
      <StatCard
        label="Pro Bouts"
        value={stats.proBouts}
        hint={`${stats.amateurBouts} amateur`}
        icon={Shield}
        accent="blue"
      />
      <StatCard label="Title Fights" value={stats.titleFights} icon={Award} />
      <StatCard label="Debuts" value={stats.debuts} icon={Sparkles} accent="emerald" />
      <StatCard
        label="Matched Fighters"
        value={stats.matchedFighters}
        hint={
          stats.unmatchedNames.length
            ? `${stats.unmatchedNames.length} unmatched`
            : "All corners resolved"
        }
        icon={Users}
      />
    </section>
  );
}
