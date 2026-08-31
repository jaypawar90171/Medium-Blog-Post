import { motion } from "framer-motion";
import { Check } from "lucide-react";

const FREE_PERKS = [
    "Publish unlimited stories",
    "Basic profile & portfolio page",
    "Comment and follow other writers",
];

const MEMBER_PERKS = [
    "Everything in Free",
    "Earn from your writing via the members' pool",
    "Full reading stats and audience insights",
    "Priority placement on topic pages",
    "Access to editor office hours",
];

export default function Membership() {
    return (
        <section id="membership" className="px-6 md:px-10 py-24 md:py-32">
            <div className="max-w-6xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: -16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.6 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="max-w-lg mb-16"
                >
                    <h2 className="font-serif text-3xl md:text-4xl text-ink mb-4">
                        Free to write. Paid to be read well.
                    </h2>
                    <p className="text-ink-soft leading-relaxed">
                        Anyone can publish on The Journal. Membership is for writers who want
                        to earn from the work and readers who want to support them
                        directly.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-6">
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.4 }}
                        whileHover={{ y: -6 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        className="border border-rule rounded-2xl p-8 md:p-10"
                    >
                        <p className="text-meta text-[14px] mb-2">For every writer</p>
                        <p className="font-serif text-4xl text-ink mb-6">Free</p>
                        <ul className="space-y-3.5 mb-8">
                            {FREE_PERKS.map((perk) => (
                                <li key={perk} className="flex items-start gap-3 text-[15px] text-ink-soft">
                                    <Check size={18} className="text-sage shrink-0 mt-0.5" strokeWidth={2} />
                                    {perk}
                                </li>
                            ))}
                        </ul>
                        <a
                            href="#"
                            className="block text-center border border-ink text-ink px-6 py-3 rounded-full text-[15px] hover:bg-ink hover:text-paper transition-colors"
                        >
                            Create your account
                        </a>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.4 }}
                        whileHover={{ y: -6 }}
                        transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }} 
                        className="bg-ink text-paper rounded-2xl p-8 md:p-10 relative overflow-hidden"
                    >
                        <p className="text-paper/60 text-[14px] mb-2">For working writers</p>
                        <p className="font-serif text-4xl mb-6">
                            $6<span className="text-lg text-paper/60">/month</span>
                        </p>
                        <ul className="space-y-3.5 mb-8">
                            {MEMBER_PERKS.map((perk) => (
                                <li key={perk} className="flex items-start gap-3 text-[15px] text-paper/85">
                                    <Check size={18} className="text-red shrink-0 mt-0.5" strokeWidth={2} />
                                    {perk}
                                </li>
                            ))}
                        </ul>
                        <a
                            href="#"
                            className="block text-center bg-red text-paper px-6 py-3 rounded-full text-[15px] hover:bg-red-dim transition-colors"
                        >
                            Become a member
                        </a>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}