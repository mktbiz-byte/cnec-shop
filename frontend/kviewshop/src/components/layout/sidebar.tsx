'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  DollarSign,
  Building2,
  Users,
  Store,
  Settings,
  AlertTriangle,
  Menu,
  X,
} from 'lucide-react';
import type { UserRole } from '@/types/database';
import type { Locale } from '@/lib/i18n/config';

interface SidebarProps {
  role: UserRole;
  locale: Locale;
}

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

export function Sidebar({ role, locale }: SidebarProps) {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const getNavItems = (): NavItem[] => {
    const baseUrl = `/${locale}`;

    switch (role) {
      case 'super_admin':
        return [
          { title: t('dashboard'), href: `${baseUrl}/admin/dashboard`, icon: LayoutDashboard },
          { title: t('brands'), href: `${baseUrl}/admin/brands`, icon: Building2 },
          { title: t('creators'), href: `${baseUrl}/admin/creators`, icon: Users },
          { title: t('settlements'), href: `${baseUrl}/admin/settlements`, icon: DollarSign },
          { title: t('settings'), href: `${baseUrl}/admin/settings`, icon: Settings },
        ];
      case 'brand_admin':
        return [
          { title: t('dashboard'), href: `${baseUrl}/brand/dashboard`, icon: LayoutDashboard },
          { title: t('products'), href: `${baseUrl}/brand/products`, icon: Package },
          { title: t('orders'), href: `${baseUrl}/brand/orders`, icon: ShoppingCart },
          { title: t('mocra'), href: `${baseUrl}/brand/mocra`, icon: AlertTriangle },
          { title: t('settlements'), href: `${baseUrl}/brand/settlements`, icon: DollarSign },
          { title: t('settings'), href: `${baseUrl}/brand/settings`, icon: Settings },
        ];
      case 'creator':
        return [
          { title: t('dashboard'), href: `${baseUrl}/creator/dashboard`, icon: LayoutDashboard },
          { title: t('myShop'), href: `${baseUrl}/creator/shop`, icon: Store },
          { title: t('products'), href: `${baseUrl}/creator/products`, icon: Package },
          { title: t('orders'), href: `${baseUrl}/creator/orders`, icon: ShoppingCart },
          { title: t('settlements'), href: `${baseUrl}/creator/settlements`, icon: DollarSign },
          { title: t('settings'), href: `${baseUrl}/creator/settings`, icon: Settings },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  const navContent = (
    <nav className="flex flex-col gap-1 px-3 py-4">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-[13px] font-medium transition-colors',
              isActive
                ? 'bg-primary/10 text-primary'
                : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
            )}
          >
            <item.icon
              className={cn('h-4 w-4 shrink-0', isActive ? 'text-primary' : '')}
            />
            {item.title}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed bottom-4 right-4 z-50 lg:hidden bg-foreground text-background p-3 rounded-full shadow-lg transition-transform active:scale-95"
        aria-label="Toggle menu"
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-14 z-40 h-[calc(100vh-3.5rem)] w-60 border-r border-border bg-sidebar transition-transform duration-200 ease-out lg:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {navContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className="fixed left-0 top-14 z-40 h-[calc(100vh-3.5rem)] w-60 border-r border-border bg-sidebar hidden lg:block">
        {navContent}
      </aside>
    </>
  );
}
