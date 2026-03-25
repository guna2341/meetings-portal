import Header from '@/src/components/header/header'
import Sidebar from '@/src/components/sidebar/sidebar'
import React from 'react'

export default function Layout ({children}: {children: React.ReactNode}){
  return (
    <div className='flex flex-col h-screen overflow-hidden w-full bg-slate-50'>
      <Header />
      <div className='flex flex-1 w-full overflow-hidden'>
        <div className='h-full z-40'>
          <Sidebar />
        </div>
        <div className='flex-1 h-full overflow-y-auto pb-15 custom-scroll'>
          {children}
        </div>
      </div>
    </div>
  )
}