import { useCallback, useRef } from "react";
import { input } from "./input";
import { useGame } from "./store";

const RADIUS = 44;

export function TouchControls() {
  const isTouch = useGame((s) => s.isTouch);
  const phase = useGame((s) => s.phase);
  const wellRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const pointer = useRef<number | null>(null);

  const setKnob = (x: number, y: number) => {
    if (!knobRef.current) return;
    knobRef.current.style.transform = `translate(${x}px, ${y}px)`;
  };

  const onDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (pointer.current !== null) return;
    pointer.current = e.pointerId;
    wellRef.current?.setPointerCapture(e.pointerId);
    move(e);
  }, []);

  const move = (e: React.PointerEvent<HTMLDivElement> | PointerEvent) => {
    const well = wellRef.current;
    if (!well) return;
    const r = well.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    let dx = e.clientX - cx;
    let dy = e.clientY - cy;
    const mag = Math.hypot(dx, dy);
    if (mag > RADIUS) {
      dx = (dx / mag) * RADIUS;
      dy = (dy / mag) * RADIUS;
    }
    setKnob(dx, dy);
    input.touchMoveX = dx / RADIUS;
    input.touchMoveY = -dy / RADIUS;
  };

  const onMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (pointer.current !== e.pointerId) return;
    move(e);
  }, []);

  const onUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (pointer.current !== e.pointerId) return;
    pointer.current = null;
    input.touchMoveX = 0;
    input.touchMoveY = 0;
    setKnob(0, 0);
  }, []);

  if (!isTouch || phase !== "playing") return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      <div className="absolute bottom-[max(1.25rem,env(safe-area-inset-bottom))] left-[max(1.25rem,env(safe-area-inset-left))] pointer-events-auto">
        <div
          ref={wellRef}
          className="stick-well"
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
        >
          <div ref={knobRef} className="stick-knob" />
        </div>
      </div>
    </div>
  );
}
