import React from 'react';
import { STATUS_CLASSES, statusLabel } from '../lib/orders';

// Coloured pill with the customer-friendly order status
const OrderStatusBadge = ({ order }) => {
  const s = statusLabel(order);
  return <span className={`inline-block px-2.5 py-1 rounded-full border font-body text-xs font-medium whitespace-nowrap ${STATUS_CLASSES[s.tone]}`}>{s.label}</span>;
};

export default OrderStatusBadge;
