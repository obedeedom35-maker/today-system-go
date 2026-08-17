import { createFileRoute, Link } from '@tanstack/react-router';
import { AppShell } from '@/components/AppShell';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { askMaterials } from '@/lib/ai.functions';
import { useServerFn } from '@tanstack/react-start';
import { 
  Bot, 
  FileText, 
  BrainCircuit, 
  Library, 
  MessageSquare, 
  Sparkles, 
  TrendingUp, 
  Send,
  Loader2,
  Paperclip,
  CheckCircle2,
  Lightbulb,
  GraduationCap
} from 'lucide-react';

export const Route = createFileRoute('/ia')({
  component: TutorIARoute,
  head: () => ({
    meta: [{ title: 'Tutor IA | Odonto Progress' }],
  }),
});

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

type Material = {
  id: string;
  file_name: string;
  created_at: string;
};

function TutorIARoute() {
  const { user } = useAuth();
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [question, setQuestion] = useState('');
  const [history, setHistory] = useState<Message[]>([]);
  const [isAsking, setIsAsking] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  // As requested, assuming askMaterials is a server function or standard async fn
  // If useServerFn is available: const ask = useServerFn(askMaterials);
  // We'll use the askMaterials directly as an async function if useServerFn is not strictly enforced in the environment,
  // but let's wrap it in a mock or use it directly.

  const { data: materials, isLoading: isLoadingMaterials } = useQuery({
    queryKey: ['materials', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('materials')
        .select('id, file_name, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        toast.error('Erro ao carregar materiais');
        throw error;
      }
      return (data as Material[]) || [];
    },
    enabled: !!user,
  });

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [history]);

  const toggleMaterial = (id: string) => {
    setSelectedMaterials(prev => 
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  const handleAsk = async (text: string = question) => {
    if (!text.trim()) return;
    
    const newMsg: Message = { role: 'user', content: text };
    setHistory(prev => [...prev, newMsg]);
    setQuestion('');
    setIsAsking(true);

    try {
      // Assuming askMaterials is imported and ready to use
      const response = await askMaterials({
        data: {
          materialIds: selectedMaterials,
          question: text,
          history: history.map((h) => ({ role: h.role, content: h.content })),
        },
      });

      setHistory(prev => [...prev, { role: 'assistant', content: response.answer }]);
    } catch (error) {
      console.error(error);
        toast.error('Erro ao processar IA', {
          action: {
            label: 'Retry',
            onClick: () => handleAsk(text),
          },
        });
      setHistory(prev => [...prev, { role: 'assistant', content: 'Desculpe, ocorreu um erro ao processar sua solicitação.' }]);
    } finally {
      setIsAsking(false);
    }
  };

  const renderMarkdown = (text: string) => {
    // Basic markdown rendering for bold, bullets, numbered lists
    let html = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n- (.*?)/g, '<br/>• $1')
      .replace(/\n\d+\. (.*?)/g, '<br/><strong>#</strong> $1');
    
    // Check if filename is referenced e.g., 📎 [filename.pdf]
    html = html.replace(/📎 \[(.*?)\]/g, '<span class="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full"><Paperclip size={12}/> $1</span>');

    return <div dangerouslySetInnerHTML={{ __html: html.replace(/\n/g, '<br/>') }} />;
  };

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 space-y-8">
        
        {/* Hero Section */}
        <div className="text-center space-y-4 max-w-3xl mx-auto pt-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-4 text-primary"
          >
            <Bot size={32} />
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold tracking-tight text-foreground"
          >
            Tutor IA
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-muted-foreground"
          >
            Seu assistente de estudos inteligente. Converse com seus materiais, crie simulados, gere resumos e muito mais.
          </motion.p>
        </div>

        {/* Action Cards Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6"
        >
          <Link to="/estudos" className="group">
            <div className="card-premium h-full p-6 flex flex-col items-center text-center gap-4 hover:border-primary/50 transition-colors">
              <div className="p-4 bg-blue-500/10 text-blue-500 rounded-2xl group-hover:scale-110 transition-transform">
                <FileText size={32} />
              </div>
              <h3 className="font-semibold text-lg">Resumir meus PDFs</h3>
              <p className="text-sm text-muted-foreground">Gere resumos estruturados dos seus materiais.</p>
            </div>
          </Link>
          
          <Link to="/simulado" className="group">
            <div className="card-premium h-full p-6 flex flex-col items-center text-center gap-4 hover:border-primary/50 transition-colors">
              <div className="p-4 bg-green-500/10 text-green-500 rounded-2xl group-hover:scale-110 transition-transform">
                <BrainCircuit size={32} />
              </div>
              <h3 className="font-semibold text-lg">Criar Simulado</h3>
              <p className="text-sm text-muted-foreground">Teste seus conhecimentos com questões geradas por IA.</p>
            </div>
          </Link>
          
          <div className="card-premium h-full p-6 flex flex-col items-center text-center gap-4 cursor-pointer hover:border-primary/50 transition-colors group">
            <div className="p-4 bg-purple-500/10 text-purple-500 rounded-2xl group-hover:scale-110 transition-transform">
              <Library size={32} />
            </div>
            <h3 className="font-semibold text-lg">Criar Flashcards</h3>
            <p className="text-sm text-muted-foreground">Gere cards para repetição espaçada.</p>
          </div>

          <div 
            onClick={() => document.getElementById('chat-section')?.scrollIntoView({ behavior: 'smooth' })}
            className="card-premium h-full p-6 flex flex-col items-center text-center gap-4 cursor-pointer hover:border-primary/50 transition-colors group"
          >
            <div className="p-4 bg-orange-500/10 text-orange-500 rounded-2xl group-hover:scale-110 transition-transform">
              <MessageSquare size={32} />
            </div>
            <h3 className="font-semibold text-lg">Perguntar aos materiais</h3>
            <p className="text-sm text-muted-foreground">Tire dúvidas conversando com seus documentos.</p>
          </div>

          <div 
            onClick={() => {
              setQuestion('Poderia me explicar de forma detalhada o assunto: ');
              document.getElementById('chat-input')?.focus();
              document.getElementById('chat-section')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="card-premium h-full p-6 flex flex-col items-center text-center gap-4 cursor-pointer hover:border-primary/50 transition-colors group"
          >
            <div className="p-4 bg-yellow-500/10 text-yellow-500 rounded-2xl group-hover:scale-110 transition-transform">
              <Sparkles size={32} />
            </div>
            <h3 className="font-semibold text-lg">Explicar um assunto</h3>
            <p className="text-sm text-muted-foreground">A IA explica qualquer tema odontológico para você.</p>
          </div>

          <Link to="/desempenho" className="group">
            <div className="card-premium h-full p-6 flex flex-col items-center text-center gap-4 hover:border-primary/50 transition-colors">
              <div className="p-4 bg-red-500/10 text-red-500 rounded-2xl group-hover:scale-110 transition-transform">
                <TrendingUp size={32} />
              </div>
              <h3 className="font-semibold text-lg">Revisar meus erros</h3>
              <p className="text-sm text-muted-foreground">Aprenda com as questões que você errou.</p>
            </div>
          </Link>
        </motion.div>

        {/* Chat Interface */}
        <div id="chat-section" className="grid grid-cols-1 lg:grid-cols-4 gap-6 pt-8">
          
          {/* Material Selector Sidebar */}
          <div className="lg:col-span-1 bg-card border rounded-2xl p-4 flex flex-col h-[500px]">
            <h3 className="font-semibold flex items-center gap-2 mb-4">
              <Library size={18} />
              Meus Materiais
            </h3>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-3">
              {isLoadingMaterials ? (
                <div className="flex justify-center p-4"><Loader2 className="animate-spin text-muted-foreground" /></div>
              ) : materials?.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center p-4 bg-muted/50 rounded-lg">
                  Nenhum material encontrado. Faça upload na página de Estudos.
                </div>
              ) : (
                materials?.map(m => (
                  <div key={m.id} className="flex items-start space-x-2 p-2 hover:bg-muted/50 rounded-lg transition-colors">
                    <Checkbox 
                      id={`mat-${m.id}`} 
                      checked={selectedMaterials.includes(m.id)}
                      onCheckedChange={() => toggleMaterial(m.id)}
                      className="mt-1"
                    />
                    <div className="grid gap-1.5 leading-none">
                      <label
                        htmlFor={`mat-${m.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {m.file_name}
                      </label>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
              {selectedMaterials.length} material(is) selecionado(s) para contexto.
            </div>
          </div>

          {/* Chat Main Area */}
          <div className="lg:col-span-3 bg-card border rounded-2xl flex flex-col h-[600px] overflow-hidden">
            
            {/* History */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-slate-50/50 dark:bg-slate-900/50">
              {history.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 max-w-md mx-auto">
                  <div className="p-4 bg-primary/10 rounded-full text-primary">
                    <MessageSquare size={32} />
                  </div>
                  <h3 className="text-xl font-semibold">Como posso ajudar?</h3>
                  <p className="text-muted-foreground">
                    Selecione materiais ao lado e faça perguntas sobre eles, ou peça para eu explicar um assunto odontológico.
                  </p>
                  <div className="flex flex-wrap justify-center gap-2 mt-4">
                    <Button variant="outline" size="sm" onClick={() => setQuestion("Pode fazer um resumo sobre Anatomia Dental?")}>
                      Resumo de Anatomia Dental
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setQuestion("Quais as indicações para extração do 3º molar?")}>
                      Indicações extração 3º molar
                    </Button>
                  </div>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {history.map((msg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                    >
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-blue-600 text-white'
                      }`}>
                        {msg.role === 'user' ? <GraduationCap size={16} /> : <Bot size={16} />}
                      </div>
                      <div className={`flex-1 rounded-2xl px-4 py-3 max-w-[85%] ${
                        msg.role === 'user' 
                          ? 'bg-primary text-primary-foreground rounded-tr-none' 
                          : 'bg-white dark:bg-slate-800 border shadow-sm rounded-tl-none text-foreground'
                      }`}>
                        {msg.role === 'user' ? (
                          <div className="whitespace-pre-wrap">{msg.content}</div>
                        ) : (
                          <div className="prose prose-sm dark:prose-invert max-w-none">
                            {renderMarkdown(msg.content)}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                  
                  {isAsking && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex gap-4"
                    >
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center">
                        <Bot size={16} />
                      </div>
                      <div className="bg-white dark:bg-slate-800 border shadow-sm rounded-2xl rounded-tl-none px-4 py-4 flex items-center gap-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t bg-card">
              
              {/* Quick suggestions if there's history */}
              {history.length > 0 && history[history.length - 1]!.role === 'assistant' && !isAsking && (
                <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide">
                  <Button variant="secondary" size="sm" onClick={() => handleAsk("Simplificar essa explicação")} className="whitespace-nowrap rounded-full text-xs h-7">
                    <Lightbulb size={12} className="mr-1" /> Simplificar
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => handleAsk("Aprofundar mais neste tema")} className="whitespace-nowrap rounded-full text-xs h-7">
                    <BrainCircuit size={12} className="mr-1" /> Aprofundar
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => handleAsk("Pode me dar um exemplo clínico?")} className="whitespace-nowrap rounded-full text-xs h-7">
                    <CheckCircle2 size={12} className="mr-1" /> Dar exemplo
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => handleAsk("Faça uma pergunta para me testar sobre isso")} className="whitespace-nowrap rounded-full text-xs h-7">
                    <HelpCircle size={12} className="mr-1" /> Me testar
                  </Button>
                </div>
              )}

              <form 
                onSubmit={(e) => { e.preventDefault(); handleAsk(); }}
                className="flex gap-2 items-end relative"
              >
                <div className="relative flex-1">
                  <Input
                    id="chat-input"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder={selectedMaterials.length > 0 ? "Faça uma pergunta sobre seus materiais..." : "Faça uma pergunta..."}
                    className="pr-12 py-6 rounded-2xl bg-muted/50 border-transparent focus-visible:border-primary focus-visible:ring-primary/20"
                    disabled={isAsking}
                  />
                  {selectedMaterials.length > 0 && (
                    <div className="absolute right-3 top-3 text-primary flex items-center justify-center w-6 h-6 bg-primary/10 rounded-full" title="Contexto ativado">
                      <Paperclip size={12} />
                    </div>
                  )}
                </div>
                <Button 
                  type="submit" 
                  disabled={!question.trim() || isAsking} 
                  className="rounded-xl h-[52px] w-[52px] shrink-0"
                >
                  <Send size={20} className={question.trim() ? "translate-x-0.5 -translate-y-0.5" : ""} />
                </Button>
              </form>
            </div>

          </div>
        </div>
      </div>
    </AppShell>
  );
}

// Temporary icon addition for internal use
function HelpCircle({ size, className }: { size?: number, className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>
    </svg>
  );
}
