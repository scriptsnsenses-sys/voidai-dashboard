import nodemailer from 'nodemailer';
import crypto from 'crypto';

export interface VerificationEmailData {
  email: string;
  code: string;
  username: string;
}

export interface PasswordResetNotificationData {
  email: string;
  token: string;
}

export interface PlanExpiredNotificationData {
  email: string;
  username: string;
  plan: string;
}

const transporter = nodemailer.createTransport({
  host: 'smtp.mailgun.org',
  port: 587,
  secure: false, 
  auth: {
    user: 'no-reply@voidai.app',
    pass: 'p4FqtWebaCFg5Ryw',
  },
});
export async function sendVerificationEmail(data: VerificationEmailData) {
  const { email, code, username } = data;

  const mailOptions = {
    from: 'no-reply@voidai.app',
    to: email,
    subject: 'Your voidai verification code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #f8f8f8; background-color: #111111;">
        <h1 style="color: #ffffff; text-align: center; margin-bottom: 30px;">Welcome to voidai</h1>
        <p style="margin-bottom: 20px; font-size: 16px; line-height: 1.5;">Hello ${username}, thank you for registering with voidai. To verify your email address and complete your registration, please use the verification code below:</p>

        <div style="text-align: center; margin: 30px 0; padding: 20px; background-color: #1a1a1a; border-radius: 8px;">
          <h2 style="font-family: monospace; font-size: 32px; letter-spacing: 5px; color: #3B82F6;">${code}</h2>
          <p style="margin-top: 10px; font-size: 14px; color: #999;">This code will expire in 10 minutes</p>
        </div>

        <p style="margin-bottom: 20px; font-size: 16px; line-height: 1.5;">If you didn't create this account, you can safely ignore this email.</p>

        <div style="border-top: 1px solid #333333; padding-top: 20px; text-align: center; font-size: 14px; color: #666666;">
          <p>© ${new Date().getFullYear()} voidai. All rights reserved.</p>
        </div>
      </div>
    `,
  };

  return await transporter.sendMail(mailOptions);
}

export function generateVerificationCode(): string {

  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendEmailVerificationReminder(data: VerificationEmailData) {
  const { email, code, username } = data;

  const mailOptions = {
    from: 'no-reply@voidai.app',
    to: email,
    subject: 'Your new voidai verification code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #f8f8f8; background-color: #111111;">
        <h1 style="color: #ffffff; text-align: center; margin-bottom: 30px;">voidai Email Verification</h1>
        <p style="margin-bottom: 20px; font-size: 16px; line-height: 1.5;">Hello ${username}, we've generated a new verification code for your account. To complete your registration and access all features of voidai, please use the code below:</p>

        <div style="text-align: center; margin: 30px 0; padding: 20px; background-color: #1a1a1a; border-radius: 8px;">
          <h2 style="font-family: monospace; font-size: 32px; letter-spacing: 5px; color: #3B82F6;">${code}</h2>
          <p style="margin-top: 10px; font-size: 14px; color: #999;">This code will expire in 10 minutes</p>
        </div>

        <p style="margin-bottom: 20px; font-size: 16px; line-height: 1.5;">If you didn't request this code, you can safely ignore this email.</p>

        <div style="border-top: 1px solid #333333; padding-top: 20px; text-align: center; font-size: 14px; color: #666666;">
          <p>© ${new Date().getFullYear()} voidai. All rights reserved.</p>
        </div>
      </div>
    `,
  };

  return await transporter.sendMail(mailOptions);
}

export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  const mailOptions = {
    from: 'no-reply@voidai.app',
    to: email,
    subject: 'Reset your voidai password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #f8f8f8; background-color: #111111;">
        <h1 style="color: #ffffff; text-align: center; margin-bottom: 30px;">Reset Your Password</h1>
        <p style="margin-bottom: 20px; font-size: 16px; line-height: 1.5;">Hello, someone has requested a password reset for your voidai account. If this was you, please click the button below to set a new password:</p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #3B82F6; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">Reset Password</a>
        </div>

        <p style="margin-bottom: 20px; font-size: 16px; line-height: 1.5;">Or copy and paste this URL into your browser:</p>
        <div style="margin: 20px 0; padding: 15px; background-color: #1a1a1a; border-radius: 8px; word-break: break-all; font-family: monospace; font-size: 14px;">
          <a href="${resetUrl}" style="color: #3B82F6; text-decoration: none;">${resetUrl}</a>
        </div>

        <p style="margin-bottom: 10px; font-size: 16px; line-height: 1.5;">The password reset link is only valid for 1 hour.</p>

        <p style="margin-bottom: 20px; font-size: 16px; line-height: 1.5;">If you didn't request a password reset, you can safely ignore this email. Your account is secure.</p>

        <div style="border-top: 1px solid #333333; padding-top: 20px; text-align: center; font-size: 14px; color: #666666;">
          <p>© ${new Date().getFullYear()} voidai. All rights reserved.</p>
        </div>
      </div>
    `,
  };

  return await transporter.sendMail(mailOptions);
}