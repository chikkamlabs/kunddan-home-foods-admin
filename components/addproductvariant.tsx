'use client';

import { useState } from 'react';
import type { VariantDraft } from '@/lib/productsStore';
import { Plus, Trash2, Edit2, Check, X, AlertCircle } from 'lucide-react';

interface AddProductVariantProps {
  variants: VariantDraft[];
  onChange: (variants: VariantDraft[]) => void;
  disabled?: boolean;
}

export default function AddProductVariantSection({
  variants,
  onChange,
  disabled = false,
}: AddProductVariantProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Form fields for adding/editing variant
  const [size, setSize] = useState('');
  const [mrp, setMrp] = useState<string>('');
  const [sellingPrice, setSellingPrice] = useState<string>('');
  const [status, setStatus] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setSize('');
    setMrp('');
    setSellingPrice('');
    setStatus(true);
    setError(null);
    setIsAdding(false);
    setEditingIndex(null);
  };

  const handleStartAdd = () => {
    resetForm();
    setIsAdding(true);
  };

  const handleStartEdit = (index: number) => {
    const v = variants[index];
    setSize(v.size);
    setMrp(v.mrp.toString());
    setSellingPrice(v.selling_price.toString());
    setStatus(v.status);
    setError(null);
    setIsAdding(false);
    setEditingIndex(index);
  };

  const handleSaveVariant = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedSize = size.trim();
    if (!trimmedSize) {
      setError('Variant size / weight / pack is required (e.g. 250g, 500g, 1kg).');
      return;
    }

    const parsedMrp = parseFloat(mrp);
    if (isNaN(parsedMrp) || parsedMrp < 0) {
      setError('MRP must be a valid positive number.');
      return;
    }

    const parsedSelling = parseFloat(sellingPrice);
    if (isNaN(parsedSelling) || parsedSelling < 0) {
      setError('Selling price must be a valid positive number.');
      return;
    }

    if (parsedSelling > parsedMrp) {
      setError('Selling price should not be greater than MRP.');
      return;
    }

    const newVariant: VariantDraft = {
      size: trimmedSize,
      mrp: parsedMrp,
      selling_price: parsedSelling,
      status,
    };

    if (editingIndex !== null) {
      const updated = [...variants];
      updated[editingIndex] = newVariant;
      onChange(updated);
    } else {
      onChange([...variants, newVariant]);
    }

    resetForm();
  };

  const handleRemoveVariant = (index: number) => {
    const updated = variants.filter((_, i) => i !== index);
    onChange(updated);
    if (editingIndex === index) {
      resetForm();
    }
  };

  return (
    <div className="space-y-3" id="product-variants-section">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-200 pb-2">
        <div>
          <h3 className="text-sm font-bold tracking-tight text-neutral-900 uppercase">
            Product Variants <span className="text-red-500">*</span>
          </h3>
          <p className="text-xs text-neutral-500">
            At least 1 variant is required for this product
          </p>
        </div>

        {!isAdding && editingIndex === null && (
          <button
            type="button"
            id="add-variant-draft-btn"
            onClick={handleStartAdd}
            disabled={disabled}
            className="btn-action self-start sm:self-auto"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Variant
          </button>
        )}
      </div>

      {/* List of existing variants */}
      {variants.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-neutral-300 p-6 text-center bg-neutral-50/50">
          <p className="text-xs font-semibold text-neutral-700">
            No variants added yet
          </p>
          <p className="text-[11px] text-neutral-400 mt-0.5">
            Every product must have at least one variant (e.g. Size, MRP, and Selling Price).
          </p>
          {!isAdding && (
            <button
              type="button"
              id="empty-state-add-variant-btn"
              onClick={handleStartAdd}
              disabled={disabled}
              className="btn-secondary text-xs mt-3 px-3 py-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              Add First Variant
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {variants.map((v, index) => {
            const isBeingEdited = editingIndex === index;
            if (isBeingEdited) return null; // rendered below in form

            const discountPct =
              v.mrp > 0
                ? Math.round(((v.mrp - v.selling_price) / v.mrp) * 100)
                : 0;

            return (
              <div
                key={`variant-${index}-${v.size}`}
                className="flex items-center justify-between p-3 rounded-xl border border-neutral-200 bg-white shadow-2xs hover:border-neutral-300 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-100 text-xs font-bold text-neutral-700">
                    #{index + 1}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-neutral-900">
                        {v.size}
                      </span>
                      {v.status ? (
                        <span className="badge-active text-[10px] py-0 px-1.5">
                          Active
                        </span>
                      ) : (
                        <span className="badge-inactive text-[10px] py-0 px-1.5">
                          Inactive
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2.5 text-xs text-neutral-600 mt-0.5">
                      <span>
                        MRP: <strong className="font-semibold line-through text-neutral-400">₹{v.mrp}</strong>
                      </span>
                      <span>
                        Price: <strong className="font-bold text-emerald-700">₹{v.selling_price}</strong>
                      </span>
                      {discountPct > 0 && (
                        <span className="text-[11px] font-semibold text-emerald-600">
                          ({discountPct}% OFF)
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleStartEdit(index)}
                    disabled={disabled || isAdding}
                    className="btn-action text-xs px-2.5 py-1"
                    title="Edit Variant"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveVariant(index)}
                    disabled={disabled || variants.length <= 1}
                    className="btn-danger-icon"
                    title={
                      variants.length <= 1
                        ? 'At least 1 variant is required'
                        : 'Delete Variant'
                    }
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Form Card */}
      {(isAdding || editingIndex !== null) && (
        <div
          id="variant-form-card"
          className="rounded-xl border border-neutral-300 bg-neutral-50/80 p-4 shadow-xs animate-in fade-in duration-150"
        >
          <div className="flex items-center justify-between mb-3 border-b border-neutral-200 pb-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-800">
              {editingIndex !== null ? `Edit Variant #${editingIndex + 1}` : 'New Variant Details'}
            </h4>
            <button
              type="button"
              onClick={resetForm}
              className="btn-icon-close h-7 w-7"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {error && (
            <div className="ui-alert-error mb-3">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Size */}
            <div>
              <label htmlFor="variant_size_input" className="form-label">
                Size / Weight / Pack <span className="text-red-500">*</span>
              </label>
              <input
                id="variant_size_input"
                type="text"
                required
                value={size}
                onChange={(e) => setSize(e.target.value)}
                placeholder="e.g. 250g, 500g, 1kg"
                className="form-input"
              />
            </div>

            {/* MRP */}
            <div>
              <label htmlFor="variant_mrp_input" className="form-label">
                MRP (₹) <span className="text-red-500">*</span>
              </label>
              <input
                id="variant_mrp_input"
                type="number"
                step="0.01"
                min="0"
                required
                value={mrp}
                onChange={(e) => setMrp(e.target.value)}
                placeholder="0.00"
                className="form-input"
              />
            </div>

            {/* Selling Price */}
            <div>
              <label htmlFor="variant_selling_price_input" className="form-label">
                Selling Price (₹) <span className="text-red-500">*</span>
              </label>
              <input
                id="variant_selling_price_input"
                type="number"
                step="0.01"
                min="0"
                required
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                placeholder="0.00"
                className="form-input"
              />
            </div>
          </div>

          {/* Status Switch & Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 mt-3 border-t border-neutral-200">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="variant_status_input"
                checked={status}
                onChange={(e) => setStatus(e.target.checked)}
                className="form-checkbox"
              />
              <label
                htmlFor="variant_status_input"
                className="text-xs font-semibold text-neutral-700 cursor-pointer"
              >
                Variant is Active & In Stock
              </label>
            </div>

            <div className="flex items-center gap-2 justify-end">
              <button
                type="button"
                onClick={resetForm}
                className="btn-secondary text-xs px-3 py-1.5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveVariant}
                className="btn-primary text-xs px-3 py-1.5"
              >
                <Check className="h-3.5 w-3.5" />
                {editingIndex !== null ? 'Update Variant' : 'Add to List'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Standalone Modal for adding/editing a variant on an existing product (used in openproduct)
 */
export function AddVariantModal({
  isOpen,
  onClose,
  onSave,
  initialVariant,
  loading = false,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (variant: VariantDraft) => Promise<void> | void;
  initialVariant?: VariantDraft | null;
  loading?: boolean;
}) {
  const [size, setSize] = useState(initialVariant?.size || '');
  const [mrp, setMrp] = useState(initialVariant?.mrp?.toString() || '');
  const [sellingPrice, setSellingPrice] = useState(
    initialVariant?.selling_price?.toString() || ''
  );
  const [status, setStatus] = useState<boolean>(initialVariant?.status ?? true);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedSize = size.trim();
    if (!trimmedSize) {
      setError('Size is required.');
      return;
    }

    const parsedMrp = parseFloat(mrp);
    if (isNaN(parsedMrp) || parsedMrp < 0) {
      setError('Valid MRP is required.');
      return;
    }

    const parsedSelling = parseFloat(sellingPrice);
    if (isNaN(parsedSelling) || parsedSelling < 0) {
      setError('Valid Selling Price is required.');
      return;
    }

    if (parsedSelling > parsedMrp) {
      setError('Selling price should not exceed MRP.');
      return;
    }

    await onSave({
      size: trimmedSize,
      mrp: parsedMrp,
      selling_price: parsedSelling,
      status,
    });
  };

  return (
    <div className="modal-backdrop" id="add-variant-modal-backdrop">
      <div className="modal-card max-w-md" id="add-variant-modal-card">
        <div className="modal-header-bar">
          <div>
            <h3 className="text-lg font-bold text-neutral-900">
              {initialVariant ? 'Edit Variant' : 'Add New Variant'}
            </h3>
            <p className="text-xs text-neutral-500">
              Specify size, MRP and selling price
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-icon-close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="ui-alert-error mb-3">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="form-label">
              Size / Weight <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={size}
              onChange={(e) => setSize(e.target.value)}
              placeholder="e.g. 500g"
              className="form-input"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">
                MRP (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={mrp}
                onChange={(e) => setMrp(e.target.value)}
                placeholder="0.00"
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">
                Selling Price (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                placeholder="0.00"
                className="form-input"
              />
            </div>
          </div>

          <div className="switch-toggle-card">
            <div>
              <span className="text-xs font-semibold text-neutral-800 block">
                Status
              </span>
              <span className="text-[11px] text-neutral-500">
                {status ? 'Active' : 'Inactive'}
              </span>
            </div>
            <input
              type="checkbox"
              checked={status}
              onChange={(e) => setStatus(e.target.checked)}
              className="form-checkbox"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
            >
              {loading ? 'Saving...' : initialVariant ? 'Update' : 'Save Variant'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
