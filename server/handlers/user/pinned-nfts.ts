import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { Pool } from 'mysql2/promise';
import { PIN_NOTE_MAX_LENGTH, PIN_NOTE_MIN_LENGTH } from '../../../src/constants/pinNote.js';
import { normalizeNfTokenId } from '../../../src/utils/nfTokenId.js';
import { plainTextLengthFromHtml } from '../../../src/utils/pinNotePlainText.js';
import { sanitizePinNoteHtmlServer } from '../../lib/sanitizePinNoteHtml.js';
import { getAppMysqlPool } from '../../lib/mysqlPool.js';
import { getRequestAuth, type RequestAuthState } from '../../lib/sessionAuth.js';
import {
  resolveCanonicalClassicAddress,
  stripInvisible,
} from '../../xrplClassicAddress.js';
import {
  deleteUserPin,
  listPinsForUser,
  listPinsForWalletAddress,
  listPinsForWalletOwner,
  normalizeWalletAddress,
  upsertUserPin,
  type PinnedNftItem,
  type PinnedNftSocials,
} from '../../lib/userPinsRepo.js';

const allowedSocialKeys = [
  'twitter',
  'discord',
  'tiktok',
  'instagram',
  'telegram',
  'linkedin',
] as const;

function parsePinnedNftSocials(value: unknown): PinnedNftSocials | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const source = value as Record<string, unknown>;
  const socials = allowedSocialKeys.reduce<PinnedNftSocials>((acc, key) => {
    const nextValue = source[key];
    if (typeof nextValue !== 'string') {
      return acc;
    }

    const normalized = nextValue.trim().replace(/^@+/, '');
    if (!normalized) {
      return acc;
    }

    acc[key] = normalized;
    return acc;
  }, {});

  return Object.keys(socials).length > 0 ? socials : null;
}

function parsePinNote(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const normalized = value.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
  if (!normalized) {
    return null;
  }
  const sanitized = sanitizePinNoteHtmlServer(normalized);
  if (!sanitized) {
    return null;
  }
  return sanitized;
}

function parseOptionalNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

/** Avoid `??` with empty string — `""` is not nullish and would wipe existing DB title/collection. */
function mergeIncomingString(
  incoming: unknown,
  previous: string | null | undefined
): string | null {
  if (incoming === undefined) {
    return previous ?? null;
  }
  if (incoming === null) {
    return null;
  }
  if (typeof incoming !== 'string') {
    return previous ?? null;
  }
  const t = incoming.trim();
  if (t === '') {
    return previous ?? null;
  }
  return t;
}

function filterPinnedByWallet(
  pinnedNfts: PinnedNftItem[],
  walletAddress?: string
): PinnedNftItem[] {
  if (!walletAddress) {
    return pinnedNfts;
  }

  const normalizedWalletAddress = normalizeWalletAddress(walletAddress);
  return pinnedNfts.filter(
    item => item.wallet_address === normalizedWalletAddress
  );
}

/**
 * Same normalization chain as wallet-assets / session: strip invisibles, canonical classic, then lowercase.
 * Ensures query/body wallet matches `user_pins.wallet_address` and `listPinsForWalletOwner` session key.
 */
function resolveWalletParamForCompare(raw: string | undefined): string | undefined {
  if (!raw || typeof raw !== 'string') {
    return undefined;
  }
  const stripped = stripInvisible(raw);
  if (!stripped) {
    return undefined;
  }
  const canonical =
    resolveCanonicalClassicAddress(stripped) ??
    resolveCanonicalClassicAddress(stripped.toLowerCase()) ??
    stripped;
  return normalizeWalletAddress(canonical);
}

/**
 * Email sessions list pins with `user_id = ?` only. Wallet-only pins use `user_id IS NULL`
 * and are returned by listPinsForWalletOwner. Without merging, users who pinned as wallet-only
 * then use Profile with email + connected wallet see an empty list and broken edit.
 */
async function loadPinnedListForAuth(
  pool: Pool,
  auth: RequestAuthState,
  walletForMerge: string | undefined
): Promise<PinnedNftItem[]> {
  const accountUserId = auth.kind === 'user' ? auth.userId : null;
  const sessionWallet =
    auth.kind === 'wallet' && auth.walletAddress
      ? resolveWalletParamForCompare(auth.walletAddress) ??
        normalizeWalletAddress(auth.walletAddress)
      : null;

  if (accountUserId != null) {
    const userPins = await listPinsForUser(pool, accountUserId);
    if (!walletForMerge) {
      return userPins;
    }
    const walletOnly = await listPinsForWalletOwner(pool, walletForMerge);
    const seen = new Set(
      userPins.map(
        p => `${normalizeNfTokenId(p.token_id)}|${p.wallet_address}`
      )
    );
    const merged = [...userPins];
    for (const w of walletOnly) {
      const key = `${normalizeNfTokenId(w.token_id)}|${w.wallet_address}`;
      if (!seen.has(key)) {
        merged.push(w);
        seen.add(key);
      }
    }
    return merged;
  }

  if (sessionWallet) {
    return listPinsForWalletAddress(pool, sessionWallet);
  }

  return [];
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET' && req.method !== 'POST' && req.method !== 'DELETE') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const auth = await getRequestAuth(req);
    if (!auth) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const walletAddressInput: string | undefined =
      req.method === 'GET'
        ? Array.isArray(req.query.wallet_address)
          ? req.query.wallet_address[0]
          : req.query.wallet_address
        : (req.body?.wallet_address as string | undefined);
    const walletAddress = walletAddressInput
      ? resolveWalletParamForCompare(walletAddressInput)
      : undefined;
    const pool = getAppMysqlPool();

    const accountUserId = auth.kind === 'user' ? auth.userId : null;
    const sessionWallet =
      auth.kind === 'wallet' && auth.walletAddress
        ? resolveWalletParamForCompare(auth.walletAddress) ??
          normalizeWalletAddress(auth.walletAddress)
        : null;

    if (req.method === 'GET') {
      const pinnedNfts = await loadPinnedListForAuth(pool, auth, walletAddress);
      const scopedPinnedNfts =
        auth.kind === 'wallet'
          ? pinnedNfts
          : filterPinnedByWallet(pinnedNfts, walletAddress);
      res.status(200).json({ success: true, pinned_nfts: scopedPinnedNfts });
      return;
    }

    if (req.method === 'POST') {
      const nft = req.body?.nft as
        | {
            token_id?: string;
            issuer?: string | null;
            uri?: string | null;
            title?: string | null;
            collection_name?: string | null;
            wallet_address?: string | null;
            latitude?: number | null;
            longitude?: number | null;
            image_url?: string | null;
            socials?: PinnedNftSocials | null;
            pin_note?: string | null;
          }
        | undefined;

      const tokenId = normalizeNfTokenId(nft?.token_id?.trim() ?? '');
      if (!tokenId) {
        res.status(400).json({ error: 'Missing nft.token_id' });
        return;
      }

      const pinWalletAddress =
        typeof nft?.wallet_address === 'string'
          ? resolveWalletParamForCompare(nft.wallet_address) ?? walletAddress
          : walletAddress;

      if (!pinWalletAddress) {
        res.status(400).json({ error: 'Missing wallet_address for pin operation' });
        return;
      }

      if (auth.kind === 'wallet') {
        if (sessionWallet != null && pinWalletAddress !== sessionWallet) {
          res.status(403).json({ error: 'Cannot pin for a different wallet' });
          return;
        }
      }

      const pinnedNfts = await loadPinnedListForAuth(
        pool,
        auth,
        walletAddress ?? pinWalletAddress
      );

      const existing = pinnedNfts.find(
        item =>
          normalizeNfTokenId(item.token_id) === tokenId &&
          item.wallet_address === pinWalletAddress
      );
      const nowIso = new Date().toISOString();
      const latitude = parseOptionalNumber(nft?.latitude);
      const longitude = parseOptionalNumber(nft?.longitude);
      const socials = parsePinnedNftSocials(nft?.socials);
      const mergeIncomingPinNote = (
        previous: string | null | undefined
      ): string | null => {
        if (nft?.pin_note === undefined) {
          return previous ?? null;
        }
        return parsePinNote(nft.pin_note);
      };

      if (latitude == null || longitude == null) {
        res.status(400).json({ error: 'Missing valid nft.latitude or nft.longitude' });
        return;
      }

      if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        res.status(400).json({ error: 'Invalid nft latitude/longitude range' });
        return;
      }

      const mergedPinNote = existing
        ? mergeIncomingPinNote(existing.pin_note ?? null)
        : mergeIncomingPinNote(undefined);

      const plainLen = mergedPinNote
        ? plainTextLengthFromHtml(mergedPinNote)
        : 0;
      if (!mergedPinNote || plainLen < PIN_NOTE_MIN_LENGTH) {
        res.status(400).json({
          error: `Pin description must be at least ${PIN_NOTE_MIN_LENGTH} non-whitespace characters.`,
        });
        return;
      }
      if (plainLen > PIN_NOTE_MAX_LENGTH) {
        res.status(400).json({
          error: `Pin description is too long (max ${PIN_NOTE_MAX_LENGTH} characters).`,
        });
        return;
      }

      await upsertUserPin(pool, {
        userId: accountUserId,
        tokenId,
        walletAddress: pinWalletAddress,
        issuer: nft?.issuer ?? existing?.issuer ?? null,
        uri: nft?.uri ?? existing?.uri ?? null,
        latitude,
        longitude,
        imageUrl: nft?.image_url ?? existing?.image_url ?? null,
        title: mergeIncomingString(nft?.title, existing?.title ?? null),
        collectionName: mergeIncomingString(
          nft?.collection_name,
          existing?.collection_name ?? null
        ),
        socials,
        pinNote: mergedPinNote,
        pinnedAtIsoForInsert: existing?.pinned_at ?? nowIso,
      });

      const nextPins = await loadPinnedListForAuth(
        pool,
        auth,
        walletAddress ?? pinWalletAddress
      );
      const responsePins =
        auth.kind === 'wallet'
          ? nextPins
          : filterPinnedByWallet(nextPins, pinWalletAddress);
      return res.status(200).json({
        success: true,
        pinned_nfts: responsePins,
      });
    }

    const tokenId = normalizeNfTokenId(
      (req.body?.token_id as string | undefined)?.trim() ?? ''
    );
    if (!tokenId) {
      return res.status(400).json({ error: 'Missing token_id' });
    }

    if (!walletAddress) {
      return res
        .status(400)
        .json({ error: 'Missing wallet_address for unpin operation' });
    }

    if (
      auth.kind === 'wallet' &&
      sessionWallet != null &&
      walletAddress !== sessionWallet
    ) {
      res.status(403).json({ error: 'Cannot unpin for a different wallet' });
      return;
    }

    await deleteUserPin(pool, accountUserId, tokenId, walletAddress);

    const nextPins = await loadPinnedListForAuth(pool, auth, walletAddress);
    const deleteResponsePins =
      auth.kind === 'wallet'
        ? nextPins
        : filterPinnedByWallet(nextPins, walletAddress);
    return res.status(200).json({
      success: true,
      pinned_nfts: deleteResponsePins,
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));

    console.error('Error handling pinned NFTs:', err);
    return res
      .status(500)
      .json({ error: 'Internal server error', details: err.message });
  }
}
