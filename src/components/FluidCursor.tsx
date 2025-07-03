'use client';
import { useEffect, useRef } from 'react';

import fluidCursor from '@/hooks/use-FluidCursor';

const FluidCursor = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      fluidCursor(canvasRef.current);
    }
  }, []);

  return (
    <div className="fixed top-0 left-0 z-0">
      <canvas ref={canvasRef} id="fluid" className="h-screen w-screen" />
    </div>
  );
};

export default FluidCursor;