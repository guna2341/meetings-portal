'use client';

import Header from '@/src/components/header/header'
import Sidebar from '@/src/components/sidebar/sidebar'
import { OrgProvider } from '@/src/context/OrgContext'
import React, { useState } from 'react'

export default function Layout ({children}: {children: React.ReactNode}){
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <OrgProvider>
      <div className='flex flex-col h-screen overflow-hidden w-full bg-slate-50'>
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className='flex flex-1 w-full overflow-hidden'>
          <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
          <div className='flex-1 h-full overflow-hidden custom-scroll'>
            {children}
          </div>
        </div>
      </div>
    </OrgProvider>
  )
}