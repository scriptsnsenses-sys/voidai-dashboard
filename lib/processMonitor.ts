// Process monitor to prevent memory leaks and crashes
let requestCount = 0;
let lastMemoryCheck = Date.now();
const MEMORY_CHECK_INTERVAL = 30000; // 30 seconds
const MAX_MEMORY_MB = 500; // 500MB memory limit
const MAX_REQUESTS_PER_MINUTE = 100;

// Track requests per IP
const requestTracker = new Map<string, { count: number; lastReset: number }>();

// Check if we're in a Node.js environment (not Edge Runtime)
const isNodeEnvironment = typeof process !== 'undefined' && 
  typeof process.memoryUsage === 'function' && 
  typeof global !== 'undefined';

export function trackRequest(ip: string): boolean {
  requestCount++;
  
  const now = Date.now();
  const ipData = requestTracker.get(ip) || { count: 0, lastReset: now };
  
  // Reset counter every minute
  if (now - ipData.lastReset > 60000) {
    ipData.count = 0;
    ipData.lastReset = now;
  }
  
  ipData.count++;
  requestTracker.set(ip, ipData);
  
  // Rate limiting
  if (ipData.count > MAX_REQUESTS_PER_MINUTE) {
    return false; // Request should be rejected
  }
  
  // Memory check (only in Node.js environment, not in Edge Runtime)
  if (isNodeEnvironment && now - lastMemoryCheck > MEMORY_CHECK_INTERVAL) {
    checkMemoryUsage();
    lastMemoryCheck = now;
  }
  
  return true; // Request is allowed
}

function checkMemoryUsage() {
  // Only run in Node.js environment
  if (!isNodeEnvironment) {
    return;
  }
  
  try {
    const memUsage = process.memoryUsage();
    const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
    
    console.log(`Memory usage: ${heapUsedMB.toFixed(2)}MB, Requests: ${requestCount}`);
    
    if (heapUsedMB > MAX_MEMORY_MB) {
      console.warn(`High memory usage detected: ${heapUsedMB.toFixed(2)}MB`);
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
        console.log('Forced garbage collection');
      }
    }
  } catch (error) {
    console.warn('Could not check memory usage:', error);
  }
}

export function getRequestStats() {
  const memoryUsage = isNodeEnvironment 
    ? (() => {
        try {
          return process.memoryUsage();
        } catch {
          return null;
        }
      })()
    : null;

  return {
    totalRequests: requestCount,
    activeIPs: requestTracker.size,
    memoryUsage
  };
}

// Cleanup old request tracking data (only in Node.js environment)
if (isNodeEnvironment && typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [ip, data] of requestTracker.entries()) {
      if (now - data.lastReset > 300000) { // 5 minutes
        requestTracker.delete(ip);
      }
    }
  }, 300000); // Clean up every 5 minutes
} 