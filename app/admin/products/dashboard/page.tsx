'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getCurrentAdminUser } from '@/lib/auth';
import { getProducts, getTotalVariantsCount } from '@/lib/productsStore';
import { getCategories } from '@/lib/categoriesStore';
import type { ProductWithCategory, Category } from '@/lib/datatypes';
import AdminHeader from '@/app/admin/header';
import AdminSidebar from '@/app/admin/sidebar';
import {
  Package,
  Plus,
  Search,
  Loader2,
  ExternalLink,
  Image as ImageIcon,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Layers,
  Filter,
  Layers3,
} from 'lucide-react';

export default function ProductsDashboardPage() {
  const router = useRouter();
  const [authChecking, setAuthChecking] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Data states
  const [products, setProducts] = useState<ProductWithCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [totalVariants, setTotalVariants] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');

  // Fetch products, categories, and variant counts
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [prodRes, catRes, vCount] = await Promise.all([
        getProducts(),
        getCategories(),
        getTotalVariantsCount(),
      ]);

      if (prodRes.data) {
        setProducts(prodRes.data);
      }
      if (catRes.data) {
        setCategories(catRes.data);
      }
      setTotalVariants(vCount);
    } catch (err) {
      console.error('Error fetching products data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

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

      await fetchData();
    }

    init();

    return () => {
      isMounted = false;
    };
  }, [router, fetchData]);

  // Compute total variants directly if already loaded
  const calculatedTotalVariants = useMemo(() => {
    if (products.length === 0) return totalVariants;
    return products.reduce((acc, p) => acc + (p.product_variants?.length || 0), 0);
  }, [products, totalVariants]);

  // Filter products by search (product_id or name) and selected category
  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return products.filter((p) => {
      // Category filter
      if (
        selectedCategoryFilter !== 'ALL' &&
        p.category_id !== selectedCategoryFilter
      ) {
        return false;
      }

      // Search query filter (product_id, Name)
      if (!query) return true;
      const matchesId = p.product_id?.toLowerCase().includes(query);
      const matchesName = p.name?.toLowerCase().includes(query);
      return matchesId || matchesName;
    });
  }, [products, searchQuery, selectedCategoryFilter]);

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
            {/* Top Stat & Action Bar */}
            <div className="ui-card-header">
              <div>
                <div className="flex items-center gap-2.5">
                  <div className="brand-icon-box">
                    <Package className="h-5 w-5" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold tracking-tight text-neutral-900">
                      Products
                    </h1>
                    <p className="text-xs text-neutral-500">
                      Manage product catalog, inventory variants, and pricing
                    </p>
                  </div>
                </div>
              </div>

              {/* Total Products & Total Variants Stats + Add Product button */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Total Products */}
                <div id="total-products-stat" className="badge-stat">
                  <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                    Total Products:
                  </span>
                  <span className="text-base font-bold text-neutral-900">
                    {products.length}
                  </span>
                </div>

                {/* Total Variants */}
                <div id="total-variants-stat" className="badge-stat">
                  <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 flex items-center gap-1">
                    <Layers3 className="h-3.5 w-3.5 text-neutral-400" />
                    Total Variants:
                  </span>
                  <span className="text-base font-bold text-neutral-900">
                    {calculatedTotalVariants}
                  </span>
                </div>

                {/* Add Product Button */}
                <Link
                  href="/admin/products/addproduct"
                  id="add-product-main-btn"
                  className="btn-primary"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Product</span>
                </Link>
              </div>
            </div>

            {/* Search & Category Filter Controls */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-3">
              {/* Search Bar */}
              <div className="relative w-full md:max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <input
                  type="text"
                  id="product-search-bar"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by Product ID or Name..."
                  className="search-bar-input"
                />
              </div>

              {/* Filter By Category & Refresh */}
              <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-neutral-400 shrink-0 hidden sm:block" />
                  <select
                    id="filter-by-category-dropdown"
                    value={selectedCategoryFilter}
                    onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                    className="form-input text-xs py-2 px-3 min-w-[160px]"
                  >
                    <option value="ALL">All Categories ({categories.length})</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  id="refresh-products-btn"
                  onClick={fetchData}
                  disabled={loading}
                  title="Refresh Products"
                  className="btn-secondary text-xs px-3 py-2 shrink-0"
                >
                  <RefreshCw
                    className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`}
                  />
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            {/* Products Table Card */}
            <div className="ui-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="ui-table">
                  <thead className="ui-table-thead">
                    <tr>
                      <th scope="col" className="ui-table-th w-14 text-center">
                        S.No
                      </th>
                      <th scope="col" className="ui-table-th w-20">
                        Image
                      </th>
                      <th scope="col" className="ui-table-th">
                        Product ID
                      </th>
                      <th scope="col" className="ui-table-th">
                        Name
                      </th>
                      <th scope="col" className="ui-table-th">
                        Category
                      </th>
                      <th scope="col" className="ui-table-th text-center">
                        No. of Variants
                      </th>
                      <th scope="col" className="ui-table-th">
                        Status
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
                            <span className="text-xs">Loading products...</span>
                          </div>
                        </td>
                      </tr>
                    ) : filteredProducts.length === 0 ? (
                      <tr>
                        <td
                          colSpan={8}
                          className="px-5 py-12 text-center text-neutral-500"
                        >
                          <div className="flex flex-col items-center justify-center gap-2">
                            <Package className="h-8 w-8 text-neutral-300" />
                            <p className="font-medium text-neutral-700">
                              No products found
                            </p>
                            <p className="text-xs text-neutral-400">
                              {searchQuery || selectedCategoryFilter !== 'ALL'
                                ? 'No products match your current search and filters.'
                                : 'Click "Add Product" to create your first product.'}
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredProducts.map((prod, index) => {
                        const variantCount = prod.product_variants?.length || 0;
                        const categoryName =
                          prod.categories?.name || 'Uncategorized';

                        return (
                          <tr
                            key={prod.id}
                            className="ui-table-tr"
                            id={`product-row-${prod.product_id}`}
                          >
                            {/* S.No */}
                            <td className="ui-table-td text-center font-medium text-neutral-500 text-xs">
                              {index + 1}
                            </td>

                            {/* Image */}
                            <td className="ui-table-td">
                              <div className="category-image-box">
                                {prod.image_url ? (
                                  <Image
                                    src={prod.image_url}
                                    alt={prod.name}
                                    fill
                                    className="object-cover"
                                    unoptimized
                                  />
                                ) : (
                                  <ImageIcon className="h-5 w-5 text-neutral-300" />
                                )}
                              </div>
                            </td>

                            {/* Product ID */}
                            <td className="ui-table-td">
                              <span className="font-mono text-xs font-semibold text-neutral-900 bg-neutral-100 px-2 py-1 rounded-md border border-neutral-200/60">
                                {prod.product_id}
                              </span>
                            </td>

                            {/* Name */}
                            <td className="ui-table-td">
                              <div className="font-semibold text-neutral-900">
                                {prod.name}
                              </div>
                              {prod.featured && (
                                <span className="inline-block mt-0.5 text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                  Featured
                                </span>
                              )}
                            </td>

                            {/* Category */}
                            <td className="ui-table-td">
                              <span className="inline-flex items-center gap-1 font-medium text-xs text-neutral-700 bg-neutral-50 px-2 py-1 rounded border border-neutral-200">
                                {categoryName}
                              </span>
                            </td>

                            {/* No. of Variants */}
                            <td className="ui-table-td text-center">
                              <span className="inline-flex items-center gap-1 font-semibold text-xs text-neutral-800 bg-neutral-100 px-2 py-0.5 rounded-full">
                                <Layers className="h-3 w-3 text-neutral-500" />
                                {variantCount} {variantCount === 1 ? 'variant' : 'variants'}
                              </span>
                            </td>

                            {/* Status */}
                            <td className="ui-table-td">
                              {prod.status ? (
                                <span className="badge-active">
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  Active
                                </span>
                              ) : (
                                <span className="badge-inactive">
                                  <XCircle className="h-3.5 w-3.5" />
                                  Inactive
                                </span>
                              )}
                            </td>

                            {/* Action (Open button) */}
                            <td className="ui-table-td text-right">
                              <Link
                                href={`/admin/products/openproduct?id=${encodeURIComponent(
                                  prod.id
                                )}`}
                                id={`open-prod-btn-${prod.product_id}`}
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
