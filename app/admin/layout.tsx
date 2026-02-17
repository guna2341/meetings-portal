import Header from '@/src/components/admin/sidebar/header'
import Sidebar from '@/src/components/admin/sidebar/sidebar'
import React from 'react'

export default function Layout ({children}: {children: React.ReactNode}){
  return (
    <div className='flex flex-col h-screen overflow-hidden w-full'>
        <Header />
      <div className='flex w-full h-screen'>
    <div>
      <Sidebar />
      </div>
      <div className='w-full h-screen overflow-y-auto pb-15 custom-scroll'>
        {children}
        </div>
      </div>
    </div>
  )
}

