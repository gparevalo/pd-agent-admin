import type {
  Agent,
  Catalog,
  Company,
  Conversation,
  DiscountCode,
  InsertAgent,
  InsertCatalog,
  InsertCompany,
  InsertConversation,
  InsertDiscountCode,
  InsertLead,
  InsertPlan,
  InsertSubscription,
  InsertUser,
  InsertSubscriptionAddon,
  SubscriptionAddon,
  InsertSubscriptionDiscount,
  SubscriptionDiscount,
  MembershipUsage,
  InsertSecurityLog,
  SecurityLog,
  Lead,
  Message,
  Plan,
  Subscription,
  User,
  ClientProfile,
  InsertClientProfile,
  ClientContact,
  InsertClientContact,
  ClientService,
  InsertClientService,
  ClientStrategy,
  InsertClientStrategy,
  ClientResult,
  InsertClientResult,
  OperationsClient,
  InsertOperationsClient,
  OperationsClientStep,
  InsertOperationsClientStep,
  OperationsOnboarding,
  InsertOperationsOnboarding,
  OperationsServiceActivation,
  InsertOperationsServiceActivation,
  ActivityLog,
  InsertActivityLog,
} from "@shared/schema";
import { randomUUID } from "crypto";
import { supabase } from "./supabase";

export interface IStorage {
  // Companies
  createCompany(company: InsertCompany): Promise<Company>;
  getCompany(id: string): Promise<Company | null>;
  updateCompany(
    id: string,
    data: Partial<InsertCompany>,
  ): Promise<Company | null>;
  getAllCompanies(): Promise<Company[]>;
  deleteCompany(id: string): Promise<void>;

  // Users
  createUser(user: InsertUser & { id?: string }): Promise<User>;
  getUserById(id: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  getAllUsers(): Promise<User[]>;
  getCompanyUsers(companyId: string): Promise<User[]>;
  getUsersByCompany(companyId: string): Promise<User[]>;
  getSuperadmins(): Promise<User[]>;
  updateUser(id: string, updates: Partial<User>): Promise<User | null>;
  deleteUser(id: string): Promise<void>;

  // Plans
  createPlan(plan: InsertPlan & { id?: string }): Promise<Plan>;
  getPlan(id: string): Promise<Plan | null>;
  getPlans(): Promise<Plan[]>;
  updatePlan(id: string, updates: Partial<InsertPlan>): Promise<Plan | null>;

  // Subscriptions
  createSubscription(
    subscription: InsertSubscription & { id?: string },
  ): Promise<Subscription>;
  getSubscription(id: string): Promise<Subscription | null>;
  getActiveSubscription(companyId: string): Promise<Subscription | null>;
  getSubscriptionByCompany(companyId: string): Promise<Subscription | null>;
  getAllSubscriptions(): Promise<Subscription[]>;
  updateSubscription(
    id: string,
    data: Partial<InsertSubscription>,
  ): Promise<Subscription | null>;

  // Admin Dashboard Subscriptions
  getAdminSubscriptionsDetails(): Promise<any[]>;
  getAdminSubscriptionDashboardKPIs(): Promise<any>;

  // Subscription Details & Actions
  getSubscriptionAddons(subscriptionId: string): Promise<SubscriptionAddon[]>;
  addSubscriptionAddon(addon: InsertSubscriptionAddon & { id?: string }): Promise<SubscriptionAddon>;
  removeSubscriptionAddon(id: string): Promise<void>;

  getSubscriptionDiscounts(subscriptionId: string): Promise<SubscriptionDiscount[]>;
  addSubscriptionDiscount(discount: InsertSubscriptionDiscount & { id?: string }): Promise<SubscriptionDiscount>;

  getMembershipUsage(companyId: string, subscriptionId: string): Promise<MembershipUsage | null>;

  logSecurityAction(log: InsertSecurityLog & { id?: string }): Promise<SecurityLog>;

  // Discount Codes
  createDiscountCode(
    discount: InsertDiscountCode & { id?: string },
  ): Promise<DiscountCode>;
  getDiscountByCode(code: string): Promise<DiscountCode | null>;
  getAllDiscountCodes(): Promise<DiscountCode[]>;
  incrementDiscountUsage(id: string): Promise<void>;
  updateDiscountCode(id: string, updates: Partial<InsertDiscountCode>): Promise<DiscountCode | null>;

  // Leads
  createLead(lead: InsertLead & { id?: string }): Promise<Lead>;
  getLeadsByCompany(companyId: string): Promise<Lead[]>;
  getLead(id: string): Promise<Lead | null>;

  // Conversations
  createConversation(
    conversation: InsertConversation & { id?: string },
  ): Promise<Conversation>;
  getConversationsByCompany(companyId: string): Promise<Conversation[]>;

  // messages
  getMessagesByConversation(conversationId: string): Promise<Message[]>;

  // Agents
  createAgent(agent: InsertAgent & { id?: string }): Promise<Agent>;
  getAgentsByCompany(companyId: string): Promise<Agent[]>;
  getAgentById(id: string): Promise<Agent | null>;
  updateAgent(id: string, updates: Partial<InsertAgent>): Promise<Agent>;
  getAgentStats(
    agentId: string,
    companyId: string,
  ): Promise<{
    totalConversations: number;
    totalLeads: number;
    conversionRate: number;
  }>;

  // Catalog
  createCatalogItem(item: InsertCatalog & { id?: string }): Promise<Catalog>;
  getCatalogByCompany(companyId: string): Promise<Catalog[]>;
  getCatalogItem(id: string): Promise<Catalog | null>;
  updateCatalogItem(
    id: string,
    updates: Partial<InsertCatalog>,
  ): Promise<Catalog>;
  deleteCatalogItem(id: string): Promise<void>;
  deleteCatalogItemsByType(companyId: string, itemType: string): Promise<void>;

  // Client CRM
  getClientProfile(companyId: string): Promise<ClientProfile | null>;
  upsertClientProfile(profile: InsertClientProfile & { id?: string }): Promise<ClientProfile>;

  getClientContacts(companyId: string): Promise<ClientContact[]>;
  createClientContact(contact: InsertClientContact & { id?: string }): Promise<ClientContact>;
  updateClientContact(id: string, contact: Partial<InsertClientContact>): Promise<ClientContact>;

  getClientServices(companyId: string): Promise<ClientService[]>;
  createClientService(service: InsertClientService & { id?: string }): Promise<ClientService>;

  getClientStrategies(companyId: string): Promise<ClientStrategy[]>;
  upsertClientStrategy(strategy: InsertClientStrategy & { id?: string }): Promise<ClientStrategy>;


  getClientResults(companyId: string): Promise<ClientResult[]>;
  upsertClientResult(result: InsertClientResult & { id?: string }): Promise<ClientResult>;


  // Operations Pipeline
  getOperationsPipeline(): Promise<OperationsClient[]>;
  getOperationsClient(id: string): Promise<OperationsClient | null>;
  createOperationsClient(op: InsertOperationsClient & { id?: string }): Promise<OperationsClient>;
  updateOperationsClient(id: string, op: Partial<InsertOperationsClient>): Promise<OperationsClient>;

  getOperationsClientSteps(operationId: string): Promise<OperationsClientStep[]>;
  updateOperationsClientStep(id: string, step: Partial<InsertOperationsClientStep>): Promise<OperationsClientStep>;

  getOperationsOnboardings(): Promise<any[]>;
  getOperationsOnboarding(operationId: string): Promise<OperationsOnboarding | null>;
  upsertOperationsOnboarding(onboarding: InsertOperationsOnboarding & { id?: string }): Promise<OperationsOnboarding>;

  getOperationsServiceActivations(): Promise<OperationsServiceActivation[]>;
  createOperationsServiceActivation(service: InsertOperationsServiceActivation & { id?: string }): Promise<OperationsServiceActivation>;
  updateOperationsServiceActivation(id: string, service: Partial<InsertOperationsServiceActivation>): Promise<OperationsServiceActivation>;

  // Audit Logs
  getActivityLogs(companyId?: string): Promise<ActivityLog[]>;
  createActivityLog(log: InsertActivityLog & { id?: string }): Promise<ActivityLog>;

  // Client 360 View
  getClient360(companyId: string): Promise<any>;

  getOperationsOnboardingByCompany(companyId: string): Promise<OperationsOnboarding | null>;
}

export class SupabaseStorage implements IStorage {
  // Companies
  async createCompany(company: InsertCompany): Promise<Company> {
    const id = randomUUID();
    const { data, error } = await supabase
      .from("companies")
      .insert({
        id,
        ...company,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async getCompany(id: string): Promise<Company | null> {
    const { data } = await supabase
      .from("companies")
      .select("*")
      .eq("id", id)
      .single();
    return data;
  }

  async updateCompany(
    id: string,
    data: Partial<InsertCompany>,
  ): Promise<Company | null> {
    const { data: updated, error } = await supabase
      .from("companies")
      .update(data)
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return updated;
  }

  async getAllCompanies(): Promise<Company[]> {
    const { data, error } = await supabase.from("companies").select("*").order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  }

  async deleteCompany(id: string): Promise<void> {
    const { error } = await supabase.from("companies").delete().eq("id", id);
    if (error) throw new Error(error.message);
  }

  // Users
  async createUser(user: InsertUser & { id?: string }): Promise<User> {
    const id = user.id || randomUUID();
    const { data, error } = await supabase
      .from("users")
      .insert({ ...user, id })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async getUserById(id: string): Promise<User | null> {
    const { data, error } = await supabase.from("users").select("*").eq("id", id).maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const { data, error } = await supabase.from("users").select("*").eq("email", email).eq("system", "ADMIN").maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  }

  async getAllUsers(): Promise<User[]> {
    const { data, error } = await supabase.from("users").select("*");
    if (error) throw new Error(error.message);
    return data;
  }

  async getCompanyUsers(companyId: string): Promise<User[]> {
    const { data, error } = await supabase.from("users").select("*").eq("company_id", companyId);
    if (error) throw new Error(error.message);
    return data;
  }

  async getUsersByCompany(companyId: string): Promise<User[]> {
    const { data } = await supabase.from("users").select("*").eq("company_id", companyId);
    return data || [];
  }

  async getSuperadmins(): Promise<User[]> {
    const { data, error } = await supabase.from("users").select("*").eq("role", "superadmin").eq("system", "ADMIN");
    if (error) throw new Error(error.message);
    return data;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    const { data, error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async deleteUser(id: string): Promise<void> {
    const { error } = await supabase.from("users").delete().eq("id", id);
    if (error) throw new Error(error.message);
  }

  // Plans
  async createPlan(plan: InsertPlan & { id?: string }): Promise<Plan> {
    const id = plan.id || randomUUID();
    const { data, error } = await supabase
      .from("plans")
      .insert({ ...plan, id })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async getPlan(id: string): Promise<Plan | null> {
    const { data } = await supabase
      .from("plans")
      .select("*")
      .eq("id", id)
      .single();
    return data;
  }

  async getPlans(): Promise<Plan[]> {
    const { data } = await supabase.from("plans").select("*");
    return data || [];
  }

  async updatePlan(id: string, updates: Partial<InsertPlan>): Promise<Plan | null> {
    const { data, error } = await supabase
      .from("plans")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  // Subscriptions
  async createSubscription(
    subscription: InsertSubscription & { id?: string },
  ): Promise<Subscription> {
    const id = subscription.id || randomUUID();
    const { data, error } = await supabase
      .from("subscriptions")
      .insert({ ...subscription, id })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async getSubscription(id: string): Promise<Subscription | null> {
    const { data } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("id", id)
      .single();
    return data;
  }

  async getActiveSubscription(companyId: string): Promise<Subscription | null> {
    const { data } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    return data;
  }

  async getSubscriptionByCompany(companyId: string): Promise<Subscription | null> {
    const { data } = await supabase
      .from("subscriptions")
      .select("*, plans(name)")
      .eq("company_id", companyId)
      .eq("status", "active")
      .maybeSingle();
    return data;
  }

  async getAllSubscriptions(): Promise<Subscription[]> {
    const { data } = await supabase.from("subscriptions").select("*");
    return data || [];
  }

  async updateSubscription(
    id: string,
    data: Partial<InsertSubscription>,
  ): Promise<Subscription | null> {
    const { data: updated, error } = await supabase
      .from("subscriptions")
      .update(data)
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return updated;
  }

  // Discount Codes
  async createDiscountCode(
    discount: InsertDiscountCode & { id?: string },
  ): Promise<DiscountCode> {
    const id = discount.id || randomUUID();
    const { data, error } = await supabase
      .from("discount_codes")
      .insert({ ...discount, id })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async getDiscountByCode(code: string): Promise<DiscountCode | null> {
    const { data } = await supabase
      .from("discount_codes")
      .select("*")
      .eq("code", code)
      .eq("is_active", true)
      .single();
    return data;
  }

  async getAllDiscountCodes(): Promise<DiscountCode[]> {
    const { data } = await supabase.from("discount_codes").select("*");
    return data || [];
  }

  async incrementDiscountUsage(id: string): Promise<void> {
    // Use raw update with increment
    const { data: discount } = await supabase
      .from("discount_codes")
      .select("current_uses")
      .eq("id", id)
      .single();

    if (discount) {
      const currentUses = (discount.current_uses || 0) + 1;
      await supabase
        .from("discount_codes")
        .update({ current_uses: currentUses })
        .eq("id", id);
    }
  }

  async updateDiscountCode(id: string, updates: Partial<InsertDiscountCode>): Promise<DiscountCode | null> {
    const { data, error } = await supabase
      .from("discount_codes")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  // Leads
  async createLead(lead: InsertLead & { id?: string }): Promise<Lead> {
    const id = lead.id || randomUUID();
    const { data, error } = await supabase
      .from("leads")
      .insert({ ...lead, id })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async updateLead(id: string, lead: Partial<InsertLead>): Promise<Lead> {
    const { data, error } = await supabase
      .from("leads")
      .update({
        name: lead.name,
        email: lead.email ?? null,
        phone: lead.phone ?? null,
        source: lead.source ?? null,
        lead_type: lead.lead_type,
        status: lead.status,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async getLeadsByCompany(companyId: string): Promise<Lead[]> {
    const { data } = await supabase
      .from("leads_with_totals")
      .select("*")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false });
    return data || [];
  }

  async getLead(id: string): Promise<Lead | null> {
    const { data } = await supabase
      .from("leads")
      .select("*")
      .eq("id", id)
      .single();
    return data;
  }

  // Conversations
  async createConversation(
    conversation: InsertConversation & { id?: string },
  ): Promise<Conversation> {
    const id = conversation.id || randomUUID();
    const { data, error } = await supabase
      .from("conversations")
      .insert({ ...conversation, id })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async getConversationsByCompany(companyId: string): Promise<Conversation[]> {
    const { data } = await supabase
      .from("conversations")
      .select("*")
      .eq("company_id", companyId)
      .order("started_at", { ascending: false });
    return data || [];
  }

  async getMessagesByConversation(conversationId: string): Promise<Message[]> {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching messages:", error);
      return [];
    }

    return data || [];
  }

  // Agents
  async createAgent(agent: InsertAgent & { id?: string }): Promise<Agent> {
    const id = agent.id || randomUUID();
    const { data, error } = await supabase
      .from("agents")
      .insert({ ...agent, id })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async getAgentsByCompany(companyId: string): Promise<Agent[]> {
    const { data } = await supabase
      .from("agents")
      .select("*")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false });
    return data || [];
  }

  async getAgentById(id: string): Promise<Agent | null> {
    const { data } = await supabase
      .from("agents")
      .select("*")
      .eq("id", id)
      .single();
    return data;
  }

  async updateAgent(id: string, updates: Partial<InsertAgent>): Promise<Agent> {
    const { data, error } = await supabase
      .from("agents")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async getAgentStats(
    agentId: string,
    companyId: string,
  ): Promise<{
    totalConversations: number;
    totalLeads: number;
    conversionRate: number;
  }> {
    // Get conversations for this agent
    const { data: conversations } = await supabase
      .from("conversations")
      .select("id")
      .eq("company_id", companyId)
      .eq("agent_id", agentId);

    const totalConversations = conversations?.length || 0;

    // Get leads for this company (agent attribution would need agent_id field in leads)
    const { data: leads } = await supabase
      .from("leads")
      .select("id")
      .eq("company_id", companyId);

    const totalLeads = leads?.length || 0;

    // Calculate conversion rate
    const conversionRate =
      totalConversations > 0
        ? Math.round((totalLeads / totalConversations) * 100)
        : 0;

    return { totalConversations, totalLeads, conversionRate };
  }

  // Catalog
  async createCatalogItem(
    item: InsertCatalog & { id?: string },
  ): Promise<Catalog> {
    const id = item.id || randomUUID();
    const { data, error } = await supabase
      .from("catalog")
      .insert({ ...item, id })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async getCatalogByCompany(companyId: string): Promise<Catalog[]> {
    const { data } = await supabase
      .from("catalog")
      .select("*")
      .eq("company_id", companyId)
      .eq("is_active", true)
      .order("name", { ascending: true });
    return data || [];
  }

  async getCatalogItem(id: string): Promise<Catalog | null> {
    const { data } = await supabase
      .from("catalog")
      .select("*")
      .eq("id", id)
      .single();
    return data;
  }

  async updateCatalogItem(
    id: string,
    updates: Partial<InsertCatalog>,
  ): Promise<Catalog> {
    const { data, error } = await supabase
      .from("catalog")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async deleteCatalogItem(id: string): Promise<void> {
    const { error } = await supabase
      .from("catalog")
      .update({ is_active: false })
      .eq("id", id);

    if (error) throw new Error(error.message);
  }

  async deleteCatalogItemsByType(companyId: string, itemType: string): Promise<void> {
    const { error } = await supabase
      .from("catalog")
      .delete()
      .eq("company_id", companyId)
      .eq("item_type", itemType);

    if (error) throw new Error(error.message);
  }

  // Admin Dashboard Subscriptions & KPIs
  async getAdminSubscriptionsDetails(): Promise<any[]> {
    const { data: subscriptions, error } = await supabase
      .from("subscriptions")
      .select("*, companies(name), plans(name), subscription_items_addons(id), subscription_discounts(id)")
      .eq('system', 'company');

    if (error) throw new Error(error.message);

    // We can fetch membership_usage separately or join it if Supabase allows.
    const { data: usages } = await supabase.from("membership_usage").select("*");

    // Merge usage into subscriptions
    return (subscriptions || []).map((sub: any) => ({
      ...sub,
      company_name: sub.companies?.name,
      plan_name: sub.plans?.name,
      addons_count: sub.subscription_items_addons?.length || 0,
      discounts_count: sub.subscription_discounts?.length || 0,
      usage: usages?.find((u: any) => u.subscription_id === sub.id) || null,
    }));
  }

  async getAdminSubscriptionDashboardKPIs(): Promise<any> {
    const { data: subscriptions } = await supabase
      .from("subscriptions")
      .select("*");

    if (!subscriptions) return { mrr: 0, arr: 0, active: 0, past_due: 0, grace_period: 0, new_30_days: 0 };

    let mrr = 0;
    let arr = 0;
    let active = 0;
    let past_due = 0;
    let grace_period = 0;
    let new_30_days = 0;

    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);

    subscriptions.forEach((sub: any) => {
      const price = parseFloat(sub.final_price || "0");
      if (sub.status === "active") {
        active++;
        if (sub.billing_cycle === "monthly") {
          mrr += price;
          arr += price * 12;
        } else if (sub.billing_cycle === "annual") {
          mrr += price / 12;
          arr += price;
        } else if (sub.billing_cycle === "semestral") {
          mrr += price / 6;
          arr += price * 2;
        }
      } else if (sub.status === "past_due") {
        past_due++;
      } else if (sub.status === "grace_period") {
        grace_period++;
      }

      const createdAt = new Date(sub.created_at);
      if (createdAt >= thirtyDaysAgo) {
        new_30_days++;
      }
    });

    return {
      mrr,
      arr,
      active,
      past_due,
      grace_period,
      new_30_days
    };
  }

  // Subscription Details & Actions
  async getSubscriptionAddons(subscriptionId: string): Promise<SubscriptionAddon[]> {
    const { data } = await supabase
      .from("subscription_items_addons")
      .select("*")
      .eq("subscription_id", subscriptionId);
    return data || [];
  }

  async addSubscriptionAddon(addon: InsertSubscriptionAddon & { id?: string }): Promise<SubscriptionAddon> {
    const id = addon.id || randomUUID();
    const { data, error } = await supabase
      .from("subscription_items_addons")
      .insert({ ...addon, id })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  async removeSubscriptionAddon(id: string): Promise<void> {
    const { error } = await supabase
      .from("subscription_items_addons")
      .delete()
      .eq("id", id);
    if (error) throw new Error(error.message);
  }

  async getSubscriptionDiscounts(subscriptionId: string): Promise<SubscriptionDiscount[]> {
    const { data } = await supabase
      .from("subscription_discounts")
      .select("*")
      .eq("subscription_id", subscriptionId);
    return data || [];
  }

  async addSubscriptionDiscount(discount: InsertSubscriptionDiscount & { id?: string }): Promise<SubscriptionDiscount> {
    const id = discount.id || randomUUID();
    const { data, error } = await supabase
      .from("subscription_discounts")
      .insert({ ...discount, id })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  async getMembershipUsage(companyId: string, subscriptionId: string): Promise<MembershipUsage | null> {
    const { data } = await supabase
      .from("membership_usage")
      .select("*")
      .eq("subscription_id", subscriptionId)
      .single();
    return data;
  }

  async logSecurityAction(log: InsertSecurityLog & { id?: string }): Promise<SecurityLog> {
    const id = log.id || randomUUID();
    const { data, error } = await supabase
      .from("security_logs")
      .insert({ ...log, id })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  // --- CLIENT CRM ---
  async getClientProfile(companyId: string): Promise<ClientProfile | null> {
    const { data } = await supabase.from("client_profiles").select("*").eq("company_id", companyId).maybeSingle();
    return data;
  }

  async upsertClientProfile(profile: InsertClientProfile & { id?: string }): Promise<ClientProfile> {
    const existing = await this.getClientProfile(profile.company_id);
    if (existing) {
      const { data, error } = await supabase.from("client_profiles").update(profile).eq("id", existing.id).select().single();
      if (error) throw new Error(error.message);
      return data;
    } else {
      const id = profile.id || randomUUID();
      const { data, error } = await supabase.from("client_profiles").insert({ ...profile, id }).select().single();
      if (error) throw new Error(error.message);
      return data;
    }
  }

  async getClientContacts(companyId: string): Promise<ClientContact[]> {
    const { data } = await supabase.from("client_contacts").select("*").eq("company_id", companyId);
    return data || [];
  }

  async createClientContact(contact: InsertClientContact & { id?: string }): Promise<ClientContact> {
    const id = contact.id || randomUUID();
    const { data, error } = await supabase.from("client_contacts").insert({ ...contact, id }).select().single();
    if (error) throw new Error(error.message);
    return data;
  }

  async updateClientContact(id: string, contact: Partial<InsertClientContact>): Promise<ClientContact> {
    const { data, error } = await supabase.from("client_contacts").update(contact).eq("id", id).select().single();
    if (error) throw new Error(error.message);
    return data;
  }

  async getClientServices(companyId: string): Promise<ClientService[]> {
    const { data } = await supabase.from("client_services").select("*").eq("company_id", companyId);
    return data || [];
  }

  async createClientService(service: InsertClientService & { id?: string }): Promise<ClientService> {
    const id = service.id || randomUUID();
    const { data, error } = await supabase.from("client_services").insert({ ...service, id }).select().single();
    if (error) throw new Error(error.message);
    return data;
  }

  async getClientStrategies(companyId: string): Promise<ClientStrategy[]> {
    const { data } = await supabase.from("client_strategies").select("*").eq("company_id", companyId);
    return data || [];
  }

  async upsertClientStrategy(strategy: InsertClientStrategy & { id?: string }): Promise<ClientStrategy> {
    const existing = await this.getClientStrategies(strategy.company_id);
    if (existing.length > 0) {
      const { data, error } = await supabase.from("client_strategies").update(strategy).eq("id", existing[0].id).select().single();
      if (error) throw new Error(error.message);
      return data;
    } else {
      const id = strategy.id || randomUUID();
      const { data, error } = await supabase.from("client_strategies").insert({ ...strategy, id }).select().single();
      if (error) throw new Error(error.message);
      return data;
    }
  }

  async getClientResults(companyId: string): Promise<ClientResult[]> {
    const { data } = await supabase.from("client_results").select("*").eq("company_id", companyId);
    return data || [];
  }

  async upsertClientResult(result: InsertClientResult & { id?: string }): Promise<ClientResult> {
    const existing = await this.getClientResults(result.company_id);
    if (existing.length > 0) {
      const { data, error } = await supabase.from("client_results").update(result).eq("id", existing[0].id).select().single();
      if (error) throw new Error(error.message);
      return data;
    } else {
      const id = result.id || randomUUID();
      const { data, error } = await supabase.from("client_results").insert({ ...result, id }).select().single();
      if (error) throw new Error(error.message);
      return data;
    }
  }

  // --- OPERATIONS PIPELINE ---
  async getOperationsPipeline(): Promise<OperationsClient[]> {
    const { data } = await supabase.from("operations_clients").select("*").order("created_at", { ascending: false });
    return data || [];
  }

  async getOperationsClient(id: string): Promise<OperationsClient | null> {
    const { data } = await supabase.from("operations_clients").select("*").eq("id", id).maybeSingle();
    return data;
  }

  async createOperationsClient(op: InsertOperationsClient & { id?: string }): Promise<OperationsClient> {
    const id = op.id || randomUUID();
    const { data, error } = await supabase.from("operations_clients").insert({ ...op, id }).select().single();
    if (error) throw new Error(error.message);
    return data;
  }

  async updateOperationsClient(id: string, op: Partial<InsertOperationsClient>): Promise<OperationsClient> {
    const { data, error } = await supabase.from("operations_clients").update(op).eq("id", id).select().single();
    if (error) throw new Error(error.message);
    return data;
  }

  async getOperationsClientSteps(operationId: string): Promise<OperationsClientStep[]> {
    const { data } = await supabase.from("operations_client_steps").select("*").eq("client_operation_id", operationId);
    return data || [];
  }

  async updateOperationsClientStep(id: string, step: Partial<InsertOperationsClientStep>): Promise<OperationsClientStep> {
    const { data, error } = await supabase.from("operations_client_steps").update(step).eq("id", id).select().single();
    if (error) throw new Error(error.message);
    return data;
  }

  async getOperationsOnboardings(): Promise<any[]> {
    const { data } = await supabase.from("operations_onboarding").select("*, companies(name), operations_clients(client_name)");
    return data || [];
  }

  async getOperationsOnboarding(operationId: string): Promise<OperationsOnboarding | null> {
    const { data } = await supabase.from("operations_onboarding").select("*").eq("client_operation_id", operationId).maybeSingle();
    return data;
  }

  async upsertOperationsOnboarding(onboarding: InsertOperationsOnboarding & { id?: string }): Promise<OperationsOnboarding> {
    const id = onboarding.id || randomUUID();
    const { data, error } = await supabase.from("operations_onboarding").upsert({ ...onboarding, id }).select().single();
    if (error) throw new Error(error.message);
    return data;
  }

  async getOperationsServiceActivations(): Promise<OperationsServiceActivation[]> {
    const { data } = await supabase.from("operations_service_activations").select("*").order("created_at", { ascending: false });
    return data || [];
  }

  async createOperationsServiceActivation(service: InsertOperationsServiceActivation & { id?: string }): Promise<OperationsServiceActivation> {
    const id = service.id || randomUUID();
    const { data, error } = await supabase.from("operations_service_activations").insert({ ...service, id }).select().single();
    if (error) throw new Error(error.message);
    return data;
  }

  async updateOperationsServiceActivation(id: string, service: Partial<InsertOperationsServiceActivation>): Promise<OperationsServiceActivation> {
    const { data, error } = await supabase.from("operations_service_activations").update(service).eq("id", id).select().single();
    if (error) throw new Error(error.message);
    return data;
  }

  async getActivityLogs(companyId?: string): Promise<ActivityLog[]> {
    let query = supabase.from("activity_logs").select("*").order("created_at", { ascending: false });
    if (companyId) query = query.eq("company_id", companyId);
    const { data } = await query;
    return data || [];
  }

  async createActivityLog(log: InsertActivityLog & { id?: string }): Promise<ActivityLog> {
    const id = log.id || randomUUID();
    const { data, error } = await supabase.from("activity_logs").insert({ ...log, id }).select().single();
    if (error) throw new Error(error.message);
    return data;
  }

  async getOperationsOnboardingByCompany(companyId: string): Promise<OperationsOnboarding | null> {
    const { data } = await supabase.from("operations_onboarding").select("*").eq("company_id", companyId).maybeSingle();
    return data;
  }

  async getClient360(companyId: string): Promise<any> {
    const { data } = await supabase.from("client_360_view").select("*").eq("company_id", companyId).maybeSingle();
    return data;
  }
}

export const storage = new SupabaseStorage();
