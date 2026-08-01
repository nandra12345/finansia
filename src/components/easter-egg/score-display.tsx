"use client";

interface ScoreDisplayProps {
  score: number;
  status: "idle" | "running" | "paused" | "over";
}

export function ScoreDisplay({ score, status }: ScoreDisplayProps) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-neutral-800 bg-neutral-950/90 px-4 py-3 text-sm text-neutral-300 shadow-sm shadow-black/20">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-emerald-300">Status</p>
        <p className="text-sm font-medium text-white">{status === "running" ? "Live" : status === "paused" ? "Paused" : status === "over" ? "Completed" : "Ready"}</p>
      </div>
      <div className="text-right">
        <p className="text-xs uppercase tracking-[0.24em] text-neutral-500">Score</p>
        <p className="text-lg font-semibold text-emerald-400">{score}</p>
      </div>
    </div>
  );
}
