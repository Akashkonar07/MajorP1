import React from 'react';

// Label + input + error message, styled like the rest of the site
const FormField = ({ label, name, error, hint, ...inputProps }) => (
  <div>
    <label htmlFor={name} className="font-body font-semibold text-xs text-charcoal uppercase tracking-wide block mb-1.5">
      {label}
    </label>
    <input
      id={name}
      name={name}
      className={`input-field ${error ? 'border-red-400' : ''}`}
      aria-invalid={!!error}
      {...inputProps}
    />
    {error ? (
      <p className="font-body text-xs text-red-600 mt-1">{error}</p>
    ) : hint ? (
      <p className="font-body text-xs text-gray-400 mt-1">{hint}</p>
    ) : null}
  </div>
);

export default FormField;
