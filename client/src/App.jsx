import React from 'react';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Collection from './pages/Collection';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Wishlist from './pages/Wishlist';
import StoreLocator from './pages/StoreLocator';
import Login from './pages/Login';
import Account from './pages/Account';
import AdminRoute from './components/admin/AdminRoute';
import AdminLayout from './components/admin/AdminLayout';
import AdminLogin from './pages/admin/AdminLogin';
import Dashboard from './pages/admin/Dashboard';
import Sarees from './pages/admin/Sarees';
import SareeForm from './pages/admin/SareeForm';
import StockRegister from './pages/admin/StockRegister';

// Customer pages share the shop header and footer
const ShopLayout = () => (
  <div className="min-h-screen flex flex-col bg-cream">
    <Header />
    <div className="flex-1">
      <Outlet />
    </div>
    <Footer />
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <Routes>
              {/* Admin area: its own layout, guarded */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
                <Route index element={<Dashboard />} />
                <Route path="sarees" element={<Sarees />} />
                <Route path="sarees/new" element={<SareeForm key="new" />} />
                <Route path="sarees/:id" element={<SareeForm />} />
                <Route path="stock-register" element={<StockRegister />} />
              </Route>

              {/* Shop */}
              <Route element={<ShopLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/collection" element={<Collection />} />
                <Route path="/category/:slug" element={<Collection />} />
                <Route path="/product/:slug" element={<ProductDetail />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/wishlist" element={<Wishlist />} />
                <Route path="/store-locator" element={<StoreLocator />} />
                <Route path="/login" element={<Login />} />
                <Route path="/account" element={<Account />} />
              </Route>
            </Routes>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
