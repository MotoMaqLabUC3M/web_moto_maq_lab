import {
  BookOpen,
  LayoutDashboard,
  User,
  Users,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  description?: string;
};

export const mainNav: NavItem[] = [
  {
    href: "/dashboard",
    label: "Panel",
    icon: LayoutDashboard,
    description: "Estado del CMS en vivo",
  },
  {
    href: "/team",
    label: "Equipo",
    icon: Users,
    description: "Departamentos y miembros",
  },
  {
    href: "/blog",
    label: "Blog",
    icon: BookOpen,
    description: "Entradas y editor",
  },
];

export const accountNav: NavItem = {
  href: "/account",
  label: "Cuenta",
  icon: User,
  description: "Sesión y ajustes",
};
