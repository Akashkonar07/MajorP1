import React, { useState } from 'react';

// Lists match the placeholder sarees in server/data/products.json (real categories to come from the shop)
const FABRICS = ['Cotton', 'Cotton Silk', 'Art Silk', 'Semi Silk', 'Soft Silk', 'Georgette', 'Chiffon', 'Crepe', 'Linen', 'Organza', 'Tissue', 'Synthetic'];
const COLORS = ['Red', 'Maroon', 'Pastel Pink', 'Purple', 'Royal Blue', 'Navy Blue', 'Turquoise', 'Mint Green', 'Bottle Green', 'Mustard Yellow', 'Gold', 'Ivory'];
const OCCASIONS = ['Daily Wear', 'Office Wear', 'Festive', 'Party', 'Wedding'];
export const MAX_PRICE = 3000;

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

const FilterSidebar = ({ filters, onFilterChange, onClear }) => {
  const toggle = (key, value) => {
    const current = filters[key] || [];
    const updated = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    onFilterChange({ ...filters, [key]: updated });
  };

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

      <AccordionSection title="Fabric" defaultOpen={true}>
        {FABRICS.map(fab => (
          <CheckOption
            key={fab}
            label={fab}
            checked={(filters.fabric || []).includes(fab)}
            onChange={() => toggle('fabric', fab)}
          />
        ))}
      </AccordionSection>

      <AccordionSection title="Colour">
        <div className="flex flex-wrap gap-2">
          {COLORS.map(color => (
            <button
              key={color}
              onClick={() => toggle('color', color)}
              className={`font-body text-xs px-2.5 py-1 rounded-full border transition-all ${
                (filters.color || []).includes(color)
                  ? 'border-maroon-900 bg-maroon-900 text-white'
                  : 'border-gray-200 text-gray-600 hover:border-maroon-900 hover:text-maroon-900'
              }`}
            >
              {color}
            </button>
          ))}
        </div>
      </AccordionSection>

      <AccordionSection title="Price Range">
        <div className="space-y-3">
          <div className="flex justify-between font-body text-xs text-gray-500">
            <span>₹{(filters.minPrice || 0).toLocaleString('en-IN')}</span>
            <span>₹{(filters.maxPrice || MAX_PRICE).toLocaleString('en-IN')}</span>
          </div>
          <input
            type="range"
            min={0}
            max={MAX_PRICE}
            step={100}
            value={filters.maxPrice || MAX_PRICE}
            onChange={(e) => onFilterChange({ ...filters, maxPrice: Number(e.target.value) })}
            className="w-full"
          />
        </div>
      </AccordionSection>
    </aside>
  );
};

export default FilterSidebar;
