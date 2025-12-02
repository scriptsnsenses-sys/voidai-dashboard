import { NextRequest } from 'next/server';

export function getIpAddress(req: NextRequest): string {
  const cfIp = req.headers.get('cf-connecting-ip');
  if (cfIp) {
    return cfIp.startsWith('::ffff:') ? cfIp.substring(7) : cfIp;
  }
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    const ip = forwarded.split(',')[0].trim();
    return ip.startsWith('::ffff:') ? ip.substring(7) : ip;
  }
  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    return realIp.startsWith('::ffff:') ? realIp.substring(7) : realIp;
  }
  return 'unknown';
}

export async function verifyHCaptchaToken(token: string, ip?: string): Promise<boolean> {
  const secretKey = process.env.HCAPTCHA_SECRET_KEY;
  if (!secretKey) {
    console.error('HCAPTCHA_SECRET_KEY environment variable not set.');
    return false;
  }
  
  const verificationUrl = 'https://hcaptcha.com/siteverify';
  const formData = new URLSearchParams();
  formData.append('secret', secretKey);
  formData.append('response', token);
  if (ip && ip !== 'unknown') formData.append('remoteip', ip);
  
  try {
    const response = await fetch(verificationUrl, {
      method: 'POST',
      body: formData,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    
    const text = await response.text();
    if (!response.ok) {
      console.error(`hCaptcha verification failed: ${response.status} ${response.statusText}`, text);
      return false;
    }
    
    const data = JSON.parse(text);
    if (data.success) {
      return true;
    } else {
      console.warn('hCaptcha response errors:', data['error-codes']);
      return false;
    }
  } catch (error) {
    console.error('Error verifying hCaptcha token:', error);
    return false;
  }
}