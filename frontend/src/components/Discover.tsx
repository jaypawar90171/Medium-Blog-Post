import { motion } from "framer-motion";

type Article = {
    title: string;
    excerpt: string;
    author: string;
    read: string;
    tag: string;
};

const FEATURED: Article = {
    title: "The case for writing badly first",
    excerpt:
        "Every essay I've published started as something unreadable. Here's why I stopped waiting for the good version to arrive first.",
    author: "Naomi Ruiz",
    read: "9 min read",
    tag: "Craft",
};

const LIST: Article[] = [
    {
        title: "What I learned editing 400 strangers' drafts",
        excerpt:
            "A year of freelance editing taught me more about clarity than four years of journalism school.",
        author: "Devon Marsh",
        read: "6 min read",
        tag: "Notes",
    },
    {
        title: "The neighborhood bakery that outlived three recessions",
        excerpt:
            "A reported piece on Ruth Okafor and the small business that refused to close.",
        author: "Priya Anand",
        read: "11 min read",
        tag: "Reporting",
    },
    {
        title: "On finishing things",
        excerpt:
            "I have forty unfinished drafts. This is the one where I talk about why.",
        author: "Sam Whitfield",
        read: "4 min read",
        tag: "Essay",
    },
];

const reveal = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0 },
};

export default function Discover() {
    return (
        <section id="discover" className="px-6 md:px-10 py-24 md:py-32">
            <div className="max-w-6xl mx-auto">
                <div className="flex items-baseline justify-between mb-12 border-b border-rule pb-6">
                    <motion.h2
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, amount: 0.6 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className="font-serif text-3xl md:text-4xl text-ink"
                    >
                        From the front page
                    </motion.h2>
                    <motion.a
                        href="#"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        whileHover={{ x: 3 }}
                        className="hidden sm:inline text-[15px] text-ink-soft hover:text-red transition-colors"
                    >
                        See all stories
                    </motion.a>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-x-12 gap-y-14">
                    <motion.article
                        variants={reveal}
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true, amount: 0.4 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="md:col-span-7"
                    >
                        <span className="text-red text-[13px] tracking-wide">{FEATURED.tag}</span>
                        <h3 className="font-serif text-[1.9rem] md:text-[2.3rem] leading-[1.15] text-ink mt-3 mb-4">
                            {FEATURED.title}
                        </h3>
                        <p className="text-ink-soft leading-relaxed max-w-lg mb-5">
                            {FEATURED.excerpt}
                        </p>
                        <p className="text-[14px] text-meta">
                            By {FEATURED.author} · {FEATURED.read}
                        </p>
                    </motion.article>

                    <div className="md:col-span-5 flex flex-col divide-y divide-rule">
                        {LIST.map((article, idx) => (
                            <motion.article
                                key={article.title}
                                variants={reveal}
                                initial="hidden"
                                whileInView="show"
                                viewport={{ once: true, amount: 0.4 }}
                                transition={{ duration: 0.55, ease: "easeOut", delay: idx * 0.08 }}
                                className="py-6 first:pt-0 last:pb-0"
                            >
                                <span className="text-sage text-[13px] tracking-wide">{article.tag}</span>
                                <h3 className="font-serif text-xl text-ink mt-2 mb-2 leading-snug">
                                    {article.title}
                                </h3>
                                <p className="text-ink-soft text-[15px] leading-relaxed mb-3">
                                    {article.excerpt}
                                </p>
                                <p className="text-[13px] text-meta">
                                    By {article.author} · {article.read}
                                </p>
                            </motion.article>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}