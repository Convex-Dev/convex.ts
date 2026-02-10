import React from 'react';
import { generateIdenticonGrid, hexToBytes } from '@convex-world/convex-ts';

interface IdenticonProps {
  data: Uint8Array | string;
  size?: number; // grid size, default 7
  renderSize?: number; // pixel size of the canvas/image, default 56 (7*8)
  pixelSize?: number; // size of each cell in pixels, overrides renderSize if provided
  className?: string;
  style?: React.CSSProperties;
}

export default function Identicon({ data, size = 7, renderSize, pixelSize, className, style }: IdenticonProps) {
  const bytes = typeof data === 'string' ? hexToBytes(data) : data;
  const grid = generateIdenticonGrid(bytes, size);
  const cell = pixelSize ?? Math.floor((renderSize ?? size * 8) / size);
  const canvasSize = cell * size;

  return (
    <canvas
      width={canvasSize}
      height={canvasSize}
      className={className}
      style={{ borderRadius: 4, ...style }}
      ref={(canvas) => {
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        for (let y = 0; y < size; y++) {
          for (let x = 0; x < size; x++) {
            const rgb = grid[y * size + x] | 0;
            const r = (rgb >> 16) & 0xff;
            const g = (rgb >> 8) & 0xff;
            const b = rgb & 0xff;
            ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
            ctx.fillRect(x * cell, y * cell, cell, cell);
          }
        }
      }}
    />
  );
}


