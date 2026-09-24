'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCurrentAdminUser } from '@/lib/auth';
import {
  getCustomers,
  getTotalCustomersCount,
} from '@/lib/customersStore';
import type { Customer } from '@/lib/datatypes';
import AdminHeader from '@/app/admin/header';
import AdminSidebar from '@/app/admin/sidebar';
import AddCustomerModal from '@/components/addCustomer';
import {
  Users,
  Search,
  Plus,
  Loader2,
  ExternalLink,
  RefreshCw,
  Award,
  Tag,
  Phone,
  Mail,
  MapPin,
} from 'lucide-react';

export default function CustomersDashboardPage() {
  const router = useRouter();
  const [authChecking, setAuthChecking] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');

  // Data state
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [totalCustomersCount, setTotalCustomersCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  // Add Customer modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Fetch customers
  const fetchCustomersData = useCallback(async () => {
    setLoading(true);
    try {
      const [customersRes, totalCount] = await Promise.all([
        getCustomers({
          searchQuery: searchQuery || undefined,
        }),
        getTotalCustomersCount(),
      ]);

      if (customersRes.data) {
        setCustomers(customersRes.data);
      }
      setTotalCustomersCount(totalCount);
    } catch (err) {
      console.error('Error fetching customers:', err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

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

      await fetchCustomersData();
    }

    init();

    return () => {
      isMounted = false;
    };
  }, [router, fetchCustomersData]);

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
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-xl font-bold tracking-tight text-neutral-900">
                    Customers
                  </h1>
                  <p className="text-xs text-neutral-500">
                    Manage customer accounts, loyalty points, and purchase history
                  </p>
                </div>
              </div>

              {/* Total Customers Stat & Actions */}
              <div className="flex items-center gap-3">
                <div id="total-customers-stat" className="badge-stat">
                  <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                    Total Customers:
                  </span>
                  <span className="text-base font-bold text-neutral-900">
                    {totalCustomersCount}
                  </span>
                </div>

                <button
                  type="button"
                  id="refresh-customers-btn"
                  onClick={fetchCustomersData}
                  disabled={loading}
                  title="Refresh Customers"
                  className="btn-secondary text-xs px-3 py-2"
                >
                  <RefreshCw
                    className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`}
                  />
                  <span>Refresh</span>
                </button>

                <button
                  type="button"
                  id="add-customer-btn"
                  onClick={() => setIsAddModalOpen(true)}
                  className="btn-primary text-xs px-3.5 py-2 flex items-center gap-1.5"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Customer</span>
                </button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="ui-card p-4">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <input
                  type="text"
                  id="customer-search-bar"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by customer name or mobile number..."
                  className="search-bar-input pl-10"
                />
              </div>
            </div>

            {/* Customers Table */}
            <div className="ui-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="ui-table" id="customers-table">
                  <thead className="ui-table-thead">
                    <tr>
                      <th scope="col" className="ui-table-th w-14 text-center">
                        S.No
                      </th>
                      <th scope="col" className="ui-table-th">
                        Name
                      </th>
                      <th scope="col" className="ui-table-th">
                        Mobile
                      </th>
                      <th scope="col" className="ui-table-th text-center">
                        Loyalty Points
                      </th>
                      <th scope="col" className="ui-table-th">
                        Referral Code
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
                          colSpan={6}
                          className="px-5 py-12 text-center text-neutral-500"
                        >
                          <div className="flex flex-col items-center justify-center gap-2">
                            <Loader2 className="h-6 w-6 animate-spin brand-spinner" />
                            <span className="text-xs font-medium">
                              Loading customers...
                            </span>
                          </div>
                        </td>
                      </tr>
                    ) : customers.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-5 py-12 text-center text-neutral-500"
                        >
                          <div className="flex flex-col items-center justify-center gap-2">
                            <Users className="h-8 w-8 text-neutral-300" />
                            <p className="font-medium text-neutral-700">
                              No customers found
                            </p>
                            <p className="text-xs text-neutral-400">
                              {searchQuery
                                ? 'No customer matches your search query.'
                                : 'There are currently no customer profiles in the database.'}
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      customers.map((cust, idx) => {
                        return (
                          <tr
                            key={cust.id}
                            className="ui-table-tr"
                            id={`customer-row-${cust.id}`}
                          >
                            {/* S.No */}
                            <td className="ui-table-td text-center font-medium text-neutral-500 text-xs">
                              {idx + 1}
                            </td>

                            {/* Name */}
                            <td className="ui-table-td">
                              <span className="font-bold text-neutral-900 block text-sm">
                                {cust.name}
                              </span>
                              {cust.email && (
                                <span className="text-[11px] text-neutral-400">
                                  {cust.email}
                                </span>
                              )}
                            </td>

                            {/* Mobile */}
                            <td className="ui-table-td">
                              <div className="flex items-center gap-1.5 text-neutral-800 font-semibold text-xs">
                                <Phone className="h-3 w-3 text-neutral-400" />
                                <span>{cust.mobile_number}</span>
                              </div>
                            </td>

                            {/* Loyalty Points */}
                            <td className="ui-table-td text-center">
                              <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                                <Award className="h-3.5 w-3.5 text-amber-600" />
                                {cust.loyalty_points ?? 0} Points
                              </span>
                            </td>

                            {/* Referral Code */}
                            <td className="ui-table-td">
                              {cust.referral_code ? (
                                <span className="inline-flex items-center gap-1 text-xs font-mono font-semibold text-neutral-700 bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200">
                                  <Tag className="h-3 w-3 text-neutral-400" />
                                  {cust.referral_code}
                                </span>
                              ) : (
                                <span className="text-xs text-neutral-400">—</span>
                              )}
                            </td>

                            {/* Open button linking to /admin/customers/opencustomer */}
                            <td className="ui-table-td text-right">
                              <Link
                                href={`/admin/customers/opencustomer?id=${encodeURIComponent(
                                  cust.id
                                )}`}
                                id={`open-customer-btn-${cust.id}`}
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

      {/* Add Customer Modal */}
      <AddCustomerModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          fetchCustomersData();
        }}
      />
    </div>
  );
}
