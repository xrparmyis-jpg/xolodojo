import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAsterisk } from "@fortawesome/free-solid-svg-icons";

gsap.registerPlugin(useGSAP);

interface GsapPageSubHeadingProps {
    heading: string;
    className?: string;
}

function GsapPageSubHeading({ heading, className = "" }: GsapPageSubHeadingProps) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const headingRef = useRef<HTMLHeadingElement | null>(null);
    const [hasEnteredView, setHasEnteredView] = useState(false);

    const headingLetters = Array.from(heading);

    useEffect(() => {
        const node = containerRef.current;
        if (!node || hasEnteredView) {
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                const [entry] = entries;
                if (entry?.isIntersecting) {
                    setHasEnteredView(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.2, rootMargin: "0px 0px -8% 0px" }
        );

        observer.observe(node);

        return () => observer.disconnect();
    }, [hasEnteredView]);

    useGSAP(
        () => {
            if (!hasEnteredView) {
                return;
            }

            const timeline = gsap.timeline({ defaults: { ease: "power2.out" } });

            timeline
                .fromTo(
                    ".subheading-icon",
                    { scale: 0.08, rotation: -360, autoAlpha: 0, transformOrigin: "50% 50%" },
                    { scale: 1.12, rotation: 0, autoAlpha: 1, duration: 0.68, ease: "back.out(2.1)" },
                    0
                )
                .to(
                    ".subheading-icon",
                    { scale: 1.06, duration: 0.2, ease: "power2.out" },
                    "-=0.06"
                )
                .fromTo(
                    headingRef.current,
                    { autoAlpha: 0, y: 10 },
                    { autoAlpha: 1, y: 0, duration: 0.3, ease: "power2.out" },
                    0.04
                )
                .fromTo(
                    ".subheading-letter",
                    { x: -18, autoAlpha: 0, color: "#decee9" },
                    {
                        x: 0,
                        autoAlpha: 1,
                        duration: 0.34,
                        ease: "power3.out",
                        stagger: 0.02,
                    },
                    0.1
                )
                .to(
                    ".subheading-letter",
                    {
                        color: "#28aae4",
                        duration: 0.34,
                        ease: "power2.out",
                        stagger: 0.018,
                    },
                    "-=0.16"
                );
        },
        { scope: containerRef, dependencies: [hasEnteredView] }
    );

    return (
        <div ref={containerRef} className={`mb-4 flex w-full items-center justify-center gap-2 ${className}`}>
            <FontAwesomeIcon
                icon={faAsterisk}
                className="subheading-icon w-5 h-5 md:w-6 md:h-6 opacity-0 text-[#642ff8]"
                aria-label="subheading icon"
            />
            <h3 ref={headingRef} className="text-2xl md:text-3xl font-bold leading-tight text-center opacity-0">
                {headingLetters.map((letter, index) => (
                    <span key={`${letter}-${index}`} className="subheading-letter inline-block opacity-0" aria-hidden="true">
                        {letter === " " ? "\u00A0" : letter}
                    </span>
                ))}
            </h3>
        </div>
    );
}

export default GsapPageSubHeading;
