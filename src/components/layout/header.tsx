"use client";

import { usePathname } from "next/navigation";
import { MobileSidebar } from "./mobile-sidebar";
import { cn } from "@/lib/utils";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ModeToggle } from "@/components/mode-toggle";

export function Header() {
    const pathname = usePathname();
    // Simple logic to get current page title from path
    // In a real app we might use a context or look up the detailed title from NAV_CONFIG
    const segment = pathname.split("/").pop();
    const title = segment ? segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ") : "Dashboard";

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 items-center px-4 md:px-8">
                <MobileSidebar />
                <div className="mr-4 hidden md:flex items-center">
                    {/* Breadcrumb or Title placeholder */}
                    <span className="font-semibold text-sm text-muted-foreground tracking-tight">financial-calc / </span>
                    <span className="ml-2 font-semibold text-sm text-foreground">{title}</span>
                </div>
                <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
                    <div className="w-full flex-1 md:w-auto md:flex-none">
                        {/* Search could go here */}
                    </div>
                    <nav className="flex items-center gap-2">
                        <ModeToggle />
                        <LanguageSwitcher />
                    </nav>
                </div>
            </div>
        </header>
    );
}

