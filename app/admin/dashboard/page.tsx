'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCurrentAdminUser } from '@/lib/auth';
import { getTodayOrdersCount } from '@/lib/ordersStore';
import { getTotalProductsCount } from '@/lib/productsStore';
import { getTotalCustomersCount } from '@/lib/customersStore';
import { getTotalCouponsCount } from '@/lib/couponsStore';
import {
  Loader2,
  ShoppingBag,
  Package,
  Users,
  Ticket,
  ArrowRight,
  RefreshCw,
  LayoutDashboard,
} from 'lucide-react';
import AdminHeader from '../header';
import AdminSidebar from '../sidebar';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Stat counts
  const [todayOrders, setTodayOrders] = useState<number>(0);
  const [totalProducts, setTotalProducts] = useState<number>(0);
  const [totalCustomers, setTotalCustomers] = useState<number>(0);
  const [totalCoupons, setTotalCoupons] = useState<number>(0);
  const [statsLoading, setStatsLoading] = useState(false);

  const fetchDashboardStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const [todayOrdersCount, productsCount, customersCount, couponsCount] =
        await Promise.all([
          getTodayOrdersCount(),
          getTotalProductsCount(),
          getTotalCustomersCount(),
          getTotalCouponsCount(),
        ]);

      setTodayOrders(todayOrdersCount);
      setTotalProducts(productsCount);
      setTotalCustomers(customersCount);
      setTotalCoupons(couponsCount);
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    async function init() {
      const { user, error } = await getCurrentAdminUser();
      if (error || !user) {
        router.push('/login');
        return;
      }
      setLoading(false);
      await fetchDashboardStats();
    }
    init();
  }, [router, fetchDashboardStats]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin brand-spinner" />
          <p className="text-sm text-neutral-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      id: 'stat-today-orders',
      title: 'Today Orders',
      count: todayOrders,
      icon: ShoppingBag,
      href: '/admin/orders/dashboard',
      description: 'Orders received today',
      iconColor: 'text-amber-700',
      iconBg: 'bg-amber-50 border-amber-200',
    },
    {
      id: 'stat-total-products',
      title: 'Total Products',
      count: totalProducts,
      icon: Package,
      href: '/admin/products',
      description: 'Listed menu items & variants',
      iconColor: 'text-emerald-700',
      iconBg: 'bg-emerald-50 border-emerald-200',
    },
    {
      id: 'stat-total-customers',
      title: 'Total Customers',
      count: totalCustomers,
      icon: Users,
      href: '/admin/customers',
      description: 'Registered user profiles',
      iconColor: 'text-sky-700',
      iconBg: 'bg-sky-50 border-sky-200',
    },
    {
      id: 'stat-total-coupons',
      title: 'Total Coupons',
      count: totalCoupons,
      icon: Ticket,
      href: '/admin/coupons',
      description: 'Active discount vouchers',
      iconColor: 'text-purple-700',
      iconBg: 'bg-purple-50 border-purple-200',
    },
  ];

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
        <main className="admin-main-area">
          <div className="admin-content-wrap">
            {/* Top Stat Header Bar */}
            <div className="ui-card-header">
              <div className="flex items-center gap-2.5">
                <div className="brand-icon-box">
                  <LayoutDashboard className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-xl font-bold tracking-tight text-neutral-900">
                    Dashboard Overview
                  </h1>
                  <p className="text-xs text-neutral-500">
                    Quick summary and operational metrics for Kunddan Home Foods
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  id="refresh-dashboard-stats-btn"
                  onClick={fetchDashboardStats}
                  disabled={statsLoading}
                  className="btn-secondary text-xs px-3 py-2 flex items-center gap-1.5"
                >
                  <RefreshCw
                    className={`h-3.5 w-3.5 ${statsLoading ? 'animate-spin' : ''}`}
                  />
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            {/* Metrics 4-Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {statCards.map((card) => {
                const Icon = card.icon;
                return (
                  <Link
                    key={card.id}
                    id={card.id}
                    href={card.href}
                    className="ui-card p-6 flex flex-col justify-between hover:border-neutral-400 hover:shadow-md transition duration-150 group"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                          {card.title}
                        </span>
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-xl border ${card.iconBg} ${card.iconColor}`}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                      </div>

                      <div className="text-3xl font-extrabold tracking-tight text-neutral-900 mb-1">
                        {statsLoading ? (
                          <Loader2 className="h-7 w-7 animate-spin text-neutral-400" />
                        ) : (
                          card.count
                        )}
                      </div>

                      <p className="text-xs text-neutral-400">
                        {card.description}
                      </p>
                    </div>

                    <div className="mt-5 pt-3 border-t border-neutral-100 flex items-center justify-between text-xs font-medium text-neutral-600 group-hover:text-neutral-900">
                      <span>View details</span>
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
