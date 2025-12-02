"use client";

import React, { ReactNode, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import {
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
  UserGroupIcon,
  ChartBarIcon,
  DocumentTextIcon,
  CogIcon,
  KeyIcon,
  CpuChipIcon,
  ArrowRightOnRectangleIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

type AdminLayoutProps = {
  children: ReactNode;
};

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { currentUser, logout } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: HomeIcon },
    { name: 'Users', href: '/admin/users', icon: UserGroupIcon },
    { name: 'Usage Monitoring', href: '/admin/usage-monitoring', icon: ChartBarIcon },
    { name: 'Generate Code', href: '/admin/generate-code', icon: CogIcon },
    { name: 'Changelog', href: '/admin/changelog', icon: DocumentTextIcon },
  ];

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  // Handle body scroll lock when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    } else {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, [mobileMenuOpen]);

  // Close menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };

    if (mobileMenuOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [mobileMenuOpen]);

  return (
    <div className="h-screen w-full bg-background text-foreground overflow-hidden flex relative">
      {/* Global Background Elements */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-gray-950" />
        
        {/* Subtle depth layers */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
            <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px]" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[100px]" />
        </div>
        
        {/* Clean grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Ccircle cx='7' cy='7' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
        
        {/* Elegant noise texture */}
        <div className="absolute inset-0 opacity-[0.015] mix-blend-soft-light bg-gradient-to-r from-white via-transparent to-white" />
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:w-72 md:flex-col relative z-20 p-4">
        <div className="flex flex-col flex-1 min-h-0 liquid-glass-sidebar h-full rounded-3xl border border-white/10 shadow-2xl">
          <div className="flex items-center h-20 flex-shrink-0 px-6 border-b border-white/5">
            <Link href="/admin" className="flex items-center group">
              <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/20 mr-3 group-hover:scale-105 transition-transform duration-300">
                <ShieldCheckIcon className="h-6 w-6 text-amber-400" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white tracking-tight">Admin Panel</h1>
                <p className="text-xs text-white/40 font-medium">VoidAI Dashboard</p>
              </div>
            </Link>
          </div>
          
          <div className="flex-1 flex flex-col overflow-y-auto py-6 px-4">
            <nav className="flex-1 space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`
                      group flex items-center px-4 py-3.5 text-sm font-medium rounded-2xl transition-all duration-300
                      ${
                        isActive
                          ? 'liquid-glass-nav-item active text-white'
                          : 'text-white/60 hover:text-white hover:bg-white/5'
                      }
                    `}
                  >
                    <item.icon
                      className={`
                        mr-3 flex-shrink-0 h-5 w-5 transition-all duration-300
                        ${
                          isActive
                            ? 'text-blue-400 scale-110'
                            : 'text-white/40 group-hover:text-white/80'
                        }
                      `}
                      aria-hidden="true"
                    />
                    {item.name}
                    {isActive && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.6)]" />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="p-4 border-t border-white/5 mx-2 mb-2">
            <div className="flex items-center p-3 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors duration-300 border border-white/5">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 p-[2px] shadow-lg">
                    <div className="h-full w-full rounded-full bg-slate-900 flex items-center justify-center">
                        <span className="text-white font-bold text-sm">{currentUser?.username?.charAt(0).toUpperCase()}</span>
                    </div>
                </div>
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <div className="text-sm font-semibold text-white truncate">
                  {currentUser?.username}
                </div>
                <div className="text-xs text-white/50 truncate flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  Online
                </div>
              </div>
              <button
                onClick={logout}
                className="flex-shrink-0 p-2 rounded-full text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
                title="Logout"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 z-30 w-full liquid-glass-2 border-b border-white/10 backdrop-blur-xl">
        <div className="flex items-center justify-between h-16 px-4">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <ShieldCheckIcon className="h-5 w-5 text-amber-400" />
            </div>
            <h1 className="text-lg font-bold text-white">Admin</h1>
          </Link>
          <button
            type="button"
            className="p-2.5 rounded-xl text-white/70 hover:text-white hover:bg-white/10 focus:outline-none transition-all duration-200 active:scale-95"
            onClick={toggleMobileMenu}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileMenuOpen ? (
              <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
            ) : (
              <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-300"
            aria-hidden="true"
            onClick={toggleMobileMenu}
            onTouchEnd={toggleMobileMenu}
          />
          
          {/* Sidebar */}
          <div className="fixed inset-y-0 left-0 flex w-full max-w-[300px]">
            <div className="relative flex w-full flex-col h-full liquid-glass-sidebar border-r border-white/10 shadow-2xl">
              {/* Close button */}
              <div className="absolute top-4 right-4 z-10">
                <button
                  type="button"
                  className="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-all duration-200"
                  onClick={toggleMobileMenu}
                >
                  <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                </button>
              </div>

              {/* Header */}
              <div className="flex items-center h-20 px-6 border-b border-white/5">
                <Link href="/admin" className="flex items-center gap-3" onClick={toggleMobileMenu}>
                  <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <ShieldCheckIcon className="h-6 w-6 text-amber-400" />
                  </div>
                  <span className="text-xl font-bold text-white tracking-tight">Admin Panel</span>
                </Link>
              </div>

              {/* Navigation */}
              <div className="flex-1 overflow-y-auto px-4 py-6">
                <nav className="space-y-2">
                  {navigation.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                        key={item.name}
                        href={item.href}
                        className={`
                            group flex items-center px-4 py-3.5 text-base font-medium rounded-xl transition-all duration-200
                            ${
                            isActive
                                ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white border border-white/10 shadow-lg'
                                : 'text-white/60 hover:bg-white/5 hover:text-white'
                            }
                        `}
                        onClick={toggleMobileMenu}
                        >
                        <item.icon
                            className={`
                            mr-3 flex-shrink-0 h-6 w-6 transition-colors duration-200
                            ${
                                isActive
                                ? 'text-blue-400'
                                : 'text-white/40 group-hover:text-white/80'
                            }
                            `}
                            aria-hidden="true"
                        />
                        {item.name}
                        </Link>
                    );
                  })}
                </nav>
              </div>

              {/* User section */}
              <div className="flex-shrink-0 p-4 border-t border-white/10 bg-black/20">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-500 to-red-500 p-[2px]">
                     <div className="h-full w-full rounded-full bg-slate-900 flex items-center justify-center">
                        <span className="text-white font-bold text-sm">{currentUser?.username?.charAt(0).toUpperCase()}</span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-base font-medium text-white truncate">
                      {currentUser?.username}
                    </div>
                    <div className="text-sm text-white/50">
                      Administrator
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      toggleMobileMenu();
                      logout();
                    }}
                    className="p-2 rounded-xl text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
                  >
                    <ArrowRightOnRectangleIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden relative z-10">
        <main className="flex-1 relative overflow-y-auto focus:outline-none custom-scrollbar">
          <div className="py-8 px-4 sm:px-8 md:pt-8 pt-24 max-w-7xl mx-auto w-full">
            {/* Mobile Breadcrumb */}
            <div className="md:hidden mb-6">
              <div className="flex items-center text-sm font-medium text-white/50 bg-white/5 px-4 py-2 rounded-full inline-flex backdrop-blur-sm border border-white/5">
                <Link href="/admin" className="hover:text-white transition-colors duration-200">
                  Admin
                </Link>
                {pathname !== '/admin' && (
                  <>
                    <span className="mx-2 text-white/20">/</span>
                    <span className="text-white">
                      {pathname === '/admin/users' ? 'Users' :
                       pathname === '/admin/usage-monitoring' ? 'Usage Monitoring' :
                       pathname === '/admin/generate-code' ? 'Generate Code' :
                       pathname === '/admin/changelog' ? 'Changelog' : ''}
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-8 pb-10">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;