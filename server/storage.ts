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
  Lead,
  Message,
  Plan,
  Subscription,
  User,
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

  // Users
  createUser(user: InsertUser & { id?: string }): Promise<User>;
  getUserById(id: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  getAllUsers(): Promise<User[]>;

  // Plans
  createPlan(plan: InsertPlan & { id?: string }): Promise<Plan>;
  getPlan(id: string): Promise<Plan | null>;
  getAllPlans(): Promise<Plan[]>;

  // Subscriptions
  createSubscription(
    subscription: InsertSubscription & { id?: string },
  ): Promise<Subscription>;
  getSubscription(id: string): Promise<Subscription | null>;
  getActiveSubscription(companyId: string): Promise<Subscription | null>;
  getAllSubscriptions(): Promise<Subscription[]>;
  updateSubscription(
    id: string,
    data: Partial<InsertSubscription>,
  ): Promise<Subscription | null>;

  // Discount Codes
  createDiscountCode(
    discount: InsertDiscountCode & { id?: string },
  ): Promise<DiscountCode>;
  getDiscountByCode(code: string): Promise<DiscountCode | null>;
  getAllDiscountCodes(): Promise<DiscountCode[]>;
  incrementDiscountUsage(id: string): Promise<void>;

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
}

export class SupabaseStorage implements IStorage {
  // Companies
  async createCompany(company: InsertCompany): Promise<Company> {
    const id = randomUUID();
    const today = new Date();
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 7);

    const { data, error } = await supabase
      .from("companies")
      .insert({
        id,
        ...company,
        trial_start: today.toISOString().split("T")[0],
        trial_end: trialEnd.toISOString().split("T")[0],
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
    const { data } = await supabase.from("companies").select("*");
    return data || [];
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
    const { data } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();
    return data;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const { data } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .eq("system", "ADMIN")
      .single();
    return data;
  }

  async getAllUsers(): Promise<User[]> {
    const { data } = await supabase.from("users").select("*");
    return data || [];
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

  async getAllPlans(): Promise<Plan[]> {
    const { data } = await supabase.from("plans").select("*");
    return data || [];
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
}

export const storage = new SupabaseStorage();
