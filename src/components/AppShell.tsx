import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import {
  LayoutDashboard,
  BookOpen,
  TrendingUp,
  GraduationCap,
  BarChart3,
  Bell,
  LogOut,
  Menu,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useUnreadCount } from "@/lib/data";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/disciplinas", label: "Disciplinas", icon: BookOpen },
  { to: "/progresso", label: "Meu Progresso", icon: TrendingUp },
  { to: "/estudos", label: "Meus Estudos", icon: GraduationCap },
  { to: "/desempenho", label: "Meu Desempenho", icon: BarChart3 },
  { to: "/notificacoes", label: "Notificações", icon: Bell },
] as const;

function Brand() {
  return (
    <Link to="/" className="flex items-center gap-3">
      <div className="bg-brand flex h-10 w-10 items-center justify-center rounded-xl text-lg font-bold text-primary-foreground shadow-[var(--shadow-glow)]">
        OP
      </div>
      <div className="leading-tight">
        <p className="font-display text-base font-bold">Odonto Progress</p>
        <p className="text-xs text-muted-foreground">Seu progresso, em um só lugar</p>
      </div>
    </Link>
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const unread = useUnreadCount();

  return (
    <nav className="flex flex-col gap-1">
      {NAV.map((item) => {
        const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground shadow-[var(--shadow-soft)]"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground",
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
            {item.label === "Notificações" && unread > 0 && (
              <span className="ml-auto rounded-full bg-destructive px-2 py-0.5 text-[11px] font-semibold text-destructive-foreground">
                {unread}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.navigate({ to: "/auth" });
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <div className="animate-pulse font-display text-lg text-muted-foreground">
          Carregando seu progresso...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col justify-between border-r border-border bg-sidebar px-4 py-6 lg:flex">
        <div className="space-y-8">
          <Brand />
          <NavLinks />
        </div>
        <Button variant="ghost" className="justify-start gap-3" onClick={() => signOut()}>
          <LogOut className="h-4 w-4" /> Sair
        </Button>
      </aside>

      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-card/80 px-4 py-3 backdrop-blur lg:hidden">
        <Brand />
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Abrir menu">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72 p-6">
            <div className="mt-8 space-y-8">
              <NavLinks />
              <Button variant="ghost" className="w-full justify-start gap-3" onClick={() => signOut()}>
                <LogOut className="h-4 w-4" /> Sair
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </header>

      <main className="px-4 py-6 lg:ml-64 lg:px-10 lg:py-10">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
