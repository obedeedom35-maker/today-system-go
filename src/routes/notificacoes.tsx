import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useNotifications } from "@/lib/data";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/notificacoes")({
  head: () => ({
    meta: [
      { title: "Notificações | Odonto Progress" },
      {
        name: "description",
        content: "Alertas de metas concluídas, lembretes de estudo e conquistas do seu período.",
      },
      { property: "og:title", content: "Notificações | Odonto Progress" },
      {
        property: "og:description",
        content: "Acompanhe conquistas, metas quase concluídas e lembretes personalizados.",
      },
    ],
  }),
  component: () => (
    <AppShell>
      <Notificacoes />
    </AppShell>
  ),
});

function Notificacoes() {
  const { data, isLoading } = useNotifications();
  const qc = useQueryClient();

  const markAll = useMutation({
    mutationFn: async () => {
      const ids = (data ?? []).filter((n) => !n.is_read).map((n) => n.id);
      if (!ids.length) return;
      const { error } = await supabase.from("notifications").update({ is_read: true }).in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold">Notificações</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Conquistas, lembretes e avisos sobre suas metas.
          </p>
        </div>
        <Button variant="secondary" className="gap-2" onClick={() => markAll.mutate()}>
          <CheckCheck className="h-4 w-4" /> Marcar todas como lidas
        </Button>
      </header>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : (data ?? []).length === 0 ? (
        <div className="card-premium p-10 text-center">
          <Bell className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">
            Você ainda não tem notificações. Registre procedimentos para começar.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {(data ?? []).map((n) => (
            <li
              key={n.id}
              className={`card-premium p-5 ${n.is_read ? "opacity-70" : "border-primary/40"}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-display text-sm font-bold">{n.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{n.message}</p>
                </div>
                <span className="text-[11px] text-muted-foreground">
                  {new Date(n.created_at).toLocaleDateString("pt-BR")}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
