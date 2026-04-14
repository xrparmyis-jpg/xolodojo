import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { prepareXamanOAuthLanding } from './utils/xamanOAuthLanding'
import { primeXamanPkceIfOAuthLanding } from './walletHandlers/xaman'
import App from './App.tsx'
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
const queryClient = new QueryClient()

// Before React / XummPkce: move OAuth tokens from #hash → ?query (SDK only reads search),
// then clear stale JWT so rememberJwt doesn't race the redirect.
prepareXamanOAuthLanding()
primeXamanPkceIfOAuthLanding()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <LoginModalProvider>
          <WagmiProvider config={wagmiConfig}>
            <QueryClientProvider client={queryClient}>
              <UserProvider>
                <App />
              </UserProvider>
            </QueryClientProvider>
          </WagmiProvider>
        </LoginModalProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
