import { useEffect, useRef } from "react";
import { createGame, type GameApi } from "./engine";
import { Hud } from "./Hud";
import { Overlays } from "./Overlays";
import { TouchControls } from "./TouchControls";
import { unlockAudio } from "./audio";
import { useGame } from "./store";

export default function GameApp() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const minimapRef = useRef<HTMLCanvasElement>(null);
  const apiRef = useRef<GameApi | null>(null);

  useEffect(() => {
    const touch =
      "ontouchstart" in window ||
      (navigator.maxTouchPoints ?? 0) > 0 ||
      window.matchMedia("(pointer: coarse)").matches;
    useGame.getState().setTouch(touch);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const minimap = minimapRef.current;
    if (!canvas || !minimap) return;
    const api = createGame(canvas, minimap);
    apiRef.current = api;
    return () => {
      api.dispose();
      apiRef.current = null;
    };
  }, []);

  const start = () => {
    unlockAudio();
    apiRef.current?.start();
  };
  const resume = () => apiRef.current?.resume();
  const restart = () => apiRef.current?.restart();
  const pause = () => apiRef.current?.pause();

  return (
    <main ref={wrapRef} className="game-root relative">
      <canvas ref={canvasRef} className="game-canvas" tabIndex={0} aria-label="Lumen maze" />
      <Hud minimapRef={minimapRef} onPause={pause} />
      <TouchControls />
      <Overlays onStart={start} onResume={resume} onRestart={restart} />
    </main>
  );
}
