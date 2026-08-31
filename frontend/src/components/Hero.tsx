import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const HEADLINE = "Write the thing only you could write.";
const TYPE_SPEED = 42;

export default function Hero() {
    const [typed, setTyped] = useState("");
    const [done, setDone] = useState(false);

    useEffect(() => {
        let i = 0;
        const start = setTimeout(function tick() {
            if (i <= HEADLINE.length) {
                setTyped(HEADLINE.slice(0, i));
                i += 1;
                setTimeout(tick, TYPE_SPEED);
            } else {
                setDone(true);
            }
        }, 400);
        return () => clearTimeout(start);
    }, []);

    return (
        <section id="top" className="relative pt-40 pb-24 md:pt-52 md:pb-32 px-6 md:px-10">
            <div className="max-w-6xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-end">
                    <div className="md:col-span-9">
                        <motion.p
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                            className="text-meta text-[15px] mb-6"
                        >
                            A publication built for people who write
                        </motion.p>

                        <h1 className="font-serif text-[2.5rem] leading-[1.08] md:text-[4.2rem] md:leading-[1.05] text-ink min-h-[4.4em] md:min-h-[2.3em]">
                            {typed}
                            <span
                                className={`inline-block w-[3px] md:w-[4px] h-[0.85em] bg-red ml-1 align-middle ${done ? "animate-pulse" : ""
                                    }`}
                                aria-hidden="true"
                            />
                        </h1>

                        <motion.p
                            initial={{ opacity: 0, y: 10 }}
                            animate={done ? { opacity: 1, y: 0 } : {}}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                            className="mt-8 text-lg text-ink-soft max-w-md leading-relaxed"
                        >
                            The Journal is a quiet corner of the internet for essays, stories, and
                            ideas — no algorithms deciding what you should have written.
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={done ? { opacity: 1, y: 0 } : {}}
                            transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
                            className="mt-10 flex flex-wrap items-center gap-5"
                        >
                            <motion.a
                                href="#write"
                                whileHover={{ scale: 1.03, y: -1 }}
                                whileTap={{ scale: 0.97 }}
                                className="bg-ink text-paper px-6 py-3.5 rounded-full text-[15px] hover:bg-red transition-colors"
                            >
                                Start your first draft
                            </motion.a>

                            <motion.a
                                href="#discover"
                                whileHover={{ x: 3 }}
                                className="text-[15px] text-ink-soft hover:text-ink transition-colors underline decoration-rule underline-offset-4"
                            >
                                Read what people are writing
                            </motion.a>
                        </motion.div>
                    </div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={done ? { opacity: 1 } : {}}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="md:col-span-3 hidden md:flex flex-col gap-1 pb-2"
                    >
                        <span className="font-serif text-5xl text-ink">{typed.length >= HEADLINE.length ? "40k+" : ""}</span>
                        <span className="text-meta text-sm">
                            writers publish here every month
                        </span>
                    </motion.div>
                </div>
            </div>

            <motion.a
                href="#stats"
                initial={{ opacity: 0 }}
                animate={done ? { opacity: 1 } : {}}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="absolute bottom-8 left-1/2 -translate-x-1/2 text-meta hover:text-ink transition-colors"
                aria-label="Scroll down"
            >
                <motion.svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    animate={{ y: [0, 6, 0] }}
                    transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M6 9l6 6 6-6" />
                </motion.svg>
            </motion.a>
        </section>
    );
}