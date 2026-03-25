'use client';

import { usePathname } from 'next/navigation';
import { Menu, Moon, Sun, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUIStore } from '@/store/uiStore';
import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { NotificationBell } from '@/components/shared/NotificationBell';

export function Header() {
  const pathname = usePathname();
  const { setSidebarOpen } = useUIStore();
  const { user } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const getPageTitle = () => {
    const path = pathname.split('/')[1];
    if (!path) return 'Dashboard';
    return path.charAt(0).toUpperCase() + path.slice(1);
  };

  const userInitials = user?.name?.split(' ').map(n => n[0]).join('') || '??';

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b bg-background/95 px-4 backdrop-blur sm:px-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold md:text-xl">{getPageTitle()}</h1>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative mr-2">
          <NotificationBell />
        </div>

        {mounted && (
          <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => {
                if (theme === 'light') setTheme('dark');
                else if (theme === 'dark') setTheme('system');
                else setTheme('light');
              }}
              title={`Theme: ${theme}`}
            >
              {theme === 'dark' ? (
                <Moon className="h-4 w-4" />
              ) : theme === 'light' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Monitor className="h-4 w-4" />
              )}
            </Button>
        )}

        <div className="ml-2 h-8 w-8 rounded-full bg-accent flex items-center justify-center cursor-pointer">
          <span className="text-xs font-medium">{userInitials}</span>
        </div>
      </div>
    </header>
  );
}
