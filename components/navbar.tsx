"use client";

import Link from "next/link";
import { ModernButton } from "@/components/ui/modern-button";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    // Set initial state
    handleScroll();

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [scrolled]);

  return (
    <motion.header 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed w-full z-50 top-4 px-4"
    >
      <div 
        className={`w-full px-6 mx-auto flex items-center justify-between h-16 max-w-6xl rounded-full ${
          scrolled
            ? "bg-black/40 backdrop-blur-lg border border-white/08 rounded-full shadow-[0_0_15px_rgba(139,92,246,0.15)]"
            : "bg-black/30 backdrop-blur-md border border-white/05 rounded-full"
        }`}
      >
        <Link href="/" className="relative font-bold text-2xl group">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
            void<span className="text-white/90">ai</span>
          </span>
          <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-400 to-purple-600 transition-all duration-300 group-hover:w-full"></span>
        </Link>

        {}
        <nav className="hidden md:flex items-center justify-center absolute left-0 right-0 mx-auto w-fit space-x-8 text-white/80 text-sm pointer-events-auto">
          {["Home", "Models", "API Access", "Docs"].map((item, index) => {
            if (!item) return null;
            const href = item === "Home" ? "/" : item === "Docs" ? "https://docs.voidai.app" : item === "API Access" ? "/pricing" : `/${item.toLowerCase()}`;
            const isExternal = item === "Docs";

            return (
              <motion.div
                key={item}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 * index }}
                className="relative group"
              >
                {isExternal ? (
                  <a 
                    href={href} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="py-2 px-1 text-sm font-medium tracking-wide hover:text-white transition-colors"
                  >
                    {item}
                  </a>
                ) : (
                  <Link 
                    href={href}
                    className="py-2 px-1 text-sm font-medium tracking-wide hover:text-white transition-colors"
                  >
                    {item}
                  </Link>
                )}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-400 to-purple-600 transition-all duration-300 group-hover:w-full"></span>
              </motion.div>
            );
          })}
        </nav>

        {}
        <div className="md:hidden flex items-center">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-white/80 hover:text-white focus:outline-none transition-colors duration-200"
          >
            {mobileMenuOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            )}
          </button>
        </div>

        {}
        <div className="items-center gap-3 hidden md:flex">
          <Link href="/models">
            <ModernButton size="md">Browse models</ModernButton>
          </Link>
        </div>
      </div>

      {}
      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden absolute top-16 left-4 right-4 bg-black/30 backdrop-blur-md border border-white/05 rounded-2xl p-4 z-50"
        >
          <nav className="flex flex-col space-y-4 pb-4">
            <Link 
              href="/" 
              className="py-2 px-4 hover:bg-white/5 rounded-lg transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link 
              href="/models"
              className="py-2 px-4 hover:bg-white/5 rounded-lg transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Models
            </Link>
            <Link
              href="/pricing" 
              className="py-2 px-4 hover:bg-white/5 rounded-lg transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              API access
            </Link>
            <a 
              href="https://docs.voidai.app" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="py-2 px-4 hover:bg-white/5 rounded-lg transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Docs
            </a>
          </nav>

          <div className="pt-4 border-t border-white/10 flex flex-col space-y-2">
            <Link href="/models" onClick={() => setMobileMenuOpen(false)} className="w-full">
              <ModernButton className="w-full">Browse models</ModernButton>
            </Link>
          </div>
        </motion.div>
      )}
    </motion.header>
  );
}