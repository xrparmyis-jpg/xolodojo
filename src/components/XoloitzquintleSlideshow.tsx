import { useEffect, useMemo, useState } from 'react';

/** Add images under `src/assets/slideshows/xoloitzquintle/` — they are included at build time. */
const urlByPath = import.meta.glob<string>(
  '../assets/slideshows/xoloitzquintle/*.{png,jpg,jpeg,webp,gif}',
  { eager: true, import: 'default' }
);

const INTERVAL_MS = 300;

function shuffledSlideUrls(): string[] {
  const urls = Object.entries(urlByPath)
    .sort(([a], [b]) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
    .map(([, url]) => url);
  const out = [...urls];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export default function XoloitzquintleSlideshow() {
  const urls = useMemo(() => shuffledSlideUrls(), []);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (urls.length <= 1 || paused) return undefined;
    const id = window.setInterval(() => {
      setIndex(i => (i + 1) % urls.length);
    }, INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [urls.length, paused]);

  if (urls.length === 0) {
    return null;
  }

  const src = urls[index];

  return (
    <div className="flex justify-center">
      <div
        className="h-[360px] w-[360px] shrink-0 overflow-hidden rounded-md bg-black/20 ring-1 ring-white/10"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <img
          key={src}
          src={src}
          alt=""
          className="h-full w-full object-cover"
          width={360}
          height={360}
          decoding="async"
        />
      </div>
    </div>
  );
}
