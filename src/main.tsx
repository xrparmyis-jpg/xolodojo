import { createRoot } from 'react-dom/client'
import { prepareXamanOAuthLanding } from './utils/xamanOAuthLanding'
import { primeXamanPkceIfOAuthLanding } from './walletHandlers/xaman'
import App from './App.tsx'
import { ToastProvider } from './components/ToastProvider';
import { AuthProvider } from './providers/AuthContext';
import { AppLoadingProvider } from './providers/AppLoadingProvider';
import { LoginModalProvider } from './providers/LoginModalContext';
import { UserProvider } from './providers/UserContext';
import './index.css'
// Mapbox CSS is required for proper map and marker styling
import 'mapbox-gl/dist/mapbox-gl.css'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { wagmiConfig } from './web3modal'
const queryClient = new QueryClient()

// Before React / XummPkce: move OAuth tokens from #hash → ?query (SDK only reads search),
// then clear stale JWT so rememberJwt doesn't race the redirect.
prepareXamanOAuthLanding()
primeXamanPkceIfOAuthLanding()

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <ToastProvider>
      <AuthProvider>
        <WagmiProvider config={wagmiConfig}>
          <QueryClientProvider client={queryClient}>
            <UserProvider>
              <AppLoadingProvider>
                <LoginModalProvider>
                  <App />
                </LoginModalProvider>
              </AppLoadingProvider>
            </UserProvider>
          </QueryClientProvider>
        </WagmiProvider>
      </AuthProvider>
    </ToastProvider>
  </BrowserRouter>,
)
