import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState } from "react";

const GameApp = lazy(() => import("@/game/GameApp"));

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  if (!ready) return <Boot />;
  return (
    <Suspense fallback={<Boot />}>
      <GameApp />
    </Suspense>
  );
}

function Boot() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-bg px-6 text-fg">
      <p className="font-mono text-xs tracking-[0.28em] text-accent uppercase">First person</p>
      <h1 className="mt-3 font-display text-5xl font-medium tracking-[-0.04em]">LUMEN</h1>
      <p className="mt-3 text-sm text-muted">A low-poly labyrinth</p>
    </main>
  );
}
