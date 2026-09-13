'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getCurrentAdminUser } from '@/lib/auth';
import { getOrderById, updateOrderStatus } from '@/lib/ordersStore';
import type { OrderWithDetails, OrderStatus } from '@/lib/datatypes';
import AdminHeader from '@/app/admin/header';
import AdminSidebar from '@/app/admin/sidebar';
import {
  ShoppingBag,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Award,
  Clock,
  Truck,
  PackageCheck,
  Ban,
  User,
  MapPin,
  FileText,
  Phone,
  Mail,
  Receipt,
  Image as ImageIcon,
} from 'lucide-react';

export default function OpenOrderPage() {
  return (
    <Suspense
      fallback={
        <div className="loading-container">
          <Loader2 className="h-8 w-8 animate-spin brand-spinner" />
        </div>
      }
    >
      <OpenOrderContent />
    </Suspense>
  );
}

function OpenOrderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderIdParam = searchParams.get('id');

  const [authChecking, setAuthChecking] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [order, setOrder] = useState<OrderWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadOrder = useCallback(async () => {
    if (!orderIdParam) {
      setError('No Order ID provided in URL.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchErr } = await getOrderById(orderIdParam);
      if (fetchErr || !data) {
        setError(fetchErr?.message || 'Order not found.');
      } else {
        setOrder(data);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load order details.');
    } finally {
      setLoading(false);
    }
  }, [orderIdParam]);

  useEffect(() => {
    let isMounted = true;

    async function init() {
      const { user, error: authErr } = await getCurrentAdminUser();
      if (!isMounted) return;

      if (authErr || !user) {
        router.push('/login');
        return;
      }
      setAuthChecking(false);

      await loadOrder();
    }

    init();

    return () => {
      isMounted = false;
    };
  }, [router, loadOrder]);

  const handleStatusChange = async (newStatus: OrderStatus) => {
    if (!order) return;
    setUpdatingStatus(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const { data, error: updateErr } = await updateOrderStatus(order.id, newStatus);
      if (updateErr || !data) {
        throw updateErr || new Error('Failed to update status');
      }
      setSuccessMsg(`Order status updated to "${newStatus.toUpperCase()}".`);
      await loadOrder();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error updating status.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Delivered
          </span>
        );
      case 'shipping':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700 border border-sky-200">
            <Truck className="h-3.5 w-3.5" />
            Shipping
          </span>
        );
      case 'packed':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700 border border-indigo-200">
            <PackageCheck className="h-3.5 w-3.5" />
            Packed
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 border border-blue-200">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Approved
          </span>
        );
      case 'cancelled':
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700 border border-red-200">
            <Ban className="h-3.5 w-3.5" />
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 border border-amber-200">
            <Clock className="h-3.5 w-3.5" />
            Pending
          </span>
        );
    }
  };

  if (authChecking || (loading && !order)) {
    return (
      <div className="loading-container">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin brand-spinner" />
          <p className="text-sm text-neutral-500">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order && error) {
    return (
      <div className="app-screen">
        <AdminHeader
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        />
        <div className="admin-body-layout">
          <AdminSidebar
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
          />
          <main className="admin-main-area">
            <div className="admin-content-wrap max-w-xl text-center py-16">
              <div className="ui-alert-error mb-4">{error}</div>
              <Link href="/admin/orders/dashboard" className="btn-primary">
                <ArrowLeft className="h-4 w-4" />
                Return to Orders Dashboard
              </Link>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const customerName =
    order?.customers?.name ||
    `${order?.first_name || ''} ${order?.last_name || ''}`.trim() ||
    'Guest Customer';

  const loyaltyPoints = order?.customers?.loyalty_points ?? 0;

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
          <div className="admin-content-wrap max-w-5xl">
            {/* Top Navigation & Action Bar */}
            <div className="ui-card-header">
              <div className="flex items-center gap-3">
                <Link
                  href="/admin/orders/dashboard"
                  className="btn-secondary px-2.5 py-1.5 text-xs"
                  id="back-to-orders-btn"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to Orders</span>
                </Link>
                <div>
                  <h1 className="text-xl font-bold tracking-tight text-neutral-900 flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5 text-neutral-800" />
                    Order Details: {order?.order_id}
                  </h1>
                  <p className="text-xs text-neutral-500">
                    Placed on{' '}
                    {order?.created_at
                      ? new Date(order.created_at).toLocaleString('en-IN')
                      : '—'}
                  </p>
                </div>
              </div>

              {/* Status Selector */}
              <div className="flex items-center gap-2">
                <div className="text-xs text-neutral-500 font-semibold mr-1">
                  Status:
                </div>
                <select
                  value={order?.status || 'pending'}
                  onChange={(e) =>
                    handleStatusChange(e.target.value as OrderStatus)
                  }
                  disabled={updatingStatus}
                  className="form-input text-xs py-1.5 px-3 font-semibold min-w-[130px]"
                  id="update-order-status-select"
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="packed">Packed</option>
                  <option value="shipping">Shipping</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>

            {/* Error or Success notification */}
            {error && (
              <div className="ui-alert-error">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <div className="flex-1">{error}</div>
              </div>
            )}

            {successMsg && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Main Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Customer Information Card */}
              <div className="ui-card p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-neutral-100 pb-2.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-800 flex items-center gap-1.5">
                    <User className="h-4 w-4 text-neutral-600" />
                    Customer Details
                  </h3>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    <Award className="h-3 w-3 text-amber-600" />
                    {loyaltyPoints} Points
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-neutral-400 block text-[11px]">
                      Full Name
                    </span>
                    <span className="font-bold text-neutral-900 text-sm">
                      {customerName}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-neutral-700 pt-1">
                    <Phone className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
                    <span>{order?.mobile || order?.customers?.mobile_number || '—'}</span>
                  </div>

                  {(order?.email || order?.customers?.email) && (
                    <div className="flex items-center gap-2 text-neutral-700">
                      <Mail className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
                      <span>{order?.email || order?.customers?.email}</span>
                    </div>
                  )}

                  {order?.customer_id && (
                    <div className="pt-1 text-[11px] text-neutral-400">
                      Customer ID: <span className="font-mono text-neutral-600">{order.customer_id}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Delivery Address Card */}
              <div className="ui-card p-5 space-y-3">
                <div className="border-b border-neutral-100 pb-2.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-800 flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-neutral-600" />
                    Delivery Address
                  </h3>
                </div>

                <div className="text-xs text-neutral-700 space-y-1">
                  <p className="font-semibold text-neutral-900">
                    {order?.address_line1 || '—'}
                  </p>
                  {order?.address_line2 && <p>{order.address_line2}</p>}
                  <p>
                    {order?.city}
                    {order?.state ? `, ${order.state}` : ''}
                    {order?.postal_code ? ` - ${order.postal_code}` : ''}
                  </p>
                </div>
              </div>

              {/* Order Summary & Pricing Card */}
              <div className="ui-card p-5 space-y-3">
                <div className="border-b border-neutral-100 pb-2.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-800 flex items-center gap-1.5">
                    <Receipt className="h-4 w-4 text-neutral-600" />
                    Payment Summary
                  </h3>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between text-neutral-600">
                    <span>Sub Total:</span>
                    <span className="font-semibold">
                      ₹{Number(order?.sub_total ?? order?.amount ?? 0).toFixed(2)}
                    </span>
                  </div>

                  {Number(order?.discount ?? 0) > 0 && (
                    <div className="flex items-center justify-between text-emerald-600 font-semibold">
                      <span>Discount ({order?.coupon_code || 'Offer'}):</span>
                      <span>- ₹{Number(order?.discount).toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-neutral-100 text-sm font-bold text-neutral-900">
                    <span>Grand Total:</span>
                    <span className="text-base text-neutral-900 font-extrabold">
                      ₹{Number(order?.amount ?? 0).toFixed(2)}
                    </span>
                  </div>

                  <div className="pt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-neutral-400">Status:</span>
                      <div>{getStatusBadge(order?.status || 'pending')}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Items List */}
            <div className="ui-card p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-900 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-neutral-700" />
                    Items List ({order?.order_items?.length || 0})
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Products and variant packs in this order
                  </p>
                </div>
                <div className="text-xs font-bold text-neutral-700 bg-neutral-100 px-3 py-1 rounded-full">
                  Total Items: {order?.items_quantity || order?.order_items?.reduce((acc, i) => acc + (i.quantity || 1), 0) || 0}
                </div>
              </div>

              {/* Items Table */}
              <div className="overflow-x-auto">
                <table className="ui-table">
                  <thead className="ui-table-thead">
                    <tr>
                      <th scope="col" className="ui-table-th w-14 text-center">
                        S.No
                      </th>
                      <th scope="col" className="ui-table-th w-16">
                        Image
                      </th>
                      <th scope="col" className="ui-table-th">
                        Product & Variant
                      </th>
                      <th scope="col" className="ui-table-th text-center">
                        Unit Price (₹)
                      </th>
                      <th scope="col" className="ui-table-th text-center">
                        Quantity
                      </th>
                      <th scope="col" className="ui-table-th text-right">
                        Line Total (₹)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {!order?.order_items || order.order_items.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-5 py-8 text-center text-xs text-neutral-400"
                        >
                          No items found for this order.
                        </td>
                      </tr>
                    ) : (
                      order.order_items.map((item, idx) => {
                        const productName =
                          item.products?.name || `Product (${item.product_id})`;
                        const variantSize =
                          item.product_variants?.size || 'Standard';
                        const imageUrl = item.products?.image_url;

                        return (
                          <tr key={item.id || idx} className="ui-table-tr">
                            {/* S.No */}
                            <td className="ui-table-td text-center text-xs font-semibold text-neutral-400">
                              {idx + 1}
                            </td>

                            {/* Image */}
                            <td className="ui-table-td">
                              <div className="category-image-box h-12 w-12">
                                {imageUrl ? (
                                  <Image
                                    src={imageUrl}
                                    alt={productName}
                                    fill
                                    className="object-cover"
                                    unoptimized
                                  />
                                ) : (
                                  <ImageIcon className="h-4 w-4 text-neutral-300" />
                                )}
                              </div>
                            </td>

                            {/* Product Name & Variant */}
                            <td className="ui-table-td">
                              <div className="font-bold text-neutral-900 text-sm">
                                {productName}
                              </div>
                              <div className="text-xs text-neutral-500 mt-0.5 flex items-center gap-2">
                                <span className="font-semibold text-neutral-700 bg-neutral-100 px-2 py-0.5 rounded">
                                  Size: {variantSize}
                                </span>
                                {item.products?.product_id && (
                                  <span className="font-mono text-[11px] text-neutral-400">
                                    {item.products.product_id}
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Unit Price */}
                            <td className="ui-table-td text-center text-xs">
                              <span className="font-semibold text-neutral-800">
                                ₹{Number(item.price).toFixed(2)}
                              </span>
                              {item.mrp && item.mrp > item.price && (
                                <span className="block text-[10px] text-neutral-400 line-through">
                                  ₹{Number(item.mrp).toFixed(2)}
                                </span>
                              )}
                            </td>

                            {/* Quantity */}
                            <td className="ui-table-td text-center">
                              <span className="font-bold text-xs bg-neutral-100 text-neutral-800 px-2 py-1 rounded-md">
                                {item.quantity}
                              </span>
                            </td>

                            {/* Line Total */}
                            <td className="ui-table-td text-right font-bold text-sm text-neutral-900">
                              ₹{Number(item.line_total ?? item.price * item.quantity).toFixed(2)}
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
