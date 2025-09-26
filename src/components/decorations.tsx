
'use client';

import React from 'react';
import { Circle, Square } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ShapeProps {
  as?: React.ElementType;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

const Shape = ({ as: Component = 'div', className, style, children }: ShapeProps) => (
  <div
    className={cn(
      'fixed z-0 text-primary/10 transition-transform duration-100 ease-out',
      className
    )}
    style={style}
  >
    {children}
  </div>
);

export function Decorations({ scrollY }: { scrollY: number }) {
  return (
    <div aria-hidden="true">
      <Shape
        style={{
          transform: `translateY(${scrollY * 0.2}px) rotate(${scrollY * 0.01}deg)`,
          top: '10%',
          left: '5%',
        }}
      >
        <Circle className="w-48 h-48" strokeWidth={1} />
      </Shape>

      <Shape
        style={{
          transform: `translateY(${scrollY * -0.15}px) rotate(${12 + scrollY * 0.01}deg)`,
          top: '20%',
          right: '10%',
        }}
      >
        <Square className="w-32 h-32" strokeWidth={1} />
      </Shape>

      <Shape
        style={{
          transform: `translateY(${scrollY * 0.1}px) rotate(${scrollY * -0.02}deg)`,
          bottom: '15%',
          left: '15%',
        }}
      >
        <Circle className="w-24 h-24" strokeWidth={1} />
      </Shape>

      <Shape
        style={{
          transform: `translateY(${scrollY * -0.05}px) rotate(${-12 + scrollY * -0.02}deg)`,
          bottom: '10%',
          right: '20%',
        }}
      >
        <Square className="w-40 h-40" strokeWidth={1} />
      </Shape>
    </div>
  );
}
