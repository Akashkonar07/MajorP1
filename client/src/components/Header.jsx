import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';

const Header = () => {
  const { cartCount } = useCart();
  const { wishlist } = useWishlist();
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
    { to: '/wishlist', label: 'Wishlist' },
    { to: '/cart', label: 'Cart', highlight: true },
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
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="w-10 h-10 bg-maroon-900 rounded-sm flex items-center justify-center">
              <span className="text-white font-heading font-bold text-lg leading-none">VS</span>
            </div>
            <span className="font-heading font-bold text-xl text-maroon-900 tracking-wide hidden sm:block">
              VIRAASAT
            </span>
          </Link>

          {/* Nav - Desktop */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(({ to, label, exact, highlight }) => (
              <NavLink
                key={to}
                to={to}
                end={exact}
                className={({ isActive }) =>
                  highlight
                    ? `px-4 py-1.5 rounded-sm font-body font-medium text-sm transition-all duration-200 ${
                        isActive
                          ? 'bg-maroon-900 text-white'
                          : 'bg-maroon-900 text-white hover:bg-maroon-800'
                      }`
                    : `px-3 py-1.5 font-body font-medium text-sm transition-colors duration-200 ${
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
                className="flex items-center gap-1 border border-gray-200 rounded-sm px-3 py-1.5 text-sm text-gray-500 hover:border-maroon-900 hover:text-maroon-900 transition-colors hidden md:flex"
              >
                <span className="material-symbols-outlined text-base">search</span>
                <span className="font-body text-sm">Search sarees...</span>
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

            {/* User */}
            <button className="p-2 hover:text-maroon-900 transition-colors hidden md:block">
              <span className="material-symbols-outlined text-xl text-charcoal">person</span>
            </button>

            {/* Mobile menu toggle */}
            <button
              className="md:hidden p-2"
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
          <div className="md:hidden border-t border-gray-100 py-3">
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
