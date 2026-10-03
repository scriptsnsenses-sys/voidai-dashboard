"use client";

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { getApiModels } from '@/lib/api';
import { motion } from 'framer-motion';

interface Model {
  id: string;
  object: string;
  owned_by: string;
  endpoints: string[];
  permission: string[];
  cost: string;
  multiplier: number;
}

interface ModelsResponse {
  object: string;
  data: Model[];
  userPlan: string;
}

interface ProviderInfo {
  name: string;
  logo: string;
  color: string;
  hasGradient?: boolean;
}

const PROVIDER_INFO: Record<string, ProviderInfo> = {
  openai: {
    name: "OpenAI",
    logo: "/openai.png",
    color: "bg-slate-200/10 border-slate-200/20 text-slate-200",
  },
  anthropic: {
    name: "Anthropic",
    logo: "/anthropic.png",
    color: "bg-[#CC785C]/20 border-[#CC785C]/30 text-[#CC785C]",
  },
  google: {
    name: "Google",
    logo: "/gemini.png",
    color: "bg-[#4796E3]/20 border-[#4796E3]/30 text-[#4796E3]",
  },
  mistral: {
    name: "Mistral AI",
    logo: "/mistral.png",
    color: "bg-[#EE792F]/20 border-[#EE792F]/30 text-[#EE792F]",
  },
  voidai: {
    name: "VoidAI",
    logo: "/voidai.png",
    color: "bg-indigo-500/20 border-indigo-500/30 text-indigo-400",
    hasGradient: true,
  },
  "black-forest-labs": {
    name: "Black Forest Labs",
    logo: "/blackforestlabs.png",
    color: "bg-slate-200/10 border-slate-200/20 text-slate-200",
  },
  "x-ai": {
    name: "xAI",
    logo: "/xAI.png",
    color: "bg-gray-500/20 border-gray-500/30 text-gray-400",
  },
  deepseek: {
    name: "DeepSeek",
    logo: "/deepseek.png",
    color: "bg-[#4D6BFE]/20 border-[#4D6BFE]/30 text-[#4D6BFE]",
  },
  elevenlabs: {
    name: "ElevenLabs",
    logo: "/elevenlabs.png",
    color: "bg-slate-200/10 border-slate-200/20 text-slate-200",
  },
  qwen: {
    name: "Qwen",
    logo: "/qwen.png",
    color: "bg-[#8A2BE2]/20 border-[#8A2BE2]/30 text-[#8A2BE2]",
  },
  stabilityai: {
    name: "Stability AI",
    logo: "/stabilityai.png",
    color: "bg-slate-200/10 border-slate-200/20 text-slate-200",
  }
};

const ENDPOINT_TYPES = {
  "/v1/chat/completions": {
    name: "Text Generation",
    icon: "💬",
    description: "Text-based chat and completion models"
  },
  "/v1/images/generations": {
    name: "Image Generation",
    icon: "🖼️",
    description: "Create images from text prompts"
  },
  "/v1/moderations": {
    name: "Moderation",
    icon: "🛡️",
    description: "Content moderation for safety"
  },
  "/v1/audio/speech": {
    name: "Speech",
    icon: "🔊",
    description: "Text-to-speech generation"
  },
  "/v1/audio/transcriptions": {
    name: "Transcription",
    icon: "🎙️",
    description: "Audio-to-text transcription"
  },
  "/v1/embeddings": {
    name: "Embeddings",
    icon: "🧠",
    description: "Vector embeddings for semantic search"
  }
};

export default function ModelsPage() {
  const [modelsData, setModelsData] = useState<ModelsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'provider' | 'endpoint'>('provider');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchModelsData();
  }, []);

  async function fetchModelsData() {
    try {
      setLoading(true);
      const data = await getApiModels();
      setModelsData(data);
    } catch (err) {
      console.error('Error fetching models data:', err);
      setError('Failed to load models data. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // Filter models based on search query
  const filteredModels = modelsData?.data.filter(model =>
    model.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    model.owned_by.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const modelsByProvider = filteredModels.reduce((groups, model) => {
    const provider = model.owned_by;
    if (!groups[provider]) {
      groups[provider] = [];
    }
    groups[provider].push(model);
    return groups;
  }, {} as Record<string, Model[]>);

  const modelsByEndpoint = filteredModels.reduce((groups, model) => {
    model.endpoints.forEach(endpoint => {
      if (!groups[endpoint]) {
        groups[endpoint] = [];
      }
      groups[endpoint].push(model);
    });
    return groups;
  }, {} as Record<string, Model[]>);

  const ModelCard = ({ model }: { model: Model }) => {
    const [expanded, setExpanded] = useState(false);

    const providerInfo = PROVIDER_INFO[model.owned_by as keyof typeof PROVIDER_INFO] || {
      name: model.owned_by,
      logo: "",
      color: "bg-gray-500/20 border-gray-500/30 text-gray-400"
    };

    const primaryEndpoint = model.endpoints[0];
    const endpointInfo = ENDPOINT_TYPES[primaryEndpoint as keyof typeof ENDPOINT_TYPES] || {
      name: "Other",
      icon: "❓",
      description: "Other model type"
    };

    return (
      <motion.div
        whileHover={{ scale: 1.02, transition: { duration: 0.2 }}}
        className={`p-4 bg-neutral-800/50 backdrop-blur-sm border border-white/10 rounded-lg cursor-pointer transition-all duration-200 ${expanded ? 'border-white/30 shadow-lg' : 'hover:shadow-lg hover:border-white/20'}`}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex justify-between items-start">
          <div className="font-medium mb-1 flex items-center">
            <span className="truncate">{model.id}</span>
            <div className="ml-2 text-xs bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-1 rounded-full">
              Available
            </div>
          </div>
          <div className="text-white/60 bg-black/20 rounded-full p-1">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24" 
              strokeWidth={1.5} 
              stroke="currentColor" 
              className={`h-4 w-4 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </div>
        </div>
        
        <div className="text-xs text-white/50 flex items-center">
          <span className="mr-1 text-lg">{endpointInfo.icon}</span>
          <span className="opacity-80">{endpointInfo.name}</span>
        </div>

        {expanded && (
          <div className="mt-3 pt-3 border-t border-white/10">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <div className="text-white/40">Provider</div>
                <div className="font-medium flex items-center mt-1">
                  {providerInfo.logo && (
                    <img 
                      src={providerInfo.logo} 
                      alt={providerInfo.name}
                      className="h-3 w-3 mr-1.5 object-contain"
                    />
                  )}
                  {providerInfo.name}
                </div>
              </div>
              <div className="col-span-2">
                <div className="text-white/40">Endpoints</div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {model.endpoints.map((endpoint, index) => (
                    <div key={index} className="text-xs bg-neutral-700/50 text-white/70 px-2 py-1 rounded">
                      {endpoint}
                    </div>
                  ))}
                </div>
              </div>
              <div className="col-span-2 text-sm text-emerald-400">Included for every account</div>
            </div>
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Available Models</h1>
            <p className="text-muted-foreground mt-1">
              Explore the models available to every account
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search models..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-4 py-2 bg-neutral-800/50 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-white/30 transition-colors"
              />
              <svg className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <button
              onClick={fetchModelsData}
              disabled={loading}
              className="px-4 py-2 bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 rounded-lg hover:bg-indigo-500/30 transition-colors disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
            {error}
          </div>
        )}

        {modelsData && (
          <div className="bg-neutral-800/30 border border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-semibold">
                  {filteredModels.length} Models Available
                </div>
                <div className="text-sm text-white/60">
                  Every listed model is available to all accounts
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('provider')}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    activeTab === 'provider' 
                      ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' 
                      : 'text-white/60 hover:text-white/80'
                  }`}
                >
                  By Provider
                </button>
                <button
                  onClick={() => setActiveTab('endpoint')}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    activeTab === 'endpoint' 
                      ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' 
                      : 'text-white/60 hover:text-white/80'
                  }`}
                >
                  By Type
                </button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-neutral-800/50 border border-white/10 rounded-lg p-4 animate-pulse">
                <div className="h-4 w-3/4 bg-neutral-700/50 rounded mb-2"></div>
                <div className="h-3 w-1/2 bg-neutral-700/50 rounded mb-4"></div>
                <div className="h-3 w-full bg-neutral-700/50 rounded"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {activeTab === 'provider' ? (
              Object.entries(modelsByProvider).map(([provider, models]) => {
                const providerInfo = PROVIDER_INFO[provider] || {
                  name: provider,
                  logo: "",
                  color: "bg-gray-500/20 border-gray-500/30 text-gray-400"
                };

                return (
                  <motion.div
                    key={provider}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center gap-3">
                      {providerInfo.logo && (
                        <img 
                          src={providerInfo.logo} 
                          alt={providerInfo.name}
                          className="h-6 w-6 object-contain"
                        />
                      )}
                      <h2 className="text-xl font-semibold">{providerInfo.name}</h2>
                      <div className="text-sm text-white/60">
                        {models.length} model{models.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {models.map((model) => (
                        <ModelCard key={model.id} model={model} />
                      ))}
                    </div>
                  </motion.div>
                );
              })
            ) : (
              Object.entries(modelsByEndpoint).map(([endpoint, models]) => {
                const endpointInfo = ENDPOINT_TYPES[endpoint as keyof typeof ENDPOINT_TYPES] || {
                  name: endpoint,
                  icon: "❓",
                  description: "Other endpoint type"
                };

                return (
                  <motion.div
                    key={endpoint}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{endpointInfo.icon}</span>
                      <div>
                        <h2 className="text-xl font-semibold">{endpointInfo.name}</h2>
                        <p className="text-sm text-white/60">{endpointInfo.description}</p>
                      </div>
                      <div className="text-sm text-white/60 ml-auto">
                        {models.length} model{models.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {models.map((model) => (
                        <ModelCard key={`${endpoint}-${model.id}`} model={model} />
                      ))}
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}