import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

const NAV_LINKS = ["Discover", "Write", "Membership"];

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const { theme, toggleTheme } = useTheme();

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 8);
        window.addEventListener("scroll", onScroll);
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    return (
        <motion.header
            initial={{ y: -24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className={`fixed top-0 inset-x-0 z-50 transition-colors duration-300 ${scrolled ? "bg-paper/90 backdrop-blur-sm border-b border-rule" : "border-b border-transparent"
                }`}
        >
            <nav className="max-w-6xl mx-auto px-6 md:px-10 h-16 flex items-center justify-between">
                <a href="#top" className="font-serif text-xl tracking-tight text-ink">
                    The Journal
                </a>

                <div className="hidden md:flex items-center gap-8">
                    {NAV_LINKS.map((link) => (
                        <motion.a
                            key={link}
                            href={`#${link.toLowerCase()}`}
                            whileHover={{ y: -1 }}
                            transition={{ type: "spring", stiffness: 400, damping: 20 }}
                            className="relative text-[15px] text-ink-soft hover:text-ink transition-colors"
                        >
                            {link}
                        </motion.a>
                    ))}
                </div>

                <div className="flex items-center gap-4">
                    <motion.button
                        onClick={toggleTheme}
                        whileTap={{ scale: 0.9 }}
                        whileHover={{ scale: 1.1 }}
                        aria-label="Toggle dark mode"
                        className="text-ink-soft hover:text-ink transition-colors p-1.5"
                    >
                        <motion.span
                            key={theme}
                            initial={{ rotate: -60, opacity: 0, scale: 0.5 }}
                            animate={{ rotate: 0, opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3 }}
                            className="block"
                        >
                            {theme === "dark" ? <Sun size={19} /> : <Moon size={19} />}
                        </motion.span>
                    </motion.button>
                    <a
                        href="#"
                        className="hidden sm:inline text-[15px] text-ink-soft hover:text-ink transition-colors"
                    >
                        Sign in
                    </a>

                    <motion.a
                        href="#"
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        className="text-[15px] text-paper bg-ink hover:bg-red transition-colors px-4 py-2 rounded-full"
                    >
                        Start writing
                    </motion.a>
                </div>
            </nav >
        </motion.header >
    );
}