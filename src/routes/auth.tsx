import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sparkles, ShieldCheck, LineChart } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar | Odonto Progress" },
      {
        name: "description",
        content: "Acesse o Odonto Progress e acompanhe metas, procedimentos e estudos de Odontologia.",
      },
      { property: "og:title", content: "Entrar no Odonto Progress" },
      {
        property: "og:description",
        content: "Acompanhe suas metas clínicas e estude com IA em um só lugar.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [institution, setInstitution] = useState("");
  const [period, setPeriod] = useState("6");

  useEffect(() => {
    if (user) router.navigate({ to: "/" });
  }, [user, router]);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error("E-mail ou senha inválidos.");
    toast.success("Bem-vindo de volta!");
    router.navigate({ to: "/" });
  }

  async function signUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          full_name: fullName,
          institution,
          course: "Odontologia",
          period_number: Number(period),
        },
      },
    });
    setLoading(false);
    if (error) {
      return toast.error(
        error.message.includes("already registered")
          ? "Este e-mail já está cadastrado."
          : "Não foi possível criar sua conta.",
      );
    }
    toast.success("Conta criada! Você já pode começar.");
    router.navigate({ to: "/" });
  }

  async function resetPassword() {
    if (!email) return toast.error("Informe seu e-mail para recuperar a senha.");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    if (error) return toast.error("Não foi possível enviar o e-mail de recuperação.");
    toast.success("Enviamos um link de recuperação para seu e-mail.");
  }

  return (
    <div className="grid min-h-screen bg-surface lg:grid-cols-2">
      <section className="bg-brand relative hidden flex-col justify-between p-12 text-primary-foreground lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 text-lg font-bold">
            OP
          </div>
          <span className="font-display text-lg font-bold">ODONTO PROGRESS</span>
        </div>
        <div className="space-y-6">
          <h1 className="font-display text-4xl leading-tight font-extrabold">
            Seu progresso na Odontologia, em um só lugar.
          </h1>
          <ul className="space-y-4 text-sm text-primary-foreground/90">
            <li className="flex items-center gap-3">
              <LineChart className="h-5 w-5" /> Metas, procedimentos e percentual de cada disciplina
            </li>
            <li className="flex items-center gap-3">
              <Sparkles className="h-5 w-5" /> Resumos, simulados e correções com Inteligência Artificial
            </li>
            <li className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5" /> Seus dados salvos e protegidos, sempre
            </li>
          </ul>
        </div>
        <p className="text-xs text-primary-foreground/70">Criado pelo aluno OBEDE-EDOM</p>
      </section>

      <section className="flex items-center justify-center p-6">
        <div className="card-premium w-full max-w-md p-8">
          <h2 className="font-display text-2xl font-bold">Acesse sua conta</h2>
          <p className="mt-1 mb-6 text-sm text-muted-foreground">
            Acompanhe sua evolução acadêmica e clínica.
          </p>

          <Tabs defaultValue="login">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Criar conta</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={signIn} className="mt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Entrando..." : "Entrar"}
                </Button>
                <button
                  type="button"
                  onClick={resetPassword}
                  className="w-full text-center text-xs text-muted-foreground underline-offset-4 hover:underline"
                >
                  Esqueci minha senha
                </button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={signUp} className="mt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome completo</Label>
                  <Input
                    id="name"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email2">E-mail</Label>
                  <Input
                    id="email2"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inst">Instituição</Label>
                  <Input
                    id="inst"
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Curso</Label>
                    <Input value="Odontologia" readOnly />
                  </div>
                  <div className="space-y-2">
                    <Label>Período</Label>
                    <Select value={period} onValueChange={setPeriod}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 10 }, (_, i) => String(i + 1)).map((p) => (
                          <SelectItem key={p} value={p}>
                            {p}º Período
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password2">Senha</Label>
                  <Input
                    id="password2"
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Criando conta..." : "Criar minha conta"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </div>
  );
}
