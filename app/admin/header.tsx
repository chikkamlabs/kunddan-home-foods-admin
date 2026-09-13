'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { signOut } from '@/lib/auth';
import { Menu, X, LogOut } from 'lucide-react';
import { useState } from 'react';

interface HeaderProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export default function AdminHeader({
  isSidebarOpen,
  onToggleSidebar,
}: HeaderProps) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    await signOut();
    router.push('/login');
  };

  return (
    <header
      id="admin-header"
      className="admin-header-bar"
    >
      {/* Left section: Sidebar toggle button + Logo + Brand Name */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Toggle Button for mobile and desktop */}
        <button
          type="button"
          id="header-sidebar-toggle-btn"
          onClick={onToggleSidebar}
          aria-label={isSidebarOpen ? 'Close sidebar menu' : 'Open sidebar menu'}
          className="admin-header-toggle-btn"
        >
          {isSidebarOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </button>

        {/* Logo and Brand Name */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="relative h-10 w-10 sm:h-12 sm:w-12 shrink-0 overflow-hidden rounded-xl border border-neutral-200 bg-white p-0.5 shadow-xs flex items-center justify-center">
            <Image
              src="/khf_logo.png"
              alt="Kunddan Home Foods Logo"
              width={44}
              height={44}
              className="object-contain"
              priority
            />
          </div>
          <div className="flex flex-col">
            <span className="text-base sm:text-lg font-bold tracking-tight text-neutral-900 leading-tight">
              Kunddan Home Foods
            </span>
            <span className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider hidden sm:block">
              Admin Portal
            </span>
          </div>
        </div>
      </div>

      {/* Right section: Logout Button */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          id="header-logout-btn"
          onClick={handleLogout}
          disabled={loggingOut}
          className="admin-header-logout-btn"
        >
          <LogOut className="h-4 w-4 text-neutral-500" />
          <span className="hidden xs:inline sm:inline">
            {loggingOut ? 'Logging out...' : 'Logout'}
          </span>
        </button>
      </div>
    </header>
  );
}
