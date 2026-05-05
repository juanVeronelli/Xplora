import { useEffect, useRef, useState } from 'react';

interface Props {
  target: number;
  duration?: number;
  triggered: boolean;
}

export default function Counter({ target, duration = 1400, triggered }: Props) {
  const [value, setValue] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (!triggered || started.current) return;
    started.current = true;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(ease * target));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [triggered, target, duration]);

  return <>{value.toLocaleString('es-AR')}</>;
}
