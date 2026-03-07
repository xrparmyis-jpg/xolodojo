import { Children, useEffect, useRef, useState, type ReactNode } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

interface GsapSocialLinksProps {
    children: ReactNode;
    className?: string;
    stagger?: number;
}

function GsapSocialLinks({
    children,
    className = "",
    stagger = 0.08,
}: GsapSocialLinksProps) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [hasEnteredView, setHasEnteredView] = useState(false);

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
            { threshold: 0.25, rootMargin: "0px 0px -8% 0px" }
        );

        observer.observe(node);

        return () => observer.disconnect();
    }, [hasEnteredView]);

    useGSAP(
        () => {
            const items = containerRef.current?.querySelectorAll(".gsap-social-link-item");
            if (!items || items.length === 0) {
                return;
            }

            if (!hasEnteredView) {
                gsap.set(items, {
                    autoAlpha: 0,
                    rotationY: -120,
                    x: -16,
                    scale: 0.72,
                    transformOrigin: "50% 50%",
                    transformPerspective: 900,
                    filter: "blur(1.5px)",
                    backfaceVisibility: "hidden",
                    force3D: true,
                });
                return;
            }

            items.forEach((item, index) => {
                gsap.timeline({ delay: index * stagger, defaults: { overwrite: "auto" } })
                    .fromTo(
                        item,
                        {
                            autoAlpha: 0,
                            rotationY: -120,
                            x: -16,
                            scale: 0.72,
                            filter: "blur(1.5px)",
                            transformOrigin: "50% 50%",
                            transformPerspective: 900,
                            backfaceVisibility: "hidden",
                            force3D: true,
                            immediateRender: false,
                        },
                        {
                            autoAlpha: 1,
                            rotationY: 18,
                            x: 0,
                            scale: 1.08,
                            filter: "blur(0px)",
                            duration: 0.28,
                            ease: "power3.out",
                        }
                    )
                    .to(item, {
                        rotationY: 0,
                        scale: 1,
                        duration: 0.16,
                        ease: "back.out(2)",
                    });
            });
        },
        { scope: containerRef, dependencies: [hasEnteredView, stagger] }
    );

    return (
        <div ref={containerRef} className={`flex items-center gap-2 [perspective:900px] ${className}`}>
            {Children.toArray(children).map((child, index) => (
                <span key={index} className="gsap-social-link-item inline-flex opacity-0">
                    {child}
                </span>
            ))}
        </div>
    );
}

export default GsapSocialLinks;
