import React, { useState, useEffect, useMemo } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import FilterSidebar from '../components/FilterSidebar';
import { fetchCatalogue, fetchCategories, productColourFamilies, productFabricFamilies, isSoldOut } from '../lib/catalogue';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'name', label: 'Name: A to Z' },
];
const PER_PAGE = 24;
const EMPTY_FILTERS = { category: [], occasion: [], fabric: [], colour: [], maxPrice: null };

const Collection = () => {
  const { slug } = useParams();                 // set on /category/:slug
  const [searchParams, setSearchParams] = useSearchParams();
  const search = (searchParams.get('search') || '').trim();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    Promise.all([fetchCatalogue(), fetchCategories()])
      .then(([items, cats]) => { setProducts(items); setCategories(cats); })
      .catch(() => setLoadError('Could not load the sarees. Please check your internet and refresh.'))
      .finally(() => setLoading(false));
  }, []);

  const currentCategory = categories.find(c => c.slug === slug);
  const priceBounds = useMemo(() => {
    if (!products.length) return [0, 0];
    const prices = products.map(p => p.price);
    return [Math.min(...prices), Math.max(...prices)];
  }, [products]);

  const visible = useMemo(() => {
    const categoryFilter = slug ? [slug] : filters.category;
    const q = search.toLowerCase();
    const list = products.filter(p => {
      if (categoryFilter.length && !categoryFilter.includes(p.category?.slug)) return false;
      if (filters.occasion.length && !filters.occasion.some(o => p.occasions?.includes(o))) return false;
      if (filters.fabric.length && !productFabricFamilies(p).some(f => filters.fabric.includes(f))) return false;
      if (filters.colour.length && !productColourFamilies(p).some(c => filters.colour.includes(c))) return false;
      if (filters.maxPrice !== null && p.price > filters.maxPrice) return false;
      if (q) {
        const text = [p.name, p.fabric, p.code, p.category?.name, ...p.variants.map(v => v.color_name)]
          .join(' ').toLowerCase();
        if (!text.includes(q)) return false;
      }
      return true;
    });
    if (sort === 'price-asc') list.sort((a, b) => a.price - b.price);
    else if (sort === 'price-desc') list.sort((a, b) => b.price - a.price);
    else if (sort === 'name') list.sort((a, b) => a.name.localeCompare(b.name));
    // Sold-out sarees stay visible but move to the end (sort is stable, so the chosen order is kept)
    list.sort((a, b) => isSoldOut(a) - isSoldOut(b));
    return list;                                 // 'newest' = order from the database (newest code first)
  }, [products, filters, sort, search, slug]);

  const totalPages = Math.max(1, Math.ceil(visible.length / PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = visible.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  const changeFilters = (f) => { setFilters(f); setPage(1); };
  const clearFilters = () => {
    changeFilters(EMPTY_FILTERS);
    if (search) setSearchParams({});
  };

  const title = currentCategory?.name ?? (search ? `Search: “${search}”` : 'All Sarees');
  const sidebar = (
    <FilterSidebar
      filters={filters}
      onFilterChange={changeFilters}
      onClear={clearFilters}
      categories={categories}
      priceBounds={priceBounds}
      hideCategory={!!slug}
    />
  );

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs font-body text-gray-400 mb-6">
        <Link to="/" className="hover:text-maroon-900 transition-colors">Home</Link>
        <span className="material-symbols-outlined text-sm">chevron_right</span>
        {slug ? (
          <>
            <Link to="/collection" className="hover:text-maroon-900 transition-colors">Collection</Link>
            <span className="material-symbols-outlined text-sm">chevron_right</span>
            <span className="text-charcoal font-medium">{currentCategory?.name ?? '…'}</span>
          </>
        ) : (
          <span className="text-charcoal font-medium">Collection</span>
        )}
      </nav>

      {/* Header row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-heading text-4xl font-semibold text-charcoal">{title}</h1>
          <p className="font-body text-sm text-gray-500 mt-1">
            {loading ? 'Loading...' : `${visible.length} saree${visible.length === 1 ? '' : 's'} found`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/search/photo"
            className="flex items-center gap-1.5 border border-maroon-900 text-maroon-900 rounded-sm px-3 py-2 text-sm font-body hover:bg-maroon-50 transition-colors"
          >
            <span className="material-symbols-outlined text-base">photo_camera</span>
            Search by photo
          </Link>
          {/* Mobile filter toggle */}
          <button
            onClick={() => setFilterOpen(!filterOpen)}
            className="md:hidden flex items-center gap-1.5 border border-gray-200 rounded-sm px-3 py-2 text-sm font-body hover:border-maroon-900 hover:text-maroon-900 transition-colors"
          >
            <span className="material-symbols-outlined text-base">tune</span>
            Filters
          </button>
          {/* Sort */}
          <div className="flex items-center gap-2">
            <span className="font-body text-sm text-gray-500 hidden sm:block">Sort:</span>
            <select
              value={sort}
              onChange={(e) => { setSort(e.target.value); setPage(1); }}
              className="border border-gray-200 rounded-sm px-3 py-2 text-sm font-body focus:outline-none focus:border-maroon-900 bg-white"
            >
              {SORT_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="flex gap-7">
        {/* Sidebar - desktop */}
        <div className="hidden md:block w-64 shrink-0">{sidebar}</div>

        {/* Mobile filter overlay */}
        {filterOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div className="absolute inset-0 bg-black/50" onClick={() => setFilterOpen(false)} />
            <div className="absolute left-0 top-0 h-full w-72 bg-white overflow-y-auto p-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-heading text-xl font-semibold">Filters</h3>
                <button onClick={() => setFilterOpen(false)} aria-label="Close filters">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              {sidebar}
              <button onClick={() => setFilterOpen(false)} className="btn-primary w-full mt-4">
                Show {visible.length} sarees
              </button>
            </div>
          </div>
        )}

        {/* Product grid */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="bg-gray-100 rounded-lg aspect-[3/4] animate-pulse" />
              ))}
            </div>
          ) : loadError ? (
            <div className="text-center py-20">
              <span className="material-symbols-outlined text-5xl text-gray-300 mb-4 block">wifi_off</span>
              <p className="font-body text-sm text-gray-500 mb-4">{loadError}</p>
              <button onClick={() => window.location.reload()} className="btn-primary">Try Again</button>
            </div>
          ) : visible.length === 0 ? (
            <div className="text-center py-20">
              <span className="material-symbols-outlined text-5xl text-gray-300 mb-4 block">search_off</span>
              <h3 className="font-heading text-2xl text-gray-400 mb-2">No sarees found</h3>
              <p className="font-body text-sm text-gray-400 mb-4">Try adjusting your filters</p>
              <button onClick={clearFilters} className="btn-primary">Clear Filters</button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
                {pageItems.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-10">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => { setPage(currentPage - 1); window.scrollTo(0, 0); }}
                    aria-label="Previous page"
                    className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center hover:border-maroon-900 hover:text-maroon-900 disabled:opacity-30 transition-colors"
                  >
                    <span className="material-symbols-outlined text-base">chevron_left</span>
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                    <button
                      key={p}
                      onClick={() => { setPage(p); window.scrollTo(0, 0); }}
                      className={`w-9 h-9 rounded-full font-body text-sm font-medium transition-all ${
                        currentPage === p
                          ? 'bg-maroon-900 text-white'
                          : 'border border-gray-200 text-charcoal hover:border-maroon-900 hover:text-maroon-900'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => { setPage(currentPage + 1); window.scrollTo(0, 0); }}
                    aria-label="Next page"
                    className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center hover:border-maroon-900 hover:text-maroon-900 disabled:opacity-30 transition-colors"
                  >
                    <span className="material-symbols-outlined text-base">chevron_right</span>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
};

export default Collection;
