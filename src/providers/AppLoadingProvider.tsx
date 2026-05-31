import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import AppLoadingOverlay from '../components/AppLoadingOverlay';

type OverlayPhase = 'idle' | 'holding' | 'exiting';

interface AppLoadingContextValue {
  setTaskLoading: (taskId: string, isLoading: boolean) => void;
}

const AppLoadingContext = createContext<AppLoadingContextValue | null>(null);

export function AppLoadingProvider({ children }: { children: ReactNode }) {
  const tasksRef = useRef(new Set<string>());
  const [activeTaskCount, setActiveTaskCount] = useState(0);
  const [phase, setPhase] = useState<OverlayPhase>('idle');

  const syncTaskCount = useCallback(() => {
    setActiveTaskCount(tasksRef.current.size);
  }, []);

  const setTaskLoading = useCallback(
    (taskId: string, isLoading: boolean) => {
      const tasks = tasksRef.current;
      const hadTask = tasks.has(taskId);

      if (isLoading) {
        if (!hadTask) {
          tasks.add(taskId);
          syncTaskCount();
        }
        return;
      }

      if (hadTask) {
        tasks.delete(taskId);
        syncTaskCount();
      }
    },
    [syncTaskCount]
  );

  useEffect(() => {
    if (activeTaskCount > 0) {
      setPhase('holding');
      return;
    }

    setPhase((current) => (current === 'holding' ? 'exiting' : current));
  }, [activeTaskCount]);

  useEffect(() => {
    if (phase !== 'exiting') {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setPhase('idle');
    }, 480);

    return () => window.clearTimeout(timeoutId);
  }, [phase]);

  const value = useMemo(() => ({ setTaskLoading }), [setTaskLoading]);

  const isBlocking = phase === 'holding';
  const showOverlay = phase !== 'idle';

  return (
    <AppLoadingContext.Provider value={value}>
      <div className={isBlocking ? 'invisible' : undefined} aria-hidden={isBlocking}>
        {children}
      </div>
      <AppLoadingOverlay phase={showOverlay ? phase : 'idle'} />
    </AppLoadingContext.Provider>
  );
}

export function useAppLoadingTask(taskId: string, isLoading: boolean): void {
  const context = useContext(AppLoadingContext);

  if (!context) {
    throw new Error('useAppLoadingTask must be used within AppLoadingProvider');
  }

  const { setTaskLoading } = context;

  useEffect(() => {
    setTaskLoading(taskId, isLoading);
    return () => {
      setTaskLoading(taskId, false);
    };
  }, [isLoading, setTaskLoading, taskId]);
}
