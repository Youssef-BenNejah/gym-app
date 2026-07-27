import { round0 } from "@/lib/nutrition";

export function CalorieRing({
  consumed,
  target,
  size = 200,
  stroke = 12,
}: {
  consumed: number;
  target: number;
  size?: number;
  stroke?: number;
}) {
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const pct = Math.min(1, target > 0 ? consumed / target : 0);
  const over = Math.max(0, target > 0 ? consumed / target - 1 : 0);
  const remaining = Math.max(0, target - consumed);
  const dash = circ * pct;
  const overDash = Math.min(circ, circ * over);
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-primary)"
          strokeWidth={stroke}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 800ms ease-out" }}
        />
        {over > 0 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--color-destructive)"
            strokeWidth={stroke}
            strokeDasharray={`${overDash} ${circ}`}
            strokeLinecap="round"
          />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <div className="text-3xl font-bold tabular-nums text-foreground">{round0(consumed)}</div>
        <div className="text-xs text-muted-foreground">
          of {round0(target)} kcal
        </div>
        <div className="mt-1 text-[11px] font-medium text-primary">
          {round0(remaining)} left
        </div>
      </div>
    </div>
  );
}
