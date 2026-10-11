import { z } from 'zod';

// Form rules (project brief §9.5). The database has its own checks too —
// these just give friendly messages before anything is sent.

const email = z.string().trim().toLowerCase().email('Enter a valid email address');
const password = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Za-z]/, 'Password must contain a letter')
  .regex(/[0-9]/, 'Password must contain a number');
const fullName = z.string().trim().min(2, 'Enter your name').max(100, 'Name is too long');
const phone = z
  .string()
  .trim()
  .regex(/^[6-9][0-9]{9}$/, 'Enter a 10-digit mobile number')
  .or(z.literal(''));

export const loginSchema = z.object({ email, password: z.string().min(1, 'Enter your password') });
export const signUpSchema = z.object({ fullName, email, password });
export const resetSchema = z.object({ email });
export const profileSchema = z.object({ full_name: fullName, phone });

// Delivery address — same rules as the addresses table and place_order()
export const addressSchema = z.object({
  full_name: fullName,
  phone: z.string().trim().regex(/^[6-9][0-9]{9}$/, 'Enter a 10-digit mobile number'),
  line1: z.string().trim().min(3, 'Enter house / flat no. and street').max(200, 'Too long'),
  line2: z.string().trim().max(200, 'Too long'),
  city: z.string().trim().min(2, 'Enter the city').max(60, 'Too long'),
  state: z.string().trim().min(2, 'Choose the state'),
  pincode: z.string().trim().regex(/^[1-9][0-9]{5}$/, 'Enter a 6-digit pincode'),
});
export const utrSchema = z.object({
  utr: z.string().transform(s => s.replace(/\s/g, '')).pipe(z.string().regex(/^[0-9]{12}$/, 'The UTR / UPI reference number has 12 digits')),
});

// Returns { data } when valid, or { errors: { field: 'message' } }
export function check(schema, values) {
  const result = schema.safeParse(values);
  if (result.success) return { data: result.data };
  const errors = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0];
    if (!errors[field]) errors[field] = issue.message;
  }
  return { errors };
}
