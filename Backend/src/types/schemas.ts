import { z } from "zod";

// --- Auth Schemas ---
export const loginSchema = z.object({
  identifier: z.string().min(1, "Username, email, or phone is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Full name is required"),
  businessName: z.string().min(2, "Business name is required"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  username: z.string().min(3, "Username must be at least 3 characters"),
  phone: z.string().min(10, "Valid phone number is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const onboardingSchema = z.object({
  currency: z.string().min(1).max(5).default("₦"),
  phone: z.string().min(10, "Valid business phone is required"),
  address: z.string().min(5, "Full business address is required"),
  taxRate: z.number().min(0).max(100).default(0),
});

// --- Product Schemas ---
export const productSchema = z.object({
  name: z.string().min(2, "Product name is required"),
  category: z.string().min(2, "Category is required"),
  price: z.number().positive("Price must be greater than 0"),
  quantity: z.number().int().min(0, "Quantity cannot be negative"),
  minStock: z.number().int().min(0).optional().default(5),
  costPrice: z.number().nonnegative().optional().default(0), // Preparation for Phase 3
});

// --- Customer Schemas ---
export const customerSchema = z.object({
  name: z.string().min(2, "Customer name is required"),
  phone: z.string().min(10, "Valid phone number is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
});

// --- Order Schemas ---
export const orderItemSchema = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().positive(),
});

export const orderSchema = z.object({
  customerId: z.number().int().positive().optional(),
  items: z.array(orderItemSchema).min(1, "Order must have at least one item"),
  totalAmount: z.number().positive(),
  paymentMethod: z.enum(["cash", "transfer", "pos"]).default("cash"),
});
