"use client";

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function TermsOfService() {
  return (
    <div className="flex flex-col min-h-screen bg-black relative">
      <div className="absolute inset-0 bg-gradient-radial opacity-50 pointer-events-none"></div>
      <div className="absolute inset-0 bg-subtle-dots pointer-events-none"></div>
      <div className="absolute inset-0 bg-soft-glow opacity-70 pointer-events-none"></div>

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
              <span className="text-gradient">Terms of Service</span>
            </h1>
            <p className="text-lg text-white/70 max-w-2xl">
              Please read these terms carefully before using our platform and services.
            </p>
          </motion.div>
        </div>
      </div>

      <main className="flex-1 py-12 relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-12"
          >
            <div className="border-b border-white/10 pb-4">
              <p className="text-white/60 italic">Last updated: 2025/07/19 15:51 UTC</p>
            </div>

            <section className="space-y-12">
              <div>
                <h2 className="text-2xl font-semibold text-white mb-4 flex items-center">
                  <span className="bg-blue-600/20 text-blue-400 rounded-full w-8 h-8 flex items-center justify-center mr-3">1</span>
                  Introduction
                </h2>
                <div className="text-white/80 leading-relaxed pl-11 space-y-4">
                  <p>Welcome to VoidAI. These Terms of Service ("Terms") govern your use of our website, API, platform, and all related services provided by VoidAI ("Services"). By accessing or using our Services, you agree to be bound by these Terms and our Privacy Policy.</p>
                  <p>Please read these Terms carefully before creating an account or using our Services. If you do not agree with any part of these Terms, you must not use our Services.</p>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-white mb-4 flex items-center">
                  <span className="bg-blue-500/20 text-blue-400 rounded-full w-8 h-8 flex items-center justify-center mr-3">2</span>
                  Acceptance of Terms
                </h2>
                <div className="text-white/80 leading-relaxed pl-11 space-y-4">
                  <p>By accessing or using VoidAI, you represent that:</p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>You have read, understood, and agree to be bound by these Terms</li>
                    <li>You are at least 18 years old (or the accordance of your legal guardians/parents)</li>
                    <li>You have the legal capacity to enter into a binding agreement</li>
                    <li>You are not barred from using our Services under applicable law</li>
                  </ul>
                  <p>If you are using our Services on behalf of a company or organization, you represent that you have the authority to bind that entity to these Terms.</p>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-white mb-4 flex items-center">
                  <span className="bg-blue-400/20 text-blue-300 rounded-full w-8 h-8 flex items-center justify-center mr-3">3</span>
                  Services Description
                </h2>
                <div className="text-white/80 leading-relaxed pl-11 space-y-4">
                  <p>VoidAI provides access to various AI models through our API and platform, including but not limited to:</p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>Text generation, completion, and editing</li>
                    <li>Image generation and editing</li>
                    <li>Access to large language models (LLMs) from various providers</li>
                    <li>API endpoints for integration with your applications</li>
                    <li>Web-based dashboard for managing your account and usage</li>
                  </ul>
                  <p>We reserve the right to modify, suspend, or discontinue any aspect of our Services at any time, with or without notice. We are not liable to you or any third party for any modification, suspension, or discontinuation of our Services.</p>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-white mb-4 flex items-center">
                  <span className="bg-indigo-500/20 text-indigo-400 rounded-full w-8 h-8 flex items-center justify-center mr-3">4</span>
                  User Accounts
                </h2>
                <div className="text-white/80 leading-relaxed pl-11 space-y-4">
                  <p>To access most features of our Services, you must create an account. When creating your account:</p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>You must provide accurate, current, and complete information</li>
                    <li>You are responsible for maintaining the confidentiality of your account credentials</li>
                    <li>You are responsible for all activities that occur under your account</li>
                    <li>You must notify us immediately of any unauthorized use of your account</li>
                    <li>You may not share your account credentials with any third party</li>
                    <li>You may not transfer your account to another person without our prior written consent</li>
                  </ul>
                  <p>We reserve the right to suspend or terminate your account at our discretion if we believe you have violated these Terms or if your account shows signs of suspicious activity.</p>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-white mb-4 flex items-center">
                  <span className="bg-indigo-400/20 text-indigo-300 rounded-full w-8 h-8 flex items-center justify-center mr-3">5</span>
                  API Usage
                </h2>
                <div className="text-white/80 leading-relaxed pl-11 space-y-4">
                  <p>When using our API, you agree to the following:</p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li><strong>Rate Limits:</strong> We expect that you will not exceed the rate limits specified for your plan tier.</li>
                    <li><strong>API Keys:</strong> You will keep your API keys secure and not share them with unauthorized parties</li>
                    <li><strong>Usage Monitoring:</strong> We monitor and track API usage data including timestamps, request counts, and rate limits for each account.</li>
                    <li><strong>IP Address Logging:</strong> We log IP addresses during registration and API usage to detect and prevent malicious activities, including spam accounts and abuse.</li>
                    <li><strong>Prohibited Uses:</strong> You will not use our API to:
                      <ul className="list-disc pl-5 mt-2">
                        <li>Generate content that violates applicable laws or promotes illegal activities</li>
                        <li>Create spam, malware, or phishing content</li>
                        <li>Intentionally overwhelm or degrade our systems</li>
                        <li>Infringe on intellectual property rights</li>
                        <li>Generate harmful, CSAM (Child Sexual Abuse Material), harassing, or discriminatory content</li>
                      </ul>
                    </li>
                  </ul>
                  <p>We monitor API usage and reserve the right to throttle, suspend, or terminate access to users who abuse our system or violate these Terms.</p>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-white mb-4 flex items-center">
                  <span className="bg-violet-500/20 text-violet-400 rounded-full w-8 h-8 flex items-center justify-center mr-3">6</span>
                  Payment Terms
                </h2>
                <div className="text-white/80 leading-relaxed pl-11 space-y-4">
                  <p>VoidAI offers multiple subscription plans and payment options:</p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li><strong>Subscription Plans:</strong> We offer various subscription plans with different features and usage limits. Current pricing is available on our website</li>
                    <li><strong>Payment Processing:</strong> Payments are processed through Stripe</li>
                    <li><strong>Billing Cycles:</strong> Subscriptions are billed in advance on either a monthly or annual basis</li>
                    <li><strong>Automatic Renewal:</strong> Subscriptions automatically renew unless canceled before the renewal date</li>
                    <li><strong>Refunds:</strong> We do not provide refunds for partial subscription periods or unused credits</li>
                    <li><strong>Price Changes:</strong> We reserve the right to change our prices at any time, these may be announced either on our site or our [Discord server](https://discord.gg/k4QGtB9kdN)</li>
                    <li><strong>Terms of Service and Privacy Policy Changes:</strong> We reserve the right to change our Terms of Service, as well as Privacy Policy at any time</li>
                  </ul>
                  <p>If your payment cannot be processed, we may suspend or terminate your access to our Services. You are responsible for all applicable taxes, fees, and charges related to your use of our Services.</p>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-white mb-4 flex items-center">
                  <span className="bg-violet-400/20 text-violet-300 rounded-full w-8 h-8 flex items-center justify-center mr-3">7</span>
                  Intellectual Property
                </h2>
                <div className="text-white/80 leading-relaxed pl-11 space-y-4">
                  <p><strong>Our Intellectual Property:</strong></p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>VoidAI and its logo, trademarks, and all other proprietary identifiers used by us are our trademarks</li>
                    <li>All software, text, graphics, user interfaces, and other content provided through our Services are owned by us or our licensors</li>
                    <li>You may not copy, modify, distribute, sell, or lease any part of our Services without our permission</li>
                  </ul>

                  <p className="mt-4"><strong>AI-Generated Content:</strong></p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>You retain ownership of the specific outputs generated for you by our Services</li>
                    <li>You are responsible for ensuring your use of AI-generated content complies with applicable copyright laws and doesn't infringe on third-party rights</li>
                    <li>We do not claim ownership of outputs generated by our Services at your direction</li>
                    <li>However, we may use anonymized data from your interactions to improve our Services</li>
                  </ul>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-white mb-4 flex items-center">
                  <span className="bg-purple-500/20 text-purple-400 rounded-full w-8 h-8 flex items-center justify-center mr-3">8</span>
                  Limitations of Liability
                </h2>
                <div className="text-white/80 leading-relaxed pl-11 space-y-4">
                  <p>To the maximum extent permitted by law:</p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>Our Services are provided "as is" without warranties of any kind, either express or implied</li>
                    <li>We do not guarantee that our Services will be uninterrupted, secure, or error-free</li>
                    <li>We are not responsible for the accuracy, quality, or appropriateness of content generated through our Services</li>
                    <li>In no event will VoidAI be liable for any indirect, special, incidental, or consequential damages</li>
                    <li>Our total liability for any claims related to these Terms is limited to the amount you paid us in the 12 months prior to the claim</li>
                  </ul>
                  <p>Some jurisdictions do not allow the exclusion of certain warranties or the limitation of liability for certain damages, so some of the above limitations may not apply to you.</p>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-white mb-4 flex items-center">
                  <span className="bg-purple-400/20 text-purple-300 rounded-full w-8 h-8 flex items-center justify-center mr-3">9</span>
                  Indemnification
                </h2>
                <div className="text-white/80 leading-relaxed pl-11">
                  <p>You agree to indemnify, defend, and hold harmless VoidAI and its employees, founders, and affiliates from and against any and all claims, damages, obligations, losses, liabilities, costs, and expenses (including attorney's fees) arising from:</p>
                  <ul className="list-disc pl-5 space-y-2 mt-4">
                    <li>Your use of our Services</li>
                    <li>Your violation of these Terms</li>
                    <li>Your violation of any third-party rights, including intellectual property rights</li>
                    <li>Any content generated through our Services at your direction</li>
                    <li>Any harm caused to any person or entity as a result of your use of our Services</li>
                  </ul>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-white mb-4 flex items-center">
                  <span className="bg-fuchsia-500/20 text-fuchsia-400 rounded-full w-8 h-8 flex items-center justify-center mr-3">10</span>
                  Termination
                </h2>
                <div className="text-white/80 leading-relaxed pl-11 space-y-4">
                  <p>Your account may be suspended or terminated under the following conditions:</p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>You violate these Terms or our Community Guidelines</li>
                    <li>You engage in fraudulent, illegal, or abusive activities</li>
                    <li>You fail to pay applicable fees after multiple attempts</li>
                    <li>We are required to do so by law</li>
                    <li>We decide to discontinue our Services</li>
                  </ul>
                  <p>You may terminate your account at any time by contacting us. Upon termination:</p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>You will lose access to our Services</li>
                    <li>Any outstanding payments will be processed</li>
                    <li>We may retain certain information as required by law or for legitimate business purposes</li>
                    <li>The provisions of these Terms that by their nature should survive termination will survive</li>
                  </ul>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-white mb-4 flex items-center">
                  <span className="bg-fuchsia-400/20 text-fuchsia-300 rounded-full w-8 h-8 flex items-center justify-center mr-3">11</span>
                  Changes to Terms
                </h2>
                <div className="text-white/80 leading-relaxed pl-11 space-y-4">
                  <p>We may update these Terms from time to time to reflect:</p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>Changes to our Services</li>
                    <li>Legal, regulatory, or security requirements</li>
                    <li>Business operations adjustments</li>
                  </ul>
                  <p>When we make changes:</p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>We will post the updated Terms on our website</li>
                    <li>For significant changes, we will notify you via email or through our Services</li>
                    <li>Changes will become effective 30 days after they are posted</li>
                    <li>Your continued use of our Services after changes take effect constitutes your acceptance of the updated Terms</li>
                  </ul>
                  <p>If you do not agree with the updated Terms, you must stop using our Services and close your account.</p>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-white mb-4 flex items-center">
                  <span className="bg-pink-500/20 text-pink-400 rounded-full w-8 h-8 flex items-center justify-center mr-3">12</span>
                  Governing Law
                </h2>
                <div className="text-white/80 leading-relaxed pl-11 space-y-4">
                  <p>These Terms shall be governed by and construed in accordance with the laws of Delaware, United States, without regard to its conflict of law provisions.</p>
                  <p>Any dispute arising out of or relating to these Terms or our Services shall be subject to the exclusive jurisdiction of the state and federal courts located in Delaware, United States.</p>
                  <p>If any provision of these Terms is found to be unenforceable or invalid, that provision will be limited or eliminated to the minimum extent necessary, and the remaining provisions will continue in full force and effect.</p>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-white mb-4 flex items-center">
                  <span className="bg-pink-400/20 text-pink-300 rounded-full w-8 h-8 flex items-center justify-center mr-3">13</span>
                  Contact Information
                </h2>
                <div className="text-white/80 leading-relaxed pl-11 space-y-4">
                  <p>If you have any questions, concerns, or feedback regarding these Terms, please contact us at:</p>
                  <div className="mt-4">
                    <p><strong>Email:</strong> legal@voidai.app</p>
                  </div>
                  <p className="mt-4">We strive to respond to all inquiries within 3 business days.</p>
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
              © 2025 VoidAI. All rights reserved.
            </p>
            <div className="flex items-center space-x-4">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                whileHover={{ y: -3 }}
              >
                <Link 
                  href="/privacy" 
                  className="group relative inline-flex overflow-hidden rounded-lg p-[1px]"
                >
                  <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#a5b4fc_0%,#818cf8_50%,#a5b4fc_100%)]" />
                  <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-lg bg-black px-3 py-1 text-sm font-medium text-white backdrop-blur-3xl">
                    Privacy Policy
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