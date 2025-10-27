import { useEffect, useRef, useState } from 'react';

interface JoystickProps {
  onMove: (x: number, y: number) => void;
}

export default function Joystick({ onMove }: JoystickProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const touchIdRef = useRef<number | null>(null);

  const maxDistance = 50;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      touchIdRef.current = touch.identifier;
      setActive(true);
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (!active && touchIdRef.current === null) return;

      const touch = Array.from(e.touches).find(
        (t) => t.identifier === touchIdRef.current
      );
      if (!touch) return;

      const rect = container.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      let deltaX = touch.clientX - centerX;
      let deltaY = touch.clientY - centerY;

      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      if (distance > maxDistance) {
        deltaX = (deltaX / distance) * maxDistance;
        deltaY = (deltaY / distance) * maxDistance;
      }

      setPosition({ x: deltaX, y: deltaY });

      const normalizedX = deltaX / maxDistance;
      const normalizedY = deltaY / maxDistance;
      onMove(normalizedX, normalizedY);
    };

    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      const touchEnded = Array.from(e.changedTouches).some(
        (t) => t.identifier === touchIdRef.current
      );
      
      if (touchEnded) {
        setActive(false);
        setPosition({ x: 0, y: 0 });
        onMove(0, 0);
        touchIdRef.current = null;
      }
    };

    container.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [active, onMove]);

  return (
    <div
      ref={containerRef}
      className="fixed bottom-24 left-8 w-32 h-32 rounded-full bg-muted/30 border-4 border-primary/50 flex items-center justify-center touch-none"
      style={{
        boxShadow: active ? '0 0 20px rgba(74, 124, 89, 0.6)' : 'none',
      }}
    >
      <div
        className="w-16 h-16 rounded-full bg-primary/80 border-2 border-accent transition-transform"
        style={{
          transform: `translate(${position.x}px, ${position.y}px)`,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
        }}
      >
        <div className="w-full h-full rounded-full bg-gradient-to-br from-primary to-accent opacity-60" />
      </div>
    </div>
  );
}
