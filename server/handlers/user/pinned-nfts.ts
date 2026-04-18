import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PIN_NOTE_MAX_LENGTH, PIN_NOTE_MIN_LENGTH } from '../../../src/constants/pinNote.js';
import { parsePinWebsiteForStorage } from '../../../src/utils/pinWebsiteUrl.js';
import { getAppMysqlPool } from '../../lib/mysqlPool.js';
import { getRequestAuth } from '../../lib/sessionAuth.js';
import {
  deleteUserPin,
  listPinsForUser,
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
  return normalized.slice(0, PIN_NOTE_MAX_LENGTH);
}

function resolvePinWebsiteUrl(
  previous: string | null | undefined,
  incoming: unknown
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
  return parsePinWebsiteForStorage(incoming);
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
      ? normalizeWalletAddress(walletAddressInput)
      : undefined;
    const pool = getAppMysqlPool();

    const accountUserId = auth.kind === 'user' ? auth.userId : null;
    const sessionWallet =
      auth.kind === 'wallet' ? normalizeWalletAddress(auth.walletAddress) : null;

    const pinnedNfts =
      accountUserId != null
        ? await listPinsForUser(pool, accountUserId)
        : sessionWallet
          ? await listPinsForWalletOwner(pool, sessionWallet)
          : [];
    const scopedPinnedNfts = filterPinnedByWallet(pinnedNfts, walletAddress);

    if (req.method === 'GET') {
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
            website_url?: string | null;
          }
        | undefined;

      const tokenId = nft?.token_id?.trim();
      if (!tokenId) {
        res.status(400).json({ error: 'Missing nft.token_id' });
        return;
      }

      const pinWalletAddress =
        typeof nft?.wallet_address === 'string'
          ? normalizeWalletAddress(nft.wallet_address)
          : walletAddress;

      if (!pinWalletAddress) {
        res.status(400).json({ error: 'Missing wallet_address for pin operation' });
        return;
      }

      if (auth.kind === 'wallet') {
        if (pinWalletAddress !== sessionWallet) {
          res.status(403).json({ error: 'Cannot pin for a different wallet' });
          return;
        }
      }

      const existing = pinnedNfts.find(
        item =>
          item.token_id === tokenId &&
          item.wallet_address === pinWalletAddress
      );
      const nowIso = new Date().toISOString();
      const latitude = parseOptionalNumber(nft?.latitude);
      const longitude = parseOptionalNumber(nft?.longitude);
      const socials = parsePinnedNftSocials(nft?.socials);
      const resolvePinNote = (previous: string | null | undefined): string | null => {
        if (nft?.pin_note === undefined) {
          return previous ?? null;
        }
        return parsePinNote(nft.pin_note);
      };

      const resolveWebsiteUrlField = (
        previous: string | null | undefined
      ): string | null => resolvePinWebsiteUrl(previous, nft?.website_url);

      if (latitude == null || longitude == null) {
        res.status(400).json({ error: 'Missing valid nft.latitude or nft.longitude' });
        return;
      }

      if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        res.status(400).json({ error: 'Invalid nft latitude/longitude range' });
        return;
      }

      const mergedPinNote = existing
        ? resolvePinNote(existing.pin_note ?? null)
        : resolvePinNote(undefined);
      const mergedWebsite = resolveWebsiteUrlField(
        existing?.website_url ?? undefined
      );

      const pinDesc = mergedPinNote;
      if (!pinDesc || pinDesc.length < PIN_NOTE_MIN_LENGTH) {
        res.status(400).json({
          error: `Pin description must be at least ${PIN_NOTE_MIN_LENGTH} characters.`,
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
        title: nft?.title ?? existing?.title ?? null,
        collectionName: nft?.collection_name ?? existing?.collection_name ?? null,
        socials,
        pinNote: pinDesc,
        websiteUrl: mergedWebsite,
        pinnedAtIsoForInsert: existing?.pinned_at ?? nowIso,
      });

      const nextPins =
        accountUserId != null
          ? await listPinsForUser(pool, accountUserId)
          : sessionWallet
            ? await listPinsForWalletOwner(pool, sessionWallet)
            : [];
      return res.status(200).json({
        success: true,
        pinned_nfts: filterPinnedByWallet(nextPins, pinWalletAddress),
      });
    }

    const tokenId = (req.body?.token_id as string | undefined)?.trim();
    if (!tokenId) {
      return res.status(400).json({ error: 'Missing token_id' });
    }

    if (!walletAddress) {
      return res
        .status(400)
        .json({ error: 'Missing wallet_address for unpin operation' });
    }

    if (auth.kind === 'wallet' && walletAddress !== sessionWallet) {
      res.status(403).json({ error: 'Cannot unpin for a different wallet' });
      return;
    }

    await deleteUserPin(pool, accountUserId, tokenId, walletAddress);

    const nextPins =
      accountUserId != null
        ? await listPinsForUser(pool, accountUserId)
        : sessionWallet
          ? await listPinsForWalletOwner(pool, sessionWallet)
          : [];
    return res.status(200).json({
      success: true,
      pinned_nfts: filterPinnedByWallet(nextPins, walletAddress),
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));

    console.error('Error handling pinned NFTs:', err);
    return res
      .status(500)
      .json({ error: 'Internal server error', details: err.message });
  }
}
