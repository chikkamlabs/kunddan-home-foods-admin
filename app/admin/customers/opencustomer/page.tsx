'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getCurrentAdminUser } from '@/lib/auth';
import {
  getCustomerById,
  getCustomerOrders,
  updateCustomer,
} from '@/lib/customersStore';
import type { Customer, Order } from '@/lib/datatypes';
import AdminHeader from '@/app/admin/header';
import AdminSidebar from '@/app/admin/sidebar';
import {
  Users,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Award,
  Tag,
  User,
  Phone,
  Mail,
  MapPin,
  KeyRound,
  ShoppingBag,
  Clock,
  Truck,
  PackageCheck,
  Ban,
  Save,
  ExternalLink,
} from 'lucide-react';

export default function OpenCustomerPage() {
  return (
    <Suspense
      fallback={
        <div className="loading-container">
          <Loader2 className="h-8 w-8 animate-spin brand-spinner" />
        </div>
      }
    >
      <OpenCustomerContent />
    </Suspense>
  );
}

function OpenCustomerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const customerIdParam = searchParams.get('id');

  const [authChecking, setAuthChecking] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Customer & Orders data
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Editable Form Fields
  const [name, setName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [cityCode, setCityCode] = useState('');
  const [loyaltyPoints, setLoyaltyPoints] = useState<number>(0);
  const [referralCode, setReferralCode] = useState('');
  const [customerKey, setCustomerKey] = useState('');

  const loadCustomerData = useCallback(async () => {
    if (!customerIdParam) {
      setError('No Customer ID provided in URL.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [custRes, ordersRes] = await Promise.all([
        getCustomerById(customerIdParam),
        getCustomerOrders(customerIdParam),
      ]);

      if (custRes.error || !custRes.data) {
        setError(custRes.error?.message || 'Customer not found.');
      } else {
        const c = custRes.data;
        setCustomer(c);
        setName(c.name || '');
        setMobileNumber(c.mobile_number || '');
        setEmail(c.email || '');
        setAddress(c.address || '');
        setCity(c.city || '');
        setCityCode(c.city_code || '');
        setLoyaltyPoints(c.loyalty_points ?? 0);
        setReferralCode(c.referral_code || '');
        setCustomerKey(c.key || '');
      }

      if (ordersRes.data) {
        setOrders(ordersRes.data);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load customer data.');
    } finally {
      setLoading(false);
    }
  }, [customerIdParam]);

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

      await loadCustomerData();
    }

    init();

    return () => {
      isMounted = false;
    };
  }, [router, loadCustomerData]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer) return;

    setError(null);
    setSuccessMsg(null);

    const trimmedName = name.trim();
    const trimmedMobile = mobileNumber.trim();

    if (!trimmedName) {
      setError('Customer name is required.');
      return;
    }

    if (!trimmedMobile) {
      setError('Mobile number is required.');
      return;
    }

    setSaving(true);
    try {
      const { data, error: updateErr } = await updateCustomer(customer.id, {
        name: trimmedName,
        mobile_number: trimmedMobile,
        email: email.trim() || null,
        address: address.trim() || null,
        city: city.trim() || null,
        city_code: cityCode.trim() || null,
        loyalty_points: Number(loyaltyPoints) || 0,
        referral_code: referralCode.trim() || null,
        key: customerKey.trim() || customer.key,
      });

      if (updateErr || !data) {
        throw updateErr || new Error('Failed to update customer');
      }

      setCustomer(data);
      setSuccessMsg('Customer details updated successfully.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error updating customer.');
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="h-3 w-3" />
            Delivered
          </span>
        );
      case 'shipping':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-semibold text-sky-700 border border-sky-200">
            <Truck className="h-3 w-3" />
            Shipping
          </span>
        );
      case 'packed':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700 border border-indigo-200">
            <PackageCheck className="h-3 w-3" />
            Packed
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700 border border-blue-200">
            <CheckCircle2 className="h-3 w-3" />
            Approved
          </span>
        );
      case 'cancelled':
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700 border border-red-200">
            <Ban className="h-3 w-3" />
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 border border-amber-200">
            <Clock className="h-3 w-3" />
            Pending
          </span>
        );
    }
  };

  if (authChecking || (loading && !customer)) {
    return (
      <div className="loading-container">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin brand-spinner" />
          <p className="text-sm text-neutral-500">Loading customer details...</p>
        </div>
      </div>
    );
  }

  if (!customer && error) {
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
              <Link href="/admin/customers" className="btn-primary">
                <ArrowLeft className="h-4 w-4" />
                Return to Customers Dashboard
              </Link>
            </div>
          </main>
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
          <div className="admin-content-wrap max-w-5xl">
            {/* Top Navigation Bar */}
            <div className="ui-card-header">
              <div className="flex items-center gap-3">
                <Link
                  href="/admin/customers"
                  className="btn-secondary px-2.5 py-1.5 text-xs"
                  id="back-to-customers-btn"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to Customers</span>
                </Link>
                <div>
                  <h1 className="text-xl font-bold tracking-tight text-neutral-900 flex items-center gap-2">
                    <User className="h-5 w-5 text-neutral-800" />
                    Customer Profile: {customer?.name}
                  </h1>
                  <p className="text-xs text-neutral-500">
                    Joined on{' '}
                    {customer?.created_at
                      ? new Date(customer.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })
                      : '—'}
                  </p>
                </div>
              </div>

              {/* Loyalty points pill badge */}
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-100/80 px-3 py-1.5 rounded-full border border-amber-300">
                  <Award className="h-4 w-4 text-amber-600" />
                  {customer?.loyalty_points ?? 0} Loyalty Points
                </span>
              </div>
            </div>

            {/* Notification Messages */}
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

            {/* Customer Details Form & Edit Card */}
            <div className="ui-card p-6">
              <div className="border-b border-neutral-100 pb-3 mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-neutral-900">
                    Edit Customer Information
                  </h2>
                  <p className="text-xs text-neutral-500">
                    Update personal profile, contact information, loyalty points, and tracking key
                  </p>
                </div>
                <div className="text-xs text-neutral-400 font-mono">
                  ID: {customer?.id}
                </div>
              </div>

              <form onSubmit={handleUpdate} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Name */}
                  <div>
                    <label className="form-label flex items-center gap-1.5" htmlFor="edit-cust-name">
                      <User className="h-3.5 w-3.5 text-neutral-500" />
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="edit-cust-name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="form-input text-sm"
                    />
                  </div>

                  {/* Mobile Number */}
                  <div>
                    <label className="form-label flex items-center gap-1.5" htmlFor="edit-cust-mobile">
                      <Phone className="h-3.5 w-3.5 text-neutral-500" />
                      Mobile Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="edit-cust-mobile"
                      type="tel"
                      required
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      className="form-input text-sm"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="form-label flex items-center gap-1.5" htmlFor="edit-cust-email">
                      <Mail className="h-3.5 w-3.5 text-neutral-500" />
                      Email Address
                    </label>
                    <input
                      id="edit-cust-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="form-input text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Loyalty Points */}
                  <div>
                    <label className="form-label flex items-center gap-1.5" htmlFor="edit-cust-points">
                      <Award className="h-3.5 w-3.5 text-amber-600" />
                      Loyalty Points
                    </label>
                    <input
                      id="edit-cust-points"
                      type="number"
                      min="0"
                      step="1"
                      value={loyaltyPoints}
                      onChange={(e) => setLoyaltyPoints(Number(e.target.value))}
                      className="form-input text-sm font-semibold"
                    />
                  </div>

                  {/* Referral Code */}
                  <div>
                    <label className="form-label flex items-center gap-1.5" htmlFor="edit-cust-referral">
                      <Tag className="h-3.5 w-3.5 text-neutral-500" />
                      Referral Code
                    </label>
                    <input
                      id="edit-cust-referral"
                      type="text"
                      value={referralCode}
                      onChange={(e) => setReferralCode(e.target.value)}
                      className="form-input text-sm"
                    />
                  </div>

                  {/* Customer Tracking Key */}
                  <div>
                    <label className="form-label flex items-center gap-1.5" htmlFor="edit-cust-key">
                      <KeyRound className="h-3.5 w-3.5 text-neutral-500" />
                      Key (Tracking Key)
                    </label>
                    <input
                      id="edit-cust-key"
                      type="text"
                      value={customerKey}
                      onChange={(e) => setCustomerKey(e.target.value)}
                      className="form-input text-sm font-mono"
                    />
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label className="form-label flex items-center gap-1.5" htmlFor="edit-cust-address">
                    <MapPin className="h-3.5 w-3.5 text-neutral-500" />
                    Address
                  </label>
                  <textarea
                    id="edit-cust-address"
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="form-input text-sm resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* City */}
                  <div>
                    <label className="form-label" htmlFor="edit-cust-city">
                      City
                    </label>
                    <input
                      id="edit-cust-city"
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="form-input text-sm"
                    />
                  </div>

                  {/* City Code */}
                  <div>
                    <label className="form-label" htmlFor="edit-cust-citycode">
                      City Code / Postal Code
                    </label>
                    <input
                      id="edit-cust-citycode"
                      type="text"
                      value={cityCode}
                      onChange={(e) => setCityCode(e.target.value)}
                      className="form-input text-sm"
                    />
                  </div>
                </div>

                {/* Submit button */}
                <div className="flex justify-end pt-3">
                  <button
                    type="submit"
                    id="save-customer-btn"
                    disabled={saving}
                    className="btn-primary text-xs px-5 py-2.5 flex items-center gap-2"
                  >
                    {saving ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Save className="h-3.5 w-3.5" />
                    )}
                    <span>{saving ? 'Saving...' : 'Update Customer Info'}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Previous Orders Section */}
            <div className="ui-card p-6 space-y-4">
              <div className="border-b border-neutral-100 pb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4 text-neutral-700" />
                    Previous Orders ({orders.length})
                  </h2>
                  <p className="text-xs text-neutral-500">
                    All orders placed by this customer. Tap an order to view full order details.
                  </p>
                </div>
              </div>

              {orders.length === 0 ? (
                <div className="py-8 text-center text-xs text-neutral-400">
                  This customer has not placed any orders yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="ui-table" id="customer-orders-table">
                    <thead className="ui-table-thead">
                      <tr>
                        <th scope="col" className="ui-table-th w-12 text-center">
                          S.No
                        </th>
                        <th scope="col" className="ui-table-th">
                          Order ID
                        </th>
                        <th scope="col" className="ui-table-th text-center">
                          Items Qty
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
                      {orders.map((ord, idx) => {
                        const formattedDate = ord.created_at
                          ? new Date(ord.created_at).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })
                          : '—';

                        return (
                          <tr
                            key={ord.id}
                            className="ui-table-tr cursor-pointer hover:bg-neutral-50"
                            onClick={() =>
                              router.push(
                                `/admin/orders/openorder?id=${encodeURIComponent(
                                  ord.id
                                )}`
                              )
                            }
                          >
                            <td className="ui-table-td text-center text-xs text-neutral-400">
                              {idx + 1}
                            </td>
                            <td className="ui-table-td">
                              <span className="font-mono text-xs font-bold text-neutral-900 bg-neutral-100 px-2 py-1 rounded border border-neutral-200">
                                {ord.order_id}
                              </span>
                            </td>
                            <td className="ui-table-td text-center text-xs font-bold text-neutral-800">
                              {ord.items_quantity ?? '—'}
                            </td>
                            <td className="ui-table-td font-bold text-xs text-neutral-900">
                              ₹{Number(ord.amount).toFixed(2)}
                            </td>
                            <td className="ui-table-td">
                              {getStatusBadge(ord.status)}
                            </td>
                            <td className="ui-table-td text-xs text-neutral-500">
                              {formattedDate}
                            </td>
                            <td className="ui-table-td text-right">
                              <Link
                                href={`/admin/orders/openorder?id=${encodeURIComponent(
                                  ord.id
                                )}`}
                                onClick={(e) => e.stopPropagation()}
                                className="btn-action"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                                <span>Open Order</span>
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
