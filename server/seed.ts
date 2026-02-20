import { supabase } from "./supabase";
import { randomUUID } from "crypto";

async function ensureCatalogTable() {
  const { error } = await supabase.from("catalog").select("id").limit(1);
  if (error && error.code === "PGRST116") {
    return;
  }
  if (error && (error.message.includes("relation") || error.code === "42P01")) {
    console.log("Creating catalog table...");
    const { error: rpcError } = await supabase.rpc("exec_sql", {
      query: `CREATE TABLE IF NOT EXISTS catalog (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id text NOT NULL,
        item_type text NOT NULL CHECK (item_type IN ('product', 'service')),
        name text NOT NULL,
        description text,
        base_price numeric DEFAULT 0,
        currency text DEFAULT 'USD',
        details jsonb DEFAULT '{"includes": [], "restrictions": [], "estimated_time": ""}',
        advanced_config jsonb DEFAULT '{"variable_pricing": null, "execution_process": []}',
        is_active boolean DEFAULT true
      );`,
    });
    if (rpcError) {
      console.log("Note: catalog table may need to be created manually in Supabase SQL editor");
      console.log("Run this SQL in your Supabase dashboard:");
      console.log(`CREATE TABLE IF NOT EXISTS catalog (
  id varchar PRIMARY KEY,
  company_id varchar NOT NULL,
  item_type text NOT NULL,
  name text NOT NULL,
  description text,
  base_price numeric DEFAULT 0,
  currency text DEFAULT 'USD',
  details jsonb DEFAULT '{"includes": [], "restrictions": [], "estimated_time": ""}',
  advanced_config jsonb DEFAULT '{"variable_pricing": null, "execution_process": []}',
  is_active boolean DEFAULT true
);`);
    } else {
      console.log("Catalog table created successfully");
    }
  }
}

export async function seedDatabase() {
  console.log("Seeding database...");

  await ensureCatalogTable();

  // Check if plans already exist
  const { data: existingPlans } = await supabase
    .from("plans")
    .select("*")
    .limit(1);

  if (existingPlans && existingPlans.length > 0) {
    console.log("Plans already exist, skipping seed...");
    return;
  }

  // Seed plans with the correct schema
  const plans = [
    {
      id: randomUUID(),
      name: "Starter",
      description: "Plan ideal para comenzar con leads ilimitados y soporte básico",
      base_price_monthly: 29.99,
      base_price_semestral: 149.99,
      base_price_annual: 249.99,
      default_limits: { leads: 1000, agents: 1, conversations: 500 },
      default_features: ["Leads ilimitados", "1 agente IA", "Soporte por email"],
    },
    {
      id: randomUUID(),
      name: "Professional",
      description: "Plan profesional con más agentes y análisis avanzados",
      base_price_monthly: 59.99,
      base_price_semestral: 299.99,
      base_price_annual: 499.99,
      default_limits: { leads: 5000, agents: 3, conversations: 2000 },
      default_features: ["Leads ilimitados", "3 agentes IA", "Soporte prioritario", "Análisis avanzados"],
    },
    {
      id: randomUUID(),
      name: "Enterprise",
      description: "Plan empresarial con acceso completo y soporte 24/7",
      base_price_monthly: 99.99,
      base_price_semestral: 499.99,
      base_price_annual: 799.99,
      default_limits: { leads: -1, agents: -1, conversations: -1 },
      default_features: ["Leads ilimitados", "Agentes IA ilimitados", "Soporte 24/7", "Análisis avanzados", "API acceso"],
    },
  ];

  const { error: plansError } = await supabase.from("plans").insert(plans);
  if (plansError) {
    console.error("Error seeding plans:", plansError);
  } else {
    console.log("Plans seeded successfully");
  }

  // Seed discount codes with the correct schema
  const discountCodes = [
    {
      id: randomUUID(),
      code: "BIENVENIDO20",
      description: "Descuento de bienvenida del 20%",
      discount_type: "percentage",
      discount_value: 20.00,
      applies_to: "all",
      is_active: true,
      max_uses: 1000,
      used_count: 0,
    },
    {
      id: randomUUID(),
      code: "ANUAL30",
      description: "Descuento del 30% en planes anuales",
      discount_type: "percentage",
      discount_value: 30.00,
      applies_to: "annual",
      billing_cycle: "annual",
      is_active: true,
      max_uses: 500,
      used_count: 0,
    },
  ];

  const { error: discountsError } = await supabase.from("discount_codes").insert(discountCodes);
  if (discountsError) {
    console.error("Error seeding discount codes:", discountsError);
  } else {
    console.log("Discount codes seeded successfully");
  }

  console.log("Database seeding complete!");
}
