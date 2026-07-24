'use client';

import { ReactNode } from 'react';
import { AuthProvider } from '@/components/AuthProvider';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import Navbar from '@/components/Navbar';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Navbar />
        {children}
      </AuthProvider>
    </ThemeProvider>
  );
}
