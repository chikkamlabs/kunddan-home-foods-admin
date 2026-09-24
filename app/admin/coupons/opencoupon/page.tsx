'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getCurrentAdminUser } from '@/lib/auth';
import {
  getCouponById,
  updateCoupon,
  deleteCoupon,
} from '@/lib/couponsStore';
import type { Coupon } from '@/lib/datatypes';
import AdminHeader from '@/app/admin/header';
import AdminSidebar from '@/app/admin/sidebar';
import {
  Ticket,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Tag,
  IndianRupee,
  Save,
  Trash2,
  Calendar,
} from 'lucide-react';

export default function OpenCouponPage() {
  return (
    <Suspense
      fallback={
        <div className="loading-container">
          <Loader2 className="h-8 w-8 animate-spin brand-spinner" />
        </div>
      }
    >
      <OpenCouponContent />
    </Suspense>
  );
}

function OpenCouponContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const couponIdParam = searchParams.get('id');

  const [authChecking, setAuthChecking] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Coupon data
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form Fields
  const [couponCode, setCouponCode] = useState('');
  const [title, setTitle] = useState('');
  const [discount, setDiscount] = useState<number | ''>('');
  const [minOrder, setMinOrder] = useState<number | ''>(0);
  const [maxDiscount, setMaxDiscount] = useState<number | ''>('');
  const [isActive, setIsActive] = useState<boolean>(true);

  const loadCouponData = useCallback(async () => {
    if (!couponIdParam) {
      setError('No Coupon ID provided in URL.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchErr } = await getCouponById(couponIdParam);
      if (fetchErr || !data) {
        setError(fetchErr?.message || 'Coupon not found.');
      } else {
        setCoupon(data);
        setCouponCode(data.coupon_code || '');
        setTitle(data.title || '');
        setDiscount(data.discount ?? '');
        setMinOrder(data.min_order ?? 0);
        setMaxDiscount(data.max_discount ?? '');
        setIsActive(data.is_active ?? true);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load coupon details.');
    } finally {
      setLoading(false);
    }
  }, [couponIdParam]);

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

      await loadCouponData();
    }

    init();

    return () => {
      isMounted = false;
    };
  }, [router, loadCouponData]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coupon) return;

    setError(null);
    setSuccessMsg(null);

    const trimmedCode = couponCode.trim().toUpperCase();
    const trimmedTitle = title.trim();

    if (!trimmedCode) {
      setError('Coupon code is required.');
      return;
    }

    if (!trimmedTitle) {
      setError('Coupon title is required.');
      return;
    }

    if (discount === '' || Number(discount) < 0) {
      setError('Please provide a valid discount amount.');
      return;
    }

    setSaving(true);
    try {
      const { data, error: updateErr } = await updateCoupon(coupon.id, {
        coupon_code: trimmedCode,
        title: trimmedTitle,
        discount: Number(discount),
        min_order: minOrder !== '' ? Number(minOrder) : 0,
        max_discount: maxDiscount !== '' ? Number(maxDiscount) : null,
        is_active: isActive,
      });

      if (updateErr || !data) {
        throw updateErr || new Error('Failed to update coupon');
      }

      setCoupon(data);
      setSuccessMsg('Coupon details updated successfully.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error updating coupon.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!coupon) return;
    const confirmed = window.confirm(
      `Are you sure you want to delete coupon "${coupon.coupon_code}"? This cannot be undone.`
    );
    if (!confirmed) return;

    setDeleting(true);
    setError(null);
    try {
      const { error: deleteErr } = await deleteCoupon(coupon.id);
      if (deleteErr) {
        throw deleteErr;
      }
      router.push('/admin/coupons');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete coupon.');
      setDeleting(false);
    }
  };

  if (authChecking || (loading && !coupon)) {
    return (
      <div className="loading-container">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin brand-spinner" />
          <p className="text-sm text-neutral-500">Loading coupon details...</p>
        </div>
      </div>
    );
  }

  if (!coupon && error) {
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
              <Link href="/admin/coupons" className="btn-primary">
                <ArrowLeft className="h-4 w-4" />
                Return to Coupons Dashboard
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
          <div className="admin-content-wrap max-w-4xl">
            {/* Top Navigation Bar */}
            <div className="ui-card-header">
              <div className="flex items-center gap-3">
                <Link
                  href="/admin/coupons"
                  className="btn-secondary px-2.5 py-1.5 text-xs"
                  id="back-to-coupons-btn"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to Coupons</span>
                </Link>
                <div>
                  <h1 className="text-xl font-bold tracking-tight text-neutral-900 flex items-center gap-2">
                    <Ticket className="h-5 w-5 text-neutral-800" />
                    Coupon: {coupon?.coupon_code}
                  </h1>
                  <p className="text-xs text-neutral-500">
                    Created on{' '}
                    {coupon?.created_at
                      ? new Date(coupon.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })
                      : '—'}
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2">
                {coupon?.is_active ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Active Coupon
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-3 py-1 text-xs font-bold text-neutral-500 border border-neutral-200">
                    Inactive
                  </span>
                )}
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

            {/* Coupon Edit Form Card */}
            <div className="ui-card p-6">
              <div className="border-b border-neutral-100 pb-3 mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-neutral-900">
                    Edit Coupon Details
                  </h2>
                  <p className="text-xs text-neutral-500">
                    Update discount value, eligibility conditions, and active state
                  </p>
                </div>
                <div className="text-xs text-neutral-400 font-mono">
                  ID: {coupon?.id}
                </div>
              </div>

              <form onSubmit={handleUpdate} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Coupon Code */}
                  <div>
                    <label className="form-label flex items-center gap-1.5" htmlFor="edit-coupon-code">
                      <Tag className="h-3.5 w-3.5 text-neutral-500" />
                      Coupon Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="edit-coupon-code"
                      type="text"
                      required
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      className="form-input text-sm uppercase font-mono font-bold tracking-wider"
                    />
                  </div>

                  {/* Title */}
                  <div>
                    <label className="form-label flex items-center gap-1.5" htmlFor="edit-coupon-title">
                      <Ticket className="h-3.5 w-3.5 text-neutral-500" />
                      Title / Description <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="edit-coupon-title"
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="form-input text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Discount */}
                  <div>
                    <label className="form-label flex items-center gap-1.5" htmlFor="edit-coupon-discount">
                      <IndianRupee className="h-3.5 w-3.5 text-neutral-500" />
                      Discount Amount (₹) <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="edit-coupon-discount"
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      value={discount}
                      onChange={(e) => setDiscount(e.target.value === '' ? '' : Number(e.target.value))}
                      className="form-input text-sm font-semibold"
                    />
                  </div>

                  {/* Min Order */}
                  <div>
                    <label className="form-label flex items-center gap-1.5" htmlFor="edit-coupon-minorder">
                      <IndianRupee className="h-3.5 w-3.5 text-neutral-500" />
                      Min Order (₹)
                    </label>
                    <input
                      id="edit-coupon-minorder"
                      type="number"
                      min="0"
                      step="0.01"
                      value={minOrder}
                      onChange={(e) => setMinOrder(e.target.value === '' ? '' : Number(e.target.value))}
                      className="form-input text-sm"
                    />
                  </div>

                  {/* Max Discount */}
                  <div>
                    <label className="form-label flex items-center gap-1.5" htmlFor="edit-coupon-maxdiscount">
                      <IndianRupee className="h-3.5 w-3.5 text-neutral-500" />
                      Max Discount Cap (₹)
                    </label>
                    <input
                      id="edit-coupon-maxdiscount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={maxDiscount}
                      onChange={(e) => setMaxDiscount(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="Optional"
                      className="form-input text-sm"
                    />
                  </div>
                </div>

                {/* Status Toggle */}
                <div className="pt-2">
                  <label className="flex items-center justify-between p-3 rounded-xl border border-neutral-200 bg-neutral-50 cursor-pointer hover:bg-neutral-100/70 transition">
                    <div>
                      <span className="text-sm font-semibold text-neutral-900 block">
                        Is Active
                      </span>
                      <span className="text-xs text-neutral-500">
                        {isActive ? 'Coupon is currently enabled for customer checkout' : 'Coupon is currently inactive'}
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="h-4 w-4 rounded text-neutral-900 focus:ring-neutral-900"
                    />
                  </label>
                </div>

                {/* Submit & Delete Buttons */}
                <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting || saving}
                    className="btn-danger text-xs px-3.5 py-2 flex items-center gap-1.5"
                  >
                    {deleting ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                    <span>{deleting ? 'Deleting...' : 'Delete Coupon'}</span>
                  </button>

                  <button
                    type="submit"
                    id="save-coupon-btn"
                    disabled={saving || deleting}
                    className="btn-primary text-xs px-5 py-2.5 flex items-center gap-2"
                  >
                    {saving ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Save className="h-3.5 w-3.5" />
                    )}
                    <span>{saving ? 'Saving...' : 'Update Coupon'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
