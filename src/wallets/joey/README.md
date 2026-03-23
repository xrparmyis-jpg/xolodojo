# Joey Wallet integration

| Piece | Role |
|--------|------|
| `extractJoeyWalletAddress.ts` | Parse address from Joey WC session / account |
| `../../hooks/useJoeyWalletConnect.ts` | QR vs mobile deeplink, Joey provider |
| `../../hooks/useJoeyWalletPersistence.ts` | Save/connect Joey row in our API |
| `../../components/joey/JoeyWalletQrModal.tsx` | Desktop QR + optional “Open app” |

`WalletConnection.tsx` only composes these; remove Joey by dropping the provider wrapper, hook calls, and modal.
