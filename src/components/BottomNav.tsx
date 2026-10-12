import { Link, useRouterState } from "@tanstack/react-router";
import { Home, UtensilsCrossed, PlusCircle, TrendingUp, User } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const tabs = [
  { to: "/", label: "Home", icon: Home },
  { to: "/meals", label: "Meals", icon: UtensilsCrossed },
  { to: "/log", label: "Log", icon: PlusCircle },
  { to: "/progress", label: "Progress", icon: TrendingUp },
  { to: "/profile", label: "Profile", icon: User },
] as const;

export function BottomNav() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background safe-bottom">
      <div className="mx-auto max-w-md grid grid-cols-5 h-16">
        {tabs.map((t) => {
          const active = t.to === "/" ? pathname === "/" : pathname.startsWith(t.to);
          const Icon = t.icon;
          return (
            <Link
              key={t.to}
              to={t.to}
              className={cn(
                "relative flex flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              {active && (
                <motion.span
                  layoutId="nav-active-pill"
                  className="absolute top-1.5 h-1 w-7 rounded-full bg-primary"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
              <motion.span
                className="grid place-items-center"
                animate={active ? { scale: 1.08 } : { scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
              >
                <Icon className={cn("h-6 w-6", active && "stroke-[2.5]")} />
              </motion.span>
              <span>{t.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
