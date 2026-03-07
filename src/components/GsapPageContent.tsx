import { useEffect, useRef, useState, type ElementType, type ReactNode } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

interface GsapPageContentProps {
    children: ReactNode;
    className?: string;
    as?: ElementType;
    delay?: number;
}

function GsapPageContent({
    children,
    className = "",
    as: Tag = "div",
    delay = 0,
}: GsapPageContentProps) {
    const contentRef = useRef<HTMLElement | null>(null);
    const [hasEnteredView, setHasEnteredView] = useState(false);

    useGSAP(
        () => {
            if (!contentRef.current || hasEnteredView) {
                return;
            }

            gsap.set(contentRef.current, {
                autoAlpha: 0,
                y: 20,
                filter: "blur(1px)",
            });
        },
        { dependencies: [hasEnteredView] }
    );

    useEffect(() => {
        const node = contentRef.current;
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
            { threshold: 0.25, rootMargin: "0px 0px -15% 0px" }
        );

        observer.observe(node);

        return () => observer.disconnect();
    }, [hasEnteredView]);

    useGSAP(
        () => {
            if (!hasEnteredView || !contentRef.current) {
                return;
            }

            gsap.to(
                contentRef.current,
                {
                    autoAlpha: 1,
                    y: 0,
                    filter: "blur(0px)",
                    duration: 0.66,
                    delay,
                    ease: "power2.out",
                }
            );
        },
        { dependencies: [hasEnteredView, delay] }
    );

    return (
        <Tag ref={contentRef as never} className={className}>
            {children}
        </Tag>
    );
}

export default GsapPageContent;
