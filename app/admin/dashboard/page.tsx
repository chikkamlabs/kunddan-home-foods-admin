'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentAdminUser } from '@/lib/auth';
import type { User } from '@/lib/datatypes';
import { Loader2, ShieldCheck } from 'lucide-react';
import AdminHeader from '../header';
import AdminSidebar from '../sidebar';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [adminUser, setAdminUser] = useState<User | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      const { user, error } = await getCurrentAdminUser();
      if (error || !user) {
        router.push('/login');
        return;
      }
      setAdminUser(user);
      setLoading(false);
    }
    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin brand-spinner" />
          <p className="text-sm text-neutral-500">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-screen">
      {/* Top Header */}
      <AdminHeader
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
      />

      <div className="admin-body-layout">
        {/* Sidebar */}
        <AdminSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 flex items-center justify-center">
          <div className="w-full max-w-xl ui-card p-8 sm:p-10 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <ShieldCheck className="h-8 w-8" />
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 mb-2">
              Hello Admin.
            </h1>
            <p className="text-base text-neutral-600 mb-6">
              You are successfully logged in.
            </p>

            {adminUser && (
              <div className="rounded-xl bg-neutral-50 p-5 border border-neutral-100 text-left text-sm text-neutral-700">
                <div className="flex justify-between py-1.5 border-b border-neutral-200/60">
                  <span className="text-neutral-500">Admin Account</span>
                  <span className="font-semibold text-neutral-900">
                    {adminUser.name || adminUser.email || 'Admin'}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 pt-2.5">
                  <span className="text-neutral-500">Access Level</span>
                  <span className="badge-active">
                    {adminUser.role}
                  </span>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
