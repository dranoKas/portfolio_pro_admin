
"use client"; // Required for hooks

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

export default function HomePage() {
  const { user, loading } = useAuth(); // targetUID removed
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) { // If user is logged in, redirect to admin
        router.replace('/admin');
      } else { // Otherwise, redirect to login
        router.replace('/login');
      }
    }
  }, [user, loading, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="ml-2">Chargement...</p>
    </div>
  );
}
