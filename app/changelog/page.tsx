"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  SparklesIcon, 
  RocketLaunchIcon, 
  BoltIcon,
  ShieldCheckIcon,
  CalendarIcon,
  TagIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';

type ChangelogEntry = {
  _id: string;
  version: string;
  date: string;
  title: string;
  type: 'major' | 'feature' | 'improvement' | 'fix' | 'announcement';
  content: string;
  highlights?: string[];
};

export default function ChangelogPage() {
  const [entries, setEntries] = useState<ChangelogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChangelog();
  }, []);

  const fetchChangelog = async () => {
    try {
      const response = await fetch('/api/changelog');
      if (response.ok) {
        const data = await response.json();
        setEntries(data.entries);
      }
    } catch (error) {
      console.error('Error fetching changelog:', error);
    } finally {
      setLoading(false);
    }
  };


  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'major':
        return <RocketLaunchIcon className="h-5 w-5" />;
      case 'feature':
        return <SparklesIcon className="h-5 w-5" />;
      case 'improvement':
        return <BoltIcon className="h-5 w-5" />;
      case 'fix':
        return <ShieldCheckIcon className="h-5 w-5" />;
      default:
        return <TagIcon className="h-5 w-5" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'major':
        return 'bg-gradient-to-r from-purple-500 to-pink-500 text-white';
      case 'feature':
        return 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white';
      case 'improvement':
        return 'bg-gradient-to-r from-green-500 to-emerald-500 text-white';
      case 'fix':
        return 'bg-gradient-to-r from-orange-500 to-red-500 text-white';
      default:
        return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white';
    }
  };

  return (
    <div className="min-h-screen text-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <Link 
              href="/"
              className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-8 transition-colors"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Back to Home
            </Link>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent leading-tight pb-4">
              Changelog
            </h1>
            <p className="text-xl text-white/60 max-w-2xl mx-auto">
              Stay up to date with the latest updates, features, and improvements to VoidAI
            </p>
          </motion.div>
        </div>
      </div>

      {/* Changelog Entries */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {loading ? (
          <div className="space-y-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-8 w-32 bg-white/10 rounded mb-4"></div>
                <div className="h-6 w-64 bg-white/10 rounded mb-2"></div>
                <div className="h-4 w-full bg-white/10 rounded"></div>
              </div>
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-xl text-white/60">No changelog entries available yet.</p>
            <p className="text-white/40 mt-2">Check back soon for updates!</p>
          </div>
        ) : (
          <div className="space-y-16">
            {entries.map((entry, index) => (
            <motion.article
              key={entry._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative"
            >
              {/* Timeline line */}
              {index < entries.length - 1 && (
                <div className="absolute left-8 top-16 bottom-0 w-0.5 bg-gradient-to-b from-white/20 to-transparent" />
              )}

              {/* Entry */}
              <div className="relative">
                {/* Date and Version Badge */}
                <div className="flex items-center gap-4 mb-6">
                  <div className={`p-3 rounded-full ${getTypeColor(entry.type)} shadow-lg`}>
                    {getTypeIcon(entry.type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      {entry.version && <span className="text-2xl font-bold">{entry.version}</span>}
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(entry.type)}`}>
                        {entry.type.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-white/60 mt-1">
                      <CalendarIcon className="h-4 w-4" />
                      {entry.date}
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="ml-16 space-y-6">
                  <h2 className="text-3xl font-bold">{entry.title}</h2>
                  
                  {/* Highlights */}
                  {entry.highlights && entry.highlights.length > 0 && (
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <h3 className="text-sm font-medium text-white/60 mb-3">KEY HIGHLIGHTS</h3>
                      <ul className="space-y-2">
                        {entry.highlights.map((highlight, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-green-400 mt-1">✓</span>
                            <span className="text-white/80">{highlight}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Main Content */}
                  <div className="prose prose-invert max-w-none">
                    <div className="text-white/80 leading-relaxed">
                      {entry.content.split('\n').map((paragraph, i) => {
                        // Handle headers
                        if (paragraph.startsWith('# ')) {
                          return (
                            <h2 key={i} className="text-3xl font-bold text-white mt-8 mb-4">
                              {paragraph.replace('# ', '')}
                            </h2>
                          );
                        }
                        if (paragraph.startsWith('## ')) {
                          return (
                            <h3 key={i} className="text-2xl font-bold text-white mt-6 mb-3">
                              {paragraph.replace('## ', '')}
                            </h3>
                          );
                        }
                        if (paragraph.startsWith('### ')) {
                          return (
                            <h4 key={i} className="text-xl font-semibold text-white mt-4 mb-2">
                              {paragraph.replace('### ', '')}
                            </h4>
                          );
                        }
                        // Handle bold text
                        if (paragraph.includes('**')) {
                          const parts = paragraph.split('**');
                          return (
                            <p key={i}>
                              {parts.map((part, j) => 
                                j % 2 === 1 ? <strong key={j} className="text-white font-semibold">{part}</strong> : part
                              )}
                            </p>
                          );
                        }
                        // Handle list items
                        if (paragraph.trim().startsWith('-')) {
                          return (
                            <li key={i} className="ml-6 list-disc">
                              {paragraph.replace(/^-\s*/, '')}
                            </li>
                          );
                        }
                        // Handle numbered lists
                        if (paragraph.trim().match(/^\d+\./)) {
                          return (
                            <li key={i} className="ml-6 list-decimal">
                              {paragraph.replace(/^\d+\.\s*/, '')}
                            </li>
                          );
                        }
                        // Regular paragraphs - only add spacing for actual paragraph breaks (empty lines)
                        if (paragraph.trim()) {
                          return <p key={i} className="mb-1">{paragraph}</p>;
                        }
                        // Empty line = paragraph break
                        return <div key={i} className="h-4" />;
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </motion.article>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-white/10 mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center text-white/60">
            <p className="mb-4">Want to stay updated with our latest changes?</p>
            <div className="flex items-center justify-center gap-4">
              <Link 
                href="/register" 
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg font-medium hover:opacity-90 transition-opacity"
              >
                Get Started
              </Link>
              <Link 
                href="https://discord.com/invite/pQab7kukfu" 
                className="px-6 py-3 bg-white/10 rounded-lg font-medium hover:bg-white/20 transition-colors"
              >
                Join Discord
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}