"use client";

import { motion } from "framer-motion";
import { Spotlight } from "@/components/ui/spotlight-new";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import Navbar from "@/components/navbar";
import Link from "next/link";
import { PLAN_DETAILS } from "@/lib/stripe-client";
import { useEffect, useState } from "react";

interface Model {
    id: string;
    plan_requirements: string[];
    owned_by: string;
    endpoints: string[];
}

interface ModelCounts {
    free: number;
    economy: number;
    basic: number;
    premium: number;
    pro: number;
    ultra: number;
    enterprise: number;
}

function countModelsForPlan(models: Model[], plan: string): number {
    return models.filter(model => model.plan_requirements.includes(plan)).length;
}

export default function Pricing() {
    const [modelCounts, setModelCounts] = useState<ModelCounts | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchModels() {
            try {
                const response = await fetch('https://api.voidai.app/v1/models');
                const data = await response.json();
                const models: Model[] = data.data || [];
                
                setModelCounts({
                    free: countModelsForPlan(models, 'free'),
                    economy: countModelsForPlan(models, 'economy'),
                    basic: countModelsForPlan(models, 'basic'),
                    premium: countModelsForPlan(models, 'premium'),
                    pro: countModelsForPlan(models, 'pro'),
                    ultra: countModelsForPlan(models, 'ultra'),
                    enterprise: countModelsForPlan(models, 'enterprise'),
                });
            } catch (error) {
                console.error('Failed to fetch models:', error);
                // Fallback counts if API fails
                setModelCounts({
                    free: 70,
                    economy: 70,
                    basic: 80,
                    premium: 85,
                    pro: 85,
                    ultra: 86,
                    enterprise: 86,
                });
            } finally {
                setLoading(false);
            }
        }
        fetchModels();
    }, []);

    const ModelCount = ({ plan }: { plan: keyof ModelCounts }) => {
        if (loading || !modelCounts) {
            return <span className="inline-block w-8 h-4 bg-white/10 rounded animate-pulse mr-1" />;
        }
        return <span className="text-emerald-400 font-semibold">{modelCounts[plan]} </span>;
    };

    return (
        <div className="flex flex-col min-h-screen w-full bg-grid-white/[0.02]">
            <Spotlight />
            <Navbar />

            <main className="flex-1 pt-[18vh] px-4">
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-400 pb-3 leading-tight">
                        Simple, transparent pricing
                    </h1>
                    <p className="text-muted-foreground mt-4">Choose the plan that&apos;s right for you</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto px-4">
                    {/* Free Plan */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="rounded-2xl border border-white/10 bg-black/50 p-8 backdrop-blur-sm flex flex-col min-h-[500px]"
                    >
                        <div>
                            <h3 className="text-2xl font-bold">{PLAN_DETAILS.free.name}</h3>
                            <p className="text-3xl font-bold mt-2">${PLAN_DETAILS.free.monthlyPrice}<span className="text-lg font-normal">/month</span></p>
                        </div>
                        <ul className="mt-8 space-y-3 text-sm flex-1">
                            <li className="flex items-center">
                                <span className="text-green-400 mr-2">✓</span>
                                125,000 Credits per Day
                            </li>
                            <li className="flex items-center">
                                <span className="text-green-400 mr-2">✓</span>
                                <ModelCount plan="free" /> models available
                            </li>
                            <li className="flex items-center">
                                <span className="text-green-400 mr-2">✓</span>
                                GPT-4o, GPT-5, Gemini, DeepSeek
                            </li>
                            <li className="flex items-center">
                                <span className="text-green-400 mr-2">✓</span>
                                Claude Haiku models
                            </li>
                            <li className="flex items-center">
                                <span className="text-red-400 mr-2">✗</span>
                                No Claude Sonnet/Opus
                            </li>
                            <li className="flex items-center">
                                <span className="text-red-400 mr-2">✗</span>
                                No o1/o3 reasoning models
                            </li>
                            <li className="flex items-center">
                                <span className="text-green-400 mr-2">✓</span>
                                Community Support
                            </li>
                        </ul>
                        <div className="mt-auto">
                            <Link href="/register">
                                <ShimmerButton className="w-full">
                                    Get Started
                                </ShimmerButton>
                            </Link>
                        </div>
                    </motion.div>

                    {/* Economy Plan */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="rounded-2xl border border-white/10 bg-black/50 p-8 backdrop-blur-sm flex flex-col min-h-[500px]"
                    >
                        <div>
                            <h3 className="text-2xl font-bold">{PLAN_DETAILS.economy.name}</h3>
                            <p className="text-3xl font-bold mt-2">${PLAN_DETAILS.economy.monthlyPrice}<span className="text-lg font-normal">/month</span></p>
                            <p className="text-sm text-muted-foreground mt-2">or ${PLAN_DETAILS.economy.yearlyPrice}/year</p>
                        </div>
                        <ul className="mt-8 space-y-3 text-sm flex-1">
                            <li className="flex items-center">
                                <span className="text-green-400 mr-2">✓</span>
                                650,000 Credits per Day
                            </li>
                            <li className="flex items-center">
                                <span className="text-green-400 mr-2">✓</span>
                                <ModelCount plan="economy" /> models available
                            </li>
                            <li className="flex items-center">
                                <span className="text-green-400 mr-2">✓</span>
                                GPT-4o, GPT-5, Gemini, DeepSeek
                            </li>
                            <li className="flex items-center">
                                <span className="text-green-400 mr-2">✓</span>
                                Claude Haiku models
                            </li>
                            <li className="flex items-center">
                                <span className="text-red-400 mr-2">✗</span>
                                No Claude Sonnet/Opus
                            </li>
                            <li className="flex items-center">
                                <span className="text-green-400 mr-2">✓</span>
                                Basic Support
                            </li>
                        </ul>
                        <div className="mt-auto">
                            <Link href="/register">
                                <ShimmerButton className="w-full">
                                    Subscribe Now
                                </ShimmerButton>
                            </Link>
                        </div>
                    </motion.div>

                    {/* Basic Plan */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="rounded-2xl border border-white/10 bg-black/50 p-8 backdrop-blur-sm flex flex-col min-h-[500px]"
                    >
                        <div>
                            <h3 className="text-2xl font-bold">{PLAN_DETAILS.basic.name}</h3>
                            <p className="text-3xl font-bold mt-2">${PLAN_DETAILS.basic.monthlyPrice}<span className="text-lg font-normal">/month</span></p>
                            <p className="text-sm text-muted-foreground mt-2">or ${PLAN_DETAILS.basic.yearlyPrice}/year</p>
                        </div>
                        <ul className="mt-8 space-y-3 text-sm flex-1">
                            <li className="flex items-center">
                                <span className="text-green-400 mr-2">✓</span>
                                1,000,000 Credits per Day
                            </li>
                            <li className="flex items-center">
                                <span className="text-green-400 mr-2">✓</span>
                                <ModelCount plan="basic" /> models available
                            </li>
                            <li className="flex items-center">
                                <span className="text-green-400 mr-2">✓</span>
                                o3 reasoning, Claude Sonnet
                            </li>
                            <li className="flex items-center">
                                <span className="text-green-400 mr-2">✓</span>
                                Sora-2 video generation
                            </li>
                            <li className="flex items-center">
                                <span className="text-green-400 mr-2">✓</span>
                                Imagen 3.0 image generation
                            </li>
                            <li className="flex items-center">
                                <span className="text-red-400 mr-2">✗</span>
                                No Claude Opus models
                            </li>
                            <li className="flex items-center">
                                <span className="text-green-400 mr-2">✓</span>
                                Priority Support
                            </li>
                        </ul>
                        <div className="mt-auto">
                            <Link href="/register">
                                <ShimmerButton className="w-full">
                                    Subscribe Now
                                </ShimmerButton>
                            </Link>
                        </div>
                    </motion.div>

                    {/* Premium Plan */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25 }}
                        className="rounded-2xl border border-white/10 bg-black/50 p-8 backdrop-blur-sm relative overflow-hidden flex flex-col min-h-[500px]"
                    >
                        <div className="absolute top-2 right-2 rounded-xl bg-gradient-to-bl from-emerald-400 to-transparent text-xs px-3 py-1">
                            Recommended
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold">{PLAN_DETAILS.premium.name}</h3>
                            <p className="text-3xl font-bold mt-2">${PLAN_DETAILS.premium.monthlyPrice}<span className="text-lg font-normal">/month</span></p>
                            <p className="text-sm text-muted-foreground mt-2">or ${PLAN_DETAILS.premium.yearlyPrice}/year</p>
                        </div>
                        <ul className="mt-8 space-y-3 text-sm flex-1">
                            <li className="flex items-center">
                                <span className="text-green-400 mr-2">✓</span>
                                4,250,000 Credits per Day
                            </li>
                            <li className="flex items-center">
                                <span className="text-green-400 mr-2">✓</span>
                                <ModelCount plan="premium" /> models available
                            </li>
                            <li className="flex items-center">
                                <span className="text-green-400 mr-2">✓</span>
                                o1 & o3 reasoning models
                            </li>
                            <li className="flex items-center">
                                <span className="text-green-400 mr-2">✓</span>
                                Claude Opus models
                            </li>
                            <li className="flex items-center">
                                <span className="text-green-400 mr-2">✓</span>
                                Sora-2 Pro, Imagen 4.0, Flux
                            </li>
                            <li className="flex items-center">
                                <span className="text-red-400 mr-2">✗</span>
                                No Midjourney
                            </li>
                            <li className="flex items-center">
                                <span className="text-green-400 mr-2">✓</span>
                                Priority Support
                            </li>
                        </ul>
                        <div className="mt-auto">
                            <Link href="/register">
                                <ShimmerButton className="w-full">
                                    Subscribe Now
                                </ShimmerButton>
                            </Link>
                        </div>
                    </motion.div>

                    {/* Pro Plan */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="rounded-2xl border border-white/10 bg-black/50 p-8 backdrop-blur-sm flex flex-col min-h-[500px]"
                    >
                        <div>
                            <h3 className="text-2xl font-bold">{PLAN_DETAILS.pro.name}</h3>
                            <p className="text-3xl font-bold mt-2">${PLAN_DETAILS.pro.monthlyPrice}<span className="text-lg font-normal">/month</span></p>
                            <p className="text-sm text-muted-foreground mt-2">or ${PLAN_DETAILS.pro.yearlyPrice}/year</p>
                        </div>
                        <ul className="mt-8 space-y-3 text-sm flex-1">
                            <li className="flex items-center">
                                <span className="text-green-400 mr-2">✓</span>
                                8,500,000 Credits per Day
                            </li>
                            <li className="flex items-center">
                                <span className="text-green-400 mr-2">✓</span>
                                <ModelCount plan="pro" /> models available
                            </li>
                            <li className="flex items-center">
                                <span className="text-green-400 mr-2">✓</span>
                                All OpenAI & Claude models
                            </li>
                            <li className="flex items-center">
                                <span className="text-green-400 mr-2">✓</span>
                                All image & video models
                            </li>
                            <li className="flex items-center">
                                <span className="text-green-400 mr-2">✓</span>
                                Gemini 3.0 Pro, Grok-4
                            </li>
                            <li className="flex items-center">
                                <span className="text-red-400 mr-2">✗</span>
                                No Midjourney
                            </li>
                            <li className="flex items-center">
                                <span className="text-green-400 mr-2">✓</span>
                                Priority Support
                            </li>
                        </ul>
                        <div className="mt-auto">
                            <Link href="/register">
                                <ShimmerButton className="w-full">
                                    Subscribe Now
                                </ShimmerButton>
                            </Link>
                        </div>
                    </motion.div>

                    {/* Ultra Plan */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.35 }}
                        className="rounded-2xl border border-white/10 bg-black/50 p-8 backdrop-blur-sm flex flex-col min-h-[500px]"
                    >
                        <div>
                            <h3 className="text-2xl font-bold">{PLAN_DETAILS.ultra.name}</h3>
                            <p className="text-3xl font-bold mt-2">${PLAN_DETAILS.ultra.monthlyPrice}<span className="text-lg font-normal">/month</span></p>
                            <p className="text-sm text-muted-foreground mt-2">or ${PLAN_DETAILS.ultra.yearlyPrice}/year</p>
                        </div>
                        <ul className="mt-8 space-y-3 text-sm flex-1">
                            <li className="flex items-center">
                                <span className="text-green-400 mr-2">✓</span>
                                12,500,000 Credits per Day
                            </li>
                            <li className="flex items-center">
                                <span className="text-green-400 mr-2">✓</span>
                                <ModelCount plan="ultra" /> models available
                            </li>
                            <li className="flex items-center">
                                <span className="text-green-400 mr-2">✓</span>
                                Every AI model included
                            </li>
                            <li className="flex items-center">
                                <span className="text-green-400 mr-2">✓</span>
                                Midjourney image generation
                            </li>
                            <li className="flex items-center">
                                <span className="text-green-400 mr-2">✓</span>
                                Claude Opus 4.5, GPT-5 Codex
                            </li>
                            <li className="flex items-center">
                                <span className="text-green-400 mr-2">✓</span>
                                Premium Support
                            </li>
                        </ul>
                        <div className="mt-auto">
                            <Link href="/register">
                                <ShimmerButton className="w-full">
                                    Subscribe Now
                                </ShimmerButton>
                            </Link>
                        </div>
                    </motion.div>

                    {/* Enterprise Plan */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="rounded-2xl border border-white/10 bg-black/50 p-8 backdrop-blur-sm flex flex-col min-h-[500px]"
                    >
                        <div>
                            <h3 className="text-2xl font-bold">{PLAN_DETAILS.enterprise.name}</h3>
                            <p className="text-3xl font-bold mt-2">${PLAN_DETAILS.enterprise.monthlyPrice}<span className="text-lg font-normal">/month</span></p>
                            <p className="text-sm text-muted-foreground mt-2">or ${PLAN_DETAILS.enterprise.yearlyPrice}/year</p>
                        </div>
                        <ul className="mt-8 space-y-3 text-sm flex-1">
                            <li className="flex items-center">
                                <span className="text-green-400 mr-2">✓</span>
                                80,000,000 Credits per Day
                            </li>
                            <li className="flex items-center">
                                <span className="text-green-400 mr-2">✓</span>
                                <ModelCount plan="enterprise" /> models available
                            </li>
                            <li className="flex items-center">
                                <span className="text-green-400 mr-2">✓</span>
                                Every model, no restrictions
                            </li>
                            <li className="flex items-center">
                                <span className="text-green-400 mr-2">✓</span>
                                Midjourney image generation
                            </li>
                            <li className="flex items-center">
                                <span className="text-green-400 mr-2">✓</span>
                                Highest rate limits
                            </li>
                            <li className="flex items-center">
                                <span className="text-green-400 mr-2">✓</span>
                                Dedicated Support
                            </li>
                        </ul>
                        <div className="mt-auto">
                            <Link href="/register">
                                <ShimmerButton className="w-full">
                                    Subscribe Now
                                </ShimmerButton>
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </main>

            <footer className="py-4 w-full items-center justify-center mt-16">
                <div className="text-center text-sm text-muted-foreground">
                    © 2025 voidai. All rights reserved.
                </div>
            </footer>
        </div>
    );
}
