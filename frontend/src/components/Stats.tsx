import { motion } from "framer-motion";

const STATS = [
    { value: "2.3M", label: "essays and stories published" },
    { value: "40k", label: "active writers this month" },
    { value: "180+", label: "countries represented" },
    { value: "12 min", label: "average time readers spend per piece" },
];

export default function Stats() {
    return (
        <section id="stats" className="px-6 md:px-10 py-16 border-y border-rule">
            <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-6">
                {STATS.map((stat, idx) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.6 }}
                        transition={{ duration: 0.5, ease: "easeOut", delay: idx * 0.08 }}
                    >
                        <motion.p
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.3, delay: idx * 0.08 + 0.1 }}
                            className="font-serif text-3xl md:text-4xl text-ink"
                        >
                            {stat.value}
                        </motion.p>
                        <motion.p
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.3, delay: idx * 0.08 + 0.2 }}
                            className="text-meta text-[14px] mt-1.5 leading-snug"
                        >
                            {stat.label}
                        </motion.p>
                    </motion.div>
                ))}
            </div>
        </section>
    );
}