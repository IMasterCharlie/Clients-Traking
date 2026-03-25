'use client';

import { Sidebar } from '@/components/shared/Sidebar';
import { Header } from '@/components/shared/Header';
import { useUIStore } from '@/store/uiStore';
import { Sheet, SheetContent } from '@/components/ui/sheet';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { sidebarOpen, setSidebarOpen } = useUIStore();

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar — fixed 240px, visible lg+, hidden when printing */}
      <div className="hidden lg:flex lg:w-60 lg:flex-col lg:fixed lg:inset-y-0 lg:z-40 lg:border-r lg:bg-card print:hidden">
        <Sidebar />
      </div>

      {/* Mobile sidebar — Sheet drawer, hidden when printing */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-64 bg-card border-r [&>button]:hidden print:hidden">
          <Sidebar />
        </SheetContent>
      </Sheet>

      {/* Main content — offset on desktop */}
      <div className="flex flex-1 flex-col min-w-0 lg:pl-60 print:pl-0">
        <div className="print:hidden">
          <Header />
        </div>
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6 lg:p-8 mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
