"use client";

import React, { ReactNode, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import {
  KeyIcon,
  HomeIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  ChatBubbleLeftRightIcon,
  InformationCircleIcon,
  ChartBarIcon,
  CubeIcon,
  CogIcon,
  BeakerIcon
} from '@heroicons/react/24/outline';

type DashboardLayoutProps = {
  children: ReactNode;
};

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { currentUser, logout } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'API Keys', href: '/dashboard/keys', icon: KeyIcon },
    { name: 'Models', href: '/dashboard/models', icon: CubeIcon },
    { name: 'Usage', href: '/dashboard/usage', icon: ChartBarIcon },
    { name: 'Free Access', href: '/dashboard/billing', icon: InformationCircleIcon },
  ];

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const formatDate = (timestamp?: string) => {
    if (!timestamp) return 'Never';
    return new Date(parseInt(timestamp) * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-950 max-w-full">
      {/* Liquid Glass Sidebar */}
      <aside className="hidden fixed inset-y-0 left-0 md:flex md:flex-col md:w-64 bg-gradient-to-b from-white/[0.03] to-white/[0.01] backdrop-blur-xl border-r border-white/08 z-40">
        {/* Header */}
        <div className="flex items-center h-16 flex-shrink-0 px-4 border-b border-white/10">
          <Link href="/" className="flex items-center group">
            <h1 className="text-2xl font-bold text-white/95 group-hover:from-blue-400 group-hover:via-indigo-400 group-hover:to-purple-400 transition-all duration-300">
              voidai
            </h1>
          </Link>
        </div>

        {/* Navigation */}
        <div className="flex flex-col flex-1 overflow-y-auto custom-scrollbar">
          <div className="flex-1 flex flex-col">
            <nav className="flex-1 py-6 px-3 space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  aria-current={pathname === item.href ? "page" : undefined}
                  className={`
                    bg-transparent hover:bg-white/[0.04] border border-transparent hover:border-white/08 rounded-lg group flex items-center px-4 py-3 text-sm font-medium transition-all duration-300
                    ${pathname === item.href ? 'active' : ''}
                  `}
                >
                  <item.icon
                    className={`
                      mr-3 flex-shrink-0 h-5 w-5 transition-all duration-300
                      ${
                        pathname === item.href
                          ? 'text-blue-400 drop-shadow-sm'
                          : 'text-white/70 group-hover:text-blue-400 group-hover:drop-shadow-sm'
                      }
                    `}
                    aria-hidden="true"
                  />
                  <span className={pathname === item.href ? 'text-white/95' : 'text-white/80 group-hover:text-white'}>
                    {item.name}
                  </span>
                </Link>
              ))}
            </nav>
          </div>

          {/* User Profile Section */}
          <div className="flex-shrink-0 border-t border-white/10 p-4">
            <div className="bg-gradient-to-b from-white/[0.04] to-white/[0.02] backdrop-blur-md border border-white/06 rounded-lg p-3">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  {currentUser?.profile_picture ? (
                    <img
                      key={currentUser.profile_picture}
                      src={currentUser.profile_picture}
                      alt={currentUser.username}
                      className="h-10 w-10 rounded-full object-cover border border-white/10"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                        if (fallback) fallback.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div
                    className="bg-gradient-to-b from-white/[0.08] to-white/[0.04] backdrop-blur-md border border-white/10 h-10 w-10 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                    style={{ display: currentUser?.profile_picture ? 'none' : 'flex' }}
                  >
                    {currentUser?.username?.charAt(0).toUpperCase()}
                  </div>
                </div>
                <div className="ml-3 flex-1 min-w-0">
                  <div className="text-sm font-medium text-white/95 truncate">
                    {currentUser?.username}
                  </div>
                  <div className="text-xs text-white/95-subtle truncate capitalize">
                    Free forever
                  </div>
                </div>
                <div className="flex items-center gap-0">
                  <Link
                    href="/dashboard/settings"
                    className="flex-shrink-0 p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all duration-200"
                    title="Settings"
                  >
                    <CogIcon className="h-4 w-4" aria-hidden="true" />
                  </Link>
                  <button
                    onClick={logout}
                    className="flex-shrink-0 p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all duration-200"
                    title="Logout"
                  >
                    <ArrowRightOnRectangleIcon className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 md:ml-64 dashboard-main-content min-w-0 max-w-full">
        {/* Mobile Header */}
        <div className="md:hidden sticky top-0 z-50 bg-gradient-to-b from-white/[0.04] to-white/[0.02] backdrop-blur-xl border-b border-white/08 border-b border-white/10">
          <div className="flex items-center justify-between h-16 px-4">
            <Link href="/" className="flex items-center">
              <h1 className="text-2xl font-bold text-white/95">voidai</h1>
            </Link>
            <button
              type="button"
              className="bg-gradient-to-b from-white/[0.06] to-white/[0.03] backdrop-blur-md border border-white/08 hover:border-white/12 rounded-lg p-2 text-white/70 hover:text-white focus:outline-none"
              onClick={toggleMobileMenu}
            >
              <Bars3Icon className="block h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 relative overflow-y-auto overflow-x-hidden focus:outline-none custom-scrollbar">

          <div className="py-8 px-4 sm:px-6 md:px-8 relative min-h-screen max-w-full overflow-x-hidden">
            {/* Mobile Spacing */}
            <div className="md:hidden h-4"></div>
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 flex z-50 md:hidden" role="dialog" aria-modal="true">
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm" aria-hidden="true" onClick={toggleMobileMenu}></div>
          <div className="relative flex flex-col w-full max-w-xs bg-gradient-to-b from-white/[0.03] to-white/[0.01] backdrop-blur-xl border-r border-white/08 shadow-2xl">
            {/* Close Button */}
            <div className="absolute top-0 right-0 pt-3 pr-3 z-50">
              <button
                type="button"
                className="bg-gradient-to-b from-white/[0.06] to-white/[0.03] backdrop-blur-md border border-white/08 hover:border-white/12 rounded-lg p-2 text-white/70 hover:text-white focus:outline-none"
                onClick={toggleMobileMenu}
              >
                <XMarkIcon className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            {/* Mobile Menu Content */}
            <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar">
              <div className="flex-shrink-0 flex items-center h-16 px-4 border-b border-white/10">
                <Link href="/" className="flex items-center group">
                  <h1 className="text-2xl font-bold text-white/95 group-hover:from-blue-400 group-hover:via-indigo-400 group-hover:to-purple-400 transition-all duration-300">
                    voidai
                  </h1>
                </Link>
              </div>
              <nav className="flex-1 px-3 pt-6 pb-4 space-y-2">
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    aria-current={pathname === item.href ? "page" : undefined}
                    className={`
                      bg-transparent hover:bg-white/[0.04] border border-transparent hover:border-white/08 rounded-lg group flex items-center px-4 py-3 text-base font-medium transition-all duration-300
                      ${pathname === item.href ? 'active' : ''}
                    `}
                    onClick={toggleMobileMenu}
                  >
                    <item.icon
                      className={`
                        mr-3 flex-shrink-0 h-6 w-6 transition-all duration-300
                        ${
                          pathname === item.href
                            ? 'text-blue-400 drop-shadow-sm'
                            : 'text-white/70 group-hover:text-blue-400 group-hover:drop-shadow-sm'
                        }
                      `}
                      aria-hidden="true"
                    />
                    <span className={pathname === item.href ? 'text-white/95' : 'text-white/80 group-hover:text-white'}>
                      {item.name}
                    </span>
                  </Link>
                ))}
              </nav>
            </div>

            {/* Mobile User Profile */}
            <div className="flex-shrink-0 border-t border-white/10 p-4">
              <div className="bg-gradient-to-b from-white/[0.04] to-white/[0.02] backdrop-blur-md border border-white/06 rounded-lg p-3">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    {currentUser?.profile_picture ? (
                      <img
                        key={currentUser.profile_picture}
                        src={currentUser.profile_picture}
                        alt={currentUser.username}
                        className="h-10 w-10 rounded-full object-cover border border-white/10"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div
                      className="bg-gradient-to-b from-white/[0.08] to-white/[0.04] backdrop-blur-md border border-white/10 h-10 w-10 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                      style={{ display: currentUser?.profile_picture ? 'none' : 'flex' }}
                    >
                      {currentUser?.username?.charAt(0).toUpperCase()}
                    </div>
                  </div>
                  <div className="ml-3 flex-1">
                    <div className="text-base font-medium text-white/95">
                      {currentUser?.username}
                    </div>
                    <div className="text-sm text-white/95-subtle capitalize">
                      Free forever
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href="/dashboard/settings"
                      onClick={toggleMobileMenu}
                      className="flex-shrink-0 p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all duration-200"
                      title="Settings"
                    >
                      <CogIcon className="h-4 w-4" aria-hidden="true" />
                    </Link>
                    <button
                      onClick={() => {
                        toggleMobileMenu();
                        logout();
                      }}
                      className="flex-shrink-0 p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all duration-200"
                      title="Logout"
                    >
                      <ArrowRightOnRectangleIcon className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardLayout;