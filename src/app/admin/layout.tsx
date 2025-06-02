
"use client"; // Required for hooks like useAuth, useRouter

import type { Metadata } from 'next'; // Metadata can still be defined
import Link from 'next/link';
import {
  Home,
  Briefcase,
  Star,
  MessageSquare,
  User,
  LogOut, // Added for sign out
  Building2,
  Loader2,
} from 'lucide-react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
  SidebarFooter, // Added for sign out button
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Toaster } from "@/components/ui/toaster";
import '../print.css';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// export const metadata: Metadata = { // Static metadata definition still works in client components
//   title: 'Admin Portfolio Architecte',
//   description: 'Gérez le contenu de votre portfolio d\'architecte.',
// };

const navItems = [
  { href: '/admin', label: 'Aperçu', icon: Home },
  { href: '/admin/personal-info', label: 'Infos Personnelles', icon: User },
  { href: '/admin/projects', label: 'Projets', icon: Briefcase },
  { href: '/admin/skills', label: 'Compétences', icon: Star },
  { href: '/admin/testimonials', label: 'Témoignages', icon: MessageSquare },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, signOut } = useAuth(); // targetUID removed
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login?error=session_expired');
    } 
    // The check against a specific targetUID is removed.
    // If a user is logged in, they are allowed in /admin.
    // Data access control will be handled by server actions based on user.uid.
  }, [user, loading, router, signOut]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    // This case should ideally be handled by the useEffect redirect,
    // but as a fallback, we can show a loading/redirecting state.
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-2">Redirection vers la page de connexion...</p>
      </div>
    );
  }

  // User is authenticated
  return (
    <SidebarProvider defaultOpen>
      <Sidebar variant="sidebar" collapsible="icon" side="left">
        <SidebarHeader className="p-4">
          <Link href="/admin" className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="text-primary rounded-full bg-primary-foreground hover:bg-accent">
              <Building2 size={24} />
            </Button>
            <h1 className="text-xl font-semibold text-sidebar-foreground group-data-[collapsible=icon]:hidden">
              Admin Architecte
            </h1>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  tooltip={{ children: item.label, side: 'right', align: 'center' }}
                >
                  <Link href={item.href} className="flex items-center">
                    <item.icon className="mr-2 h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-2 mt-auto">
            <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton
                        onClick={async () => {
                          await signOut();
                          // router.push('/login') will be handled by the effect in AuthProvider or here
                        }}
                        className="w-full"
                        tooltip={{ children: "Se déconnecter", side: 'right', align: 'center' }}
                    >
                        <LogOut className="mr-2 h-5 w-5" />
                        <span>Se déconnecter</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset data-slot="sidebar-inset" className="flex flex-col">
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 py-4">
          <SidebarTrigger className="md:hidden" />
          {/* Optional: Add breadcrumbs or page title here */}
        </header>
        <main className="flex-1 p-4 sm:px-6 sm:py-0 md:gap-8">
          {children}
        </main>
        <Toaster />
      </SidebarInset>
    </SidebarProvider>
  );
}
