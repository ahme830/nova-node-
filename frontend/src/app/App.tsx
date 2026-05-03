import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { FavorisProvider } from './contexts/FavorisContext';
import { ThemeProvider } from 'next-themes';
import { router } from './routes';

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <AuthProvider>
        <CartProvider>
          <FavorisProvider>
            <RouterProvider router={router} />
          </FavorisProvider>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
