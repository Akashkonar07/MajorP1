import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchCatalogue, formatPrice } from '../lib/catalogue';
import { checkPhoto } from '../lib/admin';
import { searchByPhoto } from '../lib/vision';

// "Search by photo": the customer picks or takes a photo of a saree she likes and we
// show the most similar sarees in the shop. The photo is processed inside her own
// browser and never uploaded; only its fingerprint (512 numbers) is sent.

const PhotoSearch = () => {
  const [catalogue, setCatalogue] = useState([]);
  const [preview, setPreview] = useState(null);
  const [state, setState] = useState({ status: 'idle' });   // idle | loading | done | error

  const resultsRef = useRef(null);

  useEffect(() => { fetchCatalogue().then(setCatalogue).catch(() => {}); }, []);
  // On phones the results sit below the photo: bring them into view when ready
  useEffect(() => {
    if (state.status === 'done' || state.status === 'error') resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [state.status]);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const pick = async e => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const problem = checkPhoto(file);
    if (problem) { setState({ status: 'error', error: problem }); return; }
    setPreview(URL.createObjectURL(file));
    setState({ status: 'loading', progress: 0 });
    try {
      const matches = await searchByPhoto(file, p => setState({ status: 'loading', progress: p }));
      setState({ status: 'done', matches });
    } catch (err) {
      setState({ status: 'error', error: err.message?.includes('fetch') ? 'Could not download the search model. Check your internet and try again.' : err.message });
    }
  };

  const results = state.status === 'done'
    ? state.matches.map(m => {
      const product = catalogue.find(p => p.id === m.product_id);
      if (!product) return null;
      const variant = product.variants.find(v => v.id === m.variant_id);
      return { product, variant, score: m.score, image: variant?.images[0] ?? product.mainImage };
    }).filter(Boolean)
    : [];

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <p className="section-label mb-2">Search by photo</p>
      <h1 className="font-heading text-4xl sm:text-5xl font-semibold text-charcoal mb-3">Find a saree like yours</h1>
      <p className="font-body text-sm text-gray-600 max-w-2xl mb-6">
        Saw a saree you love — on Instagram, at a wedding, in a screenshot? Upload the photo and we will show the most similar sarees
        in our shop. Your photo stays on your phone: it is never uploaded or saved.
      </p>

      <div className="grid md:grid-cols-[260px,1fr] gap-8 items-start">
        <div className="space-y-3 max-w-[220px] w-full mx-auto md:max-w-none">
          <label className="block aspect-[3/4] rounded-lg border-2 border-dashed border-gray-300 hover:border-maroon-900 bg-white overflow-hidden cursor-pointer relative">
            {preview ? <img src={preview} alt="Your photo" className="w-full h-full object-cover" /> : (
              <span className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 font-body text-sm gap-2">
                <span className="material-symbols-outlined text-4xl text-maroon-900">add_a_photo</span>
                Choose or take a photo
              </span>
            )}
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={pick} className="hidden" />
          </label>
          {preview && (
            <label className="btn-secondary w-full flex items-center justify-center gap-2 cursor-pointer">
              <span className="material-symbols-outlined text-base">photo_camera</span>Try another photo
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={pick} className="hidden" />
            </label>
          )}
          <p className="font-body text-[11px] text-gray-500">
            The first search downloads our search model once (about 85 MB, best on Wi-Fi). After that it is instant.
          </p>
        </div>

        <div ref={resultsRef} className="scroll-mt-20">
          {state.status === 'idle' && (
            <p className="font-body text-sm text-gray-500 py-10 text-center md:text-left">Your matches will appear here.</p>
          )}
          {state.status === 'loading' && (
            <div className="py-10 text-center md:text-left font-body text-sm text-gray-600">
              <span className="inline-block w-5 h-5 border-2 border-maroon-900/20 border-t-maroon-900 rounded-full animate-spin align-middle mr-2" />
              {state.progress > 0 && state.progress < 100 ? `Getting the search model ready… ${state.progress}%` : 'Looking for similar sarees…'}
            </div>
          )}
          {state.status === 'error' && <p className="font-body text-sm text-red-600 py-6">{state.error}</p>}
          {state.status === 'done' && (
            results.length === 0 ? (
              <p className="font-body text-sm text-gray-500 py-10">No matches yet — please try another photo, or <Link to="/collection" className="text-maroon-900 underline">browse all sarees</Link>.</p>
            ) : (
              <>
                <p className="font-body text-sm text-gray-600 mb-4">Most similar first</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {results.map(({ product, variant, score, image }) => (
                    <Link key={product.id} to={`/product/${product.slug}${variant ? `?colour=${encodeURIComponent(variant.color_name)}` : ''}`}
                      className="group bg-white rounded overflow-hidden shadow-soft card-hover">
                      <div className="relative aspect-[3/4] bg-maroon-50 overflow-hidden">
                        {image && <img src={image} alt={product.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />}
                        <span className="absolute top-2 left-2 bg-white/90 rounded-sm px-1.5 py-0.5 font-body text-[10px] font-semibold text-maroon-900">
                          {Math.round(Math.max(0, score) * 100)}% match
                        </span>
                      </div>
                      <div className="p-3">
                        <p className="font-heading font-semibold text-charcoal text-sm leading-snug line-clamp-2">{product.name}</p>
                        <p className="font-body text-xs text-gray-500">{variant?.color_name ?? `${product.variants.length} colours`}</p>
                        <p className="font-body text-sm font-semibold text-maroon-900 mt-1">{formatPrice(product.price)}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </>
            )
          )}
        </div>
      </div>
    </main>
  );
};

export default PhotoSearch;
