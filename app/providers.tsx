'use client';

import { OrgProvider } from '@/src/context/OrgContext';
import React from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <OrgProvider>
      {children}
    </OrgProvider>
  );
}
