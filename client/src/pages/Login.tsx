import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import LOGIN_IMAGE1 from "@assets/img/login2.png";
import LOGIN_IMAGE5 from "@assets/img/login5.png";
import logo from "@assets/img/logo.jpg";
import logo8 from "@assets/img/logo8.png";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type AuthResponse, type LoginData } from "@shared/schema";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2, Mail } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useLocation } from "wouter";

export default function Login() {
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { login } = useAuth();

  const form = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: LoginData) => {
    setIsLoading(true);
    try {
      const response = await api.post<AuthResponse>("/auth/login", data);
      login(response);
      window.location.href =
        response.subscription.status === "expired"
          ? "/subscription"
          : "/dashboard";
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof Error ? error.message : "Error al iniciar sesión",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#fff]">
      {/* Columna 1: Formulario (Estilo Dark de la imagen) */}
      <div
        className="w-full lg:w-1/2 flex items-start justify-center min-h-screen bg-cover bg-center"
        style={{
          backgroundImage: `url(${LOGIN_IMAGE1})`,
          backgroundPosition: "center calc(100% - 0.5vh)",
        }}
      >
        {/* El Card con altura del 70% del viewport, recto arriba y redondeado abajo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full lg:max-w-[75%] bg-[#1a1a1a] p-8 lg:p-16 rounded-b-[3.5rem] lg:rounded-b-[5rem] shadow-2xl flex flex-col min-h-[61vh] justify-between border-x border-b border-white/5"
        >
          <div>
            {/* Header con Logo PD */}
            <div className="mb-10   mt-16">
              <div className="flex items-center gap-3 mb-8 ">
                <div className="w-10 h-10 rounded-full bg-[#EF0034] flex items-center justify-center overflow-hidden shadow-lg shadow-[#EF0034]/20">
                  <img
                    src={logo}
                    alt="Logo PD"
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-white font-black uppercase text-sm tracking-[0.3em]">
                  PD Agencia Administrador
                </span>
              </div>

              <h1 className="text-white text-4xl font-bold tracking-tight mb-3">
                Bienvenido
              </h1>
              <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">
                Ingresa tus credenciales para continuar
              </p>
            </div>

            {/* Formulario */}
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-5"
              >
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            type="email"
                            placeholder="Correo electrónico"
                            className="h-14 bg-[#262626] border-zinc-800 text-white placeholder:text-zinc-600 rounded-2xl focus:ring-1 focus:ring-[#EF0034] border-none transition-all"
                          />
                          <Mail className="absolute right-5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600" />
                        </div>
                      </FormControl>
                      <FormMessage className="text-[10px] uppercase font-bold text-[#EF0034]" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            type={showPassword ? "text" : "password"}
                            placeholder="Contraseña"
                            className="h-14 bg-[#262626] border-zinc-800 text-white placeholder:text-zinc-600 rounded-2xl focus:ring-1 focus:ring-[#EF0034] border-none transition-all"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-white transition-colors"
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage className="text-[10px] uppercase font-bold text-[#EF0034]" />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full h-14 bg-[#EF0034] hover:bg-[#ff1a4a] text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] transition-all shadow-xl shadow-[#EF0034]/20 mt-4 active:scale-[0.98]"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    "INICIAR SESIÓN"
                  )}
                </Button>
              </form>
            </Form>
          </div>
        </motion.div>
      </div>

      {/* Columna 2: Imagen (Limpia, sin textos) */}

      <div
        className="hidden lg:flex lg:w-1/2 items-end justify-center min-h-screen bg-cover bg-no-repeat relative"
        style={{
          backgroundImage: `url(${LOGIN_IMAGE5})`,
          backgroundSize: "cover",
          // Esto centra horizontalmente y coloca el fondo a 5vh del fondo (bottom)
          backgroundPosition: "center calc(100% - 0.5vh)",
        }}
      >
        <div className="absolute inset-0 bg-white/10" />

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="w-full lg:max-w-[80%] bg-[#e30033] rounded-t-[4rem] lg:rounded-t-[6rem] shadow-[0_-20px_50px_-10px_rgba(0,0,0,0.5)] flex flex-col min-h-[75vh] overflow-hidden border-x border-t border-white/10 relative z-10"
        >
          {/* Contenido alineado arriba a la derecha */}
          <div className="relative z-20 p-12 lg:p-20 flex flex-col items-end text-right">
            {/* Contenedor del Logo para evitar deformación */}
            <div className="w-48 lg:w-48 mb-12 lg:mb-0">
              <img
                src={logo8}
                alt="Logo PD"
                className="w-full h-auto object-contain" // 'object-contain' mantiene la proporción real
              />
              <br />
              <br />
            </div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col items-end" // Asegura que todo el bloque interno se alinee al final
            >
              <h2 className="text-white text-[6rem] lg:text-[7rem] font-black uppercase tracking-[0.1rem] leading-[0.85]">
                WE <br />
                MAKE IT <br /> REAL
                <span className="text-[#1a1a1a]">.</span>
              </h2>

              {/* Barra decorativa */}
              <div className="h-1.5 w-16 bg-[#1a1a1a] my-8" />

              <p className="text-[#1a1a1a]/60 text-[14px] font-black uppercase tracking-[0.4em] mt-8">
                Powered by PD Agencia
              </p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
