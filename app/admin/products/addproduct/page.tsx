'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCurrentAdminUser } from '@/lib/auth';
import { getCategories } from '@/lib/categoriesStore';
import {
  getNextProductId,
  getProductsCount,
  createProductWithVariants,
  type VariantDraft,
} from '@/lib/productsStore';
import type { Category } from '@/lib/datatypes';
import AdminHeader from '@/app/admin/header';
import AdminSidebar from '@/app/admin/sidebar';
import AddProductVariantSection from '@/components/addproductvariant';
import {
  PackagePlus,
  ArrowLeft,
  Upload,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import Image from 'next/image';

export default function AddProductPage() {
  const router = useRouter();
  const [authChecking, setAuthChecking] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Categories list
  const [categories, setCategories] = useState<Category[]>([]);
  const [productsCount, setProductsCount] = useState<number>(0);

  // Form states
  const [productId, setProductId] = useState('prod-101');
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

  // Image state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Variants state (at least 1 is required)
  const [variants, setVariants] = useState<VariantDraft[]>([
    { size: '500g', mrp: 0, selling_price: 0, status: true },
  ]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Clean up preview object url
  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  // Auth and initial data load
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      const { user, error: authError } = await getCurrentAdminUser();
      if (!isMounted) return;

      if (authError || !user) {
        router.push('/login');
        return;
      }
      setAuthChecking(false);

      try {
        const [catsRes, pCount] = await Promise.all([
          getCategories(),
          getProductsCount(),
        ]);

        if (!isMounted) return;

        if (catsRes.data && catsRes.data.length > 0) {
          setCategories(catsRes.data);
          setCategoryId(catsRes.data[0].id); // default to first category
        }
        setProductsCount(pCount);
        setProductId(getNextProductId(pCount));
      } catch (err) {
        console.error('Error loading initial data:', err);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image file size must be less than 5MB');
        return;
      }
      setImageFile(file);
      const objectUrl = URL.createObjectURL(file);
      setImagePreview(objectUrl);
      setError(null);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    if (imagePreview && imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const trimmedProdId = productId.trim();
    const trimmedName = name.trim();

    if (!trimmedProdId) {
      setError('Product ID is required.');
      return;
    }

    if (!trimmedName) {
      setError('Product Name is required.');
      return;
    }

    if (!categoryId) {
      setError('Please select a Category for this product.');
      return;
    }

    if (!variants || variants.length === 0) {
      setError('At least one product variant is required.');
      return;
    }

    // Validate that all variants have valid sizes and prices
    for (let i = 0; i < variants.length; i++) {
      const v = variants[i];
      if (!v.size.trim()) {
        setError(`Variant #${i + 1} size is missing.`);
        return;
      }
      if (v.mrp < 0 || isNaN(v.mrp)) {
        setError(`Variant #${i + 1} has an invalid MRP.`);
        return;
      }
      if (v.selling_price < 0 || isNaN(v.selling_price)) {
        setError(`Variant #${i + 1} has an invalid selling price.`);
        return;
      }
    }

    setSaving(true);

    try {
      const { data: createdProduct, error: createError } =
        await createProductWithVariants(
          {
            product_id: trimmedProdId,
            category_id: categoryId,
            name: trimmedName,
            description: description.trim() || null,
            notes: notes.trim() || null,
            list: list.trim() || null,
            estimated_delivery: estimatedDelivery.trim() || null,
            used_in_txt: usedInTxt.trim() || null,
            benefits: benefits.trim() || null,
            featured,
            status,
            available,
          },
          variants,
          imageFile
        );

      if (createError) {
        throw createError;
      }

      setSuccessMsg('Product and variants created successfully! Redirecting...');
      setTimeout(() => {
        router.push('/admin/products/dashboard');
      }, 1000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create product.');
      setSaving(false);
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
      {/* Header */}
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
            {/* Navigation Header */}
            <div className="ui-card-header">
              <div className="flex items-center gap-3">
                <Link
                  href="/admin/products/dashboard"
                  className="btn-secondary px-2.5 py-1.5 text-xs"
                  id="back-to-products-btn"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to Products</span>
                </Link>
                <div>
                  <h1 className="text-xl font-bold tracking-tight text-neutral-900 flex items-center gap-2">
                    <PackagePlus className="h-5 w-5 text-neutral-800" />
                    Add New Product
                  </h1>
                  <p className="text-xs text-neutral-500">
                    Create product details, upload image, and configure variants
                  </p>
                </div>
              </div>
            </div>

            {/* Error or Success notification */}
            {error && (
              <div className="ui-alert-error" id="add-product-error-banner">
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

            {/* Product Creation Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Card 1: Basic Information */}
              <div className="ui-card p-5 sm:p-6 space-y-4">
                <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-900 border-b border-neutral-100 pb-2">
                  1. Product Identifiers & Basic Info
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Product ID (Default prod-101+N) */}
                  <div>
                    <label htmlFor="product_id" className="form-label">
                      Product ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="product_id"
                      type="text"
                      required
                      value={productId}
                      onChange={(e) => setProductId(e.target.value)}
                      placeholder="prod-101"
                      className="form-input font-mono"
                    />
                    <p className="text-[11px] text-neutral-400 mt-1">
                      Default: prod-101 + {productsCount}
                    </p>
                  </div>

                  {/* Category Dropdown */}
                  <div>
                    <label htmlFor="product_category" className="form-label">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="product_category"
                      required
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="form-input"
                    >
                      {categories.length === 0 ? (
                        <option value="">No categories available</option>
                      ) : (
                        categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name} ({cat.category_id})
                          </option>
                        ))
                      )}
                    </select>
                    {categories.length === 0 && (
                      <p className="text-[11px] text-amber-600 mt-1">
                        Please create a category first in Categories section.
                      </p>
                    )}
                  </div>

                  {/* Product Name */}
                  <div>
                    <label htmlFor="product_name" className="form-label">
                      Product Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="product_name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Special Ghee Mysore Pak"
                      className="form-input"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="product_desc" className="form-label">
                    Description
                  </label>
                  <textarea
                    id="product_desc"
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Rich description of the product, ingredients, taste, and tradition..."
                    className="form-textarea"
                  />
                </div>
              </div>

              {/* Card 2: Image Upload (product_images bucket) */}
              <div className="ui-card p-5 sm:p-6 space-y-4">
                <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-900 border-b border-neutral-100 pb-2">
                  2. Product Media (Supabase product_images bucket)
                </h2>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                  id="product-image-file"
                />

                {imagePreview ? (
                  <div className="image-preview-card">
                    <div className="category-image-box h-20 w-20 bg-white">
                      <Image
                        src={imagePreview}
                        alt="Product Preview"
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-neutral-800 truncate">
                        {imageFile?.name || 'Selected Image'}
                      </p>
                      <p className="text-[11px] text-neutral-500">
                        Will be uploaded to product_images bucket on save
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
                        title="Delete Image"
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
                      Click to select & upload product image
                    </span>
                    <span className="text-[11px] text-neutral-400 mt-0.5">
                      JPG, PNG, WebP up to 5MB (Stored in product_images bucket)
                    </span>
                  </div>
                )}
              </div>

              {/* Card 3: Additional Details (Notes, List, Delivery, Used In, Benefits) */}
              <div className="ui-card p-5 sm:p-6 space-y-4">
                <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-900 border-b border-neutral-100 pb-2">
                  3. Product Details & Attributes
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Estimated Delivery */}
                  <div>
                    <label htmlFor="product_delivery" className="form-label">
                      Estimated Delivery
                    </label>
                    <input
                      id="product_delivery"
                      type="text"
                      value={estimatedDelivery}
                      onChange={(e) => setEstimatedDelivery(e.target.value)}
                      placeholder="e.g. 2 - 4 Business Days"
                      className="form-input"
                    />
                  </div>

                  {/* Used in text */}
                  <div>
                    <label htmlFor="product_used_in" className="form-label">
                      Used In (Occasions / Pairings)
                    </label>
                    <input
                      id="product_used_in"
                      type="text"
                      value={usedInTxt}
                      onChange={(e) => setUsedInTxt(e.target.value)}
                      placeholder="e.g. Festivals, Teatime Snacks, Pooja"
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Notes */}
                  <div>
                    <label htmlFor="product_notes" className="form-label">
                      Notes / Storage Advice
                    </label>
                    <textarea
                      id="product_notes"
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g. Store in an airtight container..."
                      className="form-textarea"
                    />
                  </div>

                  {/* List / Ingredients */}
                  <div>
                    <label htmlFor="product_list" className="form-label">
                      List / Ingredients
                    </label>
                    <textarea
                      id="product_list"
                      rows={2}
                      value={list}
                      onChange={(e) => setList(e.target.value)}
                      placeholder="e.g. Pure Ghee, Gram Flour, Cardamom..."
                      className="form-textarea"
                    />
                  </div>

                  {/* Benefits */}
                  <div>
                    <label htmlFor="product_benefits" className="form-label">
                      Benefits
                    </label>
                    <textarea
                      id="product_benefits"
                      rows={2}
                      value={benefits}
                      onChange={(e) => setBenefits(e.target.value)}
                      placeholder="e.g. 100% Preservative-free, Traditional recipe..."
                      className="form-textarea"
                    />
                  </div>
                </div>

                {/* Status switches (Featured, Status, Available) */}
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
                      id="product_featured_toggle"
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
                      id="product_status_toggle"
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
                      id="product_available_toggle"
                      checked={available}
                      onChange={(e) => setAvailable(e.target.checked)}
                      className="form-checkbox"
                    />
                  </div>
                </div>
              </div>

              {/* Card 4: Product Variants (components/addproductvariant.tsx) */}
              <div className="ui-card p-5 sm:p-6">
                <AddProductVariantSection
                  variants={variants}
                  onChange={setVariants}
                  disabled={saving}
                />
              </div>

              {/* Form Action Controls */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <Link
                  href="/admin/products/dashboard"
                  className="btn-secondary"
                  id="cancel-add-product-btn"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={saving}
                  id="save-product-main-btn"
                  className="btn-primary px-6"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving Product & Variants...
                    </>
                  ) : (
                    'Save Product & Variants'
                  )}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
