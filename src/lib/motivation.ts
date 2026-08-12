import type { GoalProgress } from "./progress";

function pick(list: string[], seed = Date.now()) {
  return list[Math.floor((seed / 1000 + Math.random() * list.length) % list.length)];
}

export function periodMessage(percent: number) {
  if (percent >= 100) return "🎉 PARABÉNS! Você concluiu suas metas do período!";
  if (percent >= 90) return "Está quase lá! Você está a poucos passos de concluir suas metas.";
  if (percent >= 75) return "Você está entrando na reta final. Não pare agora!";
  if (percent >= 60) return "Seu progresso está excelente! Continue mantendo o ritmo.";
  if (percent >= 50) return "Você já passou da metade! Agora é continuar firme.";
  if (percent >= 40) return "Você já percorreu quase metade do caminho. Não diminua o ritmo!";
  if (percent >= 25) return "Você já avançou bastante. Continue nesse ritmo!";
  if (percent >= 10) return "Você já começou! Continue construindo seu caminho na Odontologia.";
  return "Todo grande resultado começa com o primeiro passo.";
}

export function goalMessage(goal: GoalProgress) {
  if (goal.exceeded > 0) return "🚀 Meta ultrapassada! Você foi além do que precisava.";
  if (goal.completed) return "🏆 Meta concluída! Você atingiu sua meta.";
  if (goal.remaining === 1) return "🔥 Falta apenas 1 procedimento para você atingir essa meta!";
  if (goal.percent >= 50)
    return `Você já está na metade dessa meta! Faltam apenas ${goal.remaining}.`;
  return `Você já realizou ${goal.done} de ${goal.target_quantity}. Continue!`;
}

export const clinicMessages = [
  "Cada paciente atendido é uma oportunidade de aprender.",
  "Você não está apenas cumprindo metas. Está construindo sua experiência profissional.",
  "Seu progresso clínico está evoluindo. Continue registrando seus procedimentos.",
];

export const dailyMessages = [
  "Você não precisa concluir tudo hoje. Precisa apenas continuar avançando.",
  "Que tal avançar um pouco hoje?",
  "Cada pequeno avanço conta.",
  "Você pode continuar de onde parou.",
  "Vamos dar mais um passo?",
  "Sua evolução na Odontologia acontece um procedimento por vez.",
];

export const welcomeBackMessages = [
  "Que bom ter você de volta! Vamos continuar de onde paramos?",
  "Seu progresso continua esperando por você. Vamos avançar?",
  "Mais um dia para evoluir na sua jornada acadêmica.",
];

export const afterProcedureMessages = [
  "✅ Procedimento registrado! Mais um passo concluído.",
  "🦷 Mais um atendimento para sua trajetória!",
  "👏 Muito bem! Seu progresso foi atualizado.",
  "📈 Seu progresso acabou de aumentar!",
];

export function simulationMessage(percent: number) {
  if (percent >= 80)
    return "🌟 Excelente desempenho! Você está demonstrando um ótimo domínio do conteúdo.";
  if (percent >= 60) return "📚 Você está evoluindo. Continue praticando para aumentar sua média.";
  return "💡 Não desanime. Seus erros mostram exatamente o que você precisa revisar.";
}

export function randomMessage(list: string[]) {
  return pick(list);
}

export function dailyMotivation(percent: number) {
  const day = new Date().toDateString();
  const seed = day.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const base = dailyMessages[seed % dailyMessages.length];
  return `${base} ${periodMessage(percent)}`;
}
