import { loginSchema, registerSchema } from "@shared/schema";
import bcrypt from "bcryptjs";
import type { Express } from "express";
import { type Server } from "http";
import {
  authMiddleware,
  AuthRequest,
  generateToken,
  roleMiddleware,
  subscriptionMiddleware,
} from "./middleware/auth";
import { storage } from "./storage";
import { supabase } from "./supabase";

export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {
  // ========== AUTH ROUTES ==========

  // Register - Creates company, client, user, and trial subscription
  app.post("/api/auth/register", async (req, res) => {
    try {
      const validation = registerSchema.safeParse(req.body);
      if (!validation.success) {
        return res
          .status(400)
          .json({ message: validation.error.errors[0].message });
      }

      const { company_name, name, email, password, phone } = validation.data;

      // Check if user exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "El email ya está registrado" });
      }

      // Create company (using name field as per Supabase schema)
      const company = await storage.createCompany({
        legal_name: company_name,
        name: name,
        contact_email: email,
        contact_phone: phone || null,
        status: "active",
      });

      // Hash password and create user (using password_hash as per Supabase schema)
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await storage.createUser({
        company_id: company.id,
        email,
        password_hash: hashedPassword,
        name,
        role: "company_admin",
        status: "active",
      });

      // Create trial subscription (7 days)
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 7);

      const subscription = await storage.createSubscription({
        company_id: company.id,
        status: "trial",
        billing_cycle: "trial",
        start_date: startDate.toISOString().split("T")[0],
        end_date: endDate.toISOString().split("T")[0],
        base_price: "0",
        final_price: "0",
      });

      // Generate token
      const token = generateToken({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        company_id: user.company_id,
      });

      const { password_hash: _, ...userWithoutPassword } = user;

      res.json({
        user: userWithoutPassword,
        company,
        subscription,
        token,
      });
    } catch (error) {
      console.error("Register error:", error);
      res.status(500).json({ message: "Error al registrar usuario" });
    }
  });

  // Login
  app.post("/api/auth/login", async (req, res) => {
    try {
      const validation = loginSchema.safeParse(req.body);
      if (!validation.success) {
        return res
          .status(400)
          .json({ message: validation.error.errors[0].message });
      }

      const { email, password } = validation.data;

      // Find user
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Credenciales inválidas" });
      }

      // Verify password (using password_hash from Supabase schema)
      const isValid = await bcrypt.compare(password, user.password_hash);
      if (!isValid) {
        return res.status(401).json({ message: "Credenciales inválidas" });
      }

      // Check user status
      if (user.status !== "active") {
        return res.status(403).json({ message: "Tu usuario está desactivado. Contacta al administrador." });
      }

      // Get company
      const company = await storage.getCompany(user.company_id);
      if (!company) {
        return res.status(500).json({ message: "Error al obtener empresa" });
      }

      // Check company status
      if (company.status !== "active") {
        return res.status(403).json({ message: "La empresa está desactivada. Contacta soporte." });
      }

      // Get subscription
      const subscription = await storage.getActiveSubscription(user.company_id);

      // Allow Superadmins to bypass subscription check? 
      // Actually, rule 6 says: "Users can access the platform only if... subscriptions.status IN (...)"
      // But typically superadmins don't need a subscription. 
      // Rule 6 might only apply to CLIENTE system users.

      if (user.role !== "superadmin") {
        if (!subscription) {
          return res.status(403).json({ message: "No hay suscripción activa o válida para esta cuenta." });
        }

        const validStatuses = ["active", "trial", "grace_period"];
        if (!validStatuses.includes(subscription.status)) {
          return res.status(403).json({ message: `Tu suscripción está ${subscription.status}. Contacta a administración.` });
        }

        // Check if subscription expired
        const endDate = new Date(subscription.end_date);
        if (endDate < new Date()) {
          // If it's expired by date, update status if not already handled
          if (subscription.status !== "expired" && subscription.status !== "cancelled") {
            await storage.updateSubscription(subscription.id, { status: "expired" });
            return res.status(403).json({ message: "Tu suscripción ha expirado." });
          }
        }
      }

      // Generate token
      const token = generateToken({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        company_id: user.company_id,
      });

      const { password_hash: _, ...userWithoutPassword } = user;

      res.json({
        user: userWithoutPassword,
        company,
        subscription,
        token,
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Error al iniciar sesión" });
    }
  });

  // ========== ADMIN MANAGEMENT ROUTES (COMPANIES & USERS) ==========

  app.get(
    "/api/admin/companies",
    authMiddleware as any,
    roleMiddleware("superadmin") as any,
    async (req, res) => {
      try {
        const companies = await storage.getAllCompanies();
        const subscriptions = await storage.getAllSubscriptions();

        const enrichedCompanies = companies.map(c => {
          const sub = subscriptions
            .filter(s => s.company_id === c.id)
            .sort((a, b) => {
              const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
              const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
              return dateB - dateA;
            })[0];

          return {
            ...c,
            current_subscription_status: sub ? sub.status : "none"
          };
        });

        res.json(enrichedCompanies);
      } catch (error) {
        res.status(500).json({ message: "Error al obtener empresas" });
      }
    }
  );

  app.post(
    "/api/admin/companies",
    authMiddleware as any,
    roleMiddleware("superadmin") as any,
    async (req: AuthRequest, res) => {
      try {
        const { company: companyData, admin: adminData } = req.body;

        // 1. Create Company
        const company = await storage.createCompany({
          ...companyData,
          status: companyData.status || "active",
        });

        // 2. Create Admin User
        const hashedPassword = await bcrypt.hash(adminData.password, 10);
        const admin = await storage.createUser({
          company_id: company.id,
          email: adminData.email,
          name: adminData.name,
          password_hash: hashedPassword,
          role: "company_admin",
          status: "active",
          system: "CLIENTE",
        });

        // Log action
        await storage.logSecurityAction({
          user_id: req.user!.id,
          company_id: company.id,
          action: "company_provisioned",
          details: { company_id: company.id, admin_id: admin.id }
        });

        res.json({ company, admin });
      } catch (error) {
        console.error("Provisioning error:", error);
        res.status(500).json({ message: "Error al crear empresa y administrador" });
      }
    }
  );

  app.get(
    "/api/admin/companies/:id",
    authMiddleware as any,
    roleMiddleware("superadmin") as any,
    async (req, res) => {
      try {
        const company = await storage.getCompany(req.params.id as string);
        if (!company) return res.status(404).json({ message: "Empresa no encontrada" });
        res.json(company);
      } catch (error) {
        res.status(500).json({ message: "Error al obtener empresa" });
      }
    }
  );

  app.patch(
    "/api/admin/companies/:id",
    authMiddleware as any,
    roleMiddleware("superadmin") as any,
    async (req, res) => {
      try {
        const updated = await storage.updateCompany(req.params.id as string, req.body);
        res.json(updated);
      } catch (error) {
        res.status(500).json({ message: "Error al actualizar empresa" });
      }
    }
  );

  app.get(
    "/api/admin/companies/:id/users",
    authMiddleware as any,
    roleMiddleware("superadmin") as any,
    async (req, res) => {
      try {
        const users = await storage.getCompanyUsers(req.params.id as string);
        const filteredUsers = users.filter(u => u.system !== "ADMIN");
        res.json(filteredUsers);
      } catch (error) {
        res.status(500).json({ message: "Error al obtener usuarios" });
      }
    }
  );

  app.post(
    "/api/admin/companies/:id/users",
    authMiddleware as any,
    roleMiddleware("superadmin") as any,
    async (req: AuthRequest, res) => {
      try {
        const { email, password, name, role } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await storage.createUser({
          company_id: req.params.id as string,
          email,
          name,
          password_hash: hashedPassword,
          role: role || "company_user",
          status: "active",
          system: "CLIENTE",
        });

        await storage.logSecurityAction({
          user_id: req.user!.id,
          company_id: req.params.id as string,
          action: "user_created",
          details: { new_user_id: user.id }
        });

        res.json(user);
      } catch (error) {
        res.status(500).json({ message: "Error al crear usuario" });
      }
    }
  );

  // Platform Admins
  app.get(
    "/api/admin/users/superadmins",
    authMiddleware as any,
    roleMiddleware("superadmin") as any,
    async (req, res) => {
      try {
        const admins = await storage.getSuperadmins();
        res.json(admins);
      } catch (error) {
        res.status(500).json({ message: "Error al obtener superadmins" });
      }
    }
  );

  app.post(
    "/api/admin/users/superadmins",
    authMiddleware as any,
    roleMiddleware("superadmin") as any,
    async (req: AuthRequest, res) => {
      try {
        const { email, password, name } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);

        const admin = await storage.createUser({
          company_id: req.user!.company_id, // Assigned to system company
          email,
          name,
          password_hash: hashedPassword,
          role: "superadmin",
          status: "active",
          system: "ADMIN",
        });

        res.json(admin);
      } catch (error) {
        res.status(500).json({ message: "Error al crear superadmin" });
      }
    }
  );

  app.patch(
    "/api/admin/users/:id/status",
    authMiddleware as any,
    roleMiddleware("superadmin") as any,
    async (req: AuthRequest, res) => {
      try {
        const updated = await storage.updateUser(req.params.id as string, { status: req.body.status });
        res.json(updated);
      } catch (error) {
        res.status(500).json({ message: "Error al actualizar estado de usuario" });
      }
    }
  );

  app.post(
    "/api/admin/users/:id/reset-password",
    authMiddleware as any,
    roleMiddleware("superadmin") as any,
    async (req: AuthRequest, res) => {
      try {
        const { password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        await storage.updateUser(req.params.id as string, { password_hash: hashedPassword });

        await storage.logSecurityAction({
          user_id: req.user!.id,
          company_id: "SYSTEM",
          action: "password_reset",
          details: { target_user_id: req.params.id as string }
        });

        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ message: "Error al resetear password" });
      }
    }
  );

  app.delete(
    "/api/admin/users/:id",
    authMiddleware as any,
    roleMiddleware("superadmin") as any,
    async (req, res) => {
      try {
        await storage.deleteUser(req.params.id as string);
        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ message: "Error al eliminar usuario" });
      }
    }
  );

  // ========== SUBSCRIPTION ROUTES ==========

  app.post(
    "/api/admin/subscriptions",
    authMiddleware as any,
    roleMiddleware("superadmin") as any,
    async (req: AuthRequest, res) => {
      try {
        const {
          company_id,
          plan_id,
          billing_cycle,
          start_date,
          end_date,
          base_price,
          final_price,
          status,
          setup_fee_paid,
        } = req.body;

        const plan = await storage.getPlan(plan_id);
        if (!plan) return res.status(404).json({ message: "Plan no encontrado" });

        // Check for existing active/trial/grace subscription
        const existingSub = await storage.getActiveSubscription(company_id);
        if (existingSub) {
          const blockedStatuses = ["active", "trial", "grace_period"];
          if (blockedStatuses.includes(existingSub.status)) {
            return res.status(400).json({
              message: `La empresa ya tiene una suscripción vigente (${existingSub.status}). Debe cancelarla antes de asignar una nueva.`
            });
          }
        }

        const subscription = await storage.createSubscription({
          company_id,
          plan_id,
          billing_cycle,
          start_date,
          end_date,
          base_price: base_price?.toString() || "0",
          final_price: final_price?.toString() || "0",
          status: status || "active",
          setup_fee_paid: setup_fee_paid?.toString() || "0",
          snapshot_limits: plan.default_limits as any,
          snapshot_features: plan.default_features as any,
          system: "company",
        });

        await storage.logSecurityAction({
          user_id: req.user!.id,
          company_id: company_id,
          action: "subscription_created_admin",
          target_id: subscription.id,
          details: { plan_id, billing_cycle },
        });

        res.json(subscription);
      } catch (error) {
        console.error("Admin subscription creation error:", error);
        res.status(500).json({ message: "Error al crear suscripción" });
      }
    },
  );

  app.get(
    "/api/subscription/current",
    authMiddleware as any,
    async (req: AuthRequest, res) => {
      try {
        const subscription = await storage.getActiveSubscription(
          req.user!.company_id,
        );
        res.json(subscription);
      } catch (error) {
        res.status(500).json({ message: "Error al obtener suscripción" });
      }
    },
  );

  app.post(
    "/api/subscription/activate",
    authMiddleware as any,
    roleMiddleware("company_admin", "superadmin") as any,
    async (req: AuthRequest, res) => {
      try {
        const { plan_id, billing_cycle, discount_code } = req.body;

        if (!plan_id || !billing_cycle) {
          return res
            .status(400)
            .json({ message: "Plan y ciclo de facturación requeridos" });
        }

        const plan = await storage.getPlan(plan_id);
        if (!plan) {
          return res.status(404).json({ message: "Plan no encontrado" });
        }

        // Get base price based on billing cycle
        let basePrice: number;
        switch (billing_cycle) {
          case "monthly":
            basePrice = parseFloat(plan.base_price_monthly || "0");
            break;
          case "semestral":
            basePrice = parseFloat(plan.base_price_semestral || "0");
            break;
          case "annual":
            basePrice = parseFloat(plan.base_price_annual || "0");
            break;
          default:
            basePrice = parseFloat(plan.base_price_monthly || "0");
        }

        let finalPrice = basePrice;

        // Apply discount if provided
        if (discount_code) {
          const discount = await storage.getDiscountByCode(
            discount_code.toUpperCase(),
          );
          if (discount && discount.is_active) {
            // Check if discount has expired
            if (discount.end_date) {
              const endDate = new Date(discount.end_date);
              if (endDate < new Date()) {
                return res
                  .status(400)
                  .json({ message: "Código de descuento expirado" });
              }
            }

            // Check billing cycle restriction
            if (
              discount.billing_cycle &&
              discount.billing_cycle !== billing_cycle
            ) {
              return res.status(400).json({
                message: `Este código solo aplica para ciclo ${discount.billing_cycle}`,
              });
            }

            // Check max uses (if tracked)
            if (
              discount.max_uses &&
              discount.used_count !== null &&
              discount.used_count !== undefined
            ) {
              if (discount.used_count >= discount.max_uses) {
                return res.status(400).json({
                  message: "Este código ha alcanzado su límite de usos",
                });
              }
            }

            // Apply discount
            if (discount.discount_type === "percentage") {
              // Cap percentage at 100%
              const percentage = Math.min(
                parseFloat(discount.discount_value?.toString() || "0"),
                100,
              );
              const discountAmount = (finalPrice * percentage) / 100;
              finalPrice = finalPrice - discountAmount;
            } else if (discount.discount_type === "fixed") {
              finalPrice =
                finalPrice -
                parseFloat(discount.discount_value?.toString() || "0");
            }
            finalPrice = Math.max(0, finalPrice); // Ensure not negative

            // Increment usage count (if max_uses is set)
            if (discount.max_uses) {
              await storage.incrementDiscountUsage(discount.id);
            }
          }
        }

        // Calculate end date based on billing cycle
        const startDate = new Date();
        const endDate = new Date();

        switch (billing_cycle) {
          case "monthly":
            endDate.setMonth(endDate.getMonth() + 1);
            break;
          case "semestral":
            endDate.setMonth(endDate.getMonth() + 6);
            break;
          case "annual":
            endDate.setFullYear(endDate.getFullYear() + 1);
            break;
          default:
            endDate.setMonth(endDate.getMonth() + 1);
        }

        const subscription = await storage.createSubscription({
          company_id: req.user!.company_id,
          plan_id: plan.id,
          status: "active",
          billing_cycle,
          start_date: startDate.toISOString().split("T")[0],
          end_date: endDate.toISOString().split("T")[0],
          base_price: basePrice.toFixed(2),
          final_price: finalPrice.toFixed(2),
        });

        res.json(subscription);
      } catch (error) {
        console.error("Activate subscription error:", error);
        res.status(500).json({ message: "Error al activar suscripción" });
      }
    },
  );

  // ========== ADMIN SUBSCRIPTION ROUTES ==========
  app.get(
    "/api/admin/subscriptions/dashboard",
    authMiddleware as any,
    roleMiddleware("superadmin", "company_admin") as any,
    async (req: AuthRequest, res) => {
      try {
        const kpis = await storage.getAdminSubscriptionDashboardKPIs();
        const subscriptions = await storage.getAdminSubscriptionsDetails();
        res.json({ kpis, subscriptions });
      } catch (error) {
        console.error("Admin dashboard error:", error);
        res
          .status(500)
          .json({ message: "Error al obtener dashboard de suscripciones" });
      }
    },
  );

  app.post(
    "/api/admin/subscriptions/:id/plan",
    authMiddleware as any,
    roleMiddleware("superadmin", "company_admin") as any,
    async (req: AuthRequest, res) => {
      try {
        const { id } = req.params;
        const { plan_id } = req.body;

        const plan = await storage.getPlan(plan_id as string);
        if (!plan)
          return res.status(404).json({ message: "Plan no encontrado" });

        const updated = await storage.updateSubscription(id as string, {
          plan_id: plan_id as string,
          snapshot_limits: plan.default_limits as any,
          snapshot_features: plan.default_features as any,
        });

        await storage.logSecurityAction({
          company_id: updated?.company_id || req.user!.company_id,
          user_id: req.user!.id,
          action: "subscription_plan_changed",
          target_id: id as string,
          details: { new_plan_id: plan_id },
        });

        res.json(updated);
      } catch (error) {
        res.status(500).json({ message: "Error al cambiar plan" });
      }
    },
  );

  app.post(
    "/api/admin/subscriptions/:id/addons",
    authMiddleware as any,
    roleMiddleware("superadmin", "company_admin") as any,
    async (req: AuthRequest, res) => {
      try {
        const { id } = req.params;
        const { addon_name, price } = req.body;

        const addon = await storage.addSubscriptionAddon({
          subscription_id: id as string,
          addon_name,
          price: price || "0",
        });

        await storage.logSecurityAction({
          company_id: req.user!.company_id,
          user_id: req.user!.id,
          action: "addon_added",
          target_id: id as string,
          details: { addon_name },
        });

        res.json(addon);
      } catch (error) {
        res.status(500).json({ message: "Error al agregar addon" });
      }
    },
  );

  app.delete(
    "/api/admin/subscriptions/:id/addons/:addonId",
    authMiddleware as any,
    roleMiddleware("superadmin", "company_admin") as any,
    async (req: AuthRequest, res) => {
      try {
        const { id, addonId } = req.params;
        await storage.removeSubscriptionAddon(addonId);

        await storage.logSecurityAction({
          company_id: req.user!.company_id,
          user_id: req.user!.id,
          action: "addon_removed",
          target_id: id as string,
          details: { addon_id: addonId },
        });
        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ message: "Error al eliminar addon" });
      }
    },
  );

  app.post(
    "/api/admin/subscriptions/:id/grace-period",
    authMiddleware as any,
    roleMiddleware("superadmin", "company_admin") as any,
    async (req: AuthRequest, res) => {
      try {
        const { id } = req.params;
        const { end_date } = req.body;

        const updated = await storage.updateSubscription(id, {
          end_date,
          status: "grace_period",
        });

        await storage.logSecurityAction({
          company_id: updated?.company_id || req.user!.company_id,
          user_id: req.user!.id,
          action: "grace_period_granted",
          target_id: id as string,
          details: { end_date },
        });

        res.json(updated);
      } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Error al extender grace period" });
      }
    },
  );

  app.post(
    "/api/admin/subscriptions/:id/cancel",
    authMiddleware as any,
    roleMiddleware("superadmin", "company_admin") as any,
    async (req: AuthRequest, res) => {
      try {
        const { id } = req.params;

        const updated = await storage.updateSubscription(id, {
          status: "cancelled",
        });

        await storage.logSecurityAction({
          company_id: updated?.company_id || req.user!.company_id,
          user_id: req.user!.id,
          action: "subscription_cancelled",
          target_id: id as string,
        });

        res.json(updated);
      } catch (error) {
        res.status(500).json({ message: "Error al cancelar suscripcion" });
      }
    },
  );

  app.post(
    "/api/admin/subscriptions/:id/discounts",
    authMiddleware as any,
    roleMiddleware("superadmin", "company_admin") as any,
    async (req: AuthRequest, res) => {
      try {
        const { id } = req.params;
        const { discount_code, amount } = req.body;

        const discountItem = await storage.addSubscriptionDiscount({
          subscription_id: id as string,
          discount_code,
          amount,
        });

        // Also update final_price on the subscription
        const sub = await storage.getSubscription(id);
        if (sub) {
          const currentPrice = parseFloat(sub.final_price || "0");
          const discountAmt = parseFloat(amount || "0");
          const newPrice = Math.max(0, currentPrice - discountAmt);
          await storage.updateSubscription(id, {
            final_price: newPrice.toString(),
          });
        }

        await storage.logSecurityAction({
          company_id: req.user!.company_id,
          user_id: req.user!.id,
          action: "discount_applied",
          target_id: id as string,
          details: { discount_code, amount },
        });

        res.json(discountItem);
      } catch (error) {
        res.status(500).json({ message: "Error al aplicar descuento" });
      }
    },
  );

  // ========== PLANS ROUTES ==========

  app.get("/api/plans", authMiddleware as any, async (req, res) => {
    try {
      const plans = await storage.getPlans();
      res.json(plans);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener planes" });
    }
  });

  app.put(
    "/api/admin/plans/:id",
    authMiddleware as any,
    roleMiddleware("superadmin", "company_admin") as any,
    async (req: AuthRequest, res) => {
      try {
        const { id } = req.params;
        const updates = req.body;
        const updated = await storage.updatePlan(id, updates);
        res.json(updated);
      } catch (error) {
        res.status(500).json({ message: "Error al actualizar plan" });
      }
    },
  );

  // ========== DISCOUNT ROUTES ==========

  app.post(
    "/api/discount/validate",
    authMiddleware as any,
    async (req, res) => {
      try {
        const { code, billing_cycle } = req.body;
        if (!code) {
          return res
            .status(400)
            .json({ valid: false, message: "Código requerido" });
        }

        const discount = await storage.getDiscountByCode(code.toUpperCase());
        if (!discount) {
          return res.json({ valid: false, message: "Código no válido" });
        }

        // Check if active
        if (!discount.is_active) {
          return res.json({ valid: false, message: "Código no activo" });
        }

        // Check if expired
        if (discount.end_date) {
          const endDate = new Date(discount.end_date);
          if (endDate < new Date()) {
            return res.json({ valid: false, message: "Código expirado" });
          }
        }

        // Check billing cycle restriction
        if (
          discount.billing_cycle &&
          billing_cycle &&
          discount.billing_cycle !== billing_cycle
        ) {
          return res.json({
            valid: false,
            message: `Este código solo aplica para ciclo ${discount.billing_cycle}`,
          });
        }

        res.json({
          valid: true,
          discount: {
            id: discount.id,
            code: discount.code,
            discount_type: discount.discount_type,
            discount_value: discount.discount_value,
            description: discount.description,
          },
        });
      } catch (error) {
        res
          .status(500)
          .json({ valid: false, message: "Error al validar código" });
      }
    },
  );

  app.get("/api/admin/discounts", authMiddleware as any, async (req, res) => {
    try {
      const discounts = await storage.getAllDiscountCodes();
      res.json(discounts);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener descuentos" });
    }
  });

  app.put(
    "/api/admin/discounts/:id",
    authMiddleware as any,
    roleMiddleware("superadmin", "company_admin") as any,
    async (req: AuthRequest, res) => {
      try {
        const { id } = req.params;
        const updates = req.body;
        const updated = await storage.updateDiscountCode(id, updates);
        res.json(updated);
      } catch (error) {
        res.status(500).json({ message: "Error al actualizar descuento" });
      }
    },
  );

  // ========== LEADS ROUTES ==========

  app.get(
    "/api/leads",
    authMiddleware as any,
    subscriptionMiddleware as any,
    async (req: AuthRequest, res) => {
      try {
        const leads = await storage.getLeadsByCompany(req.user!.company_id);
        res.json(leads);
      } catch (error) {
        res.status(500).json({ message: "Error al obtener leads" });
      }
    },
  );

  app.post(
    "/api/leads",
    authMiddleware as any,
    subscriptionMiddleware as any,
    async (req: AuthRequest, res) => {
      try {
        const { name, email, phone, source, lead_type, status } = req.body;

        if (!name) {
          return res.status(400).json({ message: "El nombre es requerido" });
        }

        const lead = await storage.createLead({
          company_id: req.user!.company_id,
          name,
          email: email || null,
          phone: phone || null,
          source: source || null,
          lead_type: lead_type || "low",
          status: status || "new",
        });

        res.json(lead);
      } catch (error) {
        console.error("Create lead error:", error);
        res.status(500).json({ message: "Error al crear lead" });
      }
    },
  );

  app.put(
    "/api/leads/:id",
    authMiddleware as any,
    subscriptionMiddleware as any,
    async (req: AuthRequest, res) => {
      try {
        const { id } = req.params;
        const { name, email, phone, source, lead_type, status } = req.body;

        if (!name) {
          return res.status(400).json({ message: "El nombre es requerido" });
        }

        const updatedLead = await storage.updateLead(id, {
          name,
          email: email || null,
          phone: phone || null,
          source: source || null,
          lead_type: lead_type || "low",
          status: status || "new",
        });

        if (!updatedLead) {
          return res.status(404).json({ message: "Lead no encontrado" });
        }

        res.json(updatedLead);
      } catch (error) {
        console.error("Update lead error:", error);
        res.status(500).json({ message: "Error al actualizar lead" });
      }
    },
  );

  // ========== CONVERSATIONS ROUTES ==========

  app.get(
    "/api/conversations",
    authMiddleware as any,
    subscriptionMiddleware as any,
    async (req: AuthRequest, res) => {
      try {
        const conversations = await storage.getConversationsByCompany(
          req.user!.company_id,
        );
        res.json(conversations);
      } catch (error) {
        res.status(500).json({ message: "Error al obtener conversaciones" });
      }
    },
  );

  // ========== MESSAGES ROUTES ==========
  app.get(
    "/api/conversations/:id/messages",
    authMiddleware as any,
    subscriptionMiddleware as any,
    async (req: AuthRequest, res) => {
      try {
        const conversationId = req.params.id;

        if (!conversationId) {
          return res
            .status(400)
            .json({ message: "conversationId es requerido" });
        }

        const messages = await storage.getMessagesByConversation(
          conversationId as string
        );

        res.json(messages);
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al obtener mensajes" });
      }
    },
  );
  // ========== AGENTS ROUTES ==========

  app.get(
    "/api/agents",
    authMiddleware as any,
    subscriptionMiddleware as any,
    async (req: AuthRequest, res) => {
      try {
        const agents = await storage.getAgentsByCompany(req.user!.company_id);
        res.json(agents);
      } catch (error) {
        res.status(500).json({ message: "Error al obtener agentes" });
      }
    },
  );

  app.post(
    "/api/agents",
    authMiddleware as any,
    subscriptionMiddleware as any,
    roleMiddleware("company_admin", "superadmin") as any,
    async (req: AuthRequest, res) => {
      try {
        const { name, tone, emoji_style, configuration, purpose } = req.body;

        if (!name) {
          return res.status(400).json({ message: "El nombre es requerido" });
        }

        const agent = await storage.createAgent({
          company_id: req.user!.company_id,
          name,
          tone: tone || "professional",
          emoji_style: emoji_style || null,
          configuration: configuration || null,
          purpose: purpose || "Asistente virtual",
          status: "active",
        });

        res.json(agent);
      } catch (error) {
        console.error("Create agent error:", error);
        res.status(500).json({ message: "Error al crear agente" });
      }
    },
  );

  // Get single agent
  app.get(
    "/api/agents/:id",
    authMiddleware as any,
    subscriptionMiddleware as any,
    async (req: AuthRequest, res) => {
      try {
        const agent = await storage.getAgentById(req.params.id);

        if (!agent) {
          return res.status(404).json({ message: "Agente no encontrado" });
        }

        // Verify agent belongs to user's company
        if (agent.company_id !== req.user!.company_id) {
          return res
            .status(403)
            .json({ message: "No tienes acceso a este agente" });
        }

        res.json(agent);
      } catch (error) {
        res.status(500).json({ message: "Error al obtener agente" });
      }
    },
  );

  // Update agent
  app.put(
    "/api/agents/:id",
    authMiddleware as any,
    subscriptionMiddleware as any,
    roleMiddleware("company_admin", "superadmin") as any,
    async (req: AuthRequest, res) => {
      try {
        const agent = await storage.getAgentById(req.params.id);

        if (!agent) {
          return res.status(404).json({ message: "Agente no encontrado" });
        }

        if (agent.company_id !== req.user!.company_id) {
          return res
            .status(403)
            .json({ message: "No tienes acceso a este agente" });
        }

        const {
          name,
          tone,
          emoji_style,
          configuration,
          status,
          service_description,
          faq,
        } = req.body;

        const updated = await storage.updateAgent(req.params.id, {
          name: name !== undefined ? name : agent.name,
          tone: tone !== undefined ? tone : agent.tone,
          emoji_style:
            emoji_style !== undefined ? emoji_style : agent.emoji_style,
          configuration:
            configuration !== undefined ? configuration : agent.configuration,
          purpose:
            req.body.purpose !== undefined ? req.body.purpose : agent.purpose,
          status: status !== undefined ? status : agent.status,
          service_description:
            service_description !== undefined
              ? service_description
              : agent.service_description,
          faq: faq !== undefined ? faq : agent.faq,
          website_url:
            req.body.website_url !== undefined
              ? req.body.website_url
              : agent.website_url,
          test_mode:
            req.body.test_mode !== undefined
              ? req.body.test_mode
              : agent.test_mode,
        });

        res.json(updated);
      } catch (error) {
        console.error("Update agent error:", error);
        res.status(500).json({ message: "Error al actualizar agente" });
      }
    },
  );

  // Agent stats
  app.get(
    "/api/agents/:id/stats",
    authMiddleware as any,
    subscriptionMiddleware as any,
    async (req: AuthRequest, res) => {
      try {
        const agent = await storage.getAgentById(req.params.id);

        if (!agent) {
          return res.status(404).json({ message: "Agente no encontrado" });
        }

        if (agent.company_id !== req.user!.company_id) {
          return res
            .status(403)
            .json({ message: "No tienes acceso a este agente" });
        }

        const stats = await storage.getAgentStats(
          req.params.id,
          req.user!.company_id,
        );

        res.json({
          status: agent.status,
          ...stats,
        });
      } catch (error) {
        res.status(500).json({ message: "Error al obtener estadísticas" });
      }
    },
  );

  // Test chat with agent
  app.post(
    "/api/agents/:id/test-chat",
    authMiddleware as any,
    subscriptionMiddleware as any,
    async (req: AuthRequest, res) => {
      try {
        const agent = await storage.getAgentById(req.params.id);

        if (!agent) {
          return res.status(404).json({ message: "Agente no encontrado" });
        }

        if (agent.company_id !== req.user!.company_id) {
          return res
            .status(403)
            .json({ message: "No tienes acceso a este agente" });
        }

        const { message } = req.body;

        if (!message) {
          return res.status(400).json({ message: "El mensaje es requerido" });
        }

        // Simulate agent response based on configuration
        const config = agent.configuration as {
          internal_prompt?: string;
        } | null;

        // Generate simulated response based on tone and configuration
        const toneResponses: Record<string, string> = {
          professional: "Gracias por tu mensaje. ",
          friendly: "¡Hola! Gracias por escribirnos. ",
          formal: "Estimado cliente, agradecemos su comunicación. ",
        };

        const greeting =
          toneResponses[agent.tone || "professional"] ||
          toneResponses.professional;

        let response = greeting;

        if (config?.objective) {
          response += `Mi objetivo es ${config.objective.toLowerCase()}. `;
        }

        response += "¿En qué puedo ayudarte hoy?";

        // Add emoji if configured
        if (agent.emoji_style || (config as any)?.use_emojis) {
          response += " 😊";
        }

        // Simulate delay for realistic response
        await new Promise((resolve) => setTimeout(resolve, 500));

        res.json({
          response,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.error("Test chat error:", error);
        res.status(500).json({ message: "Error en el chat de prueba" });
      }
    },
  );

  // ========== CATALOG ROUTES ==========

  app.get(
    "/api/admin/catalog/:companyId",
    authMiddleware as any,
    subscriptionMiddleware as any,
    async (req: AuthRequest, res) => {
      try {
        if (
          req.params.companyId !== req.user!.company_id &&
          req.user!.role !== "superadmin"
        ) {
          return res
            .status(403)
            .json({ message: "No tienes acceso a este catálogo" });
        }
        const items = await storage.getCatalogByCompany(req.params.companyId);
        res.json(items);
      } catch (error) {
        console.error("Get catalog error:", error);
        res.status(500).json({ message: "Error al obtener catálogo" });
      }
    },
  );

  app.post(
    "/api/catalog",
    authMiddleware as any,
    subscriptionMiddleware as any,
    roleMiddleware("company_admin", "superadmin") as any,
    async (req: AuthRequest, res) => {
      try {
        const {
          item_type,
          name,
          description,
          base_price,
          currency,
          details,
          advanced_config,
        } = req.body;

        if (!name || !item_type) {
          return res
            .status(400)
            .json({ message: "Nombre y tipo son requeridos" });
        }

        if (!["product", "service"].includes(item_type)) {
          return res
            .status(400)
            .json({ message: "Tipo debe ser 'product' o 'service'" });
        }

        const item = await storage.createCatalogItem({
          company_id: req.user!.company_id,
          item_type,
          name,
          description: description || null,
          base_price: base_price?.toString() || "0",
          currency: currency || "USD",
          details: details || {
            includes: [],
            restrictions: [],
            estimated_time: "",
          },
          advanced_config: advanced_config || {
            variable_pricing: null,
            execution_process: [],
          },
          is_active: true,
        });

        res.json(item);
      } catch (error) {
        console.error("Create catalog item error:", error);
        res.status(500).json({ message: "Error al crear item" });
      }
    },
  );

  app.patch(
    "/api/catalog/:id",
    authMiddleware as any,
    subscriptionMiddleware as any,
    roleMiddleware("company_admin", "superadmin") as any,
    async (req: AuthRequest, res) => {
      try {
        const existing = await storage.getCatalogItem(req.params.id);
        if (!existing) {
          return res.status(404).json({ message: "Item no encontrado" });
        }
        if (
          existing.company_id !== req.user!.company_id &&
          req.user!.role !== "superadmin"
        ) {
          return res
            .status(403)
            .json({ message: "No tienes acceso a este item" });
        }

        const updates: any = {};
        const fields = [
          "item_type",
          "name",
          "description",
          "base_price",
          "currency",
          "details",
          "advanced_config",
          "is_active",
        ];
        for (const field of fields) {
          if (req.body[field] !== undefined) {
            updates[field] =
              field === "base_price"
                ? req.body[field]?.toString()
                : req.body[field];
          }
        }

        const updated = await storage.updateCatalogItem(req.params.id, updates);
        res.json(updated);
      } catch (error) {
        console.error("Update catalog item error:", error);
        res.status(500).json({ message: "Error al actualizar item" });
      }
    },
  );

  app.delete(
    "/api/catalog/:id",
    authMiddleware as any,
    subscriptionMiddleware as any,
    roleMiddleware("company_admin", "superadmin") as any,
    async (req: AuthRequest, res) => {
      try {
        const existing = await storage.getCatalogItem(req.params.id);
        if (!existing) {
          return res.status(404).json({ message: "Item no encontrado" });
        }
        if (
          existing.company_id !== req.user!.company_id &&
          req.user!.role !== "superadmin"
        ) {
          return res
            .status(403)
            .json({ message: "No tienes acceso a este item" });
        }

        await storage.deleteCatalogItem(req.params.id);
        res.json({ success: true });
      } catch (error) {
        console.error("Delete catalog item error:", error);
        res.status(500).json({ message: "Error al eliminar item" });
      }
    },
  );

  // ========== ADMIN ROUTES =========

  // Admin - Companies
  app.get(
    "/api/admin/companies",
    authMiddleware as any,
    roleMiddleware("superadmin") as any,
    async (req, res) => {
      try {
        const companies = await storage.getAllCompanies();
        res.json(companies);
      } catch (error) {
        res.status(500).json({ message: "Error al obtener empresas" });
      }
    },
  );

  // Admin - Plans
  app.post(
    "/api/admin/plans",
    authMiddleware as any,
    roleMiddleware("superadmin") as any,
    async (req, res) => {
      try {
        const {
          name,
          description,
          base_price_monthly,
          base_price_semestral,
          base_price_annual,
          default_limits,
          default_features,
        } = req.body;

        const plan = await storage.createPlan({
          name,
          description,
          base_price_monthly,
          base_price_semestral,
          base_price_annual,
          default_limits: default_limits || null,
          default_features: default_features || null,
        });

        res.json(plan);
      } catch (error) {
        console.error("Create plan error:", error);
        res.status(500).json({ message: "Error al crear plan" });
      }
    },
  );

  // Admin - Discounts
  app.get(
    "/api/admin/discounts",
    authMiddleware as any,
    roleMiddleware("superadmin") as any,
    async (req, res) => {
      try {
        const discounts = await storage.getAllDiscountCodes();
        res.json(discounts);
      } catch (error) {
        res.status(500).json({ message: "Error al obtener descuentos" });
      }
    },
  );

  app.post(
    "/api/admin/discounts",
    authMiddleware as any,
    roleMiddleware("superadmin") as any,
    async (req, res) => {
      try {
        const {
          code,
          description,
          discount_type,
          discount_value,
          applies_to,
          billing_cycle,
          start_date,
          end_date,
          max_uses,
        } = req.body;

        const discount = await storage.createDiscountCode({
          code: code.toUpperCase(),
          description,
          discount_type: discount_type || "percentage",
          discount_value,
          applies_to,
          billing_cycle,
          start_date,
          end_date,
          max_uses,
          is_active: true,
        });

        res.json(discount);
      } catch (error) {
        console.error("Create discount error:", error);
        res.status(500).json({ message: "Error al crear descuento" });
      }
    },
  );

  // Admin - Subscriptions
  app.get(
    "/api/admin/companies/:id/users",
    authMiddleware as any,
    roleMiddleware("superadmin") as any,
    async (req, res) => {
      try {
        const users = await storage.getUsersByCompany(req.params.id as string);
        res.json(users);
      } catch (error) {
        res.status(500).json({ message: "Error al listar usuarios" });
      }
    }
  );

  app.get(
    "/api/admin/companies/:id/activity",
    authMiddleware as any,
    roleMiddleware("superadmin") as any,
    async (req, res) => {
      try {
        const logs = await storage.getActivityLogs(req.params.id as string);
        res.json(logs);
      } catch (error) {
        res.status(500).json({ message: "Error al obtener logs de actividad" });
      }
    }
  );

  app.get(
    "/api/admin/companies/:id/subscriptions",
    authMiddleware as any,
    roleMiddleware("superadmin") as any,
    async (req, res) => {
      try {
        const sub = await storage.getSubscriptionByCompany(req.params.id as string);
        res.json(sub);
      } catch (error) {
        res.status(500).json({ message: "Error al obtener suscripción" });
      }
    }
  );

  app.get(
    "/api/admin/subscriptions",
    authMiddleware as any,
    roleMiddleware("superadmin") as any,
    async (req, res) => {
      try {
        const subscriptions = await storage.getAllSubscriptions();
        res.json(subscriptions);
      } catch (error) {
        res.status(500).json({ message: "Error al obtener suscripciones" });
      }
    },
  );

  // Kickoff System - Admin
  app.post(
    "/api/admin/companies/:id/kickoff-token",
    authMiddleware as any,
    roleMiddleware("superadmin", "admin") as any,
    async (req, res) => {
      try {
        const { id } = req.params;
        const secret = process.env.SESSION_SECRET || "kickoff_secret_key_pd";
        const crypto = await import("crypto");
        const hmac = crypto.createHmac("sha256", secret);
        hmac.update(id);
        const signature = hmac.digest("hex");
        const token = `${id}.${signature}`;
        res.json({ token });
      } catch (error) {
        res.status(500).json({ message: "Error al generar token de kickoff" });
      }
    }
  );

  // Kickoff System - Public
  app.get("/api/public/kickoff/:token", async (req, res) => {
    try {
      const { token } = req.params;
      const [id, signature] = token.split(".");
      const secret = process.env.SESSION_SECRET || "kickoff_secret_key_pd";
      const crypto = await import("crypto");
      const hmac = crypto.createHmac("sha256", secret);
      hmac.update(id);
      const expectedSignature = hmac.digest("hex");

      if (signature !== expectedSignature) {
        return res.status(401).json({ message: "Token inválido o expirado" });
      }

      const company = await storage.getCompany(id);
      if (!company) return res.status(404).json({ message: "Empresa no encontrada" });

      const profiles = await storage.getClientProfile(id);
      const allCatalog = await storage.getCatalogByCompany(id);
      const strategies = await storage.getClientStrategies(id);
      const results = await storage.getClientResults(id);

      const strategy = strategies.length > 0 ? strategies[0] : null;
      const result = results.length > 0 ? results[0] : null;

      const services = allCatalog
        .filter(item => item.item_type === "service")
        .map(s => ({
          name: s.name,
          problem_solved: s.description,
          customer_benefits: s.details?.includes?.[0] || "",
          average_price: parseInt(s.base_price || "0")
        }));

      res.json({
        company: { id: company.id, name: company.name },
        existingData: {
          profile: profiles ? {
            ...profiles,
            customer_pain_points: (profiles as any).customer_characteristics
          } : undefined,
          services: services.length > 0 ? services : undefined,
          strategy,
          results: result ? {
            ...result,
            sales_cycle_duration: (result as any).sales_cycle,
            sales_objections: (result as any).purchase_decision_factor,
            marketing_actions: (result as any).previous_marketing_actions,
            customer_satisfaction_measurement: (result as any).best_marketing_results,
            referral_process: (result as any).lead_sources,
            customer_questions: (result as any).frequent_customer_questions,
            valuable_resource: (result as any).important_client_knowledge
          } : undefined
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Error al validar token" });
    }
  });

  app.post("/api/public/kickoff/:token/submit", async (req, res) => {
    try {
      const { token } = req.params;
      const { profile, services, strategy, results } = req.body;
      const [id, signature] = token.split(".");
      const secret = process.env.SESSION_SECRET || "kickoff_secret_key_pd";
      const crypto = await import("crypto");
      const hmac = crypto.createHmac("sha256", secret);
      hmac.update(id);
      const expectedSignature = hmac.digest("hex");

      if (signature !== expectedSignature) {
        return res.status(401).json({ message: "Token inválido" });
      }

      const companyId = id;

      // 1. Save Profile (Mapping customer_pain_points to customer_characteristics)
      await storage.upsertClientProfile({
        company_id: companyId,
        business_description: profile.business_description,
        ideal_customer: profile.ideal_customer,
        customer_problem: profile.customer_problem,
        customer_characteristics: profile.customer_pain_points, // Mapped
      } as any);

      // 2. Save Services in Catalog
      if (services && Array.isArray(services)) {
        await storage.deleteCatalogItemsByType(companyId, "service");
        for (const s of services) {
          await storage.createCatalogItem({
            company_id: companyId,
            item_type: "service",
            name: s.name,
            description: s.problem_solved,
            base_price: s.average_price?.toString() || "0",
            is_active: true,
            details: {
              includes: [s.customer_benefits],
              restrictions: [],
              estimated_time: ""
            }
          });
        }
      }

      // 3. Save Strategy (Mapping fields)
      if (strategy) {
        await storage.upsertClientStrategy({
          company_id: companyId,
          strategy_name: "Kickoff Strategy",
          status: "active",
          project_reason: strategy.project_reason,
          expected_results: strategy.expected_results,
          project_goals: strategy.project_goals
        });
      }

      // 4. Save Results (Mapping to existing schema)
      if (results) {
        await storage.upsertClientResult({
          company_id: companyId,
          sales_process: results.sales_process,
          sales_cycle: results.sales_cycle_duration, // Mapped
          purchase_decision_factor: results.sales_objections, // Mapped
          previous_marketing_actions: results.marketing_actions, // Mapped
          best_marketing_results: results.customer_satisfaction_measurement, // Mapped
          lead_sources: results.referral_process, // Mapped
          frequent_customer_questions: results.customer_questions, // Mapped
          important_client_knowledge: results.valuable_resource // Mapped
        });
      }

      // 5. Update Onboarding status
      const onboarding = await storage.getOperationsOnboardingByCompany(companyId);
      if (onboarding) {
        await storage.upsertOperationsOnboarding({
          ...onboarding,
          status: "kickoff_completed"
        });
      }

      // 6. Log Activity
      await storage.createActivityLog({
        company_id: companyId,
        event_type: "kickoff_completed",
        event_description: "Formulario de Kickoff Estratégico enviado vía enlace público",
        metadata: { submitted_at: new Date().toISOString() }
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Kickoff submission error:", error);
      res.status(500).json({ message: "Error al procesar el kickoff" });
    }
  });


  // Admin - Users
  app.get(
    "/api/admin/users",
    authMiddleware as any,
    roleMiddleware("superadmin") as any,
    async (req, res) => {
      try {
        const users = await storage.getAllUsers();
        // Remove password hashes from response
        const usersWithoutPasswords = users.map(
          ({ password_hash, ...user }) => user,
        );
        res.json(usersWithoutPasswords);
      } catch (error) {
        res.status(500).json({ message: "Error al obtener usuarios" });
      }
    },
  );

  // ========== ADMIN OPERATIONAL ROUTES ==========

  // Pipeline
  app.get(
    "/api/admin/client-operations/pipeline",
    authMiddleware as any,
    roleMiddleware("superadmin") as any,
    async (req, res) => {
      try {
        const pipeline = await storage.getOperationsPipeline();
        res.json(pipeline);
      } catch (error) {
        res.status(500).json({ message: "Error al obtener pipeline" });
      }
    },
  );

  app.get(
    "/api/admin/client-operations/pipeline/:id",
    authMiddleware as any,
    roleMiddleware("superadmin") as any,
    async (req, res) => {
      try {
        const op = await storage.getOperationsClient(req.params.id);
        if (!op) return res.status(404).json({ message: "Operación no encontrada" });
        const steps = await storage.getOperationsClientSteps(op.id);
        res.json({ ...op, steps });
      } catch (error) {
        res.status(500).json({ message: "Error al obtener detalle de operación" });
      }
    },
  );

  app.patch(
    "/api/admin/client-operations/pipeline/:id",
    authMiddleware as any,
    roleMiddleware("superadmin") as any,
    async (req, res) => {
      try {
        const updated = await storage.updateOperationsClient(req.params.id, req.body);
        res.json(updated);
      } catch (error) {
        console.error("Error updating operation:", error);
        res.status(500).json({ message: "Error al actualizar operación" });
      }
    },
  );

  app.post(
    "/api/admin/client-operations/pipeline",
    authMiddleware as any,
    roleMiddleware("superadmin") as any,
    async (req, res) => {
      try {
        const op = await storage.createOperationsClient(req.body);
        res.status(201).json(op);
      } catch (error) {
        res.status(500).json({ message: "Error al crear operación" });
      }
    },
  );

  // CRM Clients
  app.get(
    "/api/admin/client-operations/clients",
    authMiddleware as any,
    roleMiddleware("superadmin") as any,
    async (req, res) => {
      try {
        const companies = await storage.getAllCompanies();
        const profiles = await Promise.all(
          companies.map(async (c) => {
            const profile = await storage.getClientProfile(c.id);
            return {
              company_id: c.id,
              company_name: c.name,
              industry: c.industry || profile?.industry,
              city_country: profile?.city_country,
              client_classification: profile?.client_classification,
              account_status: profile?.account_status,
              agency_start_date: profile?.agency_start_date,
            };
          })
        );
        res.json(profiles);
      } catch (error) {
        res.status(500).json({ message: "Error al obtener listado de clientes" });
      }
    },
  );

  app.get(
    "/api/admin/client-operations/client-360/:company_id",
    authMiddleware as any,
    roleMiddleware("superadmin") as any,
    async (req, res) => {
      try {
        const companyId = req.params.company_id;
        const view = await storage.getClient360(companyId);

        // Fetch details that might not be in the view
        const profile = await storage.getClientProfile(companyId);
        const contacts = await storage.getClientContacts(companyId);
        const services = await storage.getClientServices(companyId);
        const strategies = await storage.getClientStrategies(companyId);
        const results = await storage.getClientResults(companyId);
        const activity = await storage.getActivityLogs(companyId);
        const onboarding = await storage.getOperationsOnboardingByCompany(companyId);

        // Fetch pipeline status
        const pipeline = await storage.getOperationsPipeline();
        const companyOp = pipeline.find(op => op.company_id === companyId);

        const strategy = strategies.length > 0 ? strategies[0] : null;
        const result = results.length > 0 ? results[0] : null;

        res.json({
          ...view,
          pipeline_status: companyOp?.status || "new_lead",
          summary: view,
          profile: profile ? {
            ...profile,
            ...view, // Merge view data into profile for metrics like months_active, total_ltv
            customer_pain_points: (profile as any).customer_characteristics
          } : (view ? { ...view } : null),
          contacts,
          services,
          strategy,
          onboarding,
          results: result ? {
            ...result,
            sales_cycle_duration: (result as any).sales_cycle,
            sales_objections: (result as any).purchase_decision_factor,
            marketing_actions: (result as any).previous_marketing_actions,
            customer_satisfaction_measurement: (result as any).best_marketing_results,
            referral_process: (result as any).lead_sources,
            customer_questions: (result as any).frequent_customer_questions,
            valuable_resource: (result as any).important_client_knowledge
          } : null,
          activity
        });
      } catch (error) {
        console.error("Client 360 error:", error);
        res.status(500).json({ message: "Error al obtener vista 360" });
      }
    },
  );

  // Onboarding
  app.get(
    "/api/admin/client-operations/onboarding",
    authMiddleware as any,
    roleMiddleware("superadmin") as any,
    async (req, res) => {
      try {
        const onboardings = await storage.getOperationsOnboardings();
        res.json(onboardings);
      } catch (error) {
        res.status(500).json({ message: "Error al obtener onboardings" });
      }
    },
  );

  app.patch(
    "/api/admin/client-operations/onboarding/:id",
    authMiddleware as any,
    roleMiddleware("superadmin") as any,
    async (req, res) => {
      try {
        const updated = await storage.upsertOperationsOnboarding({ ...req.body, id: req.params.id });
        res.json(updated);
      } catch (error) {
        res.status(500).json({ message: "Error al actualizar onboarding" });
      }
    },
  );

  // Service Activations
  app.get(
    "/api/admin/client-operations/services",
    authMiddleware as any,
    roleMiddleware("superadmin") as any,
    async (req, res) => {
      try {
        const services = await storage.getOperationsServiceActivations();
        res.json(services);
      } catch (error) {
        res.status(500).json({ message: "Error al obtener activaciones de servicios" });
      }
    },
  );

  // ========== CHANNELS & INTEGRATIONS ==========

  // Helper: verify agent belongs to user's company
  async function verifyAgentOwnership(
    agentId: string,
    userCompanyId: string,
  ): Promise<boolean> {
    const { data } = await supabase
      .from("agents")
      .select("id")
      .eq("id", agentId)
      .eq("company_id", userCompanyId)
      .maybeSingle();
    return !!data;
  }

  // Helper: verify channel belongs to user's company
  async function verifyChannelOwnership(
    channelId: string,
    userCompanyId: string,
  ): Promise<boolean> {
    const { data } = await supabase
      .from("agent_channels")
      .select("id")
      .eq("id", channelId)
      .eq("company_id", userCompanyId)
      .maybeSingle();
    return !!data;
  }

  // GET /api/channels/status - Get channel status for an agent
  app.get(
    "/api/channels/status",
    authMiddleware as any,
    async (req: AuthRequest, res) => {
      try {
        const agentId = req.query.agentId as string;
        const channelType = req.query.type as string;
        const userCompanyId = req.user?.company_id;

        if (!agentId || !channelType) {
          return res
            .status(400)
            .json({ message: "agentId y type son requeridos" });
        }

        if (
          !userCompanyId ||
          !(await verifyAgentOwnership(agentId, userCompanyId))
        ) {
          return res.status(403).json({ message: "No autorizado" });
        }

        // Use the view if available, fallback to direct table query
        const { data, error } = await supabase
          .from("v_agent_channels_with_integrations")
          .select("*")
          .eq("agent_id", agentId)
          .eq("company_id", userCompanyId)
          .eq("channel_type", channelType)
          .maybeSingle();

        if (error) {
          const { data: channelData, error: channelError } = await supabase
            .from("agent_channels")
            .select("*")
            .eq("agent_id", agentId)
            .eq("company_id", userCompanyId)
            .eq("channel_type", channelType)
            .maybeSingle();

          if (channelError) throw channelError;

          if (!channelData) {
            return res.json(null);
          }

          const { data: integrationData } = await supabase
            .from("agent_channel_integrations")
            .select("*")
            .eq("agent_channel_id", channelData.id)
            .maybeSingle();

          return res.json({
            ...channelData,
            integration_details: integrationData || null,
          });
        }

        res.json(data);
      } catch (error) {
        console.error("Error getting channel status:", error);
        res.status(500).json({ message: "Error al obtener estado del canal" });
      }
    },
  );

  // POST /api/channels/setup - Create or update a channel and its integration
  app.post(
    "/api/channels/setup",
    authMiddleware as any,
    async (req: AuthRequest, res) => {
      try {
        const {
          agent_id,
          channel_type,
          provider,
          provider_credentials,
          instance_name,
          external_identifier,
          qr_code,
          status,
          connected_at,
          api_key,
          webhook_url,
          n8n_workflow_id,
          workflow_name,
        } = req.body;
        const userCompanyId = req.user?.company_id;

        if (!agent_id || !channel_type) {
          return res
            .status(400)
            .json({ message: "agent_id y channel_type son requeridos" });
        }

        if (
          !userCompanyId ||
          !(await verifyAgentOwnership(agent_id, userCompanyId))
        ) {
          return res.status(403).json({ message: "No autorizado" });
        }

        const updateFields: Record<string, any> = {};
        if (instance_name !== undefined)
          updateFields.instance_name = instance_name;
        if (external_identifier !== undefined)
          updateFields.external_identifier = external_identifier;
        if (qr_code !== undefined) updateFields.qr_code = qr_code;
        if (status !== undefined) updateFields.status = status;
        if (connected_at !== undefined)
          updateFields.connected_at = connected_at;
        if (api_key !== undefined) updateFields.api_key = api_key;

        updateFields.provider = provider || channel_type;

        // Check if channel already exists
        const { data: existing } = await supabase
          .from("agent_channels")
          .select("*")
          .eq("agent_id", agent_id)
          .eq("company_id", userCompanyId)
          .eq("channel_type", channel_type)
          .maybeSingle();

        let channel;
        if (existing) {
          const { data, error: updateError } = await supabase
            .from("agent_channels")
            .update(updateFields)
            .eq("id", existing.id)
            .select()
            .single();
          if (updateError) throw updateError;
          channel = data;
        } else {
          const { data, error: insertError } = await supabase
            .from("agent_channels")
            .insert({
              agent_id,
              company_id: userCompanyId,
              channel_type,
              ...updateFields,
            })
            .select()
            .single();
          if (insertError) throw insertError;
          channel = data;
        }

        // If provider_credentials are provided, upsert the integration
        if (provider_credentials && channel) {
          const integrationPayload: Record<string, any> = {
            agent_channel_id: channel.id,
            provider: provider || channel_type,
            is_active: true,
          };

          if (provider_credentials) {
            integrationPayload.provider_credentials = provider_credentials;
          }

          integrationPayload.webhook_url = "-";
          integrationPayload.n8n_workflow_id = "-";
          integrationPayload.workflow_name = "-";

          // Check if integration exists
          const { data: existingIntegration } = await supabase
            .from("agent_channel_integrations")
            .select("id")
            .eq("agent_channel_id", channel.id)
            .maybeSingle();

          if (existingIntegration) {
            const { error: intUpdateError } = await supabase
              .from("agent_channel_integrations")
              .update(integrationPayload)
              .eq("id", existingIntegration.id);
            if (intUpdateError) throw intUpdateError;
          } else {
            const { error: intInsertError } = await supabase
              .from("agent_channel_integrations")
              .insert(integrationPayload);
            if (intInsertError) throw intInsertError;
          }
        }

        res.json(channel);
      } catch (error: any) {
        console.error("Error setting up channel:", error?.message || error);
        res.status(500).json({
          message: "Error al configurar el canal",
          detail: error?.message,
        });
      }
    },
  );

  // POST /api/channels/disable - Disable/delete a channel and its integrations
  app.post(
    "/api/channels/disable",
    authMiddleware as any,
    async (req: AuthRequest, res) => {
      try {
        const { agent_id, channel_type } = req.body;
        const userCompanyId = req.user?.company_id;

        if (!agent_id || !channel_type) {
          return res
            .status(400)
            .json({ message: "agent_id y channel_type son requeridos" });
        }

        if (
          !userCompanyId ||
          !(await verifyAgentOwnership(agent_id, userCompanyId))
        ) {
          return res.status(403).json({ message: "No autorizado" });
        }

        // Find the channel scoped to company
        const { data: channel } = await supabase
          .from("agent_channels")
          .select("id")
          .eq("agent_id", agent_id)
          .eq("company_id", userCompanyId)
          .eq("channel_type", channel_type)
          .maybeSingle();

        if (channel) {
          // Delete integration records first (foreign key)
          await supabase
            .from("agent_channel_integrations")
            .delete()
            .eq("agent_channel_id", channel.id);

          // Delete the channel
          await supabase.from("agent_channels").delete().eq("id", channel.id);
        }

        res.json({ success: true, message: "Canal deshabilitado" });
      } catch (error) {
        console.error("Error disabling channel:", error);
        res.status(500).json({ message: "Error al deshabilitar el canal" });
      }
    },
  );

  // POST /api/channels/update - Update specific fields on a channel (e.g. status, connected_at)
  app.post(
    "/api/channels/update",
    authMiddleware as any,
    async (req: AuthRequest, res) => {
      try {
        const { agent_id, channel_type, updates } = req.body;
        const userCompanyId = req.user?.company_id;

        if (!agent_id || !channel_type || !updates) {
          return res.status(400).json({
            message: "agent_id, channel_type y updates son requeridos",
          });
        }

        if (
          !userCompanyId ||
          !(await verifyAgentOwnership(agent_id, userCompanyId))
        ) {
          return res.status(403).json({ message: "No autorizado" });
        }

        const { data, error } = await supabase
          .from("agent_channels")
          .update(updates)
          .eq("agent_id", agent_id)
          .eq("company_id", userCompanyId)
          .eq("channel_type", channel_type)
          .select()
          .single();

        if (error) throw error;

        res.json(data);
      } catch (error) {
        console.error("Error updating channel:", error);
        res.status(500).json({ message: "Error al actualizar el canal" });
      }
    },
  );

  // GET /api/channels/details - Get channel + integration details (for n8n workflow)
  app.get(
    "/api/channels/details",
    authMiddleware as any,
    async (req: AuthRequest, res) => {
      try {
        const agentId = req.query.agentId as string;
        const channelType = req.query.type as string;
        const userCompanyId = req.user?.company_id;

        if (!agentId || !channelType) {
          return res
            .status(400)
            .json({ message: "agentId y type son requeridos" });
        }

        if (
          !userCompanyId ||
          !(await verifyAgentOwnership(agentId, userCompanyId))
        ) {
          return res.status(403).json({ message: "No autorizado" });
        }

        const { data: channel, error: channelError } = await supabase
          .from("agent_channels")
          .select("*")
          .eq("agent_id", agentId)
          .eq("company_id", userCompanyId)
          .eq("channel_type", channelType)
          .maybeSingle();

        if (channelError) throw channelError;
        if (!channel) return res.json({ channel: null, integration: null });

        const { data: integration, error: integrationError } = await supabase
          .from("agent_channel_integrations")
          .select("*")
          .eq("agent_channel_id", channel.id)
          .maybeSingle();

        if (integrationError) throw integrationError;

        res.json({ channel, integration });
      } catch (error) {
        console.error("Error getting channel details:", error);
        res
          .status(500)
          .json({ message: "Error al obtener detalles del canal" });
      }
    },
  );

  // POST /api/channels/integration/setup - Upsert integration for a channel
  app.post(
    "/api/channels/integration/setup",
    authMiddleware as any,
    async (req: AuthRequest, res) => {
      try {
        const {
          agent_channel_id,
          provider,
          webhook_url,
          n8n_workflow_id,
          workflow_name,
          is_active,
        } = req.body;
        const userCompanyId = req.user?.company_id;

        if (!agent_channel_id) {
          return res
            .status(400)
            .json({ message: "agent_channel_id es requerido" });
        }

        if (
          !userCompanyId ||
          !(await verifyChannelOwnership(agent_channel_id, userCompanyId))
        ) {
          return res.status(403).json({ message: "No autorizado" });
        }

        const payload: Record<string, any> = {
          agent_channel_id,
          provider: provider || "n8n",
          is_active: is_active !== undefined ? is_active : true,
        };

        if (webhook_url !== undefined) payload.webhook_url = webhook_url;
        if (n8n_workflow_id !== undefined)
          payload.n8n_workflow_id = n8n_workflow_id;
        if (workflow_name !== undefined) payload.workflow_name = workflow_name;

        // Check if integration already exists
        const { data: existingInt } = await supabase
          .from("agent_channel_integrations")
          .select("id")
          .eq("agent_channel_id", agent_channel_id)
          .maybeSingle();

        let result;
        if (existingInt) {
          const { data, error } = await supabase
            .from("agent_channel_integrations")
            .update(payload)
            .eq("id", existingInt.id)
            .select()
            .single();
          if (error) throw error;
          result = data;
        } else {
          const { data, error } = await supabase
            .from("agent_channel_integrations")
            .insert(payload)
            .select()
            .single();
          if (error) throw error;
          result = data;
        }

        res.json(result);
      } catch (error: any) {
        console.error("Error setting up integration:", error?.message || error);
        res.status(500).json({
          message: "Error al configurar la integración",
          detail: error?.message,
        });
      }
    },
  );

  // DELETE /api/channels/integration - Delete integration by agent_channel_id
  app.delete(
    "/api/channels/integration",
    authMiddleware as any,
    async (req: AuthRequest, res) => {
      try {
        const agentChannelId = req.query.agentChannelId as string;
        const userCompanyId = req.user?.company_id;

        if (!agentChannelId) {
          return res
            .status(400)
            .json({ message: "agentChannelId es requerido" });
        }

        if (
          !userCompanyId ||
          !(await verifyChannelOwnership(agentChannelId, userCompanyId))
        ) {
          return res.status(403).json({ message: "No autorizado" });
        }

        const { error } = await supabase
          .from("agent_channel_integrations")
          .delete()
          .eq("agent_channel_id", agentChannelId);

        if (error) throw error;

        res.json({ success: true });
      } catch (error) {
        console.error("Error deleting integration:", error);
        res.status(500).json({ message: "Error al eliminar la integración" });
      }
    },
  );

  return httpServer;
}
