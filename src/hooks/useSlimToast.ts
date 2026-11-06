import { useCallback, useEffect, useRef, useState } from 'react';

export function useSlimToast(durationMs = 2800) {
  const [message, setMessage] = useState('');
  const timeoutRef = useRef<number | null>(null);

  const dismiss = useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setMessage('');
  }, []);

  const show = useCallback((nextMessage: string) => {
    if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    setMessage(nextMessage);
    timeoutRef.current = window.setTimeout(() => {
      timeoutRef.current = null;
      setMessage('');
    }, durationMs);
  }, [durationMs]);

  useEffect(() => () => {
    if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
  }, []);

  return { message, show, dismiss };
}
