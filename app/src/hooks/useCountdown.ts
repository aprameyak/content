import { useState, useEffect } from 'react';
import { formatCountdown } from '@/utils/date';

interface CountdownResult {
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
  formatted: string;
}

export function useCountdown(targetDateStr?: string): CountdownResult {
  const [result, setResult] = useState<CountdownResult>({
    hours: 0, minutes: 0, seconds: 0, isExpired: true, formatted: '--:--:--',
  });

  useEffect(() => {
    if (!targetDateStr) return;

    function update() {
      const c = formatCountdown(targetDateStr!);
      setResult({
        ...c,
        formatted: `${String(c.hours).padStart(2, '0')}:${String(c.minutes).padStart(2, '0')}:${String(c.seconds).padStart(2, '0')}`,
      });
    }

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [targetDateStr]);

  return result;
}
