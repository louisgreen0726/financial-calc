import { 
  Calculator, 
  TrendingUp, 
  PieChart, 
  Landmark, 
  CreditCard, 
  Activity, 
  Globe, 
  ShieldCheck 
} from "lucide-react";

export interface NavItem {
  titleKey: string;
  descKey: string;
  href: string;
  icon: any;
}

export interface NavSection {
  titleKey: string;
  items: NavItem[];
}

export const NAV_CONFIG: NavSection[] = [
  {
    titleKey: "nav.core.title",
    items: [
      {
        titleKey: "nav.core.tvm.title",
        descKey: "nav.core.tvm.desc",
        href: "/tvm",
        icon: Calculator,
      },
      {
        titleKey: "nav.core.cashFlow.title",
        descKey: "nav.core.cashFlow.desc",
        href: "/cash-flow",
        icon: TrendingUp,
      },
    ],
  },
  {
    titleKey: "nav.investing.title",
    items: [
      {
        titleKey: "nav.investing.equity.title",
        descKey: "nav.investing.equity.desc",
        href: "/equity",
        icon: Activity,
      },
      {
        titleKey: "nav.investing.portfolio.title",
        descKey: "nav.investing.portfolio.desc",
        href: "/portfolio",
        icon: PieChart,
      },
      {
        titleKey: "nav.investing.bonds.title",
        descKey: "nav.investing.bonds.desc",
        href: "/bonds",
        icon: Landmark,
      },
    ],
  },
  {
    titleKey: "nav.derivatives.title",
    items: [
      {
        titleKey: "nav.derivatives.options.title",
        descKey: "nav.derivatives.options.desc",
        href: "/options",
        icon: ShieldCheck, 
      },
      {
        titleKey: "nav.derivatives.risk.title",
        descKey: "nav.derivatives.risk.desc",
        href: "/risk",
        icon: Activity,
      },
    ],
  },
  {
    titleKey: "nav.banking.title",
    items: [
      {
        titleKey: "nav.banking.loans.title",
        descKey: "nav.banking.loans.desc",
        href: "/loans",
        icon: CreditCard,
      },
      {
        titleKey: "nav.banking.macro.title",
        descKey: "nav.banking.macro.desc",
        href: "/macro",
        icon: Globe,
      },
    ],
  },
];

