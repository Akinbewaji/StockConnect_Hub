import { z } from "zod";

export const registerSchema = z.object({
  body: z.object({
    phone: z
      .string()
      .trim()
      .min(7, "Phone number must be at least 7 digits")
      .max(15, "Phone number must not exceed 15 characters")
      .regex(
        /^\+?[1-9]\d{6,14}$/,
        "Phone number must be in valid E.164 format (digits and optional + prefix)",
      ),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email("Invalid email address format")
      .max(255, "Email must not exceed 255 characters"),
    username: z
      .string()
      .trim()
      .toLowerCase()
      .min(3, "Username must be at least 3 characters")
      .max(30, "Username must not exceed 30 characters")
      .regex(
        /^[a-z0-9_-]+$/,
        "Username can only contain lowercase letters, numbers, underscores, and hyphens",
      ),
    password: z
      .string()
      .min(10, "Password must be at least 10 characters")
      .regex(/[A-Z]/, "Password must include at least one uppercase letter")
      .regex(/[a-z]/, "Password must include at least one lowercase letter")
      .regex(/[0-9]/, "Password must include at least one number")
      .regex(
        /[!@#$%^&*]/,
        "Password must include at least one special character (!@#$%^&*)",
      ),
    name: z
      .string()
      .trim()
      .min(1, "Name is required")
      .max(100, "Name must not exceed 100 characters"),
    businessName: z
      .string()
      .trim()
      .min(1, "Business name is required")
      .max(100, "Business name must not exceed 100 characters"),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    identifier: z
      .string()
      .trim()
      .min(1, "Email, phone, or username is required"),
    password: z.string().min(1, "Password is required"),
  }),
});
