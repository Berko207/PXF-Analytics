import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatEventDate } from "@/lib/format";
import type { EventInfo } from "@/types/fight-card";
import { CalendarDays, ExternalLink, MapPin, Radio } from "lucide-react";
import Link from "next/link";

interface EventHeaderProps {
  event: EventInfo;
}

export function EventHeader({ event }: EventHeaderProps) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-card via-card to-amber-500/5 p-6 sm:p-8">
      <div className="absolute -right-16 -top-16 size-48 rounded-full bg-amber-500/10 blur-3xl" />
      <div className="absolute -bottom-20 -left-10 size-40 rounded-full bg-blue-500/10 blur-3xl" />

      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/10">
              {event.promotion}
            </Badge>
            <Badge variant="outline">Official Fight Card</Badge>
          </div>

          <div>
            <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
              {event.name}
            </h1>
            <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="size-4 text-amber-400" />
                {formatEventDate(event.date)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-4 text-blue-400" />
                {event.location}
              </span>
              {event.venue ? (
                <span className="text-muted-foreground/80">{event.venue}</span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {event.stream_url ? (
            <Button asChild variant="outline" className="border-amber-500/30 hover:bg-amber-500/10">
              <a href={event.stream_url} target="_blank" rel="noopener noreferrer">
                <Radio className="size-4 text-amber-400" />
                Watch Stream
                <ExternalLink className="size-3.5 opacity-60" />
              </a>
            </Button>
          ) : null}
          <Button asChild variant="outline">
            <Link href="/analytics">View Analytics</Link>
          </Button>
          <Button asChild>
            <Link href="/fight-card">View Full Card</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
