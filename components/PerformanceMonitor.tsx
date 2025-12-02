'use client';

import { useEffect } from 'react';
import type { Metric } from 'web-vitals';

export function PerformanceMonitor() {
  useEffect(() => {
    // Only run on client-side
    if (typeof window === 'undefined') return;

    const reportWebVitals = async () => {
      try {
        const { onCLS, onFID, onFCP, onLCP, onTTFB } = await import('web-vitals');
        
        const sendToAnalytics = ({ name, delta, value, id }: Metric) => {
          // Send to your analytics endpoint
          const body = JSON.stringify({
            metric: name,
            value: Math.round(name === 'CLS' ? delta * 1000 : delta),
            id,
            pathname: window.location.pathname,
          });
          
          // Log in development
          if (process.env.NODE_ENV === 'development') {
            console.log(`[Web Vital] ${name}:`, value);
          }
          
          // Use sendBeacon for reliability in production
          if (process.env.NODE_ENV === 'production' && navigator.sendBeacon) {
            navigator.sendBeacon('/api/analytics/vitals', body);
          }
        };
        
        onCLS(sendToAnalytics);
        onFID(sendToAnalytics);
        onFCP(sendToAnalytics);
        onLCP(sendToAnalytics);
        onTTFB(sendToAnalytics);
      } catch (error) {
        console.error('Failed to load web-vitals:', error);
      }
    };
    
    reportWebVitals();
  }, []);
  
  return null;
}