import { Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatTime, useGame, type Phase } from "./store";

type Props = {
  onStart: () => void;
  onResume: () => void;
  onRestart: () => void;
};

export function Overlays({ onStart, onResume, onRestart }: Props) {
  const phase = useGame((s) => s.phase);
  if (phase === "playing") return null;
  if (phase === "title") return <Title onStart={onStart} />;
  if (phase === "paused") return <Paused onResume={onResume} onRestart={onRestart} />;
  return <Victory onRestart={onRestart} />;
}

function Title({ onStart }: { onStart: () => void }) {
  return (
    <div className="overlay-scrim z-20">
      <div className="overlay-panel">
        <p className="overlay-kicker">First person</p>
        <h1 className="mt-3 font-display text-5xl font-medium tracking-[-0.04em] text-fg sm:text-6xl">
          LUMEN
        </h1>
        <p className="mt-3 max-w-[22ch] text-pretty text-base leading-snug text-muted">
          A low-poly labyrinth. Collect every shard. Walk the gate.
        </p>
        <ul className="mt-6 space-y-1.5 font-mono text-xs tracking-wide text-subtle">
          <li>WASD / stick — move</li>
          <li>Mouse / drag — look</li>
          <li>Shift — sprint</li>
        </ul>
        <Button className="mt-8 w-full" size="lg" onClick={onStart}>
          <Play className="size-4" strokeWidth={2} />
          Start
        </Button>
      </div>
    </div>
  );
}

function Paused({ onResume, onRestart }: { onResume: () => void; onRestart: () => void }) {
  return (
    <div className="overlay-scrim z-20">
      <div className="overlay-panel">
        <p className="overlay-kicker">Paused</p>
        <h2 className="mt-3 font-display text-3xl font-medium tracking-[-0.03em]">Hold still</h2>
        <p className="mt-2 text-sm text-muted">The corridors wait. Esc or P to resume.</p>
        <div className="mt-8 flex flex-col gap-2">
          <Button size="lg" onClick={onResume}>
            <Play className="size-4" strokeWidth={2} />
            Resume
          </Button>
          <Button variant="secondary" onClick={onRestart}>
            New maze
          </Button>
        </div>
      </div>
    </div>
  );
}

function Victory({ onRestart }: { onRestart: () => void }) {
  const lastTime = useGame((s) => s.lastTime);
  const bestTime = useGame((s) => s.bestTime);
  const newBest = useGame((s) => s.newBest);
  const collected = useGame((s) => s.collected);
  const total = useGame((s) => s.total);

  return (
    <div className="overlay-scrim z-20">
      <div className="overlay-panel">
        <p className="overlay-kicker">Gate reached</p>
        <h2 className="mt-3 font-display text-3xl font-medium tracking-[-0.03em] sm:text-4xl">
          You walked out
        </h2>
        <dl className="mt-8 grid grid-cols-2 gap-4">
          <Stat label="Time" value={formatTime(lastTime, true)} accent={newBest} />
          <Stat label="Shards" value={`${collected} / ${total}`} />
          <Stat label="Best" value={bestTime !== null ? formatTime(bestTime, true) : "—"} />
          <Stat label="Record" value={newBest ? "New best" : "Kept"} />
        </dl>
        <Button className="mt-8 w-full" size="lg" onClick={onRestart}>
          Again
        </Button>
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-border bg-surface-2 px-3 py-3">
      <dt className="font-mono text-[0.625rem] uppercase tracking-[0.18em] text-subtle">{label}</dt>
      <dd
        className={`mt-1 font-mono text-lg tabular-nums ${accent ? "text-accent" : "text-fg"}`}
      >
        {value}
      </dd>
    </div>
  );
}

export function PauseButton({
  phase,
  onPause,
}: {
  phase: Phase;
  onPause: () => void;
}) {
  if (phase !== "playing") return null;
  return (
    <Button
      variant="secondary"
      size="icon"
      className="pointer-events-auto"
      aria-label="Pause"
      onClick={onPause}
    >
      <Pause className="size-4" strokeWidth={2} />
    </Button>
  );
}
