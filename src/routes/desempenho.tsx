import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { simulationMessage } from "@/lib/motivation";

export const Route = createFileRoute("/desempenho")({
  head: () => ({
    meta: [
      { title: "Meu Desempenho | Odonto Progress" },
      {
        name: "description",
        content: "Histórico de simulados, notas, acertos e temas para revisar em Odontologia.",
      },
      { property: "og:title", content: "Meu Desempenho | Odonto Progress" },
      {
        property: "og:description",
        content: "Acompanhe suas notas nos simulados e os temas que precisa revisar.",
      },
    ],
  }),
  component: () => (
    <AppShell>
      <Desempenho />
    </AppShell>
  ),
});

function Desempenho() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["simulations", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("simulations")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const done = (data ?? []).filter((s) => s.score != null);
  const average = done.length
    ? done.reduce((a, s) => a + Number(s.score ?? 0), 0) / done.length
    : 0;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl font-extrabold">Meu Desempenho</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Resultados dos seus simulados e evolução por tema.
        </p>
      </header>

      <section className="card-premium p-6">
        <p className="text-sm text-muted-foreground">Média geral nos simulados</p>
        <p className="font-display mt-1 text-4xl font-extrabold text-primary">
          {average.toFixed(1)}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">{simulationMessage(average * 10)}</p>
      </section>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : done.length === 0 ? (
        <div className="card-premium p-8 text-center text-sm text-muted-foreground">
          Você ainda não concluiu nenhum simulado.
        </div>
      ) : (
        <ul className="space-y-3">
          {done.map((s) => (
            <li key={s.id} className="card-premium flex items-center justify-between gap-4 p-5">
              <div>
                <p className="font-display text-sm font-bold">{s.title}</p>
                <p className="text-xs text-muted-foreground">
                  {s.correct_count ?? 0} acertos · {s.wrong_count ?? 0} erros
                </p>
              </div>
              <span className="font-display text-2xl font-extrabold text-primary">
                {Number(s.score ?? 0).toFixed(1)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
