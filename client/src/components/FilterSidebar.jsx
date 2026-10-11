import React, { useState } from 'react';
import { COLOUR_FAMILIES, FABRIC_FAMILIES, OCCASIONS, formatPrice } from '../lib/catalogue';

const AccordionSection = ({ title, children, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-3.5 text-left"
      >
        <span className="font-body font-semibold text-sm text-charcoal">{title}</span>
        <span className="material-symbols-outlined text-base text-gray-400 transition-transform duration-200" style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          expand_more
        </span>
      </button>
      {open && (
        <div className="pb-4 space-y-2">
          {children}
        </div>
      )}
    </div>
  );
};

const CheckOption = ({ label, checked, onChange }) => (
  <label className="flex items-center gap-2.5 cursor-pointer group">
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className="w-3.5 h-3.5 accent-maroon-900 rounded"
    />
    <span className="font-body text-sm text-gray-600 group-hover:text-maroon-900 transition-colors">{label}</span>
  </label>
);

// filters = { category: [slug], occasion: [], fabric: [], colour: [], maxPrice: number|null }
const FilterSidebar = ({ filters, onFilterChange, onClear, categories = [], priceBounds = [0, 0], hideCategory = false }) => {
  const toggle = (key, value) => {
    const current = filters[key] || [];
    const updated = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    onFilterChange({ ...filters, [key]: updated });
  };
  const [minPrice, maxPrice] = priceBounds;
  const currentMax = filters.maxPrice ?? maxPrice;

  return (
    <aside className="bg-white rounded shadow-soft p-5 sticky top-24 max-h-[calc(100vh-120px)] overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading font-semibold text-lg text-charcoal">Filters</h3>
        <button
          onClick={onClear}
          className="font-body text-xs text-maroon-900 hover:underline"
        >
          Clear All
        </button>
      </div>

      {!hideCategory && (
        <AccordionSection title="Category" defaultOpen={true}>
          {categories.map(cat => (
            <CheckOption
              key={cat.slug}
              label={cat.name}
              checked={(filters.category || []).includes(cat.slug)}
              onChange={() => toggle('category', cat.slug)}
            />
          ))}
        </AccordionSection>
      )}

      <AccordionSection title="Occasion" defaultOpen={true}>
        {OCCASIONS.map(occ => (
          <CheckOption
            key={occ}
            label={occ}
            checked={(filters.occasion || []).includes(occ)}
            onChange={() => toggle('occasion', occ)}
          />
        ))}
      </AccordionSection>

      <AccordionSection title="Colour" defaultOpen={true}>
        <div className="flex flex-wrap gap-2">
          {COLOUR_FAMILIES.map(({ name, hex }) => {
            const active = (filters.colour || []).includes(name);
            return (
              <button
                key={name}
                onClick={() => toggle('colour', name)}
                className={`flex items-center gap-1.5 font-body text-xs px-2.5 py-1 rounded-full border transition-all ${
                  active
                    ? 'border-maroon-900 bg-maroon-900 text-white'
                    : 'border-gray-200 text-gray-600 hover:border-maroon-900 hover:text-maroon-900'
                }`}
              >
                <span className="w-3 h-3 rounded-full border border-gray-200" style={{ backgroundColor: hex }} />
                {name}
              </button>
            );
          })}
        </div>
      </AccordionSection>

      <AccordionSection title="Fabric">
        {FABRIC_FAMILIES.map(({ name }) => (
          <CheckOption
            key={name}
            label={name}
            checked={(filters.fabric || []).includes(name)}
            onChange={() => toggle('fabric', name)}
          />
        ))}
      </AccordionSection>

      {maxPrice > minPrice && (
        <AccordionSection title="Price" defaultOpen={true}>
          <div className="space-y-3">
            <div className="flex justify-between font-body text-xs text-gray-500">
              <span>{formatPrice(minPrice)}</span>
              <span>up to {formatPrice(currentMax)}</span>
            </div>
            <input
              type="range"
              min={minPrice}
              max={maxPrice}
              step={50}
              value={currentMax}
              onChange={(e) => onFilterChange({ ...filters, maxPrice: Number(e.target.value) })}
              className="w-full accent-maroon-900"
              aria-label="Maximum price"
            />
          </div>
        </AccordionSection>
      )}
    </aside>
  );
};

export default FilterSidebar;
