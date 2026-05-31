import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
  type ReactNode,
} from 'react';
import { useJoeyWalletConnect } from '../../hooks/useJoeyWalletConnect';
import { JoeyWalletConnectRootProvider } from './joeyWalletConnectRoot';

export type JoeyWalletConnectApi = ReturnType<typeof useJoeyWalletConnect>;

const inactiveJoeyApi: JoeyWalletConnectApi = {
  isJoeyConnectPending: false,
  showJoeyQrModal: false,
  joeyConnectUri: null,
  joeyDeepLink: null,
  connect: async () => {},
  cancel: () => {},
  account: null,
  session: null,
  disconnectFromProvider: async () => {},
};

type JoeyStackContextValue = {
  requestJoeyStack: (opts?: { connectAfterMount?: boolean; disconnectAfterMount?: boolean }) => void;
  joeyStackActive: boolean;
  pendingActionRef: MutableRefObject<'connect' | 'disconnect' | null>;
  setJoeyApi: (api: JoeyWalletConnectApi) => void;
};

const JoeyApiContext = createContext<JoeyWalletConnectApi>(inactiveJoeyApi);
const JoeyStackContext = createContext<JoeyStackContextValue | null>(null);

export function useJoeyWalletConnectApi(): JoeyWalletConnectApi {
  return useContext(JoeyApiContext);
}

export function useJoeyStackRequest() {
  return useContext(JoeyStackContext);
}

type JoeyConnectHookParams = Parameters<typeof useJoeyWalletConnect>[0];

function JoeyInactiveLayer({
  children,
  requestJoeyStack,
}: {
  children: ReactNode;
  requestJoeyStack: JoeyStackContextValue['requestJoeyStack'];
}) {
  const stub = useMemo(
    (): JoeyWalletConnectApi => ({
      ...inactiveJoeyApi,
      connect: async () => {
        requestJoeyStack({ connectAfterMount: true });
      },
      disconnectFromProvider: async () => {
        requestJoeyStack({ disconnectAfterMount: true });
      },
    }),
    [requestJoeyStack]
  );

  return <JoeyApiContext.Provider value={stub}>{children}</JoeyApiContext.Provider>;
}

export function JoeyWalletConnectLazyRoot({ children }: { children: ReactNode }) {
  const [joeyStackActive, setJoeyStackActive] = useState(false);
  const pendingActionRef = useRef<'connect' | 'disconnect' | null>(null);
  const [joeyApi, setJoeyApi] = useState<JoeyWalletConnectApi>(inactiveJoeyApi);

  const requestJoeyStack = useCallback(
    (opts?: { connectAfterMount?: boolean; disconnectAfterMount?: boolean }) => {
      if (opts?.connectAfterMount) {
        pendingActionRef.current = 'connect';
      } else if (opts?.disconnectAfterMount) {
        pendingActionRef.current = 'disconnect';
      }
      setJoeyStackActive(true);
    },
    []
  );

  const stackValue = useMemo(
    (): JoeyStackContextValue => ({
      requestJoeyStack,
      joeyStackActive,
      pendingActionRef,
      setJoeyApi,
    }),
    [requestJoeyStack, joeyStackActive]
  );

  if (!joeyStackActive) {
    return (
      <JoeyStackContext.Provider value={stackValue}>
        <JoeyInactiveLayer requestJoeyStack={requestJoeyStack}>{children}</JoeyInactiveLayer>
      </JoeyStackContext.Provider>
    );
  }

  return (
    <JoeyStackContext.Provider value={stackValue}>
      <JoeyWalletConnectRootProvider>
        <JoeyApiContext.Provider value={joeyApi}>{children}</JoeyApiContext.Provider>
      </JoeyWalletConnectRootProvider>
    </JoeyStackContext.Provider>
  );
}

/** Mount inside WalletConnection once toast/busy callbacks are available. */
export function JoeyWalletConnectBridgeHost({ hookParams }: { hookParams: JoeyConnectHookParams }) {
  const stack = useJoeyStackRequest();
  const joey = useJoeyWalletConnect(hookParams);

  useEffect(() => {
    stack?.setJoeyApi(joey);
  }, [joey, stack]);

  useEffect(() => {
    if (!stack?.joeyStackActive) {
      return;
    }
    const pending = stack.pendingActionRef.current;
    if (!pending) {
      return;
    }
    stack.pendingActionRef.current = null;
    if (pending === 'connect') {
      void joey.connect();
      return;
    }
    void joey.disconnectFromProvider();
  }, [joey, stack]);

  return null;
}
