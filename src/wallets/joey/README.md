# Joey Wallet integration

| Piece | Role |
|--------|------|
| `extractJoeyWalletAddress.ts` | Parse address from Joey WC session / account |
| `joeyConnectIntent.ts` | `sessionStorage` flag so we only persist after a user-started connect (not after DB disconnect while SDK session lingers) |
| `../../hooks/useJoeyWalletConnect.ts` | QR vs mobile deeplink, `disconnectFromProvider`, Joey provider |
| `../../hooks/useJoeyWalletPersistence.ts` | Save/connect Joey row in our API |
| `../../components/joey/JoeyWalletQrModal.tsx` | Desktop QR + optional “Open app” |

`WalletConnection.tsx` only composes these; remove Joey by dropping the provider wrapper, hook calls, and modal.
