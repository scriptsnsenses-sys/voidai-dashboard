"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { ModernButton } from "@/components/ui/modern-button";
import Navbar from "@/components/navbar";
import Link from "next/link";
import { useEffect, useState } from "react";
import { 
  Zap, 
  Shield, 
  Sparkles, 
  Rocket, 
  Code2, 
  Cpu, 
  Globe, 
  ArrowRight,
  Check,
  Star,
  Brain,
  Gauge,
  Lock,
  Users
} from "lucide-react";

interface StatsData {
  totalUsers: string;
  totalApiCalls: string;
  totalTokensProcessed: string;
  uptime: string;
  avgResponseTime: string;
}

interface ActivityData {
  id: string;
  model: string;
  tokens: number;
  credits: number;
  timestamp?: string;
  timeAgo?: string;
  color: string;
  display: string;
}

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [statsData, setStatsData] = useState<StatsData>({
    totalUsers: "0",
    totalApiCalls: "0",
    totalTokensProcessed: "0",
    uptime: "0%",
    avgResponseTime: "0ms"
  });
  const [recentActivity, setRecentActivity] = useState<ActivityData[]>([]);
  const [activityLoading, setActivityLoading] = useState(true);
  const [lastActivityUpdate, setLastActivityUpdate] = useState<string>('');
  const [rawStats, setRawStats] = useState<{tokensProcessed: number, apiCalls: number}>({
    tokensProcessed: 0,
    apiCalls: 0
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const { scrollY } = useScroll();
  const backgroundY = useTransform(scrollY, [0, 1000], [0, -200]);
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);

  // Format number with commas
  const formatNumberWithCommas = (num: number): string => {
    return num.toLocaleString();
  };

  // Fetch real recent activity data with live updates
  const fetchActivity = async () => {
    try {
      const response = await fetch('/api/recent-activity');
      if (response.ok) {
        const data = await response.json();
        setRecentActivity(data.activities || []);
        setLastActivityUpdate(data.lastUpdate || new Date().toISOString());
        setActivityLoading(false);
      }
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      setActivityLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    
    // Fetch real stats data (once on load)
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/public-stats');
        if (response.ok) {
          const data = await response.json();
          setStatsData(data.stats);
          if (data.stats.rawNumbers) {
            setRawStats({
              tokensProcessed: data.stats.rawNumbers.tokensProcessed || 0,
              apiCalls: data.stats.rawNumbers.apiCalls || 0
            });
          }
          setStatsLoading(false);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };
    
    // Initial fetch
    fetchStats();
    fetchActivity();
    
    // Set up live feed - update every 1.5 seconds
    const activityInterval = setInterval(() => {
      fetchActivity();
      fetchStats(); // Also update stats to keep them live
    }, 1500);
    
    // Cleanup interval on unmount
    return () => {
      clearInterval(activityInterval);
    };
  }, []);

  const features = [
    {
      icon: <Brain className="w-6 h-6" />,
      title: "Multiple AI Models",
      description: "Access GPT-5.1, Claude 4.5, Gemini 3, and other leading models through a single API endpoint. Switch between providers without changing your code.",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Optimized Performance",
      description: "Consistent response times under 300ms through intelligent routing and infrastructure optimizations.",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Privacy-First Architecture",
      description: "Your data passes through our servers but is never logged, stored, or used for training. Complete request privacy.",
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: "High Availability",
      description: "99%+ uptime with multi-region deployment and automatic failover. Comprehensive monitoring ensures consistent service.",
      color: "from-orange-500 to-red-500"
    },
    {
      icon: <Code2 className="w-6 h-6" />,
      title: "Developer Experience",
      description: "Drop-in compatibility with OpenAI SDK. Comprehensive documentation, clear error messages, and stable API versioning.",
      color: "from-indigo-500 to-purple-500"
    },
    {
      icon: <Gauge className="w-6 h-6" />,
      title: "Free Forever",
      description: "Use every available model without subscriptions, paid plans, or credit balances.",
      color: "from-pink-500 to-rose-500"
    }
  ];

  const stats = [
    { label: "API Calls Served", value: statsData.totalApiCalls, icon: <Rocket className="w-5 h-5" /> },
    { label: "Active Developers", value: statsData.totalUsers, icon: <Users className="w-5 h-5" /> },
    { label: "Uptime SLA", value: statsData.uptime, icon: <Shield className="w-5 h-5" /> },
    { label: "Avg Response Time*", value: statsData.avgResponseTime, icon: <Zap className="w-5 h-5" /> }
  ];

  const testimonials = [
    {
      content: "10/10 service, the staff are super nice and helpful and the API is great. This is the best api I have come across, and I am very grateful for the free month, probably subscribing after this fr",
      author: "obscureoto",
      role: "VoidAI User",
      rating: 5
    },
    {
      content: "Have been using it for almost a month. I think, VOID AI is one of the best, the most affordable, equipped with all the necessary tools, responsive support and very reliable api service in the market. They provide bleeding edge models, updated almost the very day those are launched. Nothing to complain about!",
      author: "sai_raj",
      role: "VoidAI User",
      rating: 5
    },
    {
      content: "Works reliably and fast with access to many well known AI models at a fraction of the cost. A question I had regarding Claude access and agentic coding usage was answered quickly. Recommended!",
      author: "ixel",
      role: "VoidAI User",
      rating: 5
    }
  ];

  return (
    <div className="flex flex-col min-h-screen w-full relative overflow-hidden">
      {/* Clean Glassmorphism Background */}
      <div className="fixed inset-0 z-0">
        {/* Base gradient - much more subtle */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800" />
        
        {/* Subtle depth layers */}
        <motion.div 
          style={{ y: backgroundY }}
          className="absolute inset-0"
        >
          {/* Very subtle geometric elements */}
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-blue-500/3 to-purple-500/2 rounded-full blur-3xl" />
          <div className="absolute bottom-1/3 left-1/5 w-80 h-80 bg-gradient-to-tr from-purple-500/2 to-blue-500/1 rounded-full blur-3xl" />
        </motion.div>
        
        {/* Clean grid pattern */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Ccircle cx='7' cy='7' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
        
        {/* Elegant noise texture */}
        <div className="absolute inset-0 opacity-[0.015] mix-blend-soft-light bg-gradient-to-r from-white via-transparent to-white" />
      </div>

      <Navbar />

      <main className="flex-1 relative z-10">
        {/* Clean Glassmorphism Hero Section */}
        <section className="relative min-h-screen flex items-center justify-center px-6 py-32">
          <div className="max-w-7xl mx-auto w-full">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              
              {/* Left Content */}
              <motion.div 
                style={{ opacity: heroOpacity }}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="space-y-8"
              >
                {/* Clean Badge */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full liquid-glass-2 border border-white/10"
                >
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span className="text-sm text-gray-300">
                    Trusted by {statsLoading ? (
                      <span className="inline-block w-8 h-3 bg-gray-600 rounded animate-pulse ml-1"></span>
                    ) : (
                      statsData.totalUsers
                    )} developers
                  </span>
                </motion.div>

                {/* Clean Typography */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="space-y-6"
                >
                  <h1 className="text-5xl md:text-6xl lg:text-7xl font-semibold leading-tight text-white">
                    The AI API that
                    <span className="block text-blue-300 font-light">
                      developers love
                    </span>
                  </h1>
                  
                  <p className="text-xl text-gray-300 leading-relaxed max-w-lg">
                    Access the world's most powerful AI models through one unified API. 
                    Built for scale, optimized for speed.
                  </p>
                </motion.div>

                {/* Clean CTA Buttons */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  className="flex flex-col sm:flex-row gap-4"
                >
                  <Link href="/register">
                    <ModernButton size="lg" className="group min-w-[180px]">
                      <span className="flex items-center gap-2">
                        Start Building
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </ModernButton>
                  </Link>
                  <Link href="https://docs.voidai.app">
                    <ModernButton variant="secondary" size="lg" className="min-w-[180px]">
                      Documentation
                    </ModernButton>
                  </Link>
                </motion.div>

                {/* Clean Trust Indicators */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  className="flex items-center gap-8 pt-8"
                >
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <span className="text-sm text-gray-400">4.9/5</span>
                  </div>
                  <div className="h-4 w-px bg-white/20" />
                  <div className="text-sm text-gray-400">
                    {statsLoading ? (
                      <span className="inline-block w-12 h-3 bg-gray-600 rounded animate-pulse"></span>
                    ) : (
                      <span className="text-white font-semibold">{statsData.totalApiCalls}</span>
                    )} calls
                  </div>
                </motion.div>
              </motion.div>

              {/* Right Glass Panel */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="relative"
              >
                <div className="liquid-glass-enhanced p-8 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">Live API Status</h3>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span className="text-sm text-green-400">Online</span>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Uptime</span>
                      {statsLoading ? (
                        <div className="h-4 w-14 bg-gray-700 rounded animate-pulse"></div>
                      ) : (
                        <span className="text-white font-mono">{statsData.uptime}</span>
                      )}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Active Users</span>
                      {statsLoading ? (
                        <div className="h-4 w-12 bg-gray-700 rounded animate-pulse"></div>
                      ) : (
                        <span className="text-white font-mono">{statsData.totalUsers}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm text-gray-400">Recent Activity</div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <span className="text-xs text-green-400">Live</span>
                      </div>
                    </div>
                    <div className="space-y-2 min-h-[80px]">
                      {activityLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse"></div>
                          <span className="text-xs text-gray-400">Loading live feed...</span>
                        </div>
                      ) : recentActivity.length === 0 ? (
                        <div className="flex items-center gap-2">
                          <div className="w-1 h-1 bg-yellow-400 rounded-full"></div>
                          <span className="text-xs text-gray-400">No recent activity</span>
                        </div>
                      ) : (
                        recentActivity.map((activity) => (
                          <motion.div 
                            key={activity.id} 
                            className="flex items-center gap-2"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            <div className={`w-1 h-1 bg-${activity.color} rounded-full`}></div>
                            <span className="text-xs text-gray-300">{activity.display}</span>
                          </motion.div>
                        ))
                      )}
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm text-gray-400">Total Processing Stats</div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                        <span className="text-xs text-purple-400">Live</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-300">Tokens Processed</span>
                        {statsLoading ? (
                          <div className="h-3 w-20 bg-gray-700 rounded animate-pulse"></div>
                        ) : (
                          <motion.span 
                            key={rawStats.tokensProcessed}
                            initial={{ opacity: 0.7 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3 }}
                            className="text-xs text-white font-mono"
                          >
                            {formatNumberWithCommas(rawStats.tokensProcessed)}
                          </motion.span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-300">Total Requests</span>
                        {statsLoading ? (
                          <div className="h-3 w-16 bg-gray-700 rounded animate-pulse"></div>
                        ) : (
                          <motion.span 
                            key={rawStats.apiCalls}
                            initial={{ opacity: 0.7 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3 }}
                            className="text-xs text-white font-mono"
                          >
                            {formatNumberWithCommas(rawStats.apiCalls)}
                          </motion.span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Clean Glass Stats Section */}
        <section className="py-32 px-6">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4">
                Trusted by developers worldwide
              </h2>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                See why thousands choose VoidAI for their AI infrastructure
              </p>
            </motion.div>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="liquid-glass-enhanced p-6 text-center group hover:scale-105 transition-transform duration-300"
                >
                  <div className="text-blue-400 mb-4 flex justify-center">
                    {stat.icon}
                  </div>
                  <div className="text-3xl font-bold text-white mb-2">
                    {statsLoading ? (
                      <div className="h-8 w-16 bg-gray-700 rounded animate-pulse mx-auto"></div>
                    ) : (
                      stat.value
                    )}
                  </div>
                  <div className="text-sm text-gray-300">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </div>
            
          </div>
        </section>

        {/* Clean Glass Features Section */}
        <section className="py-32 px-6">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4">
                Everything you need to build
                <span className="block text-blue-300 font-light">amazing AI applications</span>
              </h2>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                Powerful features designed to accelerate your development workflow
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="liquid-glass-enhanced p-8 group hover:scale-105 transition-all duration-300"
                >
                  <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${feature.color} mb-6`}>
                    <div className="text-white">
                      {feature.icon}
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-white">
                    {feature.title}
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Clean Glass Testimonials Section */}
        <section className="py-32 px-6">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4">
                What developers are saying
              </h2>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                Real feedback from developers using VoidAI in production
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="liquid-glass-enhanced p-8 group hover:scale-105 transition-all duration-300"
                >
                  {/* Rating */}
                  <div className="flex gap-1 mb-6">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  
                  {/* Quote */}
                  <p className="text-gray-200 mb-6 leading-relaxed">
                    "{testimonial.content}"
                  </p>
                  
                  {/* Author */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {testimonial.author.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-white">
                        {testimonial.author}
                      </p>
                      <p className="text-sm text-gray-400">
                        {testimonial.role}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Clean Glass CTA Section */}
        <section className="py-32 px-6">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="liquid-glass-enhanced p-12 text-center"
            >
              <motion.h2 
                className="text-3xl md:text-5xl font-semibold mb-6 text-white"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                viewport={{ once: true }}
              >
                Ready to start building?
              </motion.h2>
              
              <motion.p 
                className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
              >
                Join thousands of developers using VoidAI to power their applications with cutting-edge AI capabilities.
              </motion.p>
              
              <motion.div 
                className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                viewport={{ once: true }}
              >
                <Link href="/register">
                  <ModernButton size="lg" className="min-w-[200px]">
                    <span className="flex items-center gap-2">
                      Get Started Free
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  </ModernButton>
                </Link>
                <Link href="/pricing">
                  <ModernButton variant="secondary" size="lg" className="min-w-[200px]">
                    View Pricing
                  </ModernButton>
                </Link>
              </motion.div>
              
              <motion.div
                className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-gray-400"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                viewport={{ once: true }}
              >
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400" />
                  <span>No credit card required</span>
                </div>
                <div className="w-1 h-1 bg-white/20 rounded-full hidden sm:block" />
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400" />
                  <span>125,000 free tokens per day</span>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>
      </main>

      <footer className="w-full border-t border-white/5 relative z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6 border-b border-white/5">
            <p className="text-[10px] leading-relaxed text-gray-400 max-w-5xl">
              * Response times vary significantly based on model selection, context window size, reasoning complexity,
              and system load. Smaller models like GPT-4o-mini (non-reasoning) typically achieve 300-600 time-to-first-token (TTFT),
              while larger models or those with reasoning capabilities, such as GPT-5 or Claude 4.5 Sonnet (with thinking enabled) may take 500ms-5s+ for TTFT depending on context
              size and reasoning depth. Streaming responses begin immediately after TTFT. These figures represent typical
              latency and may fluctuate based on real-time conditions.
            </p>
          </div>
          
          {/* Main footer content */}
          <div className="py-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-sm text-muted-foreground">
              © 2025 voidai. All rights reserved.
            </div>

            <div className="flex items-center space-x-4">
              <a
                href="/privacy"
                className="text-sm text-gray-400 hover:text-white transition-colors hover:-translate-y-1 relative z-10 cursor-pointer"
              >
                Privacy Policy
              </a>

              <span className="text-gray-700">•</span>

              <a
                href="/tos"
                className="text-sm text-gray-400 hover:text-white transition-colors hover:-translate-y-1 relative z-10 cursor-pointer"
              >
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}