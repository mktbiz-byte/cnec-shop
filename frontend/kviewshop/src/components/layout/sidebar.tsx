'use client';

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
  BarChart3,
  Settings,
  AlertTriangle,
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

  return (
    <aside className="fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] w-64 border-r border-border bg-sidebar">
      <nav className="flex flex-col gap-2 p-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-primary'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )}
            >
              <item.icon
                className={cn('h-5 w-5', isActive ? 'text-primary' : '')}
              />
              {item.title}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
