import { motion } from "framer-motion";

const STEPS = [
  {
    n: "01",
    title: "Draft without distraction",
    body: "A clean editor that gets out of the way — autosave, distraction-free mode, and version history so you never lose a paragraph you cut and later wanted back.",
  },
  {
    n: "02",
    title: "Shape it with your readers",
    body: "Share a draft privately with a few trusted readers before it goes live. Inline comments, not a wall of feedback to wade through.",
  },
  {
    n: "03",
    title: "Publish to people who'll actually read it",
    body: "No engagement-bait algorithm. Your followers see your work in the order you wrote it, and topic pages put it in front of readers who search for it.",
  },
  {
    n: "04",
    title: "Build a body of work, not a feed",
    body: "Your profile reads like a table of contents — organized by series and topic, so a new reader can find where to start.",
  },
];

export default function Write() {
  return (
    <section id="write" className="px-6 md:px-10 py-24 md:py-32 bg-paper-dim">
        <div className="max-w-6xl mx-auto">
        <motion.div
            initial={{ opacity: 0, y: -16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="max-w-lg mb-16"
        >
          <h2 className="font-serif text-3xl md:text-4xl text-ink mb-4">
            From blank page to published
          </h2>
          <p className="text-ink-soft leading-relaxed">
            Every tool on The Journal exists to answer one question: does this
            help the writing, or just the metrics?
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-12">
          {STEPS.map((step, idx) => (
            <motion.div
              key={step.n}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.55, ease: "easeOut", delay: (idx % 2) * 0.1 }}
              className="flex gap-5 pb-10 border-b border-rule"
            >
              <span className="font-serif text-2xl text-red shrink-0 pt-0.5">
                {step.n}
              </span>
              <div>
                <h3 className="font-serif text-xl text-ink mb-2">{step.title}</h3>
                <p className="text-ink-soft leading-relaxed text-[15px]">{step.body}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}