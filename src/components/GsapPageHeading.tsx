import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

interface GsapPageHeadingProps {
    eyebrow: string;
    heading: string;
    accent?: string;
    iconType?: "star" | "asterisk" | "none";
    iconCount?: number;
    centered?: boolean;
    className?: string;
}

function GsapPageHeading({
    eyebrow,
    heading,
    accent,
    iconType = "star",
    iconCount = 1,
    centered = true,
    className = "",
}: GsapPageHeadingProps) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const headingRef = useRef<HTMLHeadingElement | null>(null);

    const eyebrowIcons =
        iconType === "star" && iconCount > 0
            ? Array.from({ length: iconCount }, (_, index) => (
                <img key={index} src="/star.png" alt="icon" className="eyebrow-icon w-3 h-3 md:w-4 md:h-4 opacity-0" />
            ))
            : null;

    const eyebrowLetters = Array.from(eyebrow);
    const accentParts = accent
        ? accent
            .split(",")
            .map((part) => part.trim())
            .filter((part) => part.length > 0)
        : [];

    /** Comma between list items, but not before a segment that starts with & (e.g. "Art, Culture & XRPL"). */
    const separatorAfterPart = (index: number) => {
        if (index >= accentParts.length - 1) return null;
        const next = accentParts[index + 1];
        if (!next) return null;
        return next.startsWith("&") ? "space" : "comma";
    };

    /** `&` uses the same white as commas; the rest of the segment stays `.accent-word` for GSAP. */
    const renderAccentPartBody = (part: string) => {
        if (!part.startsWith("&")) {
            return <span className="accent-word inline-block">{part}</span>;
        }
        const rest = part.slice(1).trim();
        return (
            <span className="inline-flex items-baseline gap-x-1.5">
                <span className="accent-amp inline-block shrink-0 text-white">&</span>
                {rest ? <span className="accent-word inline-block">{rest}</span> : null}
            </span>
        );
    };

    useGSAP(
        () => {
            const root = containerRef.current;
            const finalizeEyebrowLetters = () => {
                if (!root) return;
                const letters = root.querySelectorAll<HTMLElement>(".eyebrow-letter");
                if (!letters.length) return;
                gsap.killTweensOf(letters);
                // Strip GSAP transform/scale so no letter can stay visually offset; keep text visible.
                gsap.set(letters, { autoAlpha: 1, clearProps: "transform" });
            };

            const timeline = gsap.timeline({
                defaults: { ease: "power2.out" },
                onComplete: finalizeEyebrowLetters,
            });

            timeline
                .fromTo(
                    ".eyebrow-icon",
                    { scale: 0.35, rotation: -140, autoAlpha: 0, transformOrigin: "50% 50%" },
                    { scale: 1, rotation: 0, autoAlpha: 1, duration: 0.64, ease: "back.out(1.9)", stagger: 0.05 },
                    0
                )
                .fromTo(
                    ".eyebrow-letter",
                    { y: -14, scale: 0.82, autoAlpha: 0 },
                    {
                        y: 0,
                        scale: 1,
                        autoAlpha: 1,
                        duration: 0.38,
                        ease: "bounce.out",
                        stagger: 0.02,
                        // Runs when the full stagger finishes (not on a timer tied to unrelated tweens).
                        onComplete: finalizeEyebrowLetters,
                    },
                    0.1
                )
                .fromTo(
                    headingRef.current,
                    { autoAlpha: 0, y: 34, scale: 0.92, filter: "blur(1px)" },
                    { autoAlpha: 1, y: 0, scale: 1, filter: "blur(0px)", duration: 1.02, ease: "power2.out" },
                    "-=0.18"
                );

            if (accentParts.length > 0) {
                timeline.fromTo(
                    ".accent-item",
                    { autoAlpha: 0, y: 14, scale: 0.9, transformOrigin: "50% 50%" },
                    {
                        autoAlpha: 1,
                        y: 0,
                        scale: 1,
                        duration: 0.34,
                        ease: "power3.out",
                        stagger: 0.08,
                        force3D: true,
                    },
                    "-=0.82"
                );

                timeline.fromTo(
                    ".accent-word",
                    { color: "#ffffff" },
                    {
                        color: "#b7e9f7",
                        duration: 0.36,
                        ease: "power3.out",
                        stagger: 0.08,
                    },
                    "-=0.82"
                );
            }
        },
        { scope: containerRef }
    );

    return (
        <div ref={containerRef} className={`section-title text-center ${className}`}>
            <div
                className={`text-sm md:text-base font-medium text-gray-300 uppercase tracking-wider mb-2 ${centered ? "justify-center" : "justify-start"
                    } flex items-center gap-2 flex-wrap`}
            >
                {iconType === "star" && eyebrowIcons ? <span className="flex items-center gap-1">{eyebrowIcons}</span> : null}
                {iconType === "asterisk" ? <img src="/has.png" alt="icon" className="eyebrow-icon w-4 h-4 md:w-5 md:h-5 opacity-0" /> : null}
                <span aria-label={eyebrow} className="whitespace-nowrap inline-block">
                    {eyebrowLetters.map((letter, index) => (
                        <span key={`${letter}-${index}`} className="eyebrow-letter inline-block opacity-0" aria-hidden="true">
                            {letter === " " ? "\u00A0" : letter}
                        </span>
                    ))}
                </span>
            </div>
            <h2 ref={headingRef} className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4 opacity-0">
                <span className="block">{heading}</span>
                {accent ? (
                    <span
                        className={`mt-1 inline-flex w-full flex-wrap items-center gap-x-2 gap-y-1 ${centered ? "justify-center" : "justify-start"}`}
                    >
                        {accentParts.map((part, index) => {
                            const sep = separatorAfterPart(index);
                            return (
                                <span key={`${part}-${index}`} className="accent-item inline-flex items-baseline opacity-0 text-[0.8em] md:text-[0.78em]">
                                    {renderAccentPartBody(part)}
                                    {sep === "comma" ? (
                                        <span className="accent-comma inline-block text-white">,</span>
                                    ) : sep === "space" ? (
                                        <span className="accent-space-before-amp inline-block" aria-hidden="true">
                                            {" "}
                                        </span>
                                    ) : null}
                                </span>
                            );
                        })}
                    </span>
                ) : null}
            </h2>
        </div>
    );
}

export default GsapPageHeading;