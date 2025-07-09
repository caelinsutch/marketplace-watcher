"use client";

import { AuthButton } from "@/components/auth-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@marketplace-watcher/ui/lib/utils";

export const Navigation = () => {
  const pathname = usePathname();
  
  return (
    <nav className="w-full flex justify-center border-b border-foreground/5 h-16 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="w-full max-w-7xl flex justify-between items-center p-3 px-5">
        <div className="flex gap-8 items-center">
          <Link 
            href="/" 
            className="font-bold text-lg hover:text-primary transition-colors"
          >
            Marketplace Watcher
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm">
            <Link
              href="/monitors"
              className={cn(
                "transition-colors",
                pathname?.startsWith("/monitors")
                  ? "text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              My Monitors
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <ThemeSwitcher />
          <AuthButton />
        </div>
      </div>
    </nav>
  );
};