"use client";

import { motion } from "framer-motion";
import { Spotlight } from "@/components/ui/spotlight-new";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import Navbar from "@/components/navbar";
import Link from "next/link";

export default function Pricing() {
    return (
        <div className="flex flex-col min-h-screen w-full bg-grid-white/[0.02]">
            <Spotlight />
            <Navbar />

            <main className="flex flex-1 items-center justify-center px-4 py-24">
                <motion.section
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-2xl text-center"
                >
                    <p className="text-sm font-semibold uppercase tracking-wide text-emerald-400">
                        Separate API service
                    </p>
                    <h1 className="mt-3 text-4xl font-bold leading-tight text-white md:text-5xl">
                        Model access lives outside this site.
                    </h1>
                    <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">
                        This website publishes a model catalog only. The separate VoidAI API service manages inference, access requirements, and any applicable pricing.
                    </p>
                    <div className="mt-8 flex flex-wrap justify-center gap-4">
                        <Link href="/models">
                            <ShimmerButton>Browse models</ShimmerButton>
                        </Link>
                        <a href="https://docs.voidai.app" target="_blank" rel="noopener noreferrer" className="rounded-lg border border-white/15 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-white/5">
                            API documentation
                        </a>
                    </div>
                </motion.section>
            </main>

            <footer className="py-4 text-center text-sm text-muted-foreground">
                © 2026 voidai. All rights reserved.
            </footer>
        </div>
    );
}