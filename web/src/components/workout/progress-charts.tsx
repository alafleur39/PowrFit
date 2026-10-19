"use client";

import type { WeightUnit } from "@/lib/strength";
import { formatDate, formatWeight } from "@/lib/workout/format";
import type { TrendPoint, VolumeBucket } from "@/lib/workout/progress";

// Hand-built SVG charts for Progress (P4-06, D16, D25). Each chart is one
// image with a short description, plus a table that only screen readers
// see (web design spec: charts have a text summary).

const WIDTH = 320;
const HEIGHT = 180;

const compact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });

export function VolumeChart({
  buckets,
  unit,
  caption,
}: {
  buckets: VolumeBucket[];
  unit: WeightUnit;
  /** What the bars are, for screen readers: "Volume per day this week". */
  caption: string;
}) {
  const top = 16;
  const bottom = 150;
  const max = Math.max(...buckets.map((bucket) => bucket.volume), 0);
  const slot = WIDTH / buckets.length;
  const barWidth = Math.min(28, slot * 0.6);
  const best = buckets.reduce((a, b) => (b.volume > a.volume ? b : a), buckets[0]);

  return (
    <figure className="mx-auto w-full max-w-lg">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={
          max === 0
            ? `${caption}: no volume yet.`
            : `${caption}. Highest: ${best.longLabel}, ${formatWeight(best.volume, unit)}.`
        }
        className="h-auto w-full"
      >
        <line x1={0} x2={WIDTH} y1={bottom} y2={bottom} className="stroke-border" strokeWidth={1} />
        {max > 0 && (
          <>
            <line
              x1={0}
              x2={WIDTH}
              y1={top}
              y2={top}
              className="stroke-border"
              strokeWidth={1}
              strokeDasharray="3 3"
            />
            <text x={0} y={top - 4} className="fill-muted-foreground text-[10px]">
              {compact.format(max)} {unit}
            </text>
          </>
        )}
        {buckets.map((bucket, i) => {
          const height = max === 0 ? 0 : ((bottom - top) * bucket.volume) / max;
          const x = slot * i + (slot - barWidth) / 2;
          return (
            <g key={bucket.start.toISOString()}>
              {height > 0 && (
                <rect
                  x={x}
                  y={bottom - height}
                  width={barWidth}
                  height={height}
                  rx={3}
                  className="fill-accent"
                />
              )}
              <text
                x={slot * i + slot / 2}
                y={bottom + 16}
                textAnchor="middle"
                className="fill-muted-foreground text-[10px]"
              >
                {bucket.label}
              </text>
            </g>
          );
        })}
      </svg>
      <table className="sr-only">
        <caption>{caption}</caption>
        <thead>
          <tr>
            <th scope="col">Period</th>
            <th scope="col">Workouts</th>
            <th scope="col">Volume</th>
          </tr>
        </thead>
        <tbody>
          {buckets.map((bucket) => (
            <tr key={bucket.start.toISOString()}>
              <th scope="row">{bucket.longLabel}</th>
              <td>{bucket.workouts}</td>
              <td>{formatWeight(bucket.volume, unit)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

export function TrendChart({
  points,
  unit,
  exerciseName,
}: {
  points: TrendPoint[];
  unit: WeightUnit;
  exerciseName: string;
}) {
  const left = 44;
  const right = WIDTH - 8;
  const top = 12;
  const bottom = 150;
  const weights = points.map((point) => point.weight);
  let low = Math.min(...weights);
  let high = Math.max(...weights);
  if (low === high) {
    low = Math.max(0, low - Math.max(1, low * 0.1));
    high = high + Math.max(1, high * 0.1);
  }
  const times = points.map((point) => Date.parse(point.endedAt));
  const first = times[0];
  const span = times[times.length - 1] - first;

  const xy = points.map((point, i) => ({
    x: span === 0 ? (left + right) / 2 : left + ((right - left) * (times[i] - first)) / span,
    y: bottom - ((bottom - top) * (point.weight - low)) / (high - low),
  }));
  const latest = points[points.length - 1];
  const change = latest.weight - points[0].weight;

  return (
    <figure className="mx-auto w-full max-w-lg">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={`Top set weight for ${exerciseName} over ${points.length} ${
          points.length === 1 ? "workout" : "workouts"
        }. Latest ${formatWeight(latest.weight, unit)}${
          points.length > 1
            ? `, ${change >= 0 ? "up" : "down"} ${formatWeight(Math.abs(change), unit)} from the first`
            : ""
        }.`}
        className="h-auto w-full"
      >
        <line x1={left} x2={right} y1={top} y2={top} className="stroke-border" strokeWidth={1} strokeDasharray="3 3" />
        <line x1={left} x2={right} y1={bottom} y2={bottom} className="stroke-border" strokeWidth={1} />
        <text x={left - 6} y={top + 4} textAnchor="end" className="fill-muted-foreground text-[10px]">
          {compact.format(high)}
        </text>
        <text x={left - 6} y={bottom + 4} textAnchor="end" className="fill-muted-foreground text-[10px]">
          {compact.format(low)}
        </text>
        <text x={left} y={bottom + 18} className="fill-muted-foreground text-[10px]">
          {formatDate(points[0].endedAt)}
        </text>
        {formatDate(latest.endedAt) !== formatDate(points[0].endedAt) && (
          <text x={right} y={bottom + 18} textAnchor="end" className="fill-muted-foreground text-[10px]">
            {formatDate(latest.endedAt)}
          </text>
        )}
        {xy.length > 1 && (
          <polyline
            points={xy.map(({ x, y }) => `${x},${y}`).join(" ")}
            fill="none"
            className="stroke-accent"
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}
        {xy.map(({ x, y }, i) => (
          <circle key={points[i].logId} cx={x} cy={y} r={3} className="fill-accent" />
        ))}
      </svg>
      <table className="sr-only">
        <caption>Top set weight for {exerciseName}</caption>
        <thead>
          <tr>
            <th scope="col">Workout</th>
            <th scope="col">Top set</th>
          </tr>
        </thead>
        <tbody>
          {points.map((point) => (
            <tr key={point.logId}>
              <th scope="row">{formatDate(point.endedAt)}</th>
              <td>{formatWeight(point.weight, unit)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
