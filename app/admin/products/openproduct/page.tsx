'use client';

import { useEffect, useState, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getCurrentAdminUser } from '@/lib/auth';
import { getCategories } from '@/lib/categoriesStore';
import {
  getProductById,
  updateProduct,
  addProductVariant,
  updateProductVariant,
  deleteProductVariant,
  deleteProduct,
  type VariantDraft,
} from '@/lib/productsStore';
import type { Category, ProductWithCategory, ProductVariant } from '@/lib/datatypes';
import AdminHeader from '@/app/admin/header';
import AdminSidebar from '@/app/admin/sidebar';
import { AddVariantModal } from '@/components/addproductvariant';
import {
  Package,
  ArrowLeft,
  Upload,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Lock,
  Plus,
  Edit2,
  Tag,
} from 'lucide-react';

export default function OpenProductPage() {
  return (
    <Suspense
      fallback={
        <div className="loading-container">
          <Loader2 className="h-8 w-8 animate-spin brand-spinner" />
        </div>
      }
    >
      <OpenProductContent />
    </Suspense>
  );
}

function OpenProductContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const productIdParam = searchParams.get('id');

  const [authChecking, setAuthChecking] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [product, setProduct] = useState<ProductWithCategory | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Editable Product fields
  const [categoryId, setCategoryId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [list, setList] = useState('');
  const [estimatedDelivery, setEstimatedDelivery] = useState('');
  const [usedInTxt, setUsedInTxt] = useState('');
  const [benefits, setBenefits] = useState('');
  const [featured, setFeatured] = useState<boolean>(false);
  const [status, setStatus] = useState<boolean>(true);
  const [available, setAvailable] = useState<boolean>(true);

  // Image states
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [newImagePreview, setNewImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Variant Modal state
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null);
  const [variantActionLoading, setVariantActionLoading] = useState(false);

  // Load product data
  const loadProduct = useCallback(async () => {
    if (!productIdParam) {
      setError('No Product ID provided in URL.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchErr } = await getProductById(productIdParam);
      if (fetchErr || !data) {
        setError(fetchErr?.message || 'Product not found.');
      } else {
        setProduct(data);
        setCategoryId(data.category_id);
        setName(data.name || '');
        setDescription(data.description || '');
        setNotes(data.notes || '');
        setList(data.list || '');
        setEstimatedDelivery(data.estimated_delivery || '');
        setUsedInTxt(data.used_in_txt || '');
        setBenefits(data.benefits || '');
        setFeatured(data.featured ?? false);
        setStatus(data.status ?? true);
        setAvailable(data.available ?? true);
        setImageUrl(data.image_url || null);
        setNewImageFile(null);
        setNewImagePreview(null);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load product.');
    } finally {
      setLoading(false);
    }
  }, [productIdParam]);

  // Auth check & load categories
  useEffect(() => {
    let isMounted = true;

    async function init() {
      const { user, error: authError } = await getCurrentAdminUser();
      if (!isMounted) return;

      if (authError || !user) {
        router.push('/login');
        return;
      }
      setAuthChecking(false);

      const catsRes = await getCategories();
      if (!isMounted) return;
      if (catsRes.data) {
        setCategories(catsRes.data);
      }

      await loadProduct();
    }

    init();

    return () => {
      isMounted = false;
    };
  }, [router, loadProduct]);

  // Handle image upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image file size must be less than 5MB');
        return;
      }
      setNewImageFile(file);
      const objectUrl = URL.createObjectURL(file);
      setNewImagePreview(objectUrl);
      setError(null);
    }
  };

  const handleRemoveImage = () => {
    setImageUrl(null);
    setNewImageFile(null);
    if (newImagePreview && newImagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(newImagePreview);
    }
    setNewImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Save product general updates
  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;

    setError(null);
    setSuccessMsg(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Product Name is required.');
      return;
    }

    if (!categoryId) {
      setError('Please select a Category.');
      return;
    }

    setSaving(true);
    try {
      const { error: updateErr } = await updateProduct(
        product.id,
        {
          category_id: categoryId,
          name: trimmedName,
          description: description.trim() || null,
          notes: notes.trim() || null,
          list: list.trim() || null,
          estimated_delivery: estimatedDelivery.trim() || null,
          image_url: imageUrl,
          used_in_txt: usedInTxt.trim() || null,
          benefits: benefits.trim() || null,
          featured,
          status,
          available,
        },
        newImageFile
      );

      if (updateErr) {
        throw updateErr;
      }

      setSuccessMsg('Product updated successfully!');
      await loadProduct();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update product.');
    } finally {
      setSaving(false);
    }
  };

  // Add / Edit Variant handler
  const handleSaveVariantModal = async (draft: VariantDraft) => {
    if (!product) return;
    setVariantActionLoading(true);
    setError(null);

    try {
      if (editingVariant) {
        // Update existing variant
        const { error: vErr } = await updateProductVariant(
          editingVariant.id,
          draft
        );
        if (vErr) throw vErr;
      } else {
        // Add new variant
        const { error: vErr } = await addProductVariant(product.id, draft);
        if (vErr) throw vErr;
      }

      setIsVariantModalOpen(false);
      setEditingVariant(null);
      await loadProduct();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save variant.');
    } finally {
      setVariantActionLoading(false);
    }
  };

  // Delete Variant handler
  const handleDeleteVariant = async (variantId: string) => {
    if (!product) return;
    if (product.product_variants && product.product_variants.length <= 1) {
      setError('A product must have at least one variant. You cannot delete the last remaining variant.');
      return;
    }

    if (!confirm('Are you sure you want to delete this variant?')) return;

    setVariantActionLoading(true);
    try {
      const { error: delErr } = await deleteProductVariant(variantId);
      if (delErr) throw delErr;
      await loadProduct();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete variant.');
    } finally {
      setVariantActionLoading(false);
    }
  };

  // Delete entire product
  const handleDeleteProduct = async () => {
    if (!product) return;
    if (
      !confirm(
        `Are you sure you want to delete product "${product.name}" (${product.product_id})? This action cannot be undone.`
      )
    ) {
      return;
    }

    setSaving(true);
    try {
      const { error: delErr } = await deleteProduct(product.id);
      if (delErr) throw delErr;
      router.push('/admin/products/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete product.');
      setSaving(false);
    }
  };

  const currentDisplayImage = newImagePreview || imageUrl;

  if (authChecking || (loading && !product)) {
    return (
      <div className="loading-container">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin brand-spinner" />
          <p className="text-sm text-neutral-500">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (!product && error) {
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
              <Link href="/admin/products/dashboard" className="btn-primary">
                <ArrowLeft className="h-4 w-4" />
                Return to Products
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
            {/* Action Bar */}
            <div className="ui-card-header">
              <div className="flex items-center gap-3">
                <Link
                  href="/admin/products/dashboard"
                  className="btn-secondary px-2.5 py-1.5 text-xs"
                  id="back-btn"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Products</span>
                </Link>
                <div>
                  <h1 className="text-xl font-bold tracking-tight text-neutral-900 flex items-center gap-2">
                    <Package className="h-5 w-5 text-neutral-800" />
                    Edit Product: {product?.name}
                  </h1>
                  <p className="text-xs text-neutral-500 font-mono">
                    ID: {product?.product_id}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  id="delete-product-btn"
                  onClick={handleDeleteProduct}
                  disabled={saving}
                  className="btn-danger-icon px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete Product</span>
                </button>
              </div>
            </div>

            {/* Error or Success notification */}
            {error && (
              <div className="ui-alert-error" id="edit-product-error-banner">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <div className="flex-1">{error}</div>
              </div>
            )}

            {successMsg && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleUpdateProduct} className="space-y-6">
              {/* Card 1: Locked Product ID and Details */}
              <div className="ui-card p-5 sm:p-6 space-y-4">
                <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-900 border-b border-neutral-100 pb-2">
                  1. Product Identifiers & Basic Information
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Product ID (LOCKED / Readonly) */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="form-label mb-0">Product ID</label>
                      <span className="inline-flex items-center gap-1 text-[11px] text-neutral-400">
                        <Lock className="h-3 w-3" /> Locked
                      </span>
                    </div>
                    <input
                      type="text"
                      disabled
                      value={product?.product_id || ''}
                      className="form-input-disabled"
                      title="Product ID cannot be modified"
                    />
                  </div>

                  {/* Category Selection */}
                  <div>
                    <label htmlFor="edit_product_category" className="form-label">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="edit_product_category"
                      required
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="form-input"
                    >
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name} ({cat.category_id})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Product Name */}
                  <div>
                    <label htmlFor="edit_product_name" className="form-label">
                      Product Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="edit_product_name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="form-input"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="edit_product_desc" className="form-label">
                    Description
                  </label>
                  <textarea
                    id="edit_product_desc"
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="form-textarea"
                  />
                </div>
              </div>

              {/* Card 2: Media Management */}
              <div className="ui-card p-5 sm:p-6 space-y-4">
                <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-900 border-b border-neutral-100 pb-2">
                  2. Product Image (Stored in product_images bucket)
                </h2>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                  id="edit-product-image-file"
                />

                {currentDisplayImage ? (
                  <div className="image-preview-card">
                    <div className="category-image-box h-20 w-20 bg-white">
                      <Image
                        src={currentDisplayImage}
                        alt={name || 'Product'}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-neutral-800 truncate">
                        {newImageFile ? newImageFile.name : 'Current Image'}
                      </p>
                      <p className="text-[11px] text-neutral-500">
                        {newImageFile
                          ? 'New file selected to upload'
                          : 'Publicly hosted in product_images bucket'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="btn-secondary text-xs px-2.5 py-1"
                      >
                        Change
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="btn-danger-icon"
                        title="Remove Image"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="upload-dropzone py-6"
                  >
                    <div className="brand-icon-box bg-white shadow-xs mb-2">
                      <Upload className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-semibold text-neutral-800">
                      Click to upload product image
                    </span>
                    <span className="text-[11px] text-neutral-400 mt-0.5">
                      JPG, PNG, WebP up to 5MB
                    </span>
                  </div>
                )}
              </div>

              {/* Card 3: Additional Details */}
              <div className="ui-card p-5 sm:p-6 space-y-4">
                <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-900 border-b border-neutral-100 pb-2">
                  3. Product Attributes & Switches
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="edit_product_delivery" className="form-label">
                      Estimated Delivery
                    </label>
                    <input
                      id="edit_product_delivery"
                      type="text"
                      value={estimatedDelivery}
                      onChange={(e) => setEstimatedDelivery(e.target.value)}
                      className="form-input"
                    />
                  </div>

                  <div>
                    <label htmlFor="edit_product_used_in" className="form-label">
                      Used In (Occasions / Pairings)
                    </label>
                    <input
                      id="edit_product_used_in"
                      type="text"
                      value={usedInTxt}
                      onChange={(e) => setUsedInTxt(e.target.value)}
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="edit_product_notes" className="form-label">
                      Notes / Storage Advice
                    </label>
                    <textarea
                      id="edit_product_notes"
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="form-textarea"
                    />
                  </div>

                  <div>
                    <label htmlFor="edit_product_list" className="form-label">
                      List / Ingredients
                    </label>
                    <textarea
                      id="edit_product_list"
                      rows={2}
                      value={list}
                      onChange={(e) => setList(e.target.value)}
                      className="form-textarea"
                    />
                  </div>

                  <div>
                    <label htmlFor="edit_product_benefits" className="form-label">
                      Benefits
                    </label>
                    <textarea
                      id="edit_product_benefits"
                      rows={2}
                      value={benefits}
                      onChange={(e) => setBenefits(e.target.value)}
                      className="form-textarea"
                    />
                  </div>
                </div>

                {/* Switches */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="switch-toggle-card">
                    <div>
                      <span className="text-xs font-semibold text-neutral-800 block">
                        Featured Product
                      </span>
                      <span className="text-[11px] text-neutral-500">
                        {featured ? 'Yes (Showcase)' : 'No'}
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      id="edit_product_featured"
                      checked={featured}
                      onChange={(e) => setFeatured(e.target.checked)}
                      className="form-checkbox"
                    />
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
                      id="edit_product_status"
                      checked={status}
                      onChange={(e) => setStatus(e.target.checked)}
                      className="form-checkbox"
                    />
                  </div>

                  <div className="switch-toggle-card">
                    <div>
                      <span className="text-xs font-semibold text-neutral-800 block">
                        Available
                      </span>
                      <span className="text-[11px] text-neutral-500">
                        {available ? 'In Stock' : 'Out of Stock'}
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      id="edit_product_available"
                      checked={available}
                      onChange={(e) => setAvailable(e.target.checked)}
                      className="form-checkbox"
                    />
                  </div>
                </div>
              </div>

              {/* Save Product Details Button */}
              <div className="flex items-center justify-end gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  id="save-product-details-btn"
                  className="btn-primary px-6"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving Changes...
                    </>
                  ) : (
                    'Save Product Changes'
                  )}
                </button>
              </div>
            </form>

            {/* Card 4: Display & Manage Product Variants */}
            <div className="ui-card p-5 sm:p-6 space-y-4 mt-6">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-900 flex items-center gap-1.5">
                    <Tag className="h-4 w-4 text-neutral-600" />
                    Product Variants ({product?.product_variants?.length || 0})
                  </h2>
                  <p className="text-xs text-neutral-500">
                    Display, edit, or add new variants for this product
                  </p>
                </div>

                <button
                  type="button"
                  id="add-new-variant-modal-btn"
                  onClick={() => {
                    setEditingVariant(null);
                    setIsVariantModalOpen(true);
                  }}
                  disabled={variantActionLoading}
                  className="btn-primary text-xs px-3 py-1.5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add New Variant
                </button>
              </div>

              {/* Variants List / Table */}
              <div className="space-y-2">
                {!product?.product_variants || product.product_variants.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-neutral-300 p-6 text-center text-xs text-neutral-500">
                    No variants found. Please add at least one variant.
                  </div>
                ) : (
                  product.product_variants.map((variant, idx) => {
                    const discountPct =
                      variant.mrp > 0
                        ? Math.round(
                            ((variant.mrp - variant.selling_price) / variant.mrp) * 100
                          )
                        : 0;

                    return (
                      <div
                        key={variant.id}
                        className="flex items-center justify-between p-3.5 rounded-xl border border-neutral-200 bg-white hover:border-neutral-300 transition-colors shadow-2xs"
                      >
                        <div className="flex items-center gap-3">
                          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-100 text-xs font-bold text-neutral-700">
                            #{idx + 1}
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-neutral-900">
                                {variant.size}
                              </span>
                              {variant.status ? (
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
                                MRP: <strong className="font-semibold line-through text-neutral-400">₹{variant.mrp}</strong>
                              </span>
                              <span>
                                Selling Price: <strong className="font-bold text-emerald-700">₹{variant.selling_price}</strong>
                              </span>
                              {discountPct > 0 && (
                                <span className="text-[11px] font-semibold text-emerald-600">
                                  ({discountPct}% OFF)
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingVariant(variant);
                              setIsVariantModalOpen(true);
                            }}
                            className="btn-action text-xs px-2.5 py-1"
                            title="Edit Variant"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteVariant(variant.id)}
                            disabled={
                              variantActionLoading ||
                              product.product_variants!.length <= 1
                            }
                            className="btn-danger-icon"
                            title={
                              product.product_variants!.length <= 1
                                ? 'Product must have at least 1 variant'
                                : 'Delete Variant'
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Add / Edit Variant Modal */}
      <AddVariantModal
        isOpen={isVariantModalOpen}
        onClose={() => {
          setIsVariantModalOpen(false);
          setEditingVariant(null);
        }}
        onSave={handleSaveVariantModal}
        initialVariant={
          editingVariant
            ? {
                size: editingVariant.size,
                mrp: Number(editingVariant.mrp),
                selling_price: Number(editingVariant.selling_price),
                status: editingVariant.status,
              }
            : null
        }
        loading={variantActionLoading}
      />
    </div>
  );
}
