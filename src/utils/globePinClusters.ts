import type { XoloGlobePin } from '../services/xoloGlobePinService';
import {
  GLOBE_PIN_CLUSTER_THRESHOLD_M,
  GLOBE_PIN_SPREAD_BASE_RADIUS_M,
  GLOBE_PIN_SPREAD_RADIUS_MAX_M,
  GLOBE_PIN_SPREAD_RADIUS_PER_PIN_M,
} from '../constants/xoloGlobeMap';

type LngLat = { lng: number; lat: number };

const EARTH_RADIUS_M = 6371000;

function haversineMeters(a: LngLat, b: LngLat): number {
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Meters per degree latitude (approx). */
function metersPerDegreeLat(): number {
  return 111320;
}

/** Meters per degree longitude at a given latitude. */
function metersPerDegreeLng(lat: number): number {
  return 111320 * Math.cos((lat * Math.PI) / 180);
}

function unionFindClusters(
  pins: XoloGlobePin[],
  thresholdM: number
): XoloGlobePin[][] {
  const n = pins.length;
  const parent = Array.from({ length: n }, (_, i) => i);

  const find = (i: number): number => {
    if (parent[i] !== i) {
      parent[i] = find(parent[i]);
    }
    return parent[i];
  };

  const union = (i: number, j: number) => {
    const ri = find(i);
    const rj = find(j);
    if (ri !== rj) {
      parent[rj] = ri;
    }
  };

  for (let i = 0; i < n; i++) {
    const a: LngLat = {
      lng: pins[i].longitude,
      lat: pins[i].latitude,
    };
    for (let j = i + 1; j < n; j++) {
      const b: LngLat = {
        lng: pins[j].longitude,
        lat: pins[j].latitude,
      };
      if (haversineMeters(a, b) <= thresholdM) {
        union(i, j);
      }
    }
  }

  const buckets = new Map<number, XoloGlobePin[]>();
  for (let i = 0; i < n; i++) {
    const r = find(i);
    const list = buckets.get(r);
    if (list) {
      list.push(pins[i]);
    } else {
      buckets.set(r, [pins[i]]);
    }
  }

  return [...buckets.values()];
}

function centroidLngLat(group: XoloGlobePin[]): LngLat {
  let slat = 0;
  let slng = 0;
  for (const p of group) {
    slat += p.latitude;
    slng += p.longitude;
  }
  const n = group.length;
  return { lat: slat / n, lng: slng / n };
}

function ringOffsetMeters(
  index: number,
  total: number,
  radiusM: number
): { eastM: number; northM: number } {
  const angle = (2 * Math.PI * index) / total - Math.PI / 2;
  return {
    eastM: radiusM * Math.cos(angle),
    northM: radiusM * Math.sin(angle),
  };
}

/**
 * When several pins are within ~a block of each other, Mapbox markers stack and are hard to click.
 * Spread each cluster in a ring around its centroid (true coordinates stay in popups / local time).
 */
export function computeGlobePinDisplayPositions(
  pins: XoloGlobePin[]
): Map<string, LngLat> {
  const out = new Map<string, LngLat>();
  if (pins.length === 0) {
    return out;
  }

  const clusters = unionFindClusters(pins, GLOBE_PIN_CLUSTER_THRESHOLD_M);

  for (const group of clusters) {
    if (group.length === 1) {
      const p = group[0];
      out.set(p.token_id, { lng: p.longitude, lat: p.latitude });
      continue;
    }

    const sorted = [...group].sort((a, b) =>
      a.token_id.localeCompare(b.token_id, 'en')
    );
    const c = centroidLngLat(sorted);
    const radiusM = Math.min(
      GLOBE_PIN_SPREAD_RADIUS_MAX_M,
      GLOBE_PIN_SPREAD_BASE_RADIUS_M +
        Math.max(0, sorted.length - 2) * GLOBE_PIN_SPREAD_RADIUS_PER_PIN_M
    );
    const mpLat = metersPerDegreeLat();
    const mpLng = metersPerDegreeLng(c.lat);

    sorted.forEach((p, index) => {
      const { eastM, northM } = ringOffsetMeters(index, sorted.length, radiusM);
      const dLat = northM / mpLat;
      const dLng = eastM / mpLng;
      out.set(p.token_id, {
        lng: c.lng + dLng,
        lat: c.lat + dLat,
      });
    });
  }

  return out;
}
