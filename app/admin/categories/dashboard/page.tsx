'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentAdminUser } from '@/lib/auth';
import { getCategories } from '@/lib/categoriesStore';
import type { Category } from '@/lib/datatypes';
import AdminHeader from '@/app/admin/header';
import AdminSidebar from '@/app/admin/sidebar';
import AddCategoryModal from '@/components/addcategory';
import OpenCategoryModal from '@/components/opencategory';
import {
  FolderTree,
  Plus,
  Search,
  Loader2,
  ExternalLink,
  Image as ImageIcon,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from 'lucide-react';
import Image from 'next/image';

export default function CategoriesDashboardPage() {
  const router = useRouter();
  const [authChecking, setAuthChecking] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Data state
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isOpenModalActive, setIsOpenModalActive] = useState(false);

  // Fetch categories from categoriesStore
  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await getCategories();
      if (error) {
        console.error('Error fetching categories:', error.message);
      } else if (data) {
        setCategories(data);
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Auth check & initial fetch
  useEffect(() => {
    let isMounted = true;

    async function checkAuthAndLoad() {
      const { user, error } = await getCurrentAdminUser();
      if (!isMounted) return;

      if (error || !user) {
        router.push('/login');
        return;
      }
      setAuthChecking(false);

      // Load initial categories
      setLoading(true);
      try {
        const { data, error: catError } = await getCategories();
        if (!isMounted) return;

        if (catError) {
          console.error('Error loading categories:', catError.message);
        } else if (data) {
          setCategories(data);
        }
      } catch (err) {
        console.error('Error:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    checkAuthAndLoad();

    return () => {
      isMounted = false;
    };
  }, [router]);

  // Filtered categories based on search (category_id or name)
  const filteredCategories = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return categories;
    return categories.filter(
      (cat) =>
        cat.category_id.toLowerCase().includes(query) ||
        cat.name.toLowerCase().includes(query)
    );
  }, [categories, searchQuery]);

  const handleOpenCategory = (cat: Category) => {
    setSelectedCategory(cat);
    setIsOpenModalActive(true);
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

        {/* Main Content Body */}
        <main className="admin-main-area">
          <div className="admin-content-wrap">
            {/* Top Stat & Action Bar */}
            <div className="ui-card-header">
              <div>
                <div className="flex items-center gap-2.5">
                  <div className="brand-icon-box">
                    <FolderTree className="h-5 w-5" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold tracking-tight text-neutral-900">
                      Categories
                    </h1>
                    <p className="text-xs text-neutral-500">
                      Manage product collections and catalogs
                    </p>
                  </div>
                </div>
              </div>

              {/* Total Categories Badge & Add Button */}
              <div className="flex flex-wrap items-center gap-3">
                <div
                  id="total-categories-stat"
                  className="badge-stat"
                >
                  <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                    Total Categories:
                  </span>
                  <span className="text-base font-bold text-neutral-900">
                    {categories.length}
                  </span>
                </div>

                <button
                  type="button"
                  id="add-category-main-btn"
                  onClick={() => setIsAddModalOpen(true)}
                  className="btn-primary"
                >
                  <Plus className="h-4 w-4" />
                  Add Category
                </button>
              </div>
            </div>

            {/* Search & Filter Bar */}
            <div className="flex flex-col sm:flex-row items-center gap-3 justify-between">
              <div className="relative w-full sm:max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <input
                  type="text"
                  id="category-search-bar"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by Category ID or Name..."
                  className="search-bar-input"
                />
              </div>

              <button
                type="button"
                onClick={fetchCategories}
                disabled={loading}
                title="Refresh Categories"
                className="btn-secondary text-xs self-end sm:self-auto px-3 py-2"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`}
                />
                Refresh
              </button>
            </div>

            {/* Categories Table Card */}
            <div className="ui-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="ui-table">
                  <thead className="ui-table-thead">
                    <tr>
                      <th scope="col" className="ui-table-th w-16 text-center">
                        S.No
                      </th>
                      <th scope="col" className="ui-table-th w-24">
                        Image
                      </th>
                      <th scope="col" className="ui-table-th">
                        Category ID
                      </th>
                      <th scope="col" className="ui-table-th">
                        Name
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
                        <td colSpan={6} className="px-5 py-12 text-center text-neutral-500">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <Loader2 className="h-6 w-6 animate-spin brand-spinner" />
                            <span className="text-xs">Loading categories...</span>
                          </div>
                        </td>
                      </tr>
                    ) : filteredCategories.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-5 py-12 text-center text-neutral-500">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <FolderTree className="h-8 w-8 text-neutral-300" />
                            <p className="font-medium text-neutral-700">No categories found</p>
                            <p className="text-xs text-neutral-400">
                              {searchQuery
                                ? 'No results matching your search criteria.'
                                : 'Click "Add Category" to create your first category.'}
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredCategories.map((cat, index) => (
                        <tr
                          key={cat.id}
                          className="ui-table-tr"
                        >
                          {/* S.No */}
                          <td className="ui-table-td text-center font-medium text-neutral-500 text-xs">
                            {index + 1}
                          </td>

                          {/* Image */}
                          <td className="ui-table-td">
                            <div className="category-image-box">
                              {cat.image_url ? (
                                <Image
                                  src={cat.image_url}
                                  alt={cat.name}
                                  fill
                                  className="object-cover"
                                  unoptimized
                                />
                              ) : (
                                <ImageIcon className="h-6 w-6 text-neutral-300" />
                              )}
                            </div>
                          </td>

                          {/* Category ID */}
                          <td className="ui-table-td">
                            <span className="font-mono text-xs font-semibold text-neutral-900 bg-neutral-100 px-2 py-1 rounded-md border border-neutral-200/60">
                              {cat.category_id}
                            </span>
                          </td>

                          {/* Name */}
                          <td className="ui-table-td">
                            <div className="font-semibold text-neutral-900">{cat.name}</div>
                            {cat.description && (
                              <div className="text-xs text-neutral-400 line-clamp-1 max-w-xs">
                                {cat.description}
                              </div>
                            )}
                          </td>

                          {/* Status */}
                          <td className="ui-table-td">
                            {cat.status ? (
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
                            <button
                              type="button"
                              id={`open-cat-btn-${cat.category_id}`}
                              onClick={() => handleOpenCategory(cat)}
                              className="btn-action"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                              Open
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Add Category Modal Dialog */}
      <AddCategoryModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={fetchCategories}
        currentCategoriesCount={categories.length}
      />

      {/* Open / Edit Category Modal Dialog */}
      <OpenCategoryModal
        category={selectedCategory}
        isOpen={isOpenModalActive}
        onClose={() => {
          setIsOpenModalActive(false);
          setSelectedCategory(null);
        }}
        onSuccess={fetchCategories}
      />
    </div>
  );
}
