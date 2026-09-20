import type { RefObject } from "react";
import { Gem, Timer } from "lucide-react";
import { formatTime, useGame } from "./store";
import { PauseButton } from "./Overlays";

type Props = {
  minimapRef: RefObject<HTMLCanvasElement | null>;
  onPause: () => void;
};

export function Hud({ minimapRef, onPause }: Props) {
  const phase = useGame((s) => s.phase);
  const time = useGame((s) => s.time);
  const collected = useGame((s) => s.collected);
  const total = useGame((s) => s.total);
  const hint = useGame((s) => s.hint);
  const isTouch = useGame((s) => s.isTouch);
  const locked = useGame((s) => s.locked);
  const playing = phase === "playing";

  return (
    <div className="pointer-events-none absolute inset-0 z-10 p-4 pt-[max(1rem,env(safe-area-inset-top))] pr-[max(1rem,env(safe-area-inset-right))] pb-[max(1rem,env(safe-area-inset-bottom))] pl-[max(1rem,env(safe-area-inset-left))]">
      <div className="flex items-start justify-between gap-3">
        <div className={`flex flex-wrap gap-2 ${playing ? "" : "invisible"}`}>
          <div className="hud-chip">
            <Timer className="size-3.5 text-accent" strokeWidth={2} />
            {formatTime(time)}
          </div>
          <div className="hud-chip">
            <Gem className="size-3.5 text-accent" strokeWidth={2} />
            {collected}/{total}
          </div>
        </div>
        <PauseButton phase={phase} onPause={onPause} />
      </div>

      {playing && hint ? (
        <p className="pointer-events-none absolute left-1/2 top-20 w-[min(20rem,calc(100%-2rem))] -translate-x-1/2 text-center font-display text-sm text-accent">
          {hint}
        </p>
      ) : null}

      {playing && !isTouch && !locked ? (
        <p className="pointer-events-none absolute left-1/2 top-[58%] -translate-x-1/2 font-mono text-[0.6875rem] tracking-wide text-muted">
          Click to look
        </p>
      ) : null}

      {playing ? <div className="crosshair" /> : null}

      <div
        className={`absolute right-4 ${playing ? "" : "invisible"} ${isTouch ? "bottom-36" : "bottom-4"}`}
      >
        <div className="minimap-frame">
          <canvas ref={minimapRef} width={148} height={148} aria-label="Minimap" />
        </div>
      </div>
    </div>
  );
}
