import type { Bout, Fighter } from "@/types/fight-card";

interface HeadToHeadComparisonProps {
  bout: Bout;
  selectedFighter?: Fighter;
}

function StatRow({
  label,
  left,
  right,
  highlight,
}: {
  label: string;
  left: string;
  right: string;
  highlight?: "left" | "right" | "none";
}) {
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-sm">
      <p
        className={`text-right font-medium ${
          highlight === "left" ? "text-red-400" : "text-foreground"
        }`}
      >
        {left}
      </p>
      <p className="text-center text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p
        className={`font-medium ${
          highlight === "right" ? "text-blue-400" : "text-foreground"
        }`}
      >
        {right}
      </p>
    </div>
  );
}

/** Side-by-side comparison using actual red and blue corners. */
export function HeadToHeadComparison({ bout, selectedFighter }: HeadToHeadComparisonProps) {
  const red = bout.red_corner;
  const blue = bout.blue_corner;
  const winsRed = red.record?.wins ?? 0;
  const winsBlue = blue.record?.wins ?? 0;
  const lossesRed = red.record?.losses ?? 0;
  const lossesBlue = blue.record?.losses ?? 0;

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
          Head to Head
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Bout #{bout.bout_number} · {bout.weight_class}
          {selectedFighter ? ` · Viewing ${selectedFighter.display_name}` : ""}
        </p>
      </div>

      <div className="rounded-xl border border-border/60 bg-card p-4">
        <div className="mb-4 grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-[10px] uppercase text-red-400">Red</p>
            <p
              className={`font-semibold ${
                selectedFighter?.display_name === red.display_name ? "text-red-400" : ""
              }`}
            >
              {red.display_name}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase text-blue-400">Blue</p>
            <p
              className={`font-semibold ${
                selectedFighter?.display_name === blue.display_name ? "text-blue-400" : ""
              }`}
            >
              {blue.display_name}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <StatRow
            label="Record"
            left={red.record_display ?? "—"}
            right={blue.record_display ?? "—"}
          />
          <StatRow
            label="Wins"
            left={String(winsRed)}
            right={String(winsBlue)}
            highlight={winsRed > winsBlue ? "left" : winsBlue > winsRed ? "right" : "none"}
          />
          <StatRow
            label="Losses"
            left={String(lossesRed)}
            right={String(lossesBlue)}
            highlight={lossesRed < lossesBlue ? "left" : lossesBlue < lossesRed ? "right" : "none"}
          />
          <StatRow
            label="Win %"
            left={`${bout.win_probability.red}%`}
            right={`${bout.win_probability.blue}%`}
            highlight={
              bout.win_probability.red > bout.win_probability.blue
                ? "left"
                : bout.win_probability.red < bout.win_probability.blue
                  ? "right"
                  : "none"
            }
          />
        </div>
      </div>
    </div>
  );
}
