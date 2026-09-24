'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCurrentAdminUser } from '@/lib/auth';
import {
  getCoupons,
  getTotalCouponsCount,
} from '@/lib/couponsStore';
import type { Coupon } from '@/lib/datatypes';
import AdminHeader from '@/app/admin/header';
import AdminSidebar from '@/app/admin/sidebar';
import AddCouponModal from '@/components/addcoupon';
import {
  Ticket,
  Search,
  Plus,
  Loader2,
  ExternalLink,
  RefreshCw,
  Tag,
  CheckCircle2,
  XCircle,
  IndianRupee,
} from 'lucide-react';

export default function CouponsDashboardPage() {
  const router = useRouter();
  const [authChecking, setAuthChecking] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');

  // Data state
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [totalCouponsCount, setTotalCouponsCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  // Add Coupon modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Fetch coupons
  const fetchCouponsData = useCallback(async () => {
    setLoading(true);
    try {
      const [couponsRes, totalCount] = await Promise.all([
        getCoupons({
          searchQuery: searchQuery || undefined,
        }),
        getTotalCouponsCount(),
      ]);

      if (couponsRes.data) {
        setCoupons(couponsRes.data);
      }
      setTotalCouponsCount(totalCount);
    } catch (err) {
      console.error('Error fetching coupons:', err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  // Auth check & load initial data
  useEffect(() => {
    let isMounted = true;

    async function init() {
      const { user, error } = await getCurrentAdminUser();
      if (!isMounted) return;

      if (error || !user) {
        router.push('/login');
        return;
      }
      setAuthChecking(false);

      await fetchCouponsData();
    }

    init();

    return () => {
      isMounted = false;
    };
  }, [router, fetchCouponsData]);

  if (authChecking) {
    return (
      <div className="loading-container">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin brand-spinner" />
          <p className="text-sm text-neutral-500">Checking credentials...</p>
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

        {/* Main Content */}
        <main className="admin-main-area">
          <div className="admin-content-wrap">
            {/* Top Stat Bar */}
            <div className="ui-card-header">
              <div className="flex items-center gap-2.5">
                <div className="brand-icon-box">
                  <Ticket className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-xl font-bold tracking-tight text-neutral-900">
                    Coupons
                  </h1>
                  <p className="text-xs text-neutral-500">
                    Create and manage discount codes, promotional offers, and voucher rules
                  </p>
                </div>
              </div>

              {/* Total Coupons Stat & Actions */}
              <div className="flex items-center gap-3">
                <div id="total-coupons-stat" className="badge-stat">
                  <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                    Total Coupons:
                  </span>
                  <span className="text-base font-bold text-neutral-900">
                    {totalCouponsCount}
                  </span>
                </div>

                <button
                  type="button"
                  id="refresh-coupons-btn"
                  onClick={fetchCouponsData}
                  disabled={loading}
                  title="Refresh Coupons"
                  className="btn-secondary text-xs px-3 py-2"
                >
                  <RefreshCw
                    className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`}
                  />
                  <span>Refresh</span>
                </button>

                <button
                  type="button"
                  id="add-coupon-btn"
                  onClick={() => setIsAddModalOpen(true)}
                  className="btn-primary text-xs px-3.5 py-2 flex items-center gap-1.5"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Coupon</span>
                </button>
              </div>
            </div>

            {/* Search Bar (coupon_code) */}
            <div className="ui-card p-4">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <input
                  type="text"
                  id="coupon-search-bar"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by Coupon Code (e.g. FESTIVE50)..."
                  className="search-bar-input pl-10 uppercase"
                />
              </div>
            </div>

            {/* Coupons Table */}
            <div className="ui-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="ui-table" id="coupons-table">
                  <thead className="ui-table-thead">
                    <tr>
                      <th scope="col" className="ui-table-th w-14 text-center">
                        S.No
                      </th>
                      <th scope="col" className="ui-table-th">
                        Coupon Code
                      </th>
                      <th scope="col" className="ui-table-th">
                        Title
                      </th>
                      <th scope="col" className="ui-table-th">
                        Discount
                      </th>
                      <th scope="col" className="ui-table-th">
                        Min Order / Max Discount
                      </th>
                      <th scope="col" className="ui-table-th text-center">
                        Is Active
                      </th>
                      <th scope="col" className="ui-table-th text-right">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {loading ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-5 py-12 text-center text-neutral-500"
                        >
                          <div className="flex flex-col items-center justify-center gap-2">
                            <Loader2 className="h-6 w-6 animate-spin brand-spinner" />
                            <span className="text-xs font-medium">
                              Loading coupons...
                            </span>
                          </div>
                        </td>
                      </tr>
                    ) : coupons.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-5 py-12 text-center text-neutral-500"
                        >
                          <div className="flex flex-col items-center justify-center gap-2">
                            <Ticket className="h-8 w-8 text-neutral-300" />
                            <p className="font-medium text-neutral-700">
                              No coupons found
                            </p>
                            <p className="text-xs text-neutral-400">
                              {searchQuery
                                ? 'No coupon matches your search code.'
                                : 'There are currently no coupons recorded in the database.'}
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      coupons.map((coupon, idx) => {
                        return (
                          <tr
                            key={coupon.id}
                            className="ui-table-tr"
                            id={`coupon-row-${coupon.coupon_code}`}
                          >
                            {/* S.No */}
                            <td className="ui-table-td text-center font-medium text-neutral-500 text-xs">
                              {idx + 1}
                            </td>

                            {/* Coupon Code */}
                            <td className="ui-table-td">
                              <span className="font-mono text-xs font-bold text-neutral-900 bg-neutral-100 px-2.5 py-1 rounded-md border border-neutral-200 tracking-wider">
                                {coupon.coupon_code}
                              </span>
                            </td>

                            {/* Title */}
                            <td className="ui-table-td">
                              <span className="font-semibold text-neutral-900 text-xs block">
                                {coupon.title}
                              </span>
                            </td>

                            {/* Discount */}
                            <td className="ui-table-td">
                              <span className="font-bold text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                ₹{Number(coupon.discount).toFixed(2)} Off
                              </span>
                            </td>

                            {/* Min Order & Max Discount */}
                            <td className="ui-table-td text-xs text-neutral-500">
                              <div>
                                <span>Min: ₹{Number(coupon.min_order ?? 0).toFixed(2)}</span>
                                {coupon.max_discount != null && (
                                  <span className="block text-[11px] text-neutral-400">
                                    Cap: ₹{Number(coupon.max_discount).toFixed(2)}
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Is Active */}
                            <td className="ui-table-td text-center">
                              {coupon.is_active ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                                  <CheckCircle2 className="h-3 w-3" />
                                  Active
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-semibold text-neutral-500 border border-neutral-200">
                                  <XCircle className="h-3 w-3" />
                                  Inactive
                                </span>
                              )}
                            </td>

                            {/* Open button linking to /admin/coupons/opencoupon */}
                            <td className="ui-table-td text-right">
                              <Link
                                href={`/admin/coupons/opencoupon?id=${encodeURIComponent(
                                  coupon.id
                                )}`}
                                id={`open-coupon-btn-${coupon.coupon_code}`}
                                className="btn-action"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                                <span>Open</span>
                              </Link>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Add Coupon Modal */}
      <AddCouponModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          fetchCouponsData();
        }}
      />
    </div>
  );
}
