"use client";

import qrcode from "qrcode-generator";
import { useMemo } from "react";

/** A QR code drawn as plain shapes, so there is no image to load and nothing to inject. */
export function QrCode({ text, label }: { text: string; label: string }) {
  const grid = useMemo(() => {
    const code = qrcode(0, "M");
    code.addData(text);
    code.make();
    const size = code.getModuleCount();
    const cells: { x: number; y: number }[] = [];
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        if (code.isDark(y, x)) cells.push({ x, y });
      }
    }
    return { size, cells };
  }, [text]);

  const quiet = 3; // the blank border QR readers need
  const total = grid.size + quiet * 2;
  return (
    <svg
      viewBox={`0 0 ${total} ${total}`}
      role="img"
      aria-label={label}
      className="h-auto w-full rounded-2xl bg-white"
      shapeRendering="crispEdges"
    >
      <rect width={total} height={total} fill="#fff" />
      {grid.cells.map((cell) => (
        <rect key={`${cell.x}-${cell.y}`} x={cell.x + quiet} y={cell.y + quiet} width="1" height="1" fill="#111" />
      ))}
    </svg>
  );
}
