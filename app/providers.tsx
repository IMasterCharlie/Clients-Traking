'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { Toaster } from 'sonner';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';

function AuthInitializer({ children }: { children: React.ReactNode }) {
  const { setUser, clearUser } = useAuthStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');
        const result = await response.json();
        if (result.success) {
          setUser(result.data.user);
        } else {
          clearUser();
        }
      } catch (error) {
        clearUser();
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, [setUser, clearUser]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <NextThemesProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <AuthInitializer>
          {children}
          <Toaster position="top-right" richColors />
        </AuthInitializer>
      </NextThemesProvider>
    </QueryClientProvider>
  );
}
