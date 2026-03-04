import { AnimatePresence, motion, useReducedMotion, type Variants } from "framer-motion";

interface AppLoadingOverlayProps {
    isVisible: boolean;
}

const loadingLetters = "XOLOITZQINTLE".split("");
const mobileBlindColumns = Array.from({ length: 6 }, (_, index) => index);
const desktopBlindColumns = Array.from({ length: 10 }, (_, index) => index);

function AppLoadingOverlay({ isVisible }: AppLoadingOverlayProps) {
    const shouldReduceMotion = useReducedMotion();

    const overlayVariants: Variants = {
        hidden: {
            opacity: 0,
            scale: shouldReduceMotion ? 1 : 1.01,
            filter: shouldReduceMotion ? "none" : "blur(2px)",
        },
        visible: {
            opacity: 1,
            scale: 1,
            filter: "blur(0px)",
            transition: { duration: shouldReduceMotion ? 0.1 : 0.18, ease: "easeOut" },
        },
        exit: {
            opacity: shouldReduceMotion ? 0 : [1, 1, 0],
            scale: 1,
            transition: shouldReduceMotion
                ? { duration: 0.1, ease: "easeInOut" }
                : { duration: 0.42, times: [0, 0.9, 1], ease: "easeInOut" },
        },
    };

    const blindsContainerVariants: Variants = {
        hidden: {},
        visible: {},
        exit: {},
    };

    const blindPanelVariants: Variants = {
        hidden: {
            x: 0,
        },
        visible: {
            x: 0,
        },
        exit: {
            x: shouldReduceMotion ? 0 : "-106%",
            transition: {
                duration: shouldReduceMotion ? 0.01 : 0.45,
                ease: [0.2, 0.9, 0.22, 1],
            },
        },
    };

    const contentVariants: Variants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1 },
        exit: {
            opacity: 0,
            scale: shouldReduceMotion ? 1 : 0.98,
            transition: { duration: shouldReduceMotion ? 0.08 : 0.12, ease: "easeOut" },
        },
    };

    const letterVariants: Variants = {
        hidden: {
            opacity: 0,
            y: shouldReduceMotion ? 0 : 18,
            scale: shouldReduceMotion ? 1 : 0.96,
            filter: shouldReduceMotion ? "none" : "blur(1.8px)",
            color: shouldReduceMotion ? "#28aae4" : "#666666",
        },
        visible: {
            opacity: shouldReduceMotion ? 1 : [0, 1],
            y: shouldReduceMotion ? 0 : [18, -1.5, 0],
            scale: shouldReduceMotion ? 1 : [1, 1.1, 0.985, 1],
            color: shouldReduceMotion ? "#28aae4" : ["#666666", "#d3d3d3", "#28aae4"],
            filter: shouldReduceMotion
                ? "blur(0px)"
                : ["blur(0px) brightness(1)", "blur(0px) brightness(0.78)", "blur(0px) brightness(1)"],
            transition: shouldReduceMotion
                ? {
                    duration: 0.14,
                    ease: [0.22, 1, 0.36, 1],
                }
                : {
                    y: {
                        duration: 0.2,
                        times: [0, 0.82, 1],
                        ease: [0.22, 1, 0.36, 1],
                    },
                    scale: {
                        duration: 0.2,
                        times: [0, 0.5, 0.82, 1],
                        ease: [0.22, 1, 0.36, 1],
                    },
                    opacity: {
                        duration: 0.18,
                        times: [0, 1],
                        ease: "easeOut",
                    },
                    color: {
                        duration: 0.2,
                        times: [0, 0.58, 1],
                        ease: "easeOut",
                    },
                    filter: {
                        duration: 0.2,
                        times: [0, 0.72, 1],
                        ease: "easeOut",
                    },
                },
        },
    };

    const lettersContainerVariants: Variants = {
        hidden: {},
        visible: {
            transition: {
                staggerChildren: shouldReduceMotion ? 0 : 0.022,
                delayChildren: shouldReduceMotion ? 0 : 0.01,
            },
        },
    };

    return (
        <AnimatePresence>
            {isVisible ? (
                <motion.div
                    key="app-loader"
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    variants={overlayVariants}
                    className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
                >
                    {!shouldReduceMotion && (
                        <>
                            <motion.div
                                variants={blindsContainerVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                className="pointer-events-none absolute inset-0 grid grid-cols-6 md:hidden"
                                aria-hidden="true"
                            >
                                {mobileBlindColumns.map((column) => (
                                    <div
                                        key={`blind-mobile-${column}`}
                                        className="relative h-full overflow-hidden"
                                    >
                                        <motion.div
                                            variants={blindPanelVariants}
                                            className="absolute inset-0 will-change-transform"
                                            style={{ backgroundColor: "var(--bg)" }}
                                        />
                                    </div>
                                ))}
                            </motion.div>

                            <motion.div
                                variants={blindsContainerVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                className="pointer-events-none absolute inset-0 hidden md:grid md:grid-cols-10"
                                aria-hidden="true"
                            >
                                {desktopBlindColumns.map((column) => (
                                    <div
                                        key={`blind-desktop-${column}`}
                                        className="relative h-full overflow-hidden"
                                    >
                                        <motion.div
                                            variants={blindPanelVariants}
                                            className="absolute inset-0 will-change-transform"
                                            style={{ backgroundColor: "var(--bg)" }}
                                        />
                                    </div>
                                ))}
                            </motion.div>
                        </>
                    )}

                    <motion.div
                        variants={contentVariants}
                        className="relative z-10 flex flex-col items-center gap-4 px-4 text-center"
                    >
                        <motion.div
                            initial={{ rotate: 0 }}
                            animate={{ rotate: 360 }}
                            transition={{
                                repeat: Infinity,
                                duration: shouldReduceMotion ? 0.9 : 0.72,
                                ease: "linear",
                            }}
                            className="h-14 w-14 rounded-full border-4 border-[#5cc1d6]/20 border-t-[#5cc1d6]"
                        />

                        <motion.div
                            variants={lettersContainerVariants}
                            initial="hidden"
                            animate="visible"
                            className="flex flex-wrap justify-center gap-1 text-3xl font-bold uppercase tracking-[0.2em] text-white md:text-5xl"
                        >
                            {loadingLetters.map((letter, index) => (
                                <motion.span
                                    key={`${letter}-${index}`}
                                    variants={letterVariants}
                                    className="inline-block"
                                >
                                    {letter}
                                </motion.span>
                            ))}
                        </motion.div>

                        <motion.p
                            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: shouldReduceMotion ? 0 : 0.14, duration: 0.16 }}
                            className="text-sm uppercase tracking-[0.3em] text-white/70"
                        >
                            Loading
                        </motion.p>
                    </motion.div>
                </motion.div>
            ) : null}
        </AnimatePresence>
    );
}

export default AppLoadingOverlay;