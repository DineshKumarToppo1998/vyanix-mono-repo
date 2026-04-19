"use client";

import React from 'react';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { useAuth } from '@/contexts/auth-context';
import { SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarFooter, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';
import { LayoutDashboard, ShoppingBag, Layers, Settings, LogOut, Bell, User, Search, Menu, ShoppingCart } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { usePathname, redirect } from 'next/navigation';
import { useRouter } from 'next/navigation';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isAdmin, isLoading } = useAdminAuth();
  const { logout, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    redirect('/');
  }

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, href: '/admin/dashboard' },
    { name: 'Products', icon: ShoppingBag, href: '/admin/products' },
    { name: 'Categories', icon: Layers, href: '/admin/categories' },
    { name: 'Orders', icon: ShoppingCart, href: '/admin/orders' },
    { name: 'Settings', icon: Settings, href: '/admin/settings' },
  ];

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-hidden bg-background">
        <Sidebar collapsible="icon">
          <SidebarHeader className="h-16 flex items-center px-4 border-b">
            <div className="flex items-center gap-2 font-bold text-primary">
              <div className="bg-primary text-white p-1 rounded">V</div>
              <span className="group-data-[collapsible=icon]:hidden">Vyanix</span>
            </div>
          </SidebarHeader>
          <SidebarContent className="p-2">
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={pathname.startsWith(item.href)}
                    tooltip={item.name}
                  >
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.name}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="p-4 border-t">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  className="text-destructive hover:text-destructive"
                  onClick={handleLogout}
                  disabled={loading}
                >
                  <LogOut />
                  <span className="group-data-[collapsible=icon]:hidden">Logout</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="flex flex-col">
          <header className="h-16 flex items-center justify-between px-6 border-b bg-card shrink-0">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <div className="h-6 w-px bg-border hidden md:block" />
              <div className="relative hidden md:block">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="search"
                  placeholder="Quick search..."
                  className="pl-9 h-9 w-64 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-2 right-2 h-2 w-2 bg-destructive rounded-full" />
              </Button>
              <div className="flex items-center gap-3 pl-2 border-l">
                <div className="text-right hidden sm:block">
                   <p className="text-sm font-medium leading-none">Admin User</p>
                   <p className="text-xs text-muted-foreground mt-1">Super Admin</p>
                </div>
                <Avatar className="h-8 w-8">
                  <AvatarImage src="https://picsum.photos/seed/admin/40" />
                  <AvatarFallback>AD</AvatarFallback>
                </Avatar>
              </div>
            </div>
          </header>
          
          <main className="flex-1 overflow-auto p-6 md:p-8">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
