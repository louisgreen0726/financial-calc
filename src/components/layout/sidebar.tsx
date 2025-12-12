"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { NAV_CONFIG } from "@/lib/nav-config";
import { useLanguage } from "@/lib/i18n";
import { Calculator } from "lucide-react";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> { }

export function Sidebar({ className }: SidebarProps) {
    const pathname = usePathname();
    const { t } = useLanguage();

    return (
        <div className={cn("pb-12 h-screen border-r bg-card/60 backdrop-blur-xl", className)}>
            <div className="space-y-4 py-4 h-full flex flex-col">
                <div className="px-3 py-2">
                    <Link href="/" className="flex items-center pl-4 mb-4 space-x-2 text-primary hover:opacity-90 transition-opacity">
                        <Calculator className="h-6 w-6" />
                        <h2 className="text-xl font-bold tracking-tight text-foreground">
                            FinCalc <span className="text-primary">Pro</span>
                        </h2>
                    </Link>
                    <div className="space-y-1">
                        {/* Dashboard / Home Link could go here */}
                    </div>
                </div>

                <ScrollArea className="flex-1 px-1">
                    <div className="space-y-6 px-3">
                        {NAV_CONFIG.map((section) => (
                            <div key={section.titleKey} className="py-2">
                                <h2 className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                                    {t(section.titleKey)}
                                </h2>
                                <div className="space-y-1">
                                    {section.items.map((item) => (
                                        <Button
                                            key={item.href}
                                            asChild
                                            variant={pathname === item.href ? "secondary" : "ghost"}
                                            className={cn(
                                                "w-full justify-start font-medium",
                                                pathname === item.href
                                                    ? "bg-secondary/50 text-secondary-foreground shadow-sm ring-1 ring-border"
                                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                            )}
                                        >
                                            <Link href={item.href}>
                                                <item.icon className="mr-2 h-4 w-4" />
                                                {t(item.titleKey)}
                                            </Link>
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>

                <div className="px-7 py-4 text-xs text-muted-foreground border-t">
                    <p>Professional Edition</p>
                    <p className="opacity-50">v1.0.0</p>
                </div>
            </div>
        </div>
    );
}

