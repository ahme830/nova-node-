import { ReactNode, useState } from 'react';
import { useCart } from '../contexts/CartContext';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { Chatbot } from './Chatbot';
import { Toaster } from './ui/sonner';

interface LayoutProps {
  children: ReactNode;
  hideFooter?: boolean;
}


export function Layout({ children, hideFooter = false }: LayoutProps) {
  const { count } = useCart();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar cartItemsCount={count} />
      <main className="flex-1">
        {children}
      </main>
      {!hideFooter && <Footer />}
      <Chatbot />
      <Toaster position="top-right" richColors />
    </div>
  );
}
