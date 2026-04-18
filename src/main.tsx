import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { prepareXamanOAuthLanding } from './utils/xamanOAuthLanding'
import { primeXamanPkceIfOAuthLanding } from './walletHandlers/xaman'
import App from './App.tsx'
import { ToastProvider } from './components/ToastProvider';
import { AuthProvider } from './providers/AuthContext';
import { LoginModalProvider } from './providers/LoginModalContext';
import { UserProvider } from './providers/UserContext';
import './index.css'
// Mapbox CSS is required for proper map and marker styling
import 'mapbox-gl/dist/mapbox-gl.css'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { wagmiConfig } from './web3modal'
import { JoeyWalletConnectRootProvider } from './wallets/joey/joeyWalletConnectRoot'
const queryClient = new QueryClient()

// Before React / XummPkce: move OAuth tokens from #hash → ?query (SDK only reads search),
// then clear stale JWT so rememberJwt doesn't race the redirect.
prepareXamanOAuthLanding()
primeXamanPkceIfOAuthLanding()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <WagmiProvider config={wagmiConfig}>
            <JoeyWalletConnectRootProvider>
              <QueryClientProvider client={queryClient}>
                <UserProvider>
                  <LoginModalProvider>
                    <App />
                  </LoginModalProvider>
                </UserProvider>
              </QueryClientProvider>
            </JoeyWalletConnectRootProvider>
          </WagmiProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  </StrictMode>,
)
