import { Fragment, useEffect, useMemo, useState } from 'react';
import GsapPageContent from './GsapPageContent';

/**
 * When the mint countdown reaches zero (ISO 8601 with explicit offset).
 * Same absolute instant for every user — not interpreted in the viewer’s local zone.
 *
 * May 27, 2026, 4:20 PM in US Pacific. Late May uses PDT (−07:00); use −08:00 if you need literal PST.
 */
export const MINT_COUNTDOWN_END_ISO = '2026-05-27T16:20:00-07:00';

/** Opens from “Mint Now” after the countdown completes. */
export const MINT_LIVE_URL = 'https://xrpl.cafe';

function pad2(n: number) {
    return String(Math.max(0, n)).padStart(2, '0');
}

function formatDays(n: number) {
    return n >= 100 ? String(n) : pad2(n);
}

export default function MintCountdownSection() {
    const endMs = useMemo(() => Date.parse(MINT_COUNTDOWN_END_ISO), []);
    const [nowMs, setNowMs] = useState(() => Date.now());

    useEffect(() => {
        const id = window.setInterval(() => setNowMs(Date.now()), 1000);
        return () => window.clearInterval(id);
    }, []);

    const remaining = Math.max(0, endMs - nowMs);
    const isComplete = remaining <= 0;

    const totalSec = Math.floor(remaining / 1000);
    const days = Math.floor(totalSec / 86400);
    const hours = Math.floor((totalSec % 86400) / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;

    const segments = [
        { value: formatDays(days), label: 'Days' },
        { value: pad2(hours), label: 'Hours' },
        { value: pad2(minutes), label: 'Minutes' },
        { value: pad2(seconds), label: 'Seconds' },
    ];

    return (
        <GsapPageContent className="mt-12 md:mt-16" delay={0.08} intersectionThreshold={0.12}>
            <div className="mx-auto max-w-4xl rounded-2xl border border-[#36e9e4]/35 bg-black/50 px-4 py-8 shadow-[0_0_40px_rgba(54,233,228,0.08)] backdrop-blur-sm sm:px-8 md:px-10 md:py-10">
                <p className="mb-6 text-center text-sm font-medium uppercase tracking-[0.2em] text-white/80 md:text-base">
                    Minting soon
                </p>

                {isComplete ? (
                    <div className="flex flex-col items-center gap-4">
                        <p className="text-center text-[#decee9] text-sm md:text-base">
                            The mint is live — head to XRPL Cafe to mint your Xolo.
                        </p>
                        <a
                            href={MINT_LIVE_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center rounded-lg border border-[#28aae4]/50 bg-gradient-to-r from-cyan-500/90 to-blue-600/90 px-8 py-3 text-base font-semibold text-white shadow-lg transition hover:from-cyan-400 hover:to-blue-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-[#0a0f14]"
                        >
                            Mint Now
                        </a>
                    </div>
                ) : (
                    <div
                        className="flex flex-wrap items-start justify-center gap-x-2 gap-y-4 sm:gap-x-3 md:gap-x-5"
                        aria-live="polite"
                        aria-atomic="true"
                    >
                        {segments.map((seg, i) => (
                            <Fragment key={seg.label}>
                                {i > 0 ? (
                                    <span
                                        className="select-none text-3xl font-bold leading-none text-white md:text-4xl lg:text-5xl"
                                        aria-hidden
                                    >
                                        :
                                    </span>
                                ) : null}
                                <div className="flex min-w-[3.75rem] flex-col items-center sm:min-w-[4.25rem] md:min-w-[5rem]">
                                    <span className="text-3xl font-bold tabular-nums leading-none text-white sm:text-4xl md:text-5xl lg:text-6xl">
                                        {seg.value}
                                    </span>
                                    <span className="mt-2 text-center text-[10px] font-medium uppercase tracking-widest text-white/65 sm:text-xs">
                                        {seg.label}
                                    </span>
                                </div>
                            </Fragment>
                        ))}
                    </div>
                )}
            </div>
        </GsapPageContent>
    );
}
