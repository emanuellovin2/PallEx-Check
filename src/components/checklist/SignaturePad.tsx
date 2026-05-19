"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { RotateCcw, PenLine } from "lucide-react";

interface SignaturePadProps {
  onChange: (dataUrl: string | null) => void;
  value: string | null;
}

export function SignaturePad({ onChange, value }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [hasStrokes, setHasStrokes] = useState(!!value);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  // Restore saved signature on mount
  useEffect(() => {
    if (!value || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const img = new Image();
    img.onload = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      setHasStrokes(true);
    };
    img.src = value;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function getCtx() {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    return ctx;
  }

  function getPos(
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ): { x: number; y: number } | null {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e) {
      const touch = e.touches[0];
      if (!touch) return null;
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }

  function startDraw(
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) {
    e.preventDefault();
    const pos = getPos(e);
    if (!pos) return;
    const ctx = getCtx();
    if (!ctx) return;
    setDrawing(true);
    lastPos.current = pos;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 1.2, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
  }

  function draw(
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) {
    e.preventDefault();
    if (!drawing) return;
    const pos = getPos(e);
    if (!pos || !lastPos.current) return;
    const ctx = getCtx();
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPos.current = pos;
    setHasStrokes(true);
  }

  const endDraw = useCallback(() => {
    if (!drawing) return;
    setDrawing(false);
    lastPos.current = null;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    onChange(dataUrl);
  }, [drawing, onChange]);

  function clear() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasStrokes(false);
    onChange(null);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-400">
          <PenLine className="w-4 h-4" />
          <span className="text-xs font-semibold uppercase tracking-wider">Semnătură</span>
        </div>
        {hasStrokes && (
          <button
            type="button"
            onClick={clear}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-400
              hover:text-white hover:bg-surface-700 transition-colors border border-surface-700"
          >
            <RotateCcw className="w-3 h-3" />
            Șterge
          </button>
        )}
      </div>

      <div
        className={`relative rounded-xl overflow-hidden border-2 transition-colors ${
          hasStrokes
            ? "border-brand-500/60"
            : "border-dashed border-surface-600"
        }`}
      >
        <canvas
          ref={canvasRef}
          width={600}
          height={200}
          className="w-full touch-none bg-surface-800 block"
          style={{ cursor: "crosshair" }}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
        />
        {!hasStrokes && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 pointer-events-none">
            <PenLine className="w-8 h-8 text-slate-600" />
            <p className="text-sm text-slate-500">Semnează cu degetul sau mouse-ul</p>
          </div>
        )}
      </div>

      <p className="text-xs text-slate-500 text-center">
        Prin semnătură confirmi că ai verificat vehiculul și datele sunt corecte.
      </p>
    </div>
  );
}
