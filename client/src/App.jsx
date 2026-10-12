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
import Checkout from './pages/Checkout';
import OrderDetail from './pages/OrderDetail';
import About from './pages/About';
import Services from './pages/Services';
import Policies from './pages/Policies';
import NotFound from './pages/NotFound';
import AdminRoute from './components/admin/AdminRoute';
import AdminLayout from './components/admin/AdminLayout';
import AdminLogin from './pages/admin/AdminLogin';
import Dashboard from './pages/admin/Dashboard';
import Sarees from './pages/admin/Sarees';
import SareeForm from './pages/admin/SareeForm';
import StockRegister from './pages/admin/StockRegister';
import Orders from './pages/admin/Orders';
import OrderView from './pages/admin/OrderView';
import ShopItems from './pages/admin/ShopItems';
import ShopItemForm from './pages/admin/ShopItemForm';
import ShopHistory from './pages/admin/ShopHistory';
import Settings from './pages/admin/Settings';
import Categories from './pages/admin/Categories';
import Customers from './pages/admin/Customers';
import ActivityLog from './pages/admin/ActivityLog';

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
                <Route path="orders" element={<Orders />} />
                <Route path="orders/:id" element={<OrderView />} />
                <Route path="shop-items" element={<ShopItems />} />
                <Route path="shop-items/new" element={<ShopItemForm key="new" />} />
                <Route path="shop-items/:id" element={<ShopItemForm />} />
                <Route path="shop-history" element={<ShopHistory />} />
                <Route path="settings" element={<Settings />} />
                <Route path="categories" element={<Categories />} />
                <Route path="customers" element={<Customers />} />
                <Route path="activity" element={<ActivityLog />} />
                <Route path="*" element={<p className="font-body text-sm text-gray-500">Page not found.</p>} />
              </Route>

              {/* Shop */}
              <Route element={<ShopLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/collection" element={<Collection />} />
                <Route path="/category/:slug" element={<Collection />} />
                <Route path="/product/:slug" element={<ProductDetail />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/order/:orderNo" element={<OrderDetail />} />
                <Route path="/wishlist" element={<Wishlist />} />
                <Route path="/store-locator" element={<StoreLocator />} />
                <Route path="/login" element={<Login />} />
                <Route path="/account" element={<Account />} />
                <Route path="/about" element={<About />} />
                <Route path="/services" element={<Services />} />
                <Route path="/policies" element={<Policies />} />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
