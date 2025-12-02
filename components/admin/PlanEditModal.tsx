import React, { useState, useEffect } from 'react';
import { ShimmerButton } from '@/components/ui/ShimmerButton';
import { motion } from 'framer-motion';

interface PlanOption {
  id: string;
  name: string;
  rpm: number;
  rpd: number;
}

interface PlanEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (planData: { plan: string; rpm?: number; rpd?: number }) => void;
  currentPlan: string;
  userId: string;
  username: string;
}

const PlanEditModal: React.FC<PlanEditModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentPlan,
  userId,
  username
}) => {
  const [selectedPlan, setSelectedPlan] = useState(currentPlan);
  const [customRpm, setCustomRpm] = useState<number>(10);
  const [customRpd, setCustomRpd] = useState<number>(1000);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const planOptions: PlanOption[] = [
    { id: 'free', name: 'Free', rpm: 5, rpd: 100 },
    { id: 'economy', name: 'Economy', rpm: 7, rpd: 1000 },
    { id: 'basic', name: 'Basic', rpm: 10, rpd: 2000 },
    { id: 'premium', name: 'Premium', rpm: 35, rpd: 5000 },
    { id: 'pro', name: 'Pro', rpm: 75, rpd: 7500 },
    { id: 'ultra', name: 'Ultra', rpm: 100, rpd: 10000 },
    { id: 'enterprise', name: 'Enterprise', rpm: 0, rpd: 0 },
    { id: 'custom', name: 'Custom', rpm: 0, rpd: 0 },
  ];

  useEffect(() => {
    if (currentPlan) {
      setSelectedPlan(currentPlan);

      const planOption = planOptions.find(option => option.id === currentPlan);
      if (!planOption && currentPlan !== 'custom') {
        setSelectedPlan('custom');
      }
    }
  }, [currentPlan]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    setIsSubmitting(true);

    const planData = {
      plan: selectedPlan,
      ...(selectedPlan === 'custom' && { rpm: customRpm, rpd: customRpd })
    };

    onSave(planData);
  };

  const isPlanCustom = selectedPlan === 'custom';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose}></div>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative bg-neutral-900 border border-white/10 rounded-xl shadow-xl w-full max-w-md overflow-hidden"
      >
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-xl font-semibold">Edit User Plan</h3>
              <p className="text-white/60 text-sm mt-1">
                Editing plan for <span className="font-medium text-white">{username}</span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-white/10"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18 18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                Select Plan
              </label>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {planOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setSelectedPlan(option.id)}
                    className={`p-3 rounded-lg border text-center transition-colors ${
                      selectedPlan === option.id
                        ? 'bg-blue-600/20 border-blue-500/50 text-blue-400'
                        : 'bg-neutral-800/50 border-white/10 text-white/70 hover:bg-neutral-800'
                    }`}
                  >
                    <span className="block font-medium">{option.name}</span>
                    {option.id !== 'custom' && option.id !== 'enterprise' && (
                      <span className="block text-xs mt-1 opacity-80">
                        {option.rpm} rpm / {option.rpd.toLocaleString()} rpd
                      </span>
                    )}
                    {option.id === 'enterprise' && (
                      <span className="block text-xs mt-1 opacity-80">
                        Unlimited
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {isPlanCustom && (
                <div className="space-y-4 mt-6 p-4 bg-neutral-800/30 rounded-lg border border-white/10">
                  <div>
                    <label htmlFor="rpm" className="block text-sm font-medium mb-2">
                      Requests per Minute (RPM)
                    </label>
                    <input
                      id="rpm"
                      type="number"
                      value={customRpm}
                      onChange={(e) => setCustomRpm(parseInt(e.target.value) || 0)}
                      min="1"
                      max="1000"
                      className="w-full px-4 py-2 rounded-lg bg-neutral-800 border border-white/10 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20 transition-colors"
                    />
                  </div>
                  <div>
                    <label htmlFor="rpd" className="block text-sm font-medium mb-2">
                      Requests per Day (RPD)
                    </label>
                    <input
                      id="rpd"
                      type="number"
                      value={customRpd}
                      onChange={(e) => setCustomRpd(parseInt(e.target.value) || 0)}
                      min="1"
                      max="100000"
                      className="w-full px-4 py-2 rounded-lg bg-neutral-800 border border-white/10 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20 transition-colors"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-4 pt-4 border-t border-white/10">
              <ShimmerButton
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </ShimmerButton>
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-white/10"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default PlanEditModal;