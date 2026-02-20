import {
  boolean,
  date,
  decimal,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Companies table - matches Supabase schema
export const companies = pgTable("companies", {
  id: varchar("id").primaryKey(),
  name: varchar("name", { length: 150 }).notNull(),
  legal_name: varchar("legal_name", { length: 150 }),
  industry: varchar("industry", { length: 100 }),
  logo_url: text("logo_url"),
  website: varchar("website", { length: 150 }),
  contact_email: varchar("contact_email", { length: 150 }),
  contact_phone: varchar("contact_phone", { length: 50 }),
  address: text("address"),
  status: varchar("status", { length: 20 }).default("active"),
  created_at: timestamp("created_at").defaultNow(),
  trial_start: date("trial_start"),
  trial_end: date("trial_end"),
});

export const insertCompanySchema = createInsertSchema(companies).omit({
  id: true,
  created_at: true,
});
export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type Company = typeof companies.$inferSelect;

// Users table - matches Supabase schema (password_hash instead of password)
export const users = pgTable("users", {
  id: varchar("id").primaryKey(),
  company_id: varchar("company_id").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  email: varchar("email").notNull(),
  password_hash: text("password_hash").notNull(),
  role: varchar("role", { length: 30 }).notNull().default("client_admin"),
  status: varchar("status", { length: 20 }).default("active"),
  created_at: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  created_at: true,
});
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Plans table - matches Supabase schema
export const plans = pgTable("plans", {
  id: varchar("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull(),
  description: text("description"),
  base_price_monthly: decimal("base_price_monthly", {
    precision: 10,
    scale: 2,
  }),
  base_price_semestral: decimal("base_price_semestral", {
    precision: 10,
    scale: 2,
  }),
  base_price_annual: decimal("base_price_annual", { precision: 10, scale: 2 }),
  default_limits: jsonb("default_limits"),
  default_features: jsonb("default_features"),
  created_at: timestamp("created_at").defaultNow(),
});

export const insertPlanSchema = createInsertSchema(plans).omit({
  id: true,
  created_at: true,
});
export type InsertPlan = z.infer<typeof insertPlanSchema>;
export type Plan = typeof plans.$inferSelect;

// Subscriptions table - matches Supabase schema
export const subscriptions = pgTable("subscriptions", {
  id: varchar("id").primaryKey(),
  company_id: varchar("company_id").notNull(),
  plan_id: varchar("lan_id"),
  billing_cycle: varchar("billing_cycle", { length: 20 })
    .notNull()
    .default("trial"),
  base_price: decimal("base_price", { precision: 10, scale: 2 }).default("0"),
  final_price: decimal("final_price", { precision: 10, scale: 2 }).default("0"),
  start_date: date("start_date").notNull(),
  end_date: date("end_date").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("trial"),
  created_at: timestamp("created_at").defaultNow(),
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  created_at: true,
});
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type Subscription = typeof subscriptions.$inferSelect;

// Discount codes table - matches Supabase schema (discount_codes, not discounts)
export const discountCodes = pgTable("discount_codes", {
  id: varchar("id").primaryKey(),
  code: varchar("code", { length: 50 }).notNull(),
  description: text("description"),
  discount_type: varchar("discount_type", { length: 20 }), // percentage, fixed
  discount_value: decimal("discount_value", {
    precision: 10,
    scale: 2,
  }).notNull(),
  applies_to: varchar("applies_to", { length: 30 }),
  plan_id: varchar("plan_id"),
  company_id: varchar("company_id"),
  billing_cycle: varchar("billing_cycle", { length: 20 }),
  start_date: date("start_date"),
  end_date: date("end_date"),
  max_uses: integer("max_uses"),
  used_count: integer("used_count").default(0),
  is_active: boolean("is_active").default(true),
  created_at: timestamp("created_at").defaultNow(),
});

export const insertDiscountCodeSchema = createInsertSchema(discountCodes).omit({
  id: true,
  created_at: true,
});
export type InsertDiscountCode = z.infer<typeof insertDiscountCodeSchema>;
export type DiscountCode = typeof discountCodes.$inferSelect;

// Leads table - matches Supabase schema
export const leads = pgTable("leads", {
  id: varchar("id").primaryKey(),
  company_id: varchar("company_id").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  email: varchar("email", { length: 100 }),
  phone: varchar("phone", { length: 50 }),
  source: varchar("source", { length: 50 }),
  lead_type: varchar("lead_type", { length: 20 }).default("new"),
  created_at: timestamp("created_at").defaultNow(),
  total_messages: integer("total_messages").default(0),
  total_conversations: integer("total_conversations").default(0),
  status: varchar("status", { length: 20 }).default("new"),
});

export const insertLeadSchema = createInsertSchema(leads).omit({
  id: true,
  created_at: true,
});
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Lead = typeof leads.$inferSelect;

// Conversations table - matches Supabase schema
export const conversations = pgTable("conversations", {
  id: varchar("id").primaryKey(),
  company_id: varchar("company_id").notNull(),
  agent_id: varchar("agent_id"),
  lead_id: varchar("lead_id"),
  instance: varchar("instance"),
  channel: varchar("channel", { length: 20 }),
  user_id: varchar("user_id"),
  user_name: varchar("user_name"),
  service_interest: varchar("service_interest"),
  status: varchar("status", { length: 20 }).default("active"),
  started_at: timestamp("started_at"),
  ended_at: timestamp("ended_at"),
  analyzed: boolean("analyzed").default(false),
  event_id: varchar("event_id"),
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
});
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversations.$inferSelect;

export const messages = pgTable("messages", {
  id: varchar("id").primaryKey(),
  conversation_id: varchar("conversation_id"),
  message_id: varchar("message_id", { length: 60 }).unique(),
  sender: varchar("sender", { length: 20 }),
  content: text("content"),
  metadata: jsonb("metadata"),
  created_at: timestamp("created_at").defaultNow(),
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  created_at: true,
});

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

// Agents table - matches Supabase schema
export const agents = pgTable("agents", {
  id: varchar("id").primaryKey(),
  company_id: varchar("company_id").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  tone: varchar("tone", { length: 50 }).default("professional"),
  emoji_style: varchar("emoji_style", { length: 50 }),
  configuration: jsonb("configuration"),
  purpose: varchar("purpose", { length: 100 }).notNull(),
  status: varchar("status", { length: 20 }).default("active"),
  created_at: timestamp("created_at").defaultNow(),
  service_description: text("service_description"), // moved from configuration to top-level field
  faq: text("faq"), // moved from configuration to top-level field
  website_url: varchar("website_url", { length: 200 }), // moved from configuration to top-level field
  test_mode: boolean("test_mode").default(false),
});

export const insertAgentSchema = createInsertSchema(agents).omit({
  id: true,
  created_at: true,
});
export type InsertAgent = z.infer<typeof insertAgentSchema>;
export type Agent = typeof agents.$inferSelect;

// Catalog table
export const catalog = pgTable("catalog", {
  id: varchar("id").primaryKey(),
  company_id: varchar("company_id").notNull(),
  item_type: text("item_type").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  base_price: decimal("base_price", { precision: 10, scale: 2 }).default("0"),
  currency: text("currency").default("USD"),
  details: jsonb("details").$type<{
    includes: string[];
    restrictions: string[];
    estimated_time: string;
  }>(),
  advanced_config: jsonb("advanced_config").$type<{
    variable_pricing: any;
    execution_process: string[];
  }>(),
  is_active: boolean("is_active").default(true),
});

export const insertCatalogSchema = createInsertSchema(catalog).omit({
  id: true,
});
export type InsertCatalog = z.infer<typeof insertCatalogSchema>;
export type Catalog = typeof catalog.$inferSelect;

// Auth schemas for login/register
export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

export const registerSchema = z.object({
  company_name: z.string().min(2, "El nombre de la empresa es requerido"),
  name: z.string().min(2, "El nombre es requerido"),
  email: z.string().email("Email inválido"),
  phone: z.string().regex(/^\+?[0-9]{7,15}$/, "Teléfono inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

export type LoginData = z.infer<typeof loginSchema>;
export type RegisterData = z.infer<typeof registerSchema>;

// Auth response type
export interface AuthResponse {
  user: Omit<User, "password_hash">;
  company: Company;
  subscription: Subscription;
  token: string;
}

// Theme type for company customization - using custom fields for theming
export interface CompanyTheme {
  company_name: string;
  primary_color: string;
  secondary_color: string;
  logo_url: string | null;
}
