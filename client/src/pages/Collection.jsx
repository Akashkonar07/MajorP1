import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import ProductCard from '../components/ProductCard';
import FilterSidebar from '../components/FilterSidebar';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'discount', label: 'Best Discount' },
];

const Collection = () => {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState('newest');
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ occasion: [], fabric: [], region: [], color: [], minPrice: 0, maxPrice: 110000 });
  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    const fabric = searchParams.get('fabric');
    const search = searchParams.get('search');
    if (fabric) setFilters(prev => ({ ...prev, fabric: [fabric] }));
    if (search) setFilters(prev => ({ ...prev, search }));
  }, [searchParams]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('page', page);
    params.set('limit', 12);
    params.set('sort', sort);
    if (filters.occasion?.length) params.set('occasion', filters.occasion.join(','));
    if (filters.fabric?.length) params.set('fabric', filters.fabric.join(','));
    if (filters.color?.length) params.set('color', filters.color.join(','));
    if (filters.minPrice) params.set('minPrice', filters.minPrice);
    if (filters.maxPrice && filters.maxPrice < 110000) params.set('maxPrice', filters.maxPrice);

    axios.get(`http://localhost:5000/api/products?${params.toString()}`)
      .then(res => {
        setProducts(res.data.products || []);
        setTotal(res.data.total || 0);
        setTotalPages(res.data.totalPages || 1);
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [page, sort, filters]);

  const clearFilters = () => setFilters({ occasion: [], fabric: [], region: [], color: [], minPrice: 0, maxPrice: 110000 });

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs font-body text-gray-400 mb-6">
        <Link to="/" className="hover:text-maroon-900 transition-colors">Home</Link>
        <span className="material-symbols-outlined text-sm">chevron_right</span>
        <span className="text-charcoal font-medium">Collection</span>
      </nav>

      {/* Header row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-heading text-4xl font-semibold text-charcoal">Our Collection</h1>
          <p className="font-body text-sm text-gray-500 mt-1">
            {loading ? 'Loading...' : `${total} sarees found`}
          </p>
        </div>
        <div className="flex items-center gap-3">
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
        <div className="hidden md:block w-64 shrink-0">
          <FilterSidebar filters={filters} onFilterChange={(f) => { setFilters(f); setPage(1); }} onClear={clearFilters} />
        </div>

        {/* Mobile filter overlay */}
        {filterOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div className="absolute inset-0 bg-black/50" onClick={() => setFilterOpen(false)} />
            <div className="absolute left-0 top-0 h-full w-72 bg-white overflow-y-auto p-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-heading text-xl font-semibold">Filters</h3>
                <button onClick={() => setFilterOpen(false)}>
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <FilterSidebar filters={filters} onFilterChange={(f) => { setFilters(f); setPage(1); }} onClear={clearFilters} />
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
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <span className="material-symbols-outlined text-5xl text-gray-300 mb-4 block">search_off</span>
              <h3 className="font-heading text-2xl text-gray-400 mb-2">No sarees found</h3>
              <p className="font-body text-sm text-gray-400 mb-4">Try adjusting your filters</p>
              <button onClick={clearFilters} className="btn-primary">Clear Filters</button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
                {products.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-10">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(p => p - 1)}
                    className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center hover:border-maroon-900 hover:text-maroon-900 disabled:opacity-30 transition-colors"
                  >
                    <span className="material-symbols-outlined text-base">chevron_left</span>
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-9 h-9 rounded-full font-body text-sm font-medium transition-all ${
                        page === p
                          ? 'bg-maroon-900 text-white'
                          : 'border border-gray-200 text-charcoal hover:border-maroon-900 hover:text-maroon-900'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage(p => p + 1)}
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
