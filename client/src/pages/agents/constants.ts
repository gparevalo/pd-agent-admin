export const toneLabels: Record<
  string,
  { label: string; description: string }
> = {
  professional: { label: "Profesional", description: "Formal y conciso" },
  friendly: { label: "Amigable", description: "Cercano y empático" },
  formal: { label: "Formal", description: "Muy formal y serio" },
};

export const emojiStyles = [
  { value: "none", label: "Sin emojis" },
  { value: "minimal", label: "Mínimo" },
  { value: "moderate", label: "Moderado" },
  { value: "expressive", label: "Expresivo" },
];

export const tabs = [
  { id: "info", label: "Información", icon: "Info" },
  { id: "config", label: "Configuración", icon: "Settings" },
  { id: "chat", label: "Test Chat", icon: "MessageSquare" },
  { id: "knowledge", label: "Conocimiento", icon: "BookOpen" },
  { id: "status", label: "Estado", icon: "BarChart3" },
  { id: "integrations", label: "Integraciones", icon: "Puzzle" },
] as const;

export type TabId = (typeof tabs)[number]["id"];
