import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { AlertTriangle, CreditCard, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

export default function SubscriptionBlocked() {
  const [, setLocation] = useLocation();
  const { logout } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-xl border-destructive/20">
          <CardContent className="pt-8 pb-6 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="mx-auto w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mb-6"
            >
              <AlertTriangle className="h-10 w-10 text-destructive" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h1 className="text-2xl font-bold mb-2">Membresía Vencida</h1>
              <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                Tu suscripción ha expirado. Para continuar usando la plataforma, 
                por favor renueva tu plan.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-3"
            >
              <Button 
                className="w-full" 
                onClick={() => setLocation("/subscription")}
                data-testid="button-renew-subscription"
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Renovar Suscripción
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              
              <Button 
                variant="ghost" 
                className="w-full"
                onClick={() => {
                  logout();
                  setLocation("/login");
                }}
                data-testid="button-logout"
              >
                Cerrar Sesión
              </Button>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
