import {
    useCallback,
    useLayoutEffect,
    useRef,
    type ReactNode,
} from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';

/** Pixels of slack for “bottom” (subpixels, zoom, font rounding). */
const BOTTOM_SLACK = 8;

export type TermsScrollAcceptBoxProps = {
    children: ReactNode;
    className?: string;
    /**
     * Fires once when the user has reached the end (or content fits without scrolling).
     * If `latch` is false, also fires `false` when scrolling back up.
     */
    onReachedEndChange: (reached: boolean) => void;
    /** If true, after the end is reached we never report `false` when scrolling up. */
    latch?: boolean;
    /** Pixels to move for each arrow click. */
    scrollButtonStep?: number;
    /** Max height of the text region (Tailwind class or any class). */
    maxHeightClassName?: string;
};

/**
 * Scrollable terms body with **up/down controls on the left** and a **thin** themed scrollbar
 * (see `.xolo-terms-scroll` in `index.css`).
 *
 * Use the **same** scrollable element for measuring: attach `ref` to the `overflow-y-auto` node
 * and wire `onScroll` here — if validation fails in your app, a parent or child is often the
 * element that scrolls instead of this `ref`.
 */
export function TermsScrollAcceptBox({
    children,
    className = '',
    onReachedEndChange,
    latch = true,
    scrollButtonStep = 140,
    maxHeightClassName = 'max-h-[min(52vh,420px)]',
}: TermsScrollAcceptBoxProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const reportedEndRef = useRef(false);

    const runCheck = useCallback(() => {
        const el = scrollRef.current;
        if (!el) {
            return;
        }
        const { scrollTop, scrollHeight, clientHeight } = el;
        const fitsWithoutScroll = scrollHeight <= clientHeight + 1;
        const atBottom =
            fitsWithoutScroll
            || scrollTop + clientHeight >= scrollHeight - BOTTOM_SLACK;

        if (latch) {
            if (atBottom && !reportedEndRef.current) {
                reportedEndRef.current = true;
                onReachedEndChange(true);
            }
            return;
        }
        onReachedEndChange(atBottom);
    }, [latch, onReachedEndChange]);

    useLayoutEffect(() => {
        runCheck();
    }, [runCheck, children]);

    useLayoutEffect(() => {
        const el = scrollRef.current;
        if (!el) {
            return;
        }
        const ro = new ResizeObserver(() => {
            runCheck();
        });
        ro.observe(el);
        return () => ro.disconnect();
    }, [runCheck]);

    const nudgeCheck = useCallback(() => {
        runCheck();
        requestAnimationFrame(() => {
            runCheck();
        });
        window.setTimeout(runCheck, 80);
        window.setTimeout(runCheck, 400);
    }, [runCheck]);

    const scrollByDir = (dir: 1 | -1) => {
        const el = scrollRef.current;
        if (!el) {
            return;
        }
        el.scrollBy({ top: dir * scrollButtonStep, behavior: 'smooth' });
        nudgeCheck();
    };

    return (
        <div
            className={`flex min-h-0 w-full flex-row items-stretch overflow-hidden rounded-lg border border-red-500/35 bg-black/20 ${className}`.trim()}
        >
            <div
                className="flex w-8 shrink-0 flex-col items-center justify-center gap-0.5 border-r border-red-500/20 bg-black/15 py-1.5 pl-0.5 pr-0.5"
                role="group"
                aria-label="Scroll document"
            >
                <button
                    type="button"
                    onClick={() => scrollByDir(-1)}
                    className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-red-200/80 transition hover:bg-white/10 hover:text-red-100"
                    aria-label="Scroll up"
                >
                    <FontAwesomeIcon icon={faChevronUp} className="h-3 w-3" />
                </button>
                <button
                    type="button"
                    onClick={() => scrollByDir(1)}
                    className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-red-200/80 transition hover:bg-white/10 hover:text-red-100"
                    aria-label="Scroll down"
                >
                    <FontAwesomeIcon icon={faChevronDown} className="h-3 w-3" />
                </button>
            </div>
            <div
                ref={scrollRef}
                onScroll={runCheck}
                className={`xolo-terms-scroll min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden pl-2 pr-1.5 py-2.5 sm:pl-3 sm:pr-2 sm:py-3 ${maxHeightClassName}`.trim()}
            >
                {children}
            </div>
        </div>
    );
}
