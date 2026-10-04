"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Boxes, ExternalLink, Globe2, Server } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/navbar";
import { ModernButton } from "@/components/ui/modern-button";

const features = [
  {
    icon: Boxes,
    title: "Public model catalog",
    description: "Browse models and supported endpoints from the VoidAI API without signing in.",
  },
  {
    icon: Server,
    title: "Separate serving service",
    description: "Model requests are handled by the external VoidAI API, not by this dashboard site.",
  },
  {
    icon: Globe2,
    title: "No local accounts",
    description: "This site has no registration, login, or API-key management system.",
  },
];

export default function Home() {
  const { scrollY } = useScroll();
  const backgroundY = useTransform(scrollY, [0, 900], [0, -120]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-zinc-950 text-white">
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-slate-950 via-zinc-950 to-slate-900" />
      <motion.div style={{ y: backgroundY }} className="pointer-events-none fixed inset-0 -z-10 opacity-20">
        <div className="absolute right-[12%] top-1/4 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute bottom-1/4 left-[8%] h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl" />
      </motion.div>

      <Navbar />

      <main>
        <section className="mx-auto grid min-h-[88vh] max-w-7xl items-center gap-14 px-6 pb-20 pt-32 lg:grid-cols-[1.1fr_0.9fr]">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl"
          >
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/5 px-4 py-2 text-sm text-cyan-100">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              VoidAI public catalog
            </p>
            <h1 className="text-5xl font-semibold leading-[1.06] sm:text-6xl lg:text-7xl">
              Find the right model for your next idea.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/65">
              Explore models and endpoints published by the VoidAI API. Model inference and its access requirements are managed by that separate service.
            </p>
            <div className="mt-9 flex flex-wrap gap-4">
              <Link href="/models">
                <ModernButton size="lg" className="group min-w-[180px]">
                  Browse models
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </ModernButton>
              </Link>
              <a href="https://docs.voidai.app" target="_blank" rel="noopener noreferrer">
                <ModernButton variant="secondary" size="lg" className="min-w-[180px]">
                  API documentation
                  <ExternalLink className="ml-2 h-4 w-4" />
                </ModernButton>
              </a>
            </div>
          </motion.div>

          <motion.aside
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.65, delay: 0.12 }}
            className="border border-white/10 bg-black/35 p-6 shadow-2xl shadow-black/30 sm:p-8"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-5">
              <div>
                <p className="text-sm text-white/45">Catalog source</p>
                <h2 className="mt-1 text-lg font-semibold">VoidAI API</h2>
              </div>
              <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs text-emerald-200">
                External service
              </span>
            </div>
            <div className="mt-6 rounded-md border border-white/10 bg-zinc-950/80 p-4 font-mono text-sm">
              <p className="text-cyan-200">GET</p>
              <p className="mt-2 break-all text-white/75">https://voidai-backend.onrender.com/v1/models</p>
            </div>
            <p className="mt-5 text-sm leading-6 text-white/55">
              Use this site&apos;s OpenAI-compatible `/v1/chat/completions` route. Responses, including backend errors, are passed through from the separate API service.
            </p>
          </motion.aside>
        </section>

        <section className="border-y border-white/10 bg-white/[0.025] px-6 py-20">
          <div className="mx-auto max-w-7xl">
            <div className="mb-10 max-w-2xl">
              <h2 className="text-3xl font-semibold">A lightweight front door</h2>
              <p className="mt-3 text-white/60">Discover the catalog here; the API service remains responsible for model access.</p>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              {features.map(({ icon: Icon, title, description }, index) => (
                <motion.article
                  key={title}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.08 }}
                  className="border-t border-white/15 pt-5"
                >
                  <Icon className="h-5 w-5 text-cyan-300" aria-hidden="true" />
                  <h3 className="mt-4 text-lg font-medium">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-white/55">{description}</p>
                </motion.article>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-8 text-sm text-white/45">
        <span>© 2026 VoidAI</span>
        <div className="flex gap-5">
          <Link href="/privacy" className="hover:text-white">Privacy</Link>
          <Link href="/tos" className="hover:text-white">Terms</Link>
          <a href="https://docs.voidai.app" target="_blank" rel="noopener noreferrer" className="hover:text-white">Documentation</a>
        </div>
      </footer>
    </div>
  );
}