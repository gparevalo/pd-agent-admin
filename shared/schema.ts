import {
  boolean,
  date,
  decimal,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

// --- ENUMS ---
export const accountStatusEnum = pgEnum("account_status_enum", ["active", "paused", "inactive"]);
export const clientClassificationEnum = pgEnum("client_classification_enum", ["AAA", "AA", "A", "B", "C"]);
export const operationStatusEnum = pgEnum("operation_status_enum", [
  "new_lead",
  "contract_pending",
  "onboarding",
  "service_activation",
  "active_client",
  "churned"
]);
export const onboardingStatusEnum = pgEnum("onboarding_status_enum", [
  "pending",
  "team_assigned",
  "resources_created",
  "kickoff_scheduled",
  "kickoff_completed",
  "strategy_started"
]);
export const serviceActivationStatusEnum = pgEnum("service_activation_status_enum", [
  "service_registered",
  "invoice_created",
  "sent_to_client",
  "payment_pending",
  "payment_received",
  "ticket_sent_to_IT",
  "development_in_progress",
  "service_delivered"
]);
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
  system: varchar("system", { length: 20 }).default("CLIENTE"),
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
  is_active: boolean("is_active").default(true),
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
  plan_id: varchar("plan_id"),
  system: varchar("system", { length: 20 }).default("company"),
  billing_cycle: varchar("billing_cycle", { length: 20 })
    .notNull()
    .default("trial"),
  base_price: decimal("base_price", { precision: 10, scale: 2 }).default("0"),
  final_price: decimal("final_price", { precision: 10, scale: 2 }).default("0"),
  start_date: date("start_date").notNull(),
  end_date: date("end_date").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("trial"),
  setup_fee_paid: decimal("setup_fee_paid", { precision: 10, scale: 2 }).default("0"),
  snapshot_limits: jsonb("snapshot_limits"),
  snapshot_features: jsonb("snapshot_features"),
  created_at: timestamp("created_at").defaultNow(),
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  created_at: true,
});
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type Subscription = typeof subscriptions.$inferSelect;

// Subscription Addons table
export const subscriptionItemsAddons = pgTable("subscription_items_addons", {
  id: varchar("id").primaryKey(),
  subscription_id: varchar("subscription_id").notNull(),
  addon_name: varchar("addon_name", { length: 150 }).notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).default("0"),
  activated_at: timestamp("activated_at").defaultNow(),
});

export const insertSubscriptionAddonSchema = createInsertSchema(subscriptionItemsAddons).omit({
  id: true,
  activated_at: true,
});
export type InsertSubscriptionAddon = z.infer<typeof insertSubscriptionAddonSchema>;
export type SubscriptionAddon = typeof subscriptionItemsAddons.$inferSelect;

// Subscription Discounts table
export const subscriptionDiscounts = pgTable("subscription_discounts", {
  id: varchar("id").primaryKey(),
  subscription_id: varchar("subscription_id").notNull(),
  discount_code: varchar("discount_code", { length: 50 }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  applied_at: timestamp("applied_at").defaultNow(),
});

export const insertSubscriptionDiscountSchema = createInsertSchema(subscriptionDiscounts).omit({
  id: true,
  applied_at: true,
});
export type InsertSubscriptionDiscount = z.infer<typeof insertSubscriptionDiscountSchema>;
export type SubscriptionDiscount = typeof subscriptionDiscounts.$inferSelect;

// Membership Usage table
export const membershipUsage = pgTable("membership_usage", {
  id: varchar("id").primaryKey(),
  company_id: varchar("company_id").notNull(),
  subscription_id: varchar("subscription_id").notNull(),
  messages: integer("messages").default(0),
  agents: integer("agents").default(0),
  integrations: integer("integrations").default(0),
  storage: decimal("storage", { precision: 10, scale: 2 }).default("0"), // e.g. MB
  updated_at: timestamp("updated_at").defaultNow(),
});

export const insertMembershipUsageSchema = createInsertSchema(membershipUsage).omit({
  id: true,
  updated_at: true,
});
export type InsertMembershipUsage = z.infer<typeof insertMembershipUsageSchema>;
export type MembershipUsage = typeof membershipUsage.$inferSelect;

// Security Logs table
export const securityLogs = pgTable("security_logs", {
  id: varchar("id").primaryKey(),
  company_id: varchar("company_id").notNull(),
  user_id: varchar("user_id").notNull(),
  action: varchar("action", { length: 100 }).notNull(),
  target_id: varchar("target_id", { length: 100 }), // The entity affected (e.g., subscription_id)
  details: jsonb("details"), // Store what changed
  created_at: timestamp("created_at").defaultNow(),
});

export const insertSecurityLogSchema = createInsertSchema(securityLogs).omit({
  id: true,
  created_at: true,
});
export type InsertSecurityLog = z.infer<typeof insertSecurityLogSchema>;
export type SecurityLog = typeof securityLogs.$inferSelect;


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

// --- CLIENT CRM TABLES ---

export const clientProfiles = pgTable("client_profiles", {
  id: varchar("id").primaryKey(),
  company_id: varchar("company_id").notNull().references(() => companies.id),
  industry: text("industry"),
  city_country: text("city_country"),
  website: text("website"),
  social_media: text("social_media"),
  brand_kit_url: text("brand_kit_url"),
  client_classification: clientClassificationEnum("client_classification"),
  agency_start_date: date("agency_start_date"),
  account_status: accountStatusEnum("account_status"),
  client_personality: text("client_personality"),
  client_values: text("client_values"),
  client_dislikes: text("client_dislikes"),
  idea_presentation_style: text("idea_presentation_style"),
  business_description: text("business_description"),
  business_age: text("business_age"),
  business_origin: text("business_origin"),
  main_product_service: text("main_product_service"),
  business_differentiation: text("business_differentiation"),
  main_competitors: text("main_competitors"),
  competitor_strengths: text("competitor_strengths"),
  company_strengths: text("company_strengths"),
  ideal_customer: text("ideal_customer"),
  customer_characteristics: text("customer_characteristics"),
  customer_problem: text("customer_problem"),
  customer_objections: text("customer_objections"),
  purchase_trigger: text("purchase_trigger"),
  future_target_customer: text("future_target_customer"),
  created_at: timestamp("created_at").defaultNow(),
});

export const insertClientProfileSchema = createInsertSchema(clientProfiles).omit({ id: true, created_at: true });
export type InsertClientProfile = z.infer<typeof insertClientProfileSchema>;
export type ClientProfile = typeof clientProfiles.$inferSelect;

export const clientContacts = pgTable("client_contacts", {
  id: varchar("id").primaryKey(),
  company_id: varchar("company_id").notNull().references(() => companies.id),
  contact_name: text("contact_name"),
  role: text("role"),
  email: text("email"),
  phone: text("phone"),
  notes: text("notes"),
  created_at: timestamp("created_at").defaultNow(),
});

export const insertClientContactSchema = createInsertSchema(clientContacts).omit({ id: true, created_at: true });
export type InsertClientContact = z.infer<typeof insertClientContactSchema>;
export type ClientContact = typeof clientContacts.$inferSelect;

export const clientServices = pgTable("client_services", {
  id: varchar("id").primaryKey(),
  company_id: varchar("company_id").notNull().references(() => companies.id),
  service_name: text("service_name"),
  plan_type: text("plan_type"),
  start_date: date("start_date"),
  end_date: date("end_date"),
  notes: text("notes"),
  top_selling_service: text("top_selling_service"),
  problem_solved: text("problem_solved"),
  customer_benefits: text("customer_benefits"),
  average_price: text("average_price"),
  priority_service: text("priority_service"),
  seasonality: text("seasonality"),
  created_at: timestamp("created_at").defaultNow(),
});

export const insertClientServiceSchema = createInsertSchema(clientServices).omit({ id: true, created_at: true });
export type InsertClientService = z.infer<typeof insertClientServiceSchema>;
export type ClientService = typeof clientServices.$inferSelect;

export const clientStrategies = pgTable("client_strategies", {
  id: varchar("id").primaryKey(),
  company_id: varchar("company_id").notNull().references(() => companies.id),
  strategy_name: text("strategy_name"),
  description: text("description"),
  status: text("status"),
  start_date: date("start_date"),
  project_reason: text("project_reason"),
  expected_results: text("expected_results"),
  project_goals: text("project_goals"),
  success_scenario: text("success_scenario"),
  created_at: timestamp("created_at").defaultNow(),
});

export const insertClientStrategySchema = createInsertSchema(clientStrategies).omit({ id: true, created_at: true });
export type InsertClientStrategy = z.infer<typeof insertClientStrategySchema>;
export type ClientStrategy = typeof clientStrategies.$inferSelect;

export const clientResults = pgTable("client_results", {
  id: varchar("id").primaryKey(),
  company_id: varchar("company_id").notNull().references(() => companies.id),
  period: text("period"),
  metric: text("metric"),
  value: text("value"),
  notes: text("notes"),
  lead_sources: text("lead_sources"),
  acquisition_channels: text("acquisition_channels"),
  sales_process: text("sales_process"),
  sales_responsible: text("sales_responsible"),
  sales_cycle: text("sales_cycle"),
  purchase_decision_factor: text("purchase_decision_factor"),
  previous_marketing_actions: text("previous_marketing_actions"),
  best_marketing_results: text("best_marketing_results"),
  failed_marketing_actions: text("failed_marketing_actions"),
  active_channels: text("active_channels"),
  content_types: text("content_types"),
  ads_history: text("ads_history"),
  frequent_customer_questions: text("frequent_customer_questions"),
  common_customer_mistakes: text("common_customer_mistakes"),
  important_client_knowledge: text("important_client_knowledge"),
  unknown_service_facts: text("unknown_service_facts"),
  created_at: timestamp("created_at").defaultNow(),
});

export const insertClientResultSchema = createInsertSchema(clientResults).omit({ id: true, created_at: true });
export type InsertClientResult = z.infer<typeof insertClientResultSchema>;
export type ClientResult = typeof clientResults.$inferSelect;

// --- OPERATIONS PIPELINE TABLES ---

export const operationsClients = pgTable("operations_clients", {
  id: varchar("id").primaryKey(),
  company_id: varchar("company_id").notNull().references(() => companies.id),
  client_name: text("client_name"),
  company_name: text("company_name"),
  service_contracted: text("service_contracted"),
  client_classification: clientClassificationEnum("client_classification"),
  contract_duration: text("contract_duration"),
  plan_price: numeric("plan_price"),
  date_of_entry: date("date_of_entry"),
  plan_attachment_url: text("plan_attachment_url"),
  billing_ruc: text("billing_ruc"),
  billing_name: text("billing_name"),
  billing_address: text("billing_address"),
  billing_phone: text("billing_phone"),
  legal_representative_name: text("legal_representative_name"),
  legal_representative_id: text("legal_representative_id"),
  status: operationStatusEnum("status").default("new_lead"),
  created_at: timestamp("created_at").defaultNow(),
});

export const insertOperationsClientSchema = createInsertSchema(operationsClients).omit({ id: true, created_at: true });
export type InsertOperationsClient = z.infer<typeof insertOperationsClientSchema>;
export type OperationsClient = typeof operationsClients.$inferSelect;

export const operationsClientSteps = pgTable("operations_client_steps", {
  id: varchar("id").primaryKey(),
  client_operation_id: varchar("client_operation_id").notNull().references(() => operationsClients.id),
  stage_id: text("stage_id"),
  step_key: text("step_key"),
  step_name: text("step_name"),
  completed: boolean("completed").default(false),
  completed_by: varchar("completed_by").references(() => users.id),
  completed_at: timestamp("completed_at"),
});

export const insertOperationsClientStepSchema = createInsertSchema(operationsClientSteps).omit({ id: true });
export type InsertOperationsClientStep = z.infer<typeof insertOperationsClientStepSchema>;
export type OperationsClientStep = typeof operationsClientSteps.$inferSelect;

export const operationsStageStepTemplates = pgTable("operations_stage_step_templates", {
  id: varchar("id").primaryKey(),
  stage_id: text("stage_id").notNull(),
  step_key: text("step_key").notNull(),
  step_name: text("step_name").notNull(),
  is_required: boolean("is_required").default(true),
  display_order: integer("display_order").default(0),
});

export const insertOperationsStageStepTemplateSchema = createInsertSchema(operationsStageStepTemplates).omit({ id: true });
export type InsertOperationsStageStepTemplate = z.infer<typeof insertOperationsStageStepTemplateSchema>;
export type OperationsStageStepTemplate = typeof operationsStageStepTemplates.$inferSelect;

export const operationsOnboarding = pgTable("operations_onboarding", {
  id: varchar("id").primaryKey(),
  company_id: varchar("company_id").notNull().references(() => companies.id),
  client_operation_id: varchar("client_operation_id").notNull().references(() => operationsClients.id),
  assigned_pm: varchar("assigned_pm").references(() => users.id),
  assigned_coo: varchar("assigned_coo").references(() => users.id),
  drive_folder_url: text("drive_folder_url"),
  clickup_space_url: text("clickup_space_url"),
  whatsapp_group_url: text("whatsapp_group_url"),
  kickoff_meeting_date: timestamp("kickoff_meeting_date"),
  kickoff_meeting_url: text("kickoff_meeting_url"),
  status: onboardingStatusEnum("status").default("pending"),
  created_at: timestamp("created_at").defaultNow(),
});

export const insertOperationsOnboardingSchema = createInsertSchema(operationsOnboarding).omit({ id: true, created_at: true });
export type InsertOperationsOnboarding = z.infer<typeof insertOperationsOnboardingSchema>;
export type OperationsOnboarding = typeof operationsOnboarding.$inferSelect;

export const operationsServiceActivations = pgTable("operations_service_activations", {
  id: varchar("id").primaryKey(),
  company_id: varchar("company_id").notNull().references(() => companies.id),
  service_name: text("service_name"),
  plan_type: text("plan_type"),
  contract_duration: text("contract_duration"),
  billing_ruc: text("billing_ruc"),
  billing_name: text("billing_name"),
  billing_address: text("billing_address"),
  contract_addendum_url: text("contract_addendum_url"),
  status: serviceActivationStatusEnum("status").default("service_registered"),
  created_at: timestamp("created_at").defaultNow(),
});

export const insertOperationsServiceActivationSchema = createInsertSchema(operationsServiceActivations).omit({ id: true, created_at: true });
export type InsertOperationsServiceActivation = z.infer<typeof insertOperationsServiceActivationSchema>;
export type OperationsServiceActivation = typeof operationsServiceActivations.$inferSelect;

export const activityLogs = pgTable("activity_logs", {
  id: varchar("id").primaryKey(),
  company_id: varchar("company_id").references(() => companies.id),
  user_id: varchar("user_id").references(() => users.id),
  event_type: text("event_type"),
  event_description: text("event_description"),
  metadata: jsonb("metadata"),
  created_at: timestamp("created_at").defaultNow(),
});

export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({ id: true, created_at: true });
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type ActivityLog = typeof activityLogs.$inferSelect;

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
