import { motion } from "framer-motion";

const COLUMNS = [
    {
        title: "Read",
        links: ["Discover", "Topics", "Featured writers"],
    },
    {
        title: "Write",
        links: ["New story", "Writer guidelines", "Editor help"],
    },
    {
        title: "The Journal",
        links: ["About", "Careers", "Contact"],
    },
];

export default function Footer() {
    return (
        <footer className="px-6 md:px-10 pt-20 pb-10 border-t border-rule">
            <div className="max-w-6xl mx-auto">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.5 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className="col-span-2"
                    >
                        <p className="font-serif text-xl text-ink mb-3">The Journal</p>
                        <p className="text-meta text-[14px] leading-relaxed max-w-[220px]">
                            A home for independent writing, one draft at a time.
                        </p>
                    </motion.div>

                    {COLUMNS.map((col, idx) => (
                        <motion.div
                            key={col.title}
                            initial={{ opacity: 0, y: 16 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, amount: 0.5 }}
                            transition={{ duration: 0.5, ease: "easeOut", delay: idx * 0.08 }}
                        >
                            <p className="text-ink text-[15px] mb-4">{col.title}</p>
                            <ul className="space-y-2.5">
                                {col.links.map((link) => (
                                    <li key={link}>
                                        <a
                                            href="#"
                                            className="text-meta text-[14px] hover:text-red transition-colors"
                                        >
                                            {link}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    ))}
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-8 border-t border-rule">
                    <p className="text-meta text-[13px]">
                        © {new Date().getFullYear()} The Journal. All stories belong to their writers.
                    </p>
                    <div className="flex gap-6">
                        <a href="#" className="text-meta text-[13px] hover:text-ink transition-colors">
                            Privacy
                        </a>
                        <a href="#" className="text-meta text-[13px] hover:text-ink transition-colors">
                            Terms
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
}