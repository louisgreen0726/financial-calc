import {
  Calculator,
  TrendingUp,
  PieChart,
  Landmark,
  CreditCard,
  Activity,
  Globe,
  ShieldCheck,
  History,
  Settings,
  HelpCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  titleKey: string;
  descKey: string;
  href: string;
  icon: LucideIcon;
}

export interface NavSection {
  titleKey: string;
  items: NavItem[];
  /** Optional color for icons within this section (Tailwind text color class) */
  color?: string;
}

export const NAV_CONFIG: NavSection[] = [
  {
    titleKey: "nav.core.title",
    color: "text-emerald-500",
    items: [
      {
        titleKey: "nav.core.tvm.title",
        descKey: "nav.core.tvm.desc",
        href: "/tvm/",
        icon: Calculator,
      },
      {
        titleKey: "nav.core.cashFlow.title",
        descKey: "nav.core.cashFlow.desc",
        href: "/cash-flow/",
        icon: TrendingUp,
      },
    ],
  },
  {
    titleKey: "nav.investing.title",
    color: "text-blue-500",
    items: [
      {
        titleKey: "nav.investing.equity.title",
        descKey: "nav.investing.equity.desc",
        href: "/equity/",
        icon: Activity,
      },
      {
        titleKey: "nav.investing.portfolio.title",
        descKey: "nav.investing.portfolio.desc",
        href: "/portfolio/",
        icon: PieChart,
      },
      {
        titleKey: "nav.investing.bonds.title",
        descKey: "nav.investing.bonds.desc",
        href: "/bonds/",
        icon: Landmark,
      },
    ],
  },
  {
    titleKey: "nav.derivatives.title",
    color: "text-orange-500",
    items: [
      {
        titleKey: "nav.derivatives.options.title",
        descKey: "nav.derivatives.options.desc",
        href: "/options/",
        icon: ShieldCheck,
      },
      {
        titleKey: "nav.derivatives.risk.title",
        descKey: "nav.derivatives.risk.desc",
        href: "/risk/",
        icon: Activity,
      },
    ],
  },
  {
    titleKey: "nav.banking.title",
    color: "text-purple-500",
    items: [
      {
        titleKey: "nav.banking.loans.title",
        descKey: "nav.banking.loans.desc",
        href: "/loans/",
        icon: CreditCard,
      },
      {
        titleKey: "nav.banking.macro.title",
        descKey: "nav.banking.macro.desc",
        href: "/macro/",
        icon: Globe,
      },
    ],
  },
  {
    titleKey: "nav.more.title",
    color: "text-slate-500",
    items: [
      {
        titleKey: "history.title",
        descKey: "nav.more.history.desc",
        href: "/history/",
        icon: History,
      },
      {
        titleKey: "settings.title",
        descKey: "nav.more.settings.desc",
        href: "/settings/",
        icon: Settings,
      },
      {
        titleKey: "help.title",
        descKey: "nav.more.help.desc",
        href: "/help/",
        icon: HelpCircle,
      },
    ],
  },
];

export const NAV_ITEMS = NAV_CONFIG.flatMap((section) => section.items);

export const MOBILE_PRIMARY_NAV = [
  { href: "/", icon: Calculator, labelKey: "common.home" },
  { href: "/tvm/", icon: Calculator, labelKey: "common.tvmShort" },
  { href: "/portfolio/", icon: PieChart, labelKey: "common.portfolioShort" },
  { href: "/history/", icon: History, labelKey: "history.title" },
] as const;
