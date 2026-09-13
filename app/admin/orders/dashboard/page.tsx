'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCurrentAdminUser } from '@/lib/auth';
import {
  getOrders,
  getTotalOrdersCount,
  getDefaultDateRange,
} from '@/lib/ordersStore';
import type { OrderWithDetails } from '@/lib/datatypes';
import AdminHeader from '@/app/admin/header';
import AdminSidebar from '@/app/admin/sidebar';
import {
  ShoppingBag,
  Search,
  Loader2,
  ExternalLink,
  Calendar,
  RefreshCw,
  Award,
  Filter,
  CheckCircle2,
  Clock,
  Truck,
  XCircle,
  PackageCheck,
  Ban,
} from 'lucide-react';

export default function OrdersDashboardPage() {
  const router = useRouter();
  const [authChecking, setAuthChecking] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Default date filters: last 1 week
  const defaultDates = useMemo(() => getDefaultDateRange(), []);
  const [fromDate, setFromDate] = useState(defaultDates.fromDate);
  const [toDate, setToDate] = useState(defaultDates.toDate);
  const [searchQuery, setSearchQuery] = useState('');

  // Orders data
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [totalOrdersCount, setTotalOrdersCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  // Fetch orders from ordersStore
  const fetchOrdersData = useCallback(async () => {
    setLoading(true);
    try {
      const [ordersRes, totalCount] = await Promise.all([
        getOrders({
          fromDate: fromDate || undefined,
          toDate: toDate || undefined,
          searchQuery: searchQuery || undefined,
        }),
        getTotalOrdersCount(),
      ]);

      if (ordersRes.data) {
        setOrders(ordersRes.data);
      }
      setTotalOrdersCount(totalCount);
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate, searchQuery]);

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

      await fetchOrdersData();
    }

    init();

    return () => {
      isMounted = false;
    };
  }, [router, fetchOrdersData]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="h-3 w-3" />
            Delivered
          </span>
        );
      case 'shipping':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-semibold text-sky-700 border border-sky-200">
            <Truck className="h-3 w-3" />
            Shipping
          </span>
        );
      case 'packed':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 border border-indigo-200">
            <PackageCheck className="h-3 w-3" />
            Packed
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 border border-blue-200">
            <CheckCircle2 className="h-3 w-3" />
            Approved
          </span>
        );
      case 'cancelled':
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700 border border-red-200">
            <Ban className="h-3 w-3" />
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200">
            <Clock className="h-3 w-3" />
            Pending
          </span>
        );
    }
  };

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
                  <ShoppingBag className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-xl font-bold tracking-tight text-neutral-900">
                    Orders
                  </h1>
                  <p className="text-xs text-neutral-500">
                    Track customer orders, items, amounts, and fulfillment
                  </p>
                </div>
              </div>

              {/* Total Orders Stat Badge */}
              <div className="flex items-center gap-3">
                <div id="total-orders-stat" className="badge-stat">
                  <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                    Total Orders:
                  </span>
                  <span className="text-base font-bold text-neutral-900">
                    {totalOrdersCount}
                  </span>
                </div>
                <button
                  type="button"
                  id="refresh-orders-btn"
                  onClick={fetchOrdersData}
                  disabled={loading}
                  title="Refresh Orders"
                  className="btn-secondary text-xs px-3 py-2"
                >
                  <RefreshCw
                    className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`}
                  />
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            {/* Filters Section (From Date, To Date - default last 1 week, and Search Bar) */}
            <div className="ui-card p-4 space-y-3">
              <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
                {/* Search Bar (order_id, customer_name) */}
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                  <input
                    type="text"
                    id="order-search-bar"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by Order ID or Customer Name..."
                    className="search-bar-input pl-10"
                  />
                </div>

                {/* Date Filters (From Date and To Date) */}
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5">
                  <div className="flex items-center gap-1.5 text-xs text-neutral-600 font-semibold shrink-0">
                    <Calendar className="h-3.5 w-3.5 text-neutral-400" />
                    <span>From:</span>
                  </div>
                  <input
                    type="date"
                    id="orders-from-date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="form-input text-xs py-1.5 px-2.5 w-auto"
                  />

                  <div className="flex items-center gap-1.5 text-xs text-neutral-600 font-semibold shrink-0 ml-1">
                    <span>To:</span>
                  </div>
                  <input
                    type="date"
                    id="orders-to-date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="form-input text-xs py-1.5 px-2.5 w-auto"
                  />

                  <button
                    type="button"
                    onClick={() => {
                      const d = getDefaultDateRange();
                      setFromDate(d.fromDate);
                      setToDate(d.toDate);
                      setSearchQuery('');
                    }}
                    className="btn-secondary text-[11px] py-1.5 px-2.5 shrink-0"
                    title="Reset to last 1 week"
                  >
                    Reset (1 Wk)
                  </button>
                </div>
              </div>
            </div>

            {/* Orders Table */}
            <div className="ui-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="ui-table" id="orders-table">
                  <thead className="ui-table-thead">
                    <tr>
                      <th scope="col" className="ui-table-th w-14 text-center">
                        S.No
                      </th>
                      <th scope="col" className="ui-table-th">
                        Order ID
                      </th>
                      <th scope="col" className="ui-table-th">
                        Customer Name & Loyalty Points
                      </th>
                      <th scope="col" className="ui-table-th text-center">
                        Total Quantity
                      </th>
                      <th scope="col" className="ui-table-th">
                        Amount
                      </th>
                      <th scope="col" className="ui-table-th">
                        Status
                      </th>
                      <th scope="col" className="ui-table-th">
                        Date
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
                          colSpan={8}
                          className="px-5 py-12 text-center text-neutral-500"
                        >
                          <div className="flex flex-col items-center justify-center gap-2">
                            <Loader2 className="h-6 w-6 animate-spin brand-spinner" />
                            <span className="text-xs font-medium">
                              Loading orders...
                            </span>
                          </div>
                        </td>
                      </tr>
                    ) : orders.length === 0 ? (
                      <tr>
                        <td
                          colSpan={8}
                          className="px-5 py-12 text-center text-neutral-500"
                        >
                          <div className="flex flex-col items-center justify-center gap-2">
                            <ShoppingBag className="h-8 w-8 text-neutral-300" />
                            <p className="font-medium text-neutral-700">
                              No orders found
                            </p>
                            <p className="text-xs text-neutral-400">
                              {searchQuery || fromDate || toDate
                                ? 'No orders match your specified date range or search query.'
                                : 'There are currently no orders recorded.'}
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      orders.map((order, idx) => {
                        // Customer name fallback
                        const customerName =
                          order.customers?.name ||
                          `${order.first_name || ''} ${order.last_name || ''}`.trim() ||
                          'Guest Customer';

                        const loyaltyPoints =
                          order.customers?.loyalty_points ?? 0;

                        const formattedDate = order.created_at
                          ? new Date(order.created_at).toLocaleDateString(
                              'en-IN',
                              {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              }
                            )
                          : '—';

                        return (
                          <tr
                            key={order.id}
                            className="ui-table-tr"
                            id={`order-row-${order.order_id}`}
                          >
                            {/* S.No */}
                            <td className="ui-table-td text-center font-medium text-neutral-500 text-xs">
                              {idx + 1}
                            </td>

                            {/* Order ID */}
                            <td className="ui-table-td">
                              <span className="font-mono text-xs font-bold text-neutral-900 bg-neutral-100 px-2 py-1 rounded-md border border-neutral-200/60">
                                {order.order_id}
                              </span>
                            </td>

                            {/* Customer Name & Loyalty Points */}
                            <td className="ui-table-td">
                              <div>
                                <span className="font-bold text-neutral-900 block text-sm">
                                  {customerName}
                                </span>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50/80 px-1.5 py-0.5 rounded border border-amber-200/60">
                                    <Award className="h-3 w-3 text-amber-600" />
                                    {loyaltyPoints} Points
                                  </span>
                                  {order.mobile && (
                                    <span className="text-[11px] text-neutral-400">
                                      • {order.mobile}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Total Quantity */}
                            <td className="ui-table-td text-center">
                              <span className="inline-flex items-center justify-center font-bold text-xs text-neutral-800 bg-neutral-100 px-2.5 py-1 rounded-full">
                                {order.items_quantity ??
                                  order.order_items?.reduce(
                                    (sum, item) => sum + (item.quantity || 1),
                                    0
                                  ) ??
                                  0}
                              </span>
                            </td>

                            {/* Amount */}
                            <td className="ui-table-td">
                              <span className="font-bold text-sm text-neutral-900">
                                ₹{Number(order.amount).toFixed(2)}
                              </span>
                            </td>

                            {/* Status */}
                            <td className="ui-table-td">
                              {getStatusBadge(order.status)}
                            </td>

                            {/* Date */}
                            <td className="ui-table-td text-xs text-neutral-500">
                              {formattedDate}
                            </td>

                            {/* Open button (app/admin/orders/openorder/page.tsx) */}
                            <td className="ui-table-td text-right">
                              <Link
                                href={`/admin/orders/openorder?id=${encodeURIComponent(
                                  order.id
                                )}`}
                                id={`open-order-btn-${order.order_id}`}
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
    </div>
  );
}
