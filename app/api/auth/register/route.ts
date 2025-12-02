export const runtime = 'nodejs';
import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { generateVerificationCode, sendVerificationEmail } from '@/lib/email';
import { get } from 'http'; 

const DISPOSABLE_DOMAINS_URL = 'https://disposable.github.io/disposable-email-domains/domains.txt';
const ADDITIONAL_BLOCKED_DOMAINS = ['10mail.org', 'emlhub.com', 'freeml.net', 'spymail.one', 'minimail.me', '10mail.xyz', 'yomail.info', 'emlpro.com', '10mail.xyz', 'dropmail.me', 'mailpwr.com', 'emltmp.com', 'tempmaila.org', 'mysticorchard.space', 'mriscan.live', 'deepcool.biz', 'aquaflask.click', 'mail-temp.pro', 'mail-temp.shop', 'mail-temp.info', 'murasya.ru', 'rapidletter.net', '10p.email', 'nullsto.edu.pl', 'mailinator.com', 'guerrillamail.com', 'trashmail.com', 'yopmail.com', 'tempmail.com', '10minutemail.com'];

const IP_BLOCKLIST_URLS = {
  datacenter: 'https://raw.githubusercontent.com/firehol/blocklist-ipsets/master/datacenters.netset',
  vpn: 'https://raw.githubusercontent.com/X4BNet/lists_vpn/main/ipv4.txt',
  tor: 'https://raw.githubusercontent.com/SecOps-Institute/Tor-IP-Addresses/master/tor-exit-nodes.txt',
  cloud: 'https://raw.githubusercontent.com/lord-alfred/ipranges/main/all/ipv4_merged.txt'
};

let disposableDomainsCache = {
  domains: new Set<string>(),
  lastFetched: 0,
  fetchPromise: null as Promise<void> | null
};

let ipBlocklistCache = {
  ranges: new Set<string>(),
  lastFetched: 0,
  fetchPromise: null as Promise<void> | null
};

const CACHE_TTL = 24 * 60 * 60 * 1000;

export async function getDisposableDomains(): Promise<Set<string>> {
  const now = Date.now();
  if (now - disposableDomainsCache.lastFetched < CACHE_TTL && disposableDomainsCache.domains.size > 0) {
    return disposableDomainsCache.domains;
  }

  if (disposableDomainsCache.fetchPromise) {
    await disposableDomainsCache.fetchPromise;
    return disposableDomainsCache.domains; 
  }

  disposableDomainsCache.fetchPromise = (async () => {
    try {
      console.log('Fetching disposable domains list...');
      const response = await fetch(DISPOSABLE_DOMAINS_URL);
      if (!response.ok) {
        throw new Error(`Failed to fetch disposable domains: ${response.statusText}`);
      }
      const text = await response.text();
      const domainsArray = text.split('\n').map(d => d.trim()).filter(d => d.length > 0);
      disposableDomainsCache.domains = new Set(domainsArray);
      
      ADDITIONAL_BLOCKED_DOMAINS.forEach(domain => {
        disposableDomainsCache.domains.add(domain);
      });
      
      disposableDomainsCache.lastFetched = Date.now();
      console.log(`Fetched and cached ${disposableDomainsCache.domains.size} disposable domains.`);
    } catch (error) {
      console.error("Error fetching or processing disposable domains:", error);
      
      if (disposableDomainsCache.domains.size === 0) {
        ADDITIONAL_BLOCKED_DOMAINS.forEach(domain => {
          disposableDomainsCache.domains.add(domain);
        });
      }
    } finally {
      disposableDomainsCache.fetchPromise = null; 
    }
  })();

  await disposableDomainsCache.fetchPromise; 
  return disposableDomainsCache.domains;
}

function ipToNumber(ip: string): number {
  const parts = ip.split('.');
  if (parts.length !== 4) return 0;
  return (parseInt(parts[0]) << 24) + (parseInt(parts[1]) << 16) + (parseInt(parts[2]) << 8) + parseInt(parts[3]);
}

function isIpInRange(ip: string, cidr: string): boolean {
  try {
    if (cidr.includes('/')) {
      const [network, prefixLength] = cidr.split('/');
      const mask = (0xffffffff << (32 - parseInt(prefixLength))) >>> 0;
      const networkNum = ipToNumber(network) & mask;
      const ipNum = ipToNumber(ip) & mask;
      return networkNum === ipNum;
    } else {
      return ip === cidr;
    }
  } catch {
    return false;
  }
}

async function getIpBlocklists(): Promise<Set<string>> {
  const now = Date.now();
  if (now - ipBlocklistCache.lastFetched < CACHE_TTL && ipBlocklistCache.ranges.size > 0) {
    return ipBlocklistCache.ranges;
  }

  if (ipBlocklistCache.fetchPromise) {
    await ipBlocklistCache.fetchPromise;
    return ipBlocklistCache.ranges;
  }

  ipBlocklistCache.fetchPromise = (async () => {
    try {
      console.log('Fetching IP blocklists...');
      const allRanges = new Set<string>();

      try {
        const dcResponse = await fetch(IP_BLOCKLIST_URLS.datacenter);
        if (dcResponse.ok) {
          const dcText = await dcResponse.text();
          dcText.split('\n').forEach(line => {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#') && (trimmed.includes('.') || trimmed.includes('/'))) {
              allRanges.add(trimmed);
            }
          });
        }
      } catch (e) {
        console.warn('Failed to fetch datacenter IPs:', e);
      }

      try {
        const vpnResponse = await fetch(IP_BLOCKLIST_URLS.vpn);
        if (vpnResponse.ok) {
          const vpnText = await vpnResponse.text();
          vpnText.split('\n').forEach(line => {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#') && (trimmed.includes('.') || trimmed.includes('/'))) {
              allRanges.add(trimmed);
            }
          });
        }
      } catch (e) {
        console.warn('Failed to fetch VPN IPs:', e);
      }

      try {
        const torResponse = await fetch(IP_BLOCKLIST_URLS.tor);
        if (torResponse.ok) {
          const torText = await torResponse.text();
          torText.split('\n').forEach(line => {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#') && trimmed.includes('.')) {
              allRanges.add(trimmed);
            }
          });
        }
      } catch (e) {
        console.warn('Failed to fetch Tor IPs:', e);
      }

      try {
        const cloudResponse = await fetch(IP_BLOCKLIST_URLS.cloud);
        if (cloudResponse.ok) {
          const cloudText = await cloudResponse.text();
          cloudText.split('\n').forEach(line => {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#') && (trimmed.includes('.') || trimmed.includes('/'))) {
              allRanges.add(trimmed);
            }
          });
        }
      } catch (e) {
        console.warn('Failed to fetch cloud IPs:', e);
      }

      ipBlocklistCache.ranges = allRanges;
      ipBlocklistCache.lastFetched = Date.now();
      console.log(`Fetched and cached ${allRanges.size} IP ranges/addresses.`);
    } catch (error) {
      console.error("Error fetching IP blocklists:", error);
    } finally {
      ipBlocklistCache.fetchPromise = null;
    }
  })();

  await ipBlocklistCache.fetchPromise;
  return ipBlocklistCache.ranges;
}

async function isBlockedIp(ip: string): Promise<boolean> {
  if (ip === 'unknown' || !ip) return false;
  
  if (ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) {
    return false;
  }

  try {
    const blocklist = await getIpBlocklists();
    
    for (const range of blocklist) {
      if (isIpInRange(ip, range)) {
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error checking IP blocklist:', error);
    return false;
  }
}

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const MAX_REGISTRATIONS_PER_WINDOW = 1;

const hashPassword = (password: string): { hash: string; salt: string } => {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto
    .pbkdf2Sync(password, salt, 1000, 64, 'sha512')
    .toString('hex');
  return { hash, salt };
};

function getIpAddress(req: NextRequest): string {
  const cfIp = req.headers.get('cf-connecting-ip');
  if (cfIp) {
    if (cfIp.startsWith('::ffff:')) {
      return cfIp.substring(7);
    }
    return cfIp;
  }

  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    const ip = forwarded.split(',')[0].trim();
    if (ip.startsWith('::ffff:')) {
      return ip.substring(7);
    }
    return ip;
  }

  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
     if (realIp.startsWith('::ffff:')) {
      return realIp.substring(7);
    }
    return realIp;
  }

  return 'unknown';
}

async function verifyHCaptchaToken(token: string, ip?: string): Promise<boolean> {
  const secretKey = process.env.HCAPTCHA_SECRET_KEY;
  if (!secretKey) {
    console.error('HCAPTCHA_SECRET_KEY environment variable not set.');
    return false;
  }

  const verificationUrl = 'https://hcaptcha.com/siteverify';

  const formData = new URLSearchParams();
  formData.append('secret', secretKey);
  formData.append('response', token);
  if (ip && ip !== 'unknown') {
    formData.append('remoteip', ip);
  }

  try {
    const response = await fetch(verificationUrl, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const data = await response.json();

    if (data.success) {
      return true;
    } else {
      console.warn('hCaptcha verification failed:', data['error-codes'] || 'Unknown reason');
      return false;
    }
  } catch (error) {
    console.error('Error during hCaptcha verification fetch request:', error);
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const ip = getIpAddress(req);
    
    const isBlocked = await isBlockedIp(ip);
    if (isBlocked) {
      console.warn(`Registration blocked for datacenter/VPN/proxy IP: ${ip}`);
      return NextResponse.json(
        { message: 'Registrations from datacenter, VPN, or proxy IPs are not allowed.' },
        { status: 403 }
      );
    }
    
    const { db } = await connectToDatabase();
    const attemptsCollection = db.collection('registration_attempts');
    const usersCollection = db.collection('users');

    const currentTime = Date.now();
    const windowStartTime = new Date(currentTime - RATE_LIMIT_WINDOW_MS);

    const recentAttempts = await attemptsCollection.countDocuments({
      ip: ip,
      timestamp: { $gte: windowStartTime },
    });

    if (ip !== 'unknown' && recentAttempts >= MAX_REGISTRATIONS_PER_WINDOW) {
      console.warn(`Rate limit exceeded for IP: ${ip}`);
      return NextResponse.json(
        { message: 'Too many registration attempts. Please try again later.' },
        { status: 429 }
      );
    }

    const disposableDomains = await getDisposableDomains();

    const { username, email, password, hcaptchaToken, name } = await req.json();

    if (!username || !email || !password) {
      return NextResponse.json(
        { message: 'Username, email, and password are required' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { message: 'Invalid email format' },
        { status: 400 }
      );
    }

    const lowerCaseEmail = email.toLowerCase();
    const emailParts = lowerCaseEmail.split('@');
    if (emailParts.length !== 2) {
        return NextResponse.json({ message: 'Invalid email format' }, { status: 400 });
    }
    const localPart = emailParts[0];
    const domain = emailParts[1];

    if (disposableDomains.has(domain)) {
        console.warn(`Registration blocked for disposable email domain: ${email}`);
        return NextResponse.json(
            { message: 'Registrations using disposable email addresses are not allowed.' },
            { status: 400 }
        );
    }

    for (const blockedDomain of ADDITIONAL_BLOCKED_DOMAINS) {
        if (domain === blockedDomain || domain.endsWith('.' + blockedDomain)) {
            console.warn(`Registration blocked for blocked domain/subdomain: ${email} (matches ${blockedDomain})`);
            return NextResponse.json(
                { message: 'Registrations using this email domain are not allowed.' },
                { status: 400 }
            );
        }
    }

    if (domain === 'gmail.com' || domain === 'googlemail.com') {
        if (localPart.includes('.') || localPart.includes('+')) {
            console.warn(`Registration blocked for Gmail alias: ${email}`);
            return NextResponse.json(
                { message: 'Registrations using Gmail aliases (containing . or +) are not allowed.' },
                { status: 400 }
            );
        }
    }

    if (password.length < 8) {
      return NextResponse.json(
        { message: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    const existingUser = await usersCollection.findOne({
      $or: [
        { username: username },
        { email: lowerCaseEmail }
      ]
    });

    if (existingUser) {
      return NextResponse.json(
        { message: 'Username or email already exists' },
        { status: 400 }
      );
    }

    if (ip !== 'unknown') {
      await attemptsCollection.insertOne({ ip: ip, timestamp: new Date(currentTime) });
    }

    if (!hcaptchaToken) {
      return NextResponse.json({ message: 'CAPTCHA token missing.' }, { status: 400 });
    }
    const isHCaptchaValid = await verifyHCaptchaToken(hcaptchaToken, ip !== 'unknown' ? ip : undefined);
    if (!isHCaptchaValid) {
      return NextResponse.json({ message: 'Invalid CAPTCHA verification.' }, { status: 403 });
    }

    const { hash, salt } = hashPassword(password);
    const verificationCode = generateVerificationCode();
    
    // Import plan credits from MongoDB users helper
    const { getPlanCredits } = await import('@/lib/postgresql-users');
    const dailyCredits = getPlanCredits('free');

    const result = await usersCollection.insertOne({
      username,
      name: name || username, // Use provided name or fallback to username
      email: lowerCaseEmail,
      password: hash,
      salt,
      plan: 'free',
      plan_expires_at: null,
      created_at: new Date().toISOString(),
      verification_code: verificationCode,
      is_verified: false,
      code_expires: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      enabled: true,
      subscription_id: null,
      cancel_at_period_end: false,
      user_options: { cache: true },
      updated_at: new Date().toISOString()
    });

    // Create corresponding V2 user record for API keys and credits
    try {
      const { connectToV2Database } = await import('@/lib/mongodb');
      const { db: v2Db } = await connectToV2Database();
      
      await v2Db.collection('users').insertOne({
        _id: result.insertedId,
        id: result.insertedId.toString(),
        created_by: result.insertedId.toString(),
        name: name || username,
        api_key: [],
        plan: 'free',
        enabled: true,
        credits: dailyCredits,
        credits_last_reset: Math.floor(Date.now() / 1000),
        created_at: Math.floor(Date.now() / 1000),
        updated_at: Math.floor(Date.now() / 1000),
        cancel_at_period_end: false,
        plan_expires_at: null,
        original_d1_username: username,
        user_options: { cache: true }
      });
    } catch (v2Error) {
      console.error('Failed to create V2 user record:', v2Error);
      // Don't fail registration if V2 creation fails - V1 is primary for auth
    }

    try {
        await sendVerificationEmail({
          email: lowerCaseEmail,
          code: verificationCode,
          username
        });
    } catch (emailError) {
        console.error(`Failed to send verification email to ${lowerCaseEmail}:`, emailError);
    }

    return NextResponse.json(
      { 
        message: 'User registered successfully. Please check your email for the verification code.',
        userId: result.insertedId.toString(),
        requiresVerification: true,
        email
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}