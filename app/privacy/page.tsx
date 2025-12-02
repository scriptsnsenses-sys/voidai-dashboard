"use client";

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function PrivacyPolicy() {
  return (
    <div className="flex flex-col min-h-screen bg-black relative">
      {}
      <div className="absolute inset-0 bg-gradient-radial opacity-50 pointer-events-none"></div>
      <div className="absolute inset-0 bg-subtle-dots pointer-events-none"></div>
      <div className="absolute inset-0 bg-soft-glow opacity-70 pointer-events-none"></div>

      {}
      <div className="relative w-full overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20">
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-8"
          >
            <Link 
              href="/" 
              className="inline-flex items-center text-sm text-white/60 hover:text-white transition-colors"
            >
              <ArrowLeftIcon className="w-4 h-4 mr-1" />
              Back to Home
            </Link>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-center md:text-left"
          >
            <h1 className="text-5xl md:text-6xl font-bold mb-4">
              <span className="text-gradient">Privacy Policy</span>
            </h1>
            <p className="text-lg text-white/70 max-w-2xl">
              At VoidAI, we value your privacy and are committed to protecting your personal information.
            </p>
          </motion.div>
        </div>
      </div>

      {}
      <main className="flex-1 py-12 relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-12"
          >
            <div className="border-b border-white/10 pb-4">
              <p className="text-white/60 italic">Last updated: June 23, 2025</p>
            </div>

            <section className="space-y-12">
              <div>
                <h2 className="text-2xl font-semibold text-white mb-4 flex items-center">
                  <span className="bg-blue-600/20 text-blue-400 rounded-full w-8 h-8 flex items-center justify-center mr-3">1</span>
                  Introduction
                </h2>
                <p className="text-white/80 leading-relaxed pl-11">
                  This Privacy Policy explains how VoidAI ("we", "our", or "us") collects, uses, and protects your personal information when you use our AI platform and services. VoidAI is committed to ensuring that your privacy is protected. This policy applies to our website at voidai.app, our dashboard, and all related services.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-white mb-4 flex items-center">
                  <span className="bg-blue-500/20 text-blue-400 rounded-full w-8 h-8 flex items-center justify-center mr-3">2</span>
                  Information We Collect
                </h2>
                <div className="text-white/80 leading-relaxed pl-11 space-y-4">
                  <p>We collect several types of information from and about users of our platform, including:</p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li><strong>Personal Data:</strong> Email address and billing information necessary for account management and invoicing.</li>
                    <li><strong>Account Credentials:</strong> Passwords are encrypted and not accessible by the VoidAI team.</li>
                    <li><strong>API Usage Data:</strong> We collect information about your API usage, including request count, timestamps, and request types.</li>
                    <li><strong>IP Addresses:</strong> We log IP addresses during registration attempts and API usage to detect and prevent potential malicious activities, spam accounts, and abuse.</li>
                  </ul>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-white mb-4 flex items-center">
                  <span className="bg-blue-400/20 text-blue-300 rounded-full w-8 h-8 flex items-center justify-center mr-3">3</span>
                  How We Use Your Information
                </h2>
                <div className="text-white/80 leading-relaxed pl-11 space-y-4">
                  <h3 className="text-xl font-semibold mt-6 mb-3">Usage of Information</h3>
                  <p>The information we collect is used for the following purposes:</p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li><strong>Service Delivery:</strong> To provide you with access to our platform and APIs.</li>
                    <li><strong>Billing:</strong> To charge you for premium features and manage your subscription.</li>
                    <li><strong>Communication:</strong> To notify you about changes to our service, provide customer support, or send marketing materials if you've opted in.</li>
                    <li><strong>Platform Improvement:</strong> To understand how users interact with our services and identify areas for enhancement.</li>
                    <li><strong>Security:</strong> To detect, prevent, and address technical issues, spam, or malicious activities. This includes using IP address logs to identify and block potentially malicious users.</li>
                    <li><strong>Usage Tracking:</strong> To monitor and analyze your usage of our platform, including API request counts, types, and patterns, to optimize the service and ensure fair usage according to your plan tier.</li>
                  </ul>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-white mb-4 flex items-center">
                  <span className="bg-purple-600/20 text-purple-400 rounded-full w-8 h-8 flex items-center justify-center mr-3">4</span>
                  Content Moderation and Safety
                </h2>
                <div className="text-white/80 leading-relaxed pl-11 space-y-4">
                  <p>VoidAI is committed to maintaining a safe and legal platform. To ensure the safety of our users and comply with legal requirements, we implement content moderation practices:</p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li><strong>Automated Content Scanning:</strong> We may automatically scan and analyze content submitted through our APIs to detect potentially harmful, illegal, or inappropriate material.</li>
                    <li><strong>CSAM Detection:</strong> We actively monitor for and block Child Sexual Abuse Material (CSAM) and other illegal content using industry-standard detection methods.</li>
                    <li><strong>Content Filtering:</strong> We may filter or block content that violates our Terms of Service, including but not limited to content that is harmful, abusive, harassing, or illegal.</li>
                    <li><strong>Legal Compliance:</strong> We cooperate with law enforcement agencies when required by law and may report illegal content to appropriate authorities.</li>
                    <li><strong>Content Retention:</strong> Content flagged for moderation purposes may be temporarily retained for review, investigation, and legal compliance purposes.</li>
                  </ul>
                  <p>By using our services, you acknowledge and consent to these content moderation practices. We reserve the right to suspend or terminate accounts that violate our content policies.</p>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-white mb-4 flex items-center">
                  <span className="bg-indigo-500/20 text-indigo-400 rounded-full w-8 h-8 flex items-center justify-center mr-3">5</span>
                  Data Storage and Security
                </h2>
                <div className="text-white/80 leading-relaxed pl-11 space-y-4">
                  <p>VoidAI takes data security seriously and implements appropriate measures:</p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>All passwords are securely hashed and salted using industry-standard cryptographic functions</li>
                    <li>We use rate limiting and DDoS protection to safeguard our infrastructure</li>
                    <li>API keys are encrypted and stored securely</li>
                    <li>We use MongoDB for data storage with appropriate security controls</li>
                    <li>Access to our systems is strictly controlled and monitored</li>
                    <li>We implement regular security audits and updates</li>
                  </ul>
                  <p>We retain your personal data for as long as necessary to provide you with our services. You can request deletion of your account and associated data at any time (see Your Rights and Choices).</p>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-white mb-4 flex items-center">
                  <span className="bg-indigo-400/20 text-indigo-300 rounded-full w-8 h-8 flex items-center justify-center mr-3">6</span>
                  Cookies and Tracking Technologies
                </h2>
                <div className="text-white/80 leading-relaxed pl-11">
                  <p>We use cookies and similar technologies for authentication, security, These include:</p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li><strong>Essential cookies:</strong> Required for our site to function properly, including for authentication</li>
                  </ul>
                  <p className="mt-4">You can control cookies through your browser settings. However, disabling certain cookies may affect the functionality of our services.</p>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-white mb-4 flex items-center">
                  <span className="bg-violet-500/20 text-violet-400 rounded-full w-8 h-8 flex items-center justify-center mr-3">7</span>
                  Third-Party Services
                </h2>
                <div className="text-white/80 leading-relaxed pl-11">
                  <p>We work with the following third-party services that may process your data:</p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li><strong>Payment processors:</strong> We use Stripe to handle payment transactions</li>
                    <li><strong>AI service providers:</strong> We may route AI model requests through providers such as OpenAI, Google, Anthropic, and more.</li>
                    <li><strong>Cloud infrastructure:</strong> Our services are hosted on secure cloud infrastructure</li>
                    <li><strong>Communication services:</strong> We use email services for verification and updates.</li>
                  </ul>
                  <p className="mt-4">Each of these third parties has their own privacy policies which govern how they process your data. We encourage you to review their privacy policies as well.</p>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-white mb-4 flex items-center">
                  <span className="bg-violet-400/20 text-violet-300 rounded-full w-8 h-8 flex items-center justify-center mr-3">8</span>
                  Your Rights and Choices
                </h2>
                <div className="text-white/80 leading-relaxed pl-11">
                  <p>Depending on your location, you may have certain rights regarding your personal information:</p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>Access and download a copy of your personal data</li>
                    <li>Correct inaccurate or incomplete information</li>
                    <li>Request deletion of your personal data</li>
                    <li>Object to or restrict certain processing activities</li>
                    <li>Withdraw consent where applicable</li>
                    <li>Data portability (receive your data in a structured, machine-readable format)</li>
                  </ul>
                  <p className="mt-4">To exercise these rights, please contact us at privacy@voidai.app. We will respond to your request within 1-3 business days.</p>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-white mb-4 flex items-center">
                  <span className="bg-purple-500/20 text-purple-400 rounded-full w-8 h-8 flex items-center justify-center mr-3">9</span>
                  Children's Privacy
                </h2>
                <p className="text-white/80 leading-relaxed pl-11">
                  Our services are not directed to children under the age of 18. We do not knowingly collect personal information from children. If you are a parent or guardian and believe your child has provided us with personal information, please contact us so we can take appropriate action.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-white mb-4 flex items-center">
                  <span className="bg-purple-400/20 text-purple-300 rounded-full w-8 h-8 flex items-center justify-center mr-3">10</span>
                  International Data Transfers
                </h2>
                <p className="text-white/80 leading-relaxed pl-11">
                  We operate globally and may transfer your personal information to servers or third parties located outside your country of residence. By using our services, you consent to the transfer of your data internationally. We take steps to ensure that your data receives an adequate level of protection regardless of where it is processed.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-white mb-4 flex items-center">
                  <span className="bg-fuchsia-500/20 text-fuchsia-400 rounded-full w-8 h-8 flex items-center justify-center mr-3">11</span>
                  Changes to This Privacy Policy
                </h2>
                <p className="text-white/80 leading-relaxed pl-11">
                  We may update this Privacy Policy from time to time. We will notify you of significant changes by posting the new Privacy Policy on our website and, where appropriate, sending you a notification. We encourage you to periodically review this page to stay informed about our data practices.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-white mb-4 flex items-center">
                  <span className="bg-fuchsia-400/20 text-fuchsia-300 rounded-full w-8 h-8 flex items-center justify-center mr-3">12</span>
                  GDPR Compliance
                </h2>
                <div className="text-white/80 leading-relaxed pl-11">
                  <p>For users in the European Union, we comply with the General Data Protection Regulation (GDPR). This means:</p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>We process data based on lawful grounds (contract performance, legitimate interests, consent, or legal obligation)</li>
                    <li>We implement appropriate technical and organizational measures to ensure data security</li>
                    <li>We notify relevant authorities and affected users of data breaches as required</li>
                    <li>We conduct data protection impact assessments where appropriate</li>
                    <li>We honor data subject rights as outlined in the "Your Rights and Choices" section</li>
                  </ul>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-white mb-4 flex items-center">
                  <span className="bg-pink-500/20 text-pink-400 rounded-full w-8 h-8 flex items-center justify-center mr-3">13</span>
                  CCPA Compliance
                </h2>
                <div className="text-white/80 leading-relaxed pl-11">
                  <p>For California residents, the California Consumer Privacy Act (CCPA) provides specific rights:</p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>Right to know what personal information is collected, used, shared, or sold</li>
                    <li>Right to delete personal information held by us</li>
                    <li>Right to opt-out of the sale of personal information (note: VoidAI does not sell personal information)</li>
                    <li>Right to non-discrimination for exercising CCPA rights</li>
                  </ul>
                  <p className="mt-4">To exercise these rights, please contact us as described in the "Contact Information" section.</p>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-white mb-4 flex items-center">
                  <span className="bg-pink-400/20 text-pink-300 rounded-full w-8 h-8 flex items-center justify-center mr-3">14</span>
                  Contact Information
                </h2>
                <div className="text-white/80 leading-relaxed pl-11">
                  <p>If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us at:</p>
                  <div className="mt-4">
                    <p><strong>Email:</strong> privacy@voidai.app</p>
                  </div>
                  <p className="mt-4">We are committed to addressing your concerns and will respond promptly to any inquiries.</p>
                </div>
              </div>
            </section>
          </motion.div>
        </div>
      </main>

      {}
      <footer className="py-12 relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="border-t border-white/5 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-white/40">
              © 2025 voidai. All rights reserved.
            </p>
            <div className="flex items-center space-x-4">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                whileHover={{ y: -3 }}
              >
                <Link 
                  href="/tos" 
                  className="group relative inline-flex overflow-hidden rounded-lg p-[1px]"
                >
                  <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#a5b4fc_0%,#818cf8_50%,#a5b4fc_100%)]" />
                  <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-lg bg-black px-3 py-1 text-sm font-medium text-white backdrop-blur-3xl">
                    Terms of Service
                  </span>
                </Link>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                whileHover={{ y: -3 }}
              >
                <Link 
                  href="/" 
                  className="group relative inline-flex overflow-hidden rounded-lg p-[1px]"
                >
                  <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#a5b4fc_0%,#818cf8_50%,#a5b4fc_100%)]" />
                  <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-lg bg-black px-3 py-1 text-sm font-medium text-white backdrop-blur-3xl">
                    Home
                  </span>
                </Link>
              </motion.div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}