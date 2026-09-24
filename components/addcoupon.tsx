'use client';

import { useState } from 'react';
import { createCoupon } from '@/lib/couponsStore';
import { X, Loader2, AlertCircle, Ticket, Tag, Percent, IndianRupee, ToggleLeft, ToggleRight } from 'lucide-react';

interface AddCouponModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddCouponModal({
  isOpen,
  onClose,
  onSuccess,
}: AddCouponModalProps) {
  if (!isOpen) return null;

  return <AddCouponModalContent onClose={onClose} onSuccess={onSuccess} />;
}

function AddCouponModalContent({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [couponCode, setCouponCode] = useState('');
  const [title, setTitle] = useState('');
  const [discount, setDiscount] = useState<number | ''>('');
  const [minOrder, setMinOrder] = useState<number | ''>(0);
  const [maxDiscount, setMaxDiscount] = useState<number | ''>('');
  const [isActive, setIsActive] = useState<boolean>(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

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

    setLoading(true);

    try {
      const { error: insertError } = await createCoupon({
        coupon_code: trimmedCode,
        title: trimmedTitle,
        discount: Number(discount),
        min_order: minOrder !== '' ? Number(minOrder) : 0,
        max_discount: maxDiscount !== '' ? Number(maxDiscount) : null,
        is_active: isActive,
      });

      if (insertError) {
        throw insertError;
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      console.error('Error creating coupon:', err);
      setError(err instanceof Error ? err.message : 'Failed to create coupon.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      id="add-coupon-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs overflow-y-auto"
    >
      <div
        id="add-coupon-modal"
        className="ui-card w-full max-w-xl overflow-hidden p-0 shadow-2xl my-8"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-coupon-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="brand-icon-box">
              <Ticket className="h-5 w-5 text-neutral-800" />
            </div>
            <div>
              <h2
                id="add-coupon-title"
                className="text-lg font-bold text-neutral-900"
              >
                Add New Coupon
              </h2>
              <p className="text-xs text-neutral-500">
                Create a discount or promotional voucher code
              </p>
            </div>
          </div>
          <button
            type="button"
            id="close-add-coupon-modal"
            onClick={onClose}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="ui-alert-error">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Coupon Code */}
            <div>
              <label className="form-label flex items-center gap-1.5" htmlFor="coupon-code-input">
                <Tag className="h-3.5 w-3.5 text-neutral-500" />
                Coupon Code <span className="text-red-500">*</span>
              </label>
              <input
                id="coupon-code-input"
                type="text"
                required
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="e.g. FESTIVE50"
                className="form-input text-sm uppercase font-mono font-bold tracking-wider"
              />
            </div>

            {/* Title */}
            <div>
              <label className="form-label flex items-center gap-1.5" htmlFor="coupon-title-input">
                <Ticket className="h-3.5 w-3.5 text-neutral-500" />
                Title / Description <span className="text-red-500">*</span>
              </label>
              <input
                id="coupon-title-input"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Flat ₹50 Off on orders"
                className="form-input text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Discount */}
            <div>
              <label className="form-label flex items-center gap-1.5" htmlFor="coupon-discount-input">
                <IndianRupee className="h-3.5 w-3.5 text-neutral-500" />
                Discount (₹) <span className="text-red-500">*</span>
              </label>
              <input
                id="coupon-discount-input"
                type="number"
                min="0"
                step="0.01"
                required
                value={discount}
                onChange={(e) => setDiscount(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="50"
                className="form-input text-sm font-semibold"
              />
            </div>

            {/* Min Order */}
            <div>
              <label className="form-label flex items-center gap-1.5" htmlFor="coupon-min-order-input">
                <IndianRupee className="h-3.5 w-3.5 text-neutral-500" />
                Min Order (₹)
              </label>
              <input
                id="coupon-min-order-input"
                type="number"
                min="0"
                step="0.01"
                value={minOrder}
                onChange={(e) => setMinOrder(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="0"
                className="form-input text-sm"
              />
            </div>

            {/* Max Discount */}
            <div>
              <label className="form-label flex items-center gap-1.5" htmlFor="coupon-max-discount-input">
                <IndianRupee className="h-3.5 w-3.5 text-neutral-500" />
                Max Discount (₹)
              </label>
              <input
                id="coupon-max-discount-input"
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

          {/* Is Active Toggle */}
          <div className="pt-2">
            <label className="flex items-center justify-between p-3 rounded-xl border border-neutral-200 bg-neutral-50 cursor-pointer hover:bg-neutral-100/70 transition">
              <div>
                <span className="text-sm font-semibold text-neutral-900 block">
                  Coupon Status
                </span>
                <span className="text-xs text-neutral-500">
                  {isActive ? 'Active - Customers can apply this coupon' : 'Inactive - Coupon is disabled'}
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

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-100">
            <button
              type="button"
              id="cancel-add-coupon-btn"
              onClick={onClose}
              disabled={loading}
              className="btn-secondary text-xs px-4 py-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="submit-add-coupon-btn"
              disabled={loading}
              className="btn-primary text-xs px-5 py-2 flex items-center gap-2"
            >
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>{loading ? 'Creating...' : 'Save Coupon'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
