import React, { useState } from 'react';
import { ShimmerButton } from '@/components/ui/ShimmerButton';
import { motion } from 'framer-motion';

interface RejectionModalProps {
  onConfirm: (reason: string) => void;
  onCancel: () => void;
  isOpen: boolean;
}

const RejectionModal: React.FC<RejectionModalProps> = ({ 
  onConfirm, 
  onCancel,
  isOpen
}) => {
  const [reason, setReason] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onCancel}></div>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative bg-neutral-900 border border-white/10 rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-xl font-semibold">Reject Application</h3>
              <p className="text-white/60 text-sm mt-1">
                Please provide a reason for rejection
              </p>
            </div>
            <button
              onClick={onCancel}
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

          <div className="space-y-4">
            <div>
              <label htmlFor="rejection-reason" className="block text-sm font-medium mb-2">
                Rejection Reason (Optional)
              </label>
              <textarea
                id="rejection-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-neutral-800 border border-white/10 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20 transition-colors min-h-[120px]"
                placeholder="Explain why this application is being rejected..."
              />
              <p className="mt-1 text-xs text-white/60">
                This message will be included in the rejection email sent to the user
              </p>
            </div>

            <div className="flex gap-4 mt-6">
              <ShimmerButton
                onClick={() => onConfirm(reason)}
                className="w-full bg-red-900/70"
              >
                Reject Application
              </ShimmerButton>
              <button
                onClick={onCancel}
                className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-white/10"
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

export default RejectionModal;