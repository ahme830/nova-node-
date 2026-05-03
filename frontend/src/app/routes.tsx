import React from 'react';
import { createBrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Catalog } from './pages/Catalog';
import { ProductDetail } from './pages/ProductDetail';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Profile } from './pages/Profile';
import { CustomerDashboard } from './pages/CustomerDashboard';
import { VendorDashboard } from './pages/VendorDashboard';
import { VendorStore } from './pages/VendorStore';
import { VendorProducts } from './pages/VendorProducts';
import { VendorOrders } from './pages/VendorOrders';
import { VendorPredictions } from './pages/VendorPredictions';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminUsers } from './pages/AdminUsers';
import { AdminStores } from './pages/AdminStores';
import { AdminProducts } from './pages/AdminProducts';
import { AdminOrders } from './pages/AdminOrders';
import { AdminCategories } from './pages/AdminCategories';
import { Cart } from './pages/Cart';
import { NotFound } from './pages/NotFound';
import { CustomerOrders } from './pages/CustomerOrders';
import { CustomerFavorites } from './pages/CustomerFavorites';
import { ProtectedRoute } from './components/ProtectedRoute';
import { FAQ } from './pages/FAQ';
import { Contact } from './pages/Contact';
import { Terms } from './pages/Terms';
import { Privacy } from './pages/Privacy';
import { Legal } from './pages/Legal';
import { AddressManager } from './pages/AddressManager';
import { ProfileSettings } from './pages/ProfileSettings';
import { OrderDetails } from './pages/OrderDetails';
import { CheckoutAddress } from './pages/CheckoutAddress';
import { CheckoutShipping } from './pages/CheckoutShipping';
import { CheckoutPayment } from './pages/CheckoutPayment';
import { OrderSuccess } from './pages/OrderSuccess';
import { OrderFailure } from './pages/OrderFailure';
import { StoreDetail } from './pages/StoreDetail';
import { AdminReviews } from './pages/AdminReviews';
import { AdminReports } from './pages/AdminReports';
import { AdminPredictions } from './pages/AdminPredictions';
import { AdminContact } from './pages/AdminContact';

const Root = ({ children }: { children: React.ReactNode }) => (
  <Layout>{children}</Layout>
);

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Root><Home /></Root>,
  },
  {
    path: '/catalog',
    element: <Root><Catalog /></Root>,
  },
  {
    path: '/product/:id',
    element: <Root><ProductDetail /></Root>,
  },
  {
    path: '/store/:id',
    element: <Root><StoreDetail /></Root>,
  },
  {
    path: '/login',
    element: <Root><Login /></Root>,
  },
  {
    path: '/register',
    element: <Root><Register /></Root>,
  },
  {
    path: '/faq',
    element: <Root><FAQ /></Root>,
  },
  {
    path: '/contact',
    element: <Root><Contact /></Root>,
  },
  {
    path: '/terms',
    element: <Root><Terms /></Root>,
  },
  {
    path: '/privacy',
    element: <Root><Privacy /></Root>,
  },
  {
    path: '/legal',
    element: <Root><Legal /></Root>,
  },
  {
    path: '/customer/cart',
    element: <Root><Cart /></Root>,
  },
  
  // Checkout Flow
  {
    path: '/checkout/address',
    element: <Root><ProtectedRoute allowedRoles={['customer', 'vendor', 'admin']}><CheckoutAddress /></ProtectedRoute></Root>,
  },
  {
    path: '/checkout/shipping',
    element: <Root><ProtectedRoute allowedRoles={['customer', 'vendor', 'admin']}><CheckoutShipping /></ProtectedRoute></Root>,
  },
  {
    path: '/checkout/payment',
    element: <Root><ProtectedRoute allowedRoles={['customer', 'vendor', 'admin']}><CheckoutPayment /></ProtectedRoute></Root>,
  },
  {
    path: '/checkout/success',
    element: <Root><ProtectedRoute allowedRoles={['customer', 'vendor', 'admin']}><OrderSuccess /></ProtectedRoute></Root>,
  },
  {
    path: '/checkout/failure',
    element: <Root><ProtectedRoute allowedRoles={['customer', 'vendor', 'admin']}><OrderFailure /></ProtectedRoute></Root>,
  },

  // Protected Routes - Client
  {
    path: '/profile',
    element: <Root><ProtectedRoute allowedRoles={['customer', 'vendor', 'admin']}><Profile /></ProtectedRoute></Root>,
  },
  {
    path: '/settings',
    element: <Root><ProtectedRoute allowedRoles={['customer', 'vendor', 'admin']}><ProfileSettings /></ProtectedRoute></Root>,
  },
  {
    path: '/customer/dashboard',
    element: <Root><ProtectedRoute allowedRoles={['customer']}><CustomerDashboard /></ProtectedRoute></Root>,
  },
  {
    path: '/customer/orders',
    element: <Root><ProtectedRoute allowedRoles={['customer']}><CustomerOrders /></ProtectedRoute></Root>,
  },
  {
    path: '/customer/orders/:id',
    element: <Root><ProtectedRoute allowedRoles={['customer', 'vendor', 'admin']}><OrderDetails /></ProtectedRoute></Root>,
  },
  {
    path: '/customer/favorites',
    element: <Root><ProtectedRoute allowedRoles={['customer']}><CustomerFavorites /></ProtectedRoute></Root>,
  },
  {
    path: '/customer/addresses',
    element: <Root><ProtectedRoute allowedRoles={['customer']}><AddressManager /></ProtectedRoute></Root>,
  },

  // Protected Routes - Vendor
  {
    path: '/vendor/dashboard',
    element: <Root><ProtectedRoute allowedRoles={['vendor']}><VendorDashboard /></ProtectedRoute></Root>,
  },
  {
    path: '/vendor/store',
    element: <Root><ProtectedRoute allowedRoles={['vendor']}><VendorStore /></ProtectedRoute></Root>,
  },
  {
    path: '/vendor/products',
    element: <Root><ProtectedRoute allowedRoles={['vendor']}><VendorProducts /></ProtectedRoute></Root>,
  },
  {
    path: '/vendor/orders',
    element: <Root><ProtectedRoute allowedRoles={['vendor']}><VendorOrders /></ProtectedRoute></Root>,
  },
  {
    path: '/vendor/predictions',
    element: <Root><ProtectedRoute allowedRoles={['vendor']}><VendorPredictions /></ProtectedRoute></Root>,
  },

  // Protected Routes - Admin
  {
    path: '/admin/dashboard',
    element: <Root><ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute></Root>,
  },
  {
    path: '/admin/users',
    element: <Root><ProtectedRoute allowedRoles={['admin']}><AdminUsers /></ProtectedRoute></Root>,
  },
  {
    path: '/admin/stores',
    element: <Root><ProtectedRoute allowedRoles={['admin']}><AdminStores /></ProtectedRoute></Root>,
  },
  {
    path: '/admin/products',
    element: <Root><ProtectedRoute allowedRoles={['admin']}><AdminProducts /></ProtectedRoute></Root>,
  },
  {
    path: '/admin/orders',
    element: <Root><ProtectedRoute allowedRoles={['admin']}><AdminOrders /></ProtectedRoute></Root>,
  },
  {
    path: '/admin/reviews',
    element: <Root><ProtectedRoute allowedRoles={['admin']}><AdminReviews /></ProtectedRoute></Root>,
  },
  {
    path: '/admin/reports',
    element: <Root><ProtectedRoute allowedRoles={['admin']}><AdminReports /></ProtectedRoute></Root>,
  },
  {
    path: '/admin/categories',
    element: <Root><ProtectedRoute allowedRoles={['admin']}><AdminCategories /></ProtectedRoute></Root>,
  },
  {
    path: '/admin/predictions',
    element: <Root><ProtectedRoute allowedRoles={['admin']}><AdminPredictions /></ProtectedRoute></Root>,
  },
  {
    path: '/admin/messages',
    element: <Root><ProtectedRoute allowedRoles={['admin']}><AdminContact /></ProtectedRoute></Root>,
  },
  {
    path: '*',
    element: <NotFound />,
  },
]);
