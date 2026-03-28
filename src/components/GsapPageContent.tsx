import {
    useEffect,
    useRef,
    useState,
    type CSSProperties,
    type ElementType,
    type ReactNode,
} from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

/** Default: top-level list items (wraps common `div > ul > li` or root `ul > li`). */
const DEFAULT_STAGGER_SELECTOR = ":scope > ul > li, :scope > li";

interface GsapPageContentProps {
    children?: ReactNode;
    className?: string;
    as?: ElementType;
    delay?: number;
    style?: CSSProperties;
    /**
     * When true, animates each top-level `li` (see `staggerSelector`) in sequence instead of the whole block at once.
     * Nested lists stay with their parent item.
     */
    staggerChildren?: boolean;
    /** Seconds between each staggered child (default 0.12). */
    staggerEach?: number;
    /** Override which elements match for staggering (e.g. `":scope > ul"` for one animation per list). */
    staggerSelector?: string;
    /** IntersectionObserver threshold (default 0.25). Use `0` so bottom-of-page content (e.g. footer) still triggers. */
    intersectionThreshold?: number;
    /** IntersectionObserver rootMargin. Default shrinks the bottom of the viewport; use `"0px"` for footers. */
    intersectionRootMargin?: string;
}

function GsapPageContent({
    children = null,
    className = "",
    as: Tag = "div",
    delay = 0,
    style,
    staggerChildren = false,
    staggerEach = 0.12,
    staggerSelector = DEFAULT_STAGGER_SELECTOR,
    intersectionThreshold = 0.25,
    intersectionRootMargin = "0px 0px -15% 0px",
}: GsapPageContentProps) {
    const contentRef = useRef<HTMLElement | null>(null);
    const [hasEnteredView, setHasEnteredView] = useState(false);

    useGSAP(
        () => {
            if (!contentRef.current) {
                return;
            }

            if (staggerChildren) {
                gsap.set(contentRef.current, { autoAlpha: 1 });
                if (!hasEnteredView) {
                    const nodes = contentRef.current.querySelectorAll(staggerSelector);
                    if (nodes.length > 0) {
                        gsap.set(nodes, {
                            autoAlpha: 0,
                            y: 20,
                            filter: "blur(1px)",
                        });
                    } else {
                        gsap.set(contentRef.current, {
                            autoAlpha: 0,
                            y: 20,
                            filter: "blur(1px)",
                        });
                    }
                }
                return;
            }

            if (!hasEnteredView) {
                gsap.set(contentRef.current, {
                    autoAlpha: 0,
                    y: 20,
                    filter: "blur(1px)",
                });
            }
        },
        { dependencies: [hasEnteredView, staggerChildren, staggerSelector] }
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
            { threshold: intersectionThreshold, rootMargin: intersectionRootMargin }
        );

        observer.observe(node);

        return () => observer.disconnect();
    }, [hasEnteredView, intersectionThreshold, intersectionRootMargin]);

    useGSAP(
        () => {
            if (!hasEnteredView || !contentRef.current) {
                return;
            }

            if (staggerChildren) {
                const nodes = contentRef.current.querySelectorAll(staggerSelector);
                if (nodes.length > 0) {
                    gsap.to(nodes, {
                        autoAlpha: 1,
                        y: 0,
                        filter: "blur(0px)",
                        duration: 0.66,
                        delay,
                        stagger: staggerEach,
                        ease: "power2.out",
                    });
                } else {
                    gsap.to(contentRef.current, {
                        autoAlpha: 1,
                        y: 0,
                        filter: "blur(0px)",
                        duration: 0.66,
                        delay,
                        ease: "power2.out",
                    });
                }
                return;
            }

            gsap.to(contentRef.current, {
                autoAlpha: 1,
                y: 0,
                filter: "blur(0px)",
                duration: 0.66,
                delay,
                ease: "power2.out",
            });
        },
        { dependencies: [hasEnteredView, delay, staggerChildren, staggerEach, staggerSelector] }
    );

    return (
        <Tag ref={contentRef as never} className={className} style={style}>
            {children}
        </Tag>
    );
}

export default GsapPageContent;
