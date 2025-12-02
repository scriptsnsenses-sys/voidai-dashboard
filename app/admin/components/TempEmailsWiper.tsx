"use client";

import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';

export default function TempEmailsWiper() {
  const [isWiping, setIsWiping] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; count?: number } | null>(null);

  const handleWipeTempEmails = async () => {
    if (!confirm('Are you sure you want to delete all users with temporary email addresses? This action cannot be undone.')) {
      return;
    }

    setIsWiping(true);
    setResult(null);

    try {
      const response = await fetch('/api/admin/wipe-temp-emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok) {
        setResult({
          success: true,
          message: data.message,
          count: data.deleted
        });
      } else {
        setResult({
          success: false,
          message: data.message || 'Failed to wipe temporary email users'
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: 'An unexpected error occurred'
      });
      console.error('Error wiping temporary email users:', error);
    } finally {
      setIsWiping(false);
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6 mb-6">
      <div className="flex items-center mb-4">
        <AlertTriangle className="h-6 w-6 text-amber-500 mr-2" />
        <h2 className="text-xl font-bold">Manage Temporary Email Users</h2>
      </div>
      
      <p className="mb-4">
        Delete users who registered with temporary or disposable email addresses, 
        including emails from the murasya.ru domain.
      </p>
      
      {result && (
        <div className={`p-4 rounded-md ${result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} mb-4`}>
          <p>{result.message}</p>
          {result.count !== undefined && (
            <p className="mt-2 font-semibold">Deleted {result.count} users</p>
          )}
        </div>
      )}
      
      <button
        onClick={handleWipeTempEmails}
        disabled={isWiping}
        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 flex items-center"
      >
        {isWiping ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Deleting...
          </>
        ) : 'Delete Users with Temporary Emails'}
      </button>
    </div>
  );
} 