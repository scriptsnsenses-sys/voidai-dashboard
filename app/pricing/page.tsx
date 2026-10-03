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
                        Free forever
                    </p>
                    <h1 className="mt-3 text-4xl font-bold leading-tight text-white md:text-5xl">
                        Every model. No plans. No payments.
                    </h1>
                    <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">
                        Create an account to use VoidAI. There are no subscriptions, credit balances, or paid tiers.
                    </p>
                    <div className="mt-8 flex flex-wrap justify-center gap-4">
                        <Link href="/register">
                            <ShimmerButton>Get started</ShimmerButton>
                        </Link>
                        <Link
                            href="/dashboard/models"
                            className="rounded-lg border border-white/15 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-white/5"
                        >
                            Browse models
                        </Link>
                    </div>
                </motion.section>
            </main>

            <footer className="py-4 text-center text-sm text-muted-foreground">
                © 2026 voidai. All rights reserved.
            </footer>
        </div>
    );
}