import React from 'react';
import TopNav from './TopNav';
import Sidebar from './Sidebar';

type Props = { children: React.ReactElement };

export default function AppLayout({ children }: Props) {
  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-5">{children}</main>
      </div>
    </div>
  );
}


