import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const { i18n } = useTranslation();

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <div className="w-16 h-8 rounded-full bg-muted animate-pulse" />;
    }

    const isDark = theme === 'dark';
    const isRTL = i18n.dir() === 'rtl';

    return (
        <button
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className="relative flex items-center w-16 h-8 rounded-full p-1 transition-colors duration-500 focus:outline-none focus:ring-2 focus:ring-primary/50 group"
            style={{
                backgroundColor: isDark ? 'var(--secondary)' : '#e2e8f0',
            }}
            aria-label="Changer de thème"
            dir="ltr"
        >
            {/* Track Background Accent */}
            <motion.div
                className="absolute inset-0 rounded-full opacity-20"
                animate={{
                    backgroundColor: isDark ? 'var(--primary)' : 'transparent',
                }}
                transition={{ duration: 0.5 }}
            />

            {/* Switch Thumb */}
            <motion.div
                className="relative z-10 w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center overflow-hidden"
                initial={false}
                animate={{
                    x: isDark ? 32 : 0,
                }}
                transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 30,
                }}
            >
                <AnimatePresence mode="wait" initial={false}>
                    {isDark ? (
                        <motion.div
                            key="moon"
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -20, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <Moon className="w-3.5 h-3.5 text-primary fill-primary" />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="sun"
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -20, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <Sun className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* Decorative Icons on Track */}
            <div className="absolute inset-0 flex items-center justify-between px-2 text-muted-foreground/40 pointer-events-none">
                <Sun className={`w-3.5 h-3.5 transition-opacity duration-300 ${isDark ? 'opacity-100' : 'opacity-0'}`} />
                <Moon className={`w-3.5 h-3.5 transition-opacity duration-300 ${isDark ? 'opacity-0' : 'opacity-100'}`} />
            </div>
        </button>
    );
}
