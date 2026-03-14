import { useCallback, useEffect, useRef, useState } from 'react';

export interface UseResilientImageLoaderOptions {
  urls: string[];
  retryDelays?: number[]; // ms, e.g. [1000, 2000, 5000, 10000]
  onLoad?: () => void;
  onError?: (err: Error) => void;
}

export function useResilientImageLoader({
  urls,
  retryDelays = [1000, 2000, 5000, 10000, 30000],
  onLoad,
  onError,
}: UseResilientImageLoaderOptions) {
  const [currentUrlIndex, setCurrentUrlIndex] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // Reset on new URLs
  useEffect(() => {
    setCurrentUrlIndex(0);
    setRetryCount(0);
    setLoading(true);
    setError(null);
  }, [urls.join('|')]);

  const handleError = useCallback(
    (err: Error) => {
      setError(err);
      setLoading(true); // keep spinner
      if (onError) onError(err);
      // Next URL (gateway), or loop back
      setCurrentUrlIndex((idx) => (idx + 1) % urls.length);
      setRetryCount((count) => count + 1);
      // Schedule next retry
      const delay = retryDelays[Math.min(retryCount, retryDelays.length - 1)];
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        if (isMounted.current) setLoading(true);
      }, delay);
    },
    [urls.length, retryDelays, retryCount, onError]
  );

  const handleLoad = useCallback(() => {
    setLoading(false);
    setError(null);
    if (onLoad) onLoad();
  }, [onLoad]);

  // Manual retry (e.g. on spinner click)
  const manualRetry = useCallback(() => {
    setRetryCount((count) => count + 1);
    setLoading(true);
    setError(null);
  }, []);

  return {
    src: urls[currentUrlIndex],
    loading,
    error,
    onLoad: handleLoad,
    onError: (e: any) => handleError(new Error(e?.message || 'Image failed')),
    manualRetry,
    retryCount,
  };
}
