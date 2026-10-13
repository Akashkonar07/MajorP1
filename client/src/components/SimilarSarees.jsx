import React, { useEffect, useState } from 'react';
import ProductCard from './ProductCard';
import { fetchCatalogue } from '../lib/catalogue';
import { fetchSimilar } from '../lib/vision';

// "Similar sarees": sarees whose photos look most alike (visual fingerprints, migration 012).
// Shows nothing if there are no matches yet, so the page never breaks.
const SimilarSarees = ({ productId }) => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    let live = true;
    Promise.all([fetchSimilar(productId, 8), fetchCatalogue()])
      .then(([similar, catalogue]) => {
        if (!live) return;
        setItems(similar.map(s => catalogue.find(p => p.id === s.product_id)).filter(Boolean));
      })
      .catch(() => { if (live) setItems([]); });
    return () => { live = false; };
  }, [productId]);

  if (!items.length) return null;
  return (
    <section className="mt-14">
      <div className="flex items-end justify-between gap-3 mb-4">
        <div>
          <p className="section-label mb-1">You may also like</p>
          <h2 className="font-heading text-3xl font-semibold text-charcoal">Similar sarees</h2>
        </div>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 snap-x">
        {items.map(p => (
          <div key={p.id} className="w-40 sm:w-52 shrink-0 snap-start">
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </section>
  );
};

export default SimilarSarees;
