import React from 'react';
import Header from '@/components/Header';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col flex-grow">
      <Header />
      <main className="flex-grow">{children}</main>
    </div>
  );
}