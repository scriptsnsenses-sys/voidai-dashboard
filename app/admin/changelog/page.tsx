"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  RocketLaunchIcon,
  BeakerIcon,
  WrenchScrewdriverIcon,
  BugAntIcon,
  MegaphoneIcon,
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { ShimmerButton } from '@/components/ui/ShimmerButton';

type ChangelogEntry = {
  _id?: string;
  version: string;
  date: string;
  title: string;
  type: 'major' | 'feature' | 'improvement' | 'fix' | 'announcement';
  content: string;
  highlights: string[];
  published: boolean;
};

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'major': return <RocketLaunchIcon className="w-5 h-5 text-purple-400" />;
    case 'feature': return <BeakerIcon className="w-5 h-5 text-blue-400" />;
    case 'improvement': return <WrenchScrewdriverIcon className="w-5 h-5 text-emerald-400" />;
    case 'fix': return <BugAntIcon className="w-5 h-5 text-red-400" />;
    case 'announcement': return <MegaphoneIcon className="w-5 h-5 text-amber-400" />;
    default: return <RocketLaunchIcon className="w-5 h-5 text-gray-400" />;
  }
};

const getTypeColor = (type: string) => {
  switch (type) {
    case 'major': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
    case 'feature': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    case 'improvement': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    case 'fix': return 'bg-red-500/10 text-red-400 border-red-500/20';
    case 'announcement': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
  }
};

export default function AdminChangelog() {
  const [entries, setEntries] = useState<ChangelogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<ChangelogEntry | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Form state
  const [formData, setFormData] = useState<ChangelogEntry>({
    version: '',
    date: new Date().toISOString().split('T')[0],
    title: '',
    type: 'feature',
    content: '',
    highlights: [],
    published: true
  });

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/changelog', {
        method: 'GET',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setEntries(data.entries);
      }
    } catch (error) {
      console.error('Error fetching changelog entries:', error);
      setErrorMessage('Failed to load changelog entries');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const method = formData._id ? 'PUT' : 'POST';
      const url = formData._id ? `/api/admin/changelog/${formData._id}` : '/api/admin/changelog';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
        credentials: 'include',
      });

      if (response.ok) {
        setSuccessMessage(formData._id ? 'Entry updated successfully' : 'Entry created successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
        setShowForm(false);
        setEditingEntry(null);
        setFormData({
          version: '',
          date: new Date().toISOString().split('T')[0],
          title: '',
          type: 'feature',
          content: '',
          highlights: [],
          published: true
        });
        fetchEntries();
      } else {
        const data = await response.json();
        setErrorMessage(data.error || 'Failed to save entry');
        setTimeout(() => setErrorMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error saving entry:', error);
      setErrorMessage('An error occurred while saving');
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  const handleEdit = (entry: ChangelogEntry) => {
    setEditingEntry(entry);
    setFormData(entry);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this changelog entry?')) return;

    try {
      const response = await fetch(`/api/admin/changelog/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        setSuccessMessage('Entry deleted successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
        fetchEntries();
      } else {
        const data = await response.json();
        setErrorMessage(data.error || 'Failed to delete entry');
        setTimeout(() => setErrorMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error deleting entry:', error);
      setErrorMessage('An error occurred while deleting');
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  return (
      <div className="space-y-8 pb-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Changelog Management</h1>
            <p className="text-white/50 mt-1">
              Create and manage changelog entries to keep users informed
            </p>
          </div>
          {!showForm && (
            <ShimmerButton
              onClick={() => {
                setShowForm(true);
                setEditingEntry(null);
                setFormData({
                  version: '',
                  date: new Date().toISOString().split('T')[0],
                  title: '',
                  type: 'feature',
                  content: '',
                  highlights: [],
                  published: true
                });
              }}
              className="px-6"
              variant="gradient"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              New Entry
            </ShimmerButton>
          )}
        </div>

        {/* Messages */}
        <AnimatePresence>
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 flex items-center gap-2"
            >
              <CheckCircleIcon className="w-5 h-5" />
              {successMessage}
            </motion.div>
          )}
          
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-2"
            >
              <XMarkIcon className="w-5 h-5" />
              {errorMessage}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: 'auto', marginBottom: 32 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              className="overflow-hidden"
            >
              <div className="liquid-glass-card p-6 md:p-8">
                <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
                  <h2 className="text-xl font-bold text-white">
                    {editingEntry ? 'Edit Entry' : 'Create New Entry'}
                  </h2>
                  <button 
                    onClick={() => setShowForm(false)}
                    className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-colors"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-medium text-white/50 mb-2 uppercase tracking-wide">Version</label>
                      <input
                        type="text"
                        value={formData.version}
                        onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                        placeholder={formData.type === 'announcement' ? "Optional" : "e.g., 2.0.0"}
                        className="w-full px-4 py-3 rounded-xl bg-black/20 border border-white/10 text-white focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                        required={formData.type !== 'announcement'}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-white/50 mb-2 uppercase tracking-wide">Date</label>
                      <input
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-black/20 border border-white/10 text-white focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all [color-scheme:dark]"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-white/50 mb-2 uppercase tracking-wide">Title</label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="e.g., 🚀 VoidAI 2.0: A New Era"
                        className="w-full px-4 py-3 rounded-xl bg-black/20 border border-white/10 text-white focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-white/50 mb-2 uppercase tracking-wide">Type</label>
                      <div className="relative">
                        <select
                          value={formData.type}
                          onChange={(e) => setFormData({ ...formData, type: e.target.value as ChangelogEntry['type'] })}
                          className="w-full px-4 py-3 rounded-xl bg-black/20 border border-white/10 text-white focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all appearance-none"
                        >
                          <option value="major" className="bg-neutral-900">Major Release</option>
                          <option value="feature" className="bg-neutral-900">New Feature</option>
                          <option value="improvement" className="bg-neutral-900">Improvement</option>
                          <option value="fix" className="bg-neutral-900">Bug Fix</option>
                          <option value="announcement" className="bg-neutral-900">Announcement</option>
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/50">
                           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                             <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                           </svg>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-white/50 mb-2 uppercase tracking-wide">
                      Content (Markdown)
                    </label>
                    <textarea
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      placeholder="Write your changelog content here... Use # for main headers, ## for subheaders, **text** for bold, - for lists"
                      rows={10}
                      className="w-full px-4 py-3 rounded-xl bg-black/20 border border-white/10 text-white focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-mono text-sm resize-y"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-white/50 mb-2 uppercase tracking-wide">
                      Key Highlights (Comma separated)
                    </label>
                    <input
                      type="text"
                      value={formData.highlights.join(', ')}
                      onChange={(e) => setFormData({
                        ...formData,
                        highlights: e.target.value.split(',').map(h => h.trim()).filter(h => h)
                      })}
                      placeholder="Feature 1, Feature 2, Feature 3 (optional)"
                      className="w-full px-4 py-3 rounded-xl bg-black/20 border border-white/10 text-white focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                    />
                  </div>

                  <div className="flex items-center gap-4 py-2">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${formData.published ? 'bg-blue-500 border-blue-500' : 'border-white/20 group-hover:border-white/40'}`}>
                        {formData.published && <CheckCircleIcon className="w-3.5 h-3.5 text-white" />}
                      </div>
                      <input
                        type="checkbox"
                        checked={formData.published}
                        onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                        className="hidden"
                      />
                      <span className="text-sm text-white/70 group-hover:text-white transition-colors">Published immediately</span>
                    </label>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                    <button
                      type="button"
                      onClick={() => {
                        setShowForm(false);
                        setEditingEntry(null);
                      }}
                      className="px-6 py-2.5 rounded-xl text-white/60 hover:text-white hover:bg-white/5 transition-colors text-sm font-medium"
                    >
                      Cancel
                    </button>
                    <ShimmerButton
                      type="submit"
                      className="px-8 py-2.5"
                      variant="gradient"
                    >
                      {editingEntry ? 'Update Entry' : 'Create Entry'}
                    </ShimmerButton>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Entries List */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-8 rounded-2xl bg-white/5 border border-white/5 animate-pulse h-48" />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 liquid-glass-card border-dashed border-white/10">
            <div className="p-4 rounded-full bg-white/5 mb-4">
                <RocketLaunchIcon className="w-8 h-8 text-white/20" />
            </div>
            <h3 className="text-lg font-medium text-white">No changelog entries yet</h3>
            <p className="text-white/40 mt-1">Create your first entry to announce updates</p>
            <button 
                onClick={() => {
                  setShowForm(true);
                  setEditingEntry(null);
                  setFormData({
                    version: '',
                    date: new Date().toISOString().split('T')[0],
                    title: '',
                    type: 'feature',
                    content: '',
                    highlights: [],
                    published: true
                  });
                }}
                className="mt-6 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-medium text-white transition-colors"
            >
                Create Entry
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {entries.map((entry) => (
              <motion.div
                key={entry._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="liquid-glass-card p-6 md:p-8 group hover:border-white/20 transition-all duration-300"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      {entry.version && (
                        <span className="text-lg font-mono font-bold text-white bg-white/10 px-2 py-0.5 rounded-lg">
                            v{entry.version}
                        </span>
                      )}
                      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${getTypeColor(entry.type)} uppercase tracking-wider`}>
                        {getTypeIcon(entry.type)}
                        {entry.type}
                      </div>
                      {!entry.published && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 uppercase tracking-wider">
                          Draft
                        </span>
                      )}
                      <span className="text-sm text-white/40 ml-auto md:ml-0">
                        {new Date(entry.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                    
                    <h3 className="text-2xl font-bold text-white mb-4">{entry.title}</h3>
                    
                    <div className="prose prose-invert max-w-none">
                        <p className="text-white/70 leading-relaxed whitespace-pre-line text-sm md:text-base">
                            {entry.content}
                        </p>
                    </div>

                    {entry.highlights && entry.highlights.length > 0 && (
                        <div className="mt-6 flex flex-wrap gap-2">
                            {entry.highlights.map((highlight, idx) => (
                                <span key={idx} className="inline-flex items-center px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-white/70">
                                    <CheckCircleIcon className="w-3 h-3 mr-1.5 text-green-400" />
                                    {highlight}
                                </span>
                            ))}
                        </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 md:flex-col">
                    <button
                      onClick={() => handleEdit(entry)}
                      className="p-2.5 hover:bg-blue-500/10 hover:text-blue-400 rounded-xl transition-colors text-white/40"
                      title="Edit Entry"
                    >
                      <PencilIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(entry._id!)}
                      className="p-2.5 hover:bg-red-500/10 hover:text-red-400 rounded-xl transition-colors text-white/40"
                      title="Delete Entry"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
  );
}