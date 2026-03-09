import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
// Mapbox CSS is required for proper map and marker styling
import 'mapbox-gl/dist/mapbox-gl.css'
import { Auth0Provider } from '@auth0/auth0-react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { wagmiConfig } from './web3modal'

const queryClient = new QueryClient()

const domain = import.meta.env.VITE_AUTH0_DOMAIN
const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID

if (!domain || !clientId) {
  console.error('Auth0 Environment Variables:', {
    domain: domain || 'MISSING',
    clientId: clientId || 'MISSING',
    allEnv: Object.keys(import.meta.env).filter(key => key.startsWith('VITE_'))
  })
  throw new Error(
    'Missing Auth0 configuration. Please check your environment variables in Vercel. ' +
    'Make sure VITE_AUTH0_DOMAIN and VITE_AUTH0_CLIENT_ID are set and redeploy.'
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Auth0Provider
        domain={domain}
        clientId={clientId}
        authorizationParams={{
          redirect_uri: window.location.origin,
        }}
        useRefreshTokens={true}
        cacheLocation="localstorage"
        onRedirectCallback={(appState) => {
          // This will be handled by the navigate in App.tsx
          // Store returnTo for use in App component
          if (appState?.returnTo) {
            sessionStorage.setItem('auth0_app_state', JSON.stringify({ returnTo: appState.returnTo }));
          }
        }}
      >
        <WagmiProvider config={wagmiConfig}>
          <QueryClientProvider client={queryClient}>
            <App />
          </QueryClientProvider>
        </WagmiProvider>
      </Auth0Provider>
    </BrowserRouter>
  </StrictMode>,
)
