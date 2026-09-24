'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  ShoppingBag,
  Package,
  FolderTree,
  Users,
  Ticket,
  X,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const navigationItems = [
  { name: 'Home', href: '/admin/dashboard', icon: Home },
  { name: 'Orders', href: '/admin/orders/dashboard', icon: ShoppingBag },
  { name: 'Products', href: '/admin/products/dashboard', icon: Package },
  { name: 'Categories', href: '/admin/categories/dashboard', icon: FolderTree },
  { name: 'Customers', href: '/admin/customers/dashboard', icon: Users },
  { name: 'Coupons', href: '/admin/coupons/dashboard', icon: Ticket },
];

export default function AdminSidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          id="sidebar-backdrop"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs transition-opacity md:hidden"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        id="admin-sidebar"
        className={`admin-sidebar-wrap ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Mobile Header in Sidebar with Close button */}
        <div className="flex h-20 items-center justify-between border-b border-neutral-200 px-6 md:hidden">
          <span className="text-base font-bold text-neutral-900 tracking-tight">
            Navigation Menu
          </span>
          <button
            type="button"
            id="close-sidebar-btn"
            onClick={onClose}
            className="btn-icon-close"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation links */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Admin Panel
          </div>
          <nav className="space-y-1.5" aria-label="Admin Navigation">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.name === 'Customers' && (pathname.startsWith('/customers') || pathname.startsWith('/opencustomer') || pathname.startsWith('/admin/customers'))) ||
                (item.name === 'Coupons' && (pathname.startsWith('/coupons') || pathname.startsWith('/opencoupon') || pathname.startsWith('/admin/coupons'))) ||
                (item.name === 'Orders' && (pathname.startsWith('/orders') || pathname.startsWith('/admin/orders'))) ||
                (item.name === 'Categories' && (pathname.startsWith('/categories') || pathname.startsWith('/admin/categories'))) ||
                (item.name === 'Products' && (pathname.startsWith('/products') || pathname.startsWith('/admin/products') || pathname.startsWith('/admin/addproduct') || pathname.startsWith('/admin/openproduct'))) ||
                (item.href !== '/admin/dashboard' && pathname.startsWith(item.href.replace(/\/dashboard$/, '')));

              return (
                <Link
                  key={item.name}
                  id={`nav-${item.name.toLowerCase()}`}
                  href={item.href}
                  onClick={() => {
                    // Close sidebar on mobile when navigating
                    if (window.innerWidth < 768) {
                      onClose();
                    }
                  }}
                  className={`nav-link-item ${
                    isActive ? 'nav-link-active' : 'nav-link-inactive'
                  }`}
                >
                  <Icon
                    className={`h-5 w-5 shrink-0 ${
                      isActive ? 'text-white' : 'text-neutral-500'
                    }`}
                  />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer brand indicator in sidebar */}
        <div className="border-t border-neutral-100 p-4 text-center">
          <p className="text-xs text-neutral-400 font-medium">
            Kunddan Home Foods © {new Date().getFullYear()}
          </p>
        </div>
      </aside>
    </>
  );
}
