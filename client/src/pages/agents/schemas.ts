import { z } from "zod";

export const infoFormSchema = z.object({
  name: z.string().min(2, "El nombre es requerido"),
  tone: z.string(),
  purpose: z.string().min(2, "El propósito es requerido"),
  emoji_style: z.string().nullable(),
  website_url: z.string().url("URL inválida").optional().or(z.literal("")),
  status: z.string(),
});

export const configFormSchema = z.object({
  service_description: z.string().optional(),
  website_url: z.string().url("URL inválida").optional().or(z.literal("")),
});

export const knowledgeFormSchema = z.object({
  faq: z.string().optional(),
  knowledge_url: z.string().url("URL inválida").optional().or(z.literal("")),
});

export type InfoFormData = z.infer<typeof infoFormSchema>;
export type ConfigFormData = z.infer<typeof configFormSchema>;
export type KnowledgeFormData = z.infer<typeof knowledgeFormSchema>;

export const leadFormSchema = z.object({
  name: z.string().min(2, "El nombre es requerido"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().optional(),
  source: z.string().optional(),
  lead_type: z.string().default("low"),
  status: z.string().default("new"),
});

export type LeadFormData = z.infer<typeof leadFormSchema>;
