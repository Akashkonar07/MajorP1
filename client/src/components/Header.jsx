import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import logoIcon from '../assets/brand/icon.svg';

const Header = () => {
  const { cartCount } = useCart();
  const { wishlist } = useWishlist();
  const { user, isAdmin } = useAuth();
  const accountLink = user ? '/account' : '/login';
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/collection?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  const navLinks = [
    { to: '/', label: 'Home', exact: true },
    { to: '/collection', label: 'Collection' },
    { to: '/services', label: 'Services' },
    { to: '/about', label: 'About' },
    { to: '/store-locator', label: 'Store Locator' },
  ];

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white shadow-soft' : 'bg-white border-b border-gray-100'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Lotus icon + bold maroon shop name (team's choice over the full horizontal logo) */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <img src={logoIcon} alt="" className="w-10 h-10" />
            <span className="font-heading font-bold text-lg sm:text-xl text-maroon-900 tracking-wide whitespace-nowrap">
              Vaibhav Laxmi Saree
            </span>
          </Link>

          {/* Nav - Desktop */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map(({ to, label, exact, highlight }) => (
              <NavLink
                key={to}
                to={to}
                end={exact}
                className={({ isActive }) =>
                  highlight
                    ? `px-4 py-1.5 rounded-sm font-body font-medium text-sm whitespace-nowrap transition-all duration-200 ${
                        isActive
                          ? 'bg-maroon-900 text-white'
                          : 'bg-maroon-900 text-white hover:bg-maroon-800'
                      }`
                    : `px-3 py-1.5 font-body font-medium text-sm whitespace-nowrap transition-colors duration-200 ${
                        isActive
                          ? 'text-maroon-900 border-b-2 border-maroon-900'
                          : 'text-charcoal hover:text-maroon-900'
                      }`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Right icons */}
          <div className="flex items-center gap-2">
            {/* Search */}
            {searchOpen ? (
              <form onSubmit={handleSearch} className="flex items-center">
                <input
                  autoFocus
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search sarees..."
                  className="border border-gray-200 rounded-sm px-3 py-1.5 text-sm font-body w-48 focus:outline-none focus:border-maroon-900 transition-all"
                />
                <button type="submit" className="ml-1 p-1 text-maroon-900">
                  <span className="material-symbols-outlined text-xl">search</span>
                </button>
                <button type="button" onClick={() => setSearchOpen(false)} className="ml-1 p-1 text-gray-500">
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              </form>
            ) : (
              <button
                onClick={() => setSearchOpen(true)}
                className="flex items-center gap-1 border border-gray-200 rounded-sm px-3 py-1.5 text-sm text-gray-500 hover:border-maroon-900 hover:text-maroon-900 transition-colors hidden lg:flex"
              >
                <span className="material-symbols-outlined text-base">search</span>
                <span className="font-body text-sm whitespace-nowrap hidden xl:inline">Search sarees...</span>
              </button>
            )}

            {/* Wishlist */}
            <Link to="/wishlist" className="relative p-2 hover:text-maroon-900 transition-colors">
              <span className="material-symbols-outlined text-xl text-charcoal hover:text-maroon-900">favorite</span>
              {wishlist.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-maroon-900 text-white text-[10px] font-body font-semibold w-4 h-4 rounded-full flex items-center justify-center">
                  {wishlist.length}
                </span>
              )}
            </Link>

            {/* Cart */}
            <Link to="/cart" className="relative p-2 hover:text-maroon-900 transition-colors">
              <span className="material-symbols-outlined text-xl text-charcoal hover:text-maroon-900">shopping_bag</span>
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-maroon-900 text-white text-[10px] font-body font-semibold w-4 h-4 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Admin shortcut — only shown to logged-in admins */}
            {isAdmin && (
              <Link
                to="/admin"
                className="flex items-center gap-1 px-2.5 py-1 rounded-sm bg-gold-700 text-white font-body text-xs font-semibold hover:bg-gold-800 transition-colors"
              >
                <span className="material-symbols-outlined text-sm">admin_panel_settings</span>
                <span className="hidden sm:inline">Admin</span>
              </Link>
            )}

            {/* Account: log in, or My Account when logged in */}
            <Link
              to={accountLink}
              aria-label={user ? 'My account' : 'Log in'}
              className="p-2 hover:text-maroon-900 transition-colors hidden lg:block"
            >
              <span
                className={`material-symbols-outlined text-xl ${user ? 'text-maroon-900' : 'text-charcoal'}`}
                style={{ fontVariationSettings: user ? "'FILL' 1" : "'FILL' 0" }}
              >
                person
              </span>
            </Link>

            {/* Mobile menu toggle */}
            <button
              className="lg:hidden p-2"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <span className="material-symbols-outlined text-xl text-charcoal">
                {menuOpen ? 'close' : 'menu'}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="lg:hidden border-t border-gray-100 py-3">
            {navLinks.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `block px-4 py-2.5 font-body font-medium text-sm transition-colors ${
                    isActive ? 'text-maroon-900 bg-maroon-50' : 'text-charcoal hover:text-maroon-900'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
            <Link
              to={accountLink}
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2 px-4 py-2.5 font-body font-medium text-sm text-charcoal hover:text-maroon-900"
            >
              <span className="material-symbols-outlined text-base">person</span>
              {user ? 'My Account' : 'Log in / Sign up'}
            </Link>
            {/* Mobile search */}
            <form onSubmit={handleSearch} className="flex items-center px-4 mt-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search sarees..."
                className="border border-gray-200 rounded-sm px-3 py-2 text-sm font-body flex-1 focus:outline-none focus:border-maroon-900"
              />
              <button type="submit" className="ml-2 p-2 bg-maroon-900 text-white rounded-sm">
                <span className="material-symbols-outlined text-base">search</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
