import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { AppShell } from "@/components/AppShell"
import { useServerFn } from "@tanstack/react-start"
import { generateSimulation, gradeSimulation } from "@/lib/ai.functions"
import { useProfile } from "@/lib/data"
import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { 
  Loader2, ArrowRight, ArrowLeft, Clock, CheckCircle2, XCircle, 
  Flag, BookOpen, AlertCircle, FileText, BrainCircuit, RefreshCcw, 
  History, Timer, FileQuestion, BookMarked
} from "lucide-react"

export const Route = createFileRoute('/simulado')({
  component: SimuladoPage,
})

type Phase = 'builder' | 'generating' | 'exam' | 'grading' | 'results'

interface Material {
  id: string
  file_name: string
  subject_id: string | null
}

interface Question {
  id: string
  simulation_id: string
  question_type: string
  statement: string
  options: any
  correct_answer: string
  topic: string | null
  position: number
}

interface AnswerRecord {
  id: string
  question_id: string
  answer: string | null
  is_correct: boolean | null
  explanation: string | null
  score: number | null
}

function SimuladoPage() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const { data: subjects } = useQuery({
    queryKey: ['all-subjects'],
    queryFn: async () => {
      const { data, error } = await supabase.from('subjects').select('*').order('name')
      if (error) throw error
      return data
    },
    enabled: !!session?.user.id,
  })
  const generate = useServerFn(generateSimulation)
  const grade = useServerFn(gradeSimulation)

  // Estado do Construtor
  const [phase, setPhase] = useState<Phase>('builder')
  const [subjectId, setSubjectId] = useState<string>('')
  const [materialIds, setMaterialIds] = useState<string[]>([])
  const [examType, setExamType] = useState<'primeira' | 'segunda' | 'ultima'>('segunda')
  const [questionCount, setQuestionCount] = useState<number>(10)
  const [difficulty, setDifficulty] = useState<'facil' | 'media' | 'dificil'>('media')
  const [focusTopics, setFocusTopics] = useState<string>('')
  const [timeLimitEnabled, setTimeLimitEnabled] = useState(false)
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<number>(60)
  const [pdfFiles, setPdfFiles] = useState<{ name: string; text: string }[]>([])
  const [extractingPdf, setExtractingPdf] = useState(false)
  
  // Estado de Geração
  const [generationStep, setGenerationStep] = useState(0)

  // Estado do Exame
  const [simulationId, setSimulationId] = useState<string>('')
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [flagged, setFlagged] = useState<Record<string, boolean>>({})
  const [startTime, setStartTime] = useState<number>(0)
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)

  // Estado dos Resultados
  const [scoreData, setScoreData] = useState<{score: number, correct: number, total: number} | null>(null)

  // Consultas
  const { data: materials } = useQuery({
    queryKey: ['materials', subjectId],
    queryFn: async () => {
      let query = supabase.from('materials').select('*')
      if (subjectId) {
        query = query.eq('subject_id', subjectId)
      }
      const { data, error } = await query
      if (error) throw error
      return data as unknown as Material[]
    },
    enabled: !!session?.user.id && !!subjectId,
  })

  const { data: questions } = useQuery({
    queryKey: ['simulation_questions', simulationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('simulation_questions')
        .select('*')
        .eq('simulation_id', simulationId)
        .order('position')
      if (error) throw error
      return data as unknown as Question[]
    },
    enabled: !!simulationId && (phase === 'exam' || phase === 'results' || phase === 'grading'),
  })

  const { data: results } = useQuery({
    queryKey: ['simulation_answers', simulationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('simulation_answers')
        .select('*')
        .eq('simulation_id', simulationId)
      if (error) throw error
      return data as unknown as AnswerRecord[]
    },
    enabled: !!simulationId && phase === 'results',
  })

  // Efeito do Temporizador
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>
    if (phase === 'exam' && timeRemaining !== null) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev && prev > 0) return prev - 1
          clearInterval(interval)
          handleFinishExam() // Finalizar automaticamente
          return 0
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [phase, timeRemaining])

  const toggleMaterial = (id: string) => {
    setMaterialIds(prev => 
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    )
  }

  const handlePdfUpload = async (files: FileList) => {
    if (!files.length) return
    setExtractingPdf(true)
    try {
      const pdfjs = await import('pdfjs-dist')
      pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`
      const results: { name: string; text: string }[] = []
      for (const file of Array.from(files)) {
        const arrayBuffer = await file.arrayBuffer()
        const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise
        let text = ''
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i)
          const content = await page.getTextContent()
          text += content.items.map((item: any) => item.str).join(' ') + '\n'
        }
        results.push({ name: file.name, text: text.slice(0, 30000) })
      }
      setPdfFiles(prev => [...prev, ...results].slice(0, 5))
      toast.success(`${results.length} PDF${results.length > 1 ? 's' : ''} carregado${results.length > 1 ? 's' : ''}!`)
    } catch (err) {
      toast.error('Erro ao extrair texto do PDF')
    } finally {
      setExtractingPdf(false)
    }
  }

  const handleGenerate = async () => {
    if (!subjectId) {
      toast.error('Selecione uma disciplina')
      return
    }
    if (materialIds.length === 0 && pdfFiles.length === 0) {
      toast.error('Selecione ao menos um material ou faça upload de um PDF')
      return
    }
    setPhase('generating')
    setGenerationStep(0)

    const steps = [
      'Analisando materiais...',
      'Identificando tópicos...',
      'Gerando questões...',
      'Organizando prova...',
      'Pronto!'
    ]

    const interval = setInterval(() => {
      setGenerationStep(prev => Math.min(prev + 1, steps.length - 1))
    }, 1500)

    try {
      const res = await generate({ data: {
        subjectId: subjectId || null,
        materialIds,
        pdfTexts: pdfFiles.map(f => f.text),
        questionCount,
        examType,
        difficulty,
        focusTopics: focusTopics || null,
        timeLimitMinutes: timeLimitEnabled ? timeLimitMinutes : null,
        title: `Simulado - ${subjects?.find(s => s.id === subjectId)?.name || 'Geral'}`
      } })
      
      clearInterval(interval)
      setGenerationStep(4)
      setTimeout(() => {
        setSimulationId(res.id)
        setPhase('exam')
        setCurrentQuestionIdx(0)
        setAnswers({})
        setFlagged({})
        setStartTime(Date.now())
        if (timeLimitEnabled) {
          setTimeRemaining(timeLimitMinutes * 60)
        } else {
          setTimeRemaining(null)
        }
      }, 1000)
    } catch (err) {
      clearInterval(interval)
      toast.error('Erro ao gerar simulado')
      setPhase('builder')
    }
  }

  const handleAnswer = (questionId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }))
  }

  const handleToggleFlag = (questionId: string) => {
    setFlagged(prev => ({ ...prev, [questionId]: !prev[questionId] }))
  }

  const handleFinishExam = async () => {
    if (!questions) return

    const unanswered = questions.filter(q => !answers[q.id])
    if (unanswered.length > 0) {
      const confirm = window.confirm(`Você tem ${unanswered.length} questões sem resposta. Deseja finalizar mesmo assim?`)
      if (!confirm) return
    }

    setPhase('grading')
    const durationSeconds = Math.floor((Date.now() - startTime) / 1000)
    
    try {
      const formattedAnswers = questions.map(q => ({
        questionId: q.id,
        answer: answers[q.id] || ''
      }))

      const res = await grade({ data: {
        simulationId,
        durationSeconds,
        answers: formattedAnswers,
      } })

      setScoreData(res)
      setPhase('results')
    } catch (error) {
      toast.error('Erro ao corrigir prova')
      setPhase('exam')
    }
  }

  const resetBuilder = () => {
    setPhase('builder')
    setSimulationId('')
    setAnswers({})
    setScoreData(null)
    setPdfFiles([])
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  return (
    <AppShell>
      <div className="container max-w-4xl py-8 mx-auto space-y-8 pb-24">
        
        <AnimatePresence mode="wait">
          {phase === 'builder' && (
            <motion.div
              key="builder"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-primary/10 rounded-xl text-primary">
                  <BrainCircuit className="w-8 h-8" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">Simular Prova</h1>
                  <p className="text-muted-foreground">Configure seu simulado personalizado com IA.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-8">
                  {/* Passo 1 e 2 */}
                  <div className="space-y-4 p-6 bg-card rounded-2xl border shadow-sm">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-primary" /> 1. Disciplina e Materiais
                    </h2>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Disciplina</Label>
                        <Select value={subjectId} onValueChange={setSubjectId}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Selecione uma disciplina" />
                          </SelectTrigger>
                          <SelectContent>
                            {subjects?.map(s => (
                              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {subjectId && (
                        <div className="space-y-2 pt-2">
                          <Label>Materiais base (opcional)</Label>
                          <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto p-2 border rounded-md bg-muted/20">
                            {materials?.length === 0 && <p className="text-sm text-muted-foreground p-2">Nenhum material encontrado.</p>}
                            {materials?.map(m => (
                              <label key={m.id} className="flex items-center space-x-3 p-2 hover:bg-muted/50 rounded cursor-pointer transition-colors">
                                <Checkbox 
                                  checked={materialIds.includes(m.id)}
                                  onCheckedChange={() => toggleMaterial(m.id)}
                                />
                                <span className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{m.file_name}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Upload de PDFs */}
                      <div className="space-y-2 pt-2">
                        <Label className="flex items-center gap-2">
                          <FileText className="w-4 h-4" /> Upload de PDFs (opcional)
                        </Label>
                        <label className={cn(
                          "flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-xl cursor-pointer transition-colors",
                          extractingPdf || pdfFiles.length >= 5
                            ? "opacity-50 cursor-not-allowed"
                            : "hover:bg-muted/50 hover:border-primary/50"
                        )}>
                          {extractingPdf ? (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Extraindo texto do PDF...
                            </div>
                          ) : (
                            <div className="text-center text-sm text-muted-foreground">
                              <FileText className="w-6 h-6 mx-auto mb-1 opacity-50" />
                              <span>Clique para enviar PDFs</span>
                              <p className="text-xs mt-1">Máximo 5 arquivos · O simulado será gerado com base no conteúdo</p>
                            </div>
                          )}
                          <input
                            type="file"
                            accept=".pdf"
                            multiple
                            disabled={extractingPdf || pdfFiles.length >= 5}
                            className="hidden"
                            onChange={(e) => e.target.files && handlePdfUpload(e.target.files)}
                          />
                        </label>
                        {pdfFiles.length > 0 && (
                          <div className="space-y-1">
                            {pdfFiles.map((f, i) => (
                              <div key={i} className="flex items-center justify-between text-sm p-2 bg-primary/5 border border-primary/20 rounded-lg">
                                <span className="truncate flex items-center gap-2 text-primary">
                                  <FileText className="w-3 h-3 flex-shrink-0" />
                                  {f.name}
                                </span>
                                <button
                                  onClick={() => setPdfFiles(prev => prev.filter((_, j) => j !== i))}
                                  className="text-muted-foreground hover:text-destructive ml-2 flex-shrink-0"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Passo 3 */}
                  <div className="space-y-4 p-6 bg-card rounded-2xl border shadow-sm">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                      <FileQuestion className="w-5 h-5 text-primary" /> 2. Tipo de Avaliação
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        { id: 'primeira', label: '1ª Avaliação', desc: '100% Discursiva' },
                        { id: 'segunda', label: '2ª Avaliação', desc: 'Mista' },
                        { id: 'ultima', label: 'Última Avaliação', desc: '100% Objetiva' }
                      ].map(type => (
                        <div 
                          key={type.id}
                          onClick={() => setExamType(type.id as any)}
                          className={cn(
                            "p-4 rounded-xl border-2 cursor-pointer transition-all text-center space-y-1",
                            examType === type.id ? "border-primary bg-primary/5" : "border-transparent bg-muted hover:bg-muted/80"
                          )}
                        >
                          <p className="font-semibold">{type.label}</p>
                          <p className="text-xs text-muted-foreground">{type.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Passo 4 e 5 */}
                  <div className="space-y-6 p-6 bg-card rounded-2xl border shadow-sm">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                      <Settings2Icon className="w-5 h-5 text-primary" /> 3. Configurações
                    </h2>
                    
                    <div className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <Label>Quantidade de Questões: {questionCount}</Label>
                        </div>
                        <Slider 
                          value={[questionCount]} 
                          onValueChange={(v) => setQuestionCount(v[0] ?? 10)} 
                          min={5} max={20} step={1} 
                        />
                      </div>

                      <div className="space-y-3 pt-2">
                        <Label>Dificuldade</Label>
                        <div className="grid grid-cols-3 gap-2">
                          {['facil', 'media', 'dificil'].map(diff => (
                            <Button 
                              key={diff}
                              variant={difficulty === diff ? 'default' : 'outline'}
                              onClick={() => setDifficulty(diff as any)}
                              className="w-full capitalize"
                            >
                              {diff === 'facil' ? 'Fácil' : diff === 'media' ? 'Média' : 'Difícil'}
                            </Button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2 pt-2">
                        <Label>Tópicos em Foco (Opcional)</Label>
                        <Input 
                          placeholder="Ex: Anatomia, Fisiologia..." 
                          value={focusTopics}
                          onChange={(e) => setFocusTopics(e.target.value)}
                        />
                      </div>

                      <div className="space-y-3 pt-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="timeLimit" 
                            checked={timeLimitEnabled}
                            onCheckedChange={(c) => setTimeLimitEnabled(!!c)}
                          />
                          <Label htmlFor="timeLimit">Limite de Tempo</Label>
                        </div>
                        {timeLimitEnabled && (
                          <div className="flex items-center space-x-2 pl-6">
                            <Input 
                              type="number" 
                              min={5} 
                              max={180} 
                              value={timeLimitMinutes}
                              onChange={(e) => setTimeLimitMinutes(parseInt(e.target.value) || 60)}
                              className="w-24"
                            />
                            <span className="text-sm text-muted-foreground">minutos</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Painel de Resumo */}
                <div className="space-y-6">
                  <div className="sticky top-24 p-6 bg-card rounded-2xl border shadow-sm space-y-6">
                    <h3 className="font-semibold text-lg border-b pb-2">Resumo</h3>
                    
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Disciplina:</span>
                        <span className="font-medium truncate max-w-[120px]" title={subjects?.find(s => s.id === subjectId)?.name}>
                          {subjects?.find(s => s.id === subjectId)?.name || '-'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Materiais:</span>
                        <span className="font-medium">{materialIds.length > 0 ? `${materialIds.length} selecionados` : 'Todos'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Avaliação:</span>
                        <span className="font-medium capitalize">{examType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Questões:</span>
                        <span className="font-medium">{questionCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Dificuldade:</span>
                        <span className="font-medium capitalize">{difficulty}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tempo:</span>
                        <span className="font-medium">{timeLimitEnabled ? `${timeLimitMinutes} min` : 'Livre'}</span>
                      </div>
                    </div>

                    <Button 
                      className="w-full" 
                      size="lg" 
                      onClick={handleGenerate}
                      disabled={!subjectId}
                    >
                      <BrainCircuit className="w-4 h-4 mr-2" />
                      Gerar Simulado
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {phase === 'generating' && (
            <motion.div
              key="generating"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center min-h-[60vh] space-y-8"
            >
              <div className="relative">
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                  className="absolute inset-0 bg-primary/20 rounded-full blur-xl"
                />
                <div className="relative bg-background p-6 rounded-full border-4 border-primary/20 shadow-xl">
                  <BrainCircuit className="w-16 h-16 text-primary animate-pulse" />
                </div>
              </div>
              
              <div className="space-y-4 text-center w-full max-w-sm">
                <h2 className="text-2xl font-bold">Preparando seu Simulado</h2>
                <div className="space-y-2">
                  {[
                    'Analisando materiais...',
                    'Identificando tópicos...',
                    'Gerando questões...',
                    'Organizando prova...',
                    'Pronto!'
                  ].map((step, i) => (
                    <div 
                      key={step} 
                      className={cn(
                        "flex items-center space-x-3 text-sm transition-all duration-500",
                        generationStep > i ? "text-primary" : generationStep === i ? "text-foreground font-medium text-base" : "text-muted-foreground/40"
                      )}
                    >
                      {generationStep > i ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : generationStep === i ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-current" />
                      )}
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {phase === 'exam' && questions && questions.length > 0 && (
            <motion.div
              key="exam"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              {/* Cabeçalho do Exame */}
              <div className="sticky top-4 z-10 bg-background/80 backdrop-blur-md p-4 rounded-2xl border shadow-sm flex items-center justify-between">
                <div className="flex items-center space-x-4 flex-1">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                    {currentQuestionIdx + 1}/{questions.length}
                  </div>
                  <div className="flex-1 max-w-md hidden sm:block">
                    <div className="flex justify-between text-xs mb-1 text-muted-foreground">
                      <span>Progresso</span>
                      <span>{Math.round(((Object.keys(answers).length) / questions.length) * 100)}%</span>
                    </div>
                    <Progress value={((Object.keys(answers).length) / questions.length) * 100} className="h-2" />
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  {timeRemaining !== null && (
                    <div className={cn(
                      "flex items-center space-x-2 px-3 py-1.5 rounded-full font-mono text-sm font-medium",
                      timeRemaining < 300 ? "bg-destructive/10 text-destructive animate-pulse" : "bg-muted"
                    )}>
                      <Clock className="w-4 h-4" />
                      <span>{formatTime(timeRemaining)}</span>
                    </div>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm"
                    className={cn(flagged[questions[currentQuestionIdx]!.id] && "bg-orange-500/10 text-orange-500 border-orange-500/20")}
                    onClick={() => handleToggleFlag(questions[currentQuestionIdx]!.id)}
                  >
                    <Flag className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Revisar</span>
                  </Button>
                </div>
              </div>

              {/* Conteúdo da Questão */}
              <div className="bg-card rounded-2xl border shadow-sm overflow-hidden min-h-[400px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentQuestionIdx}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="p-6 md:p-8 space-y-8"
                  >
                    <div className="prose prose-sm md:prose-base max-w-none dark:prose-invert">
                      <p className="text-lg leading-relaxed whitespace-pre-wrap">
                        {questions[currentQuestionIdx]!.statement}
                      </p>
                    </div>

                    {questions[currentQuestionIdx]!.question_type === 'objetiva' ? (
                      <div className="space-y-3">
                        {Array.isArray(questions[currentQuestionIdx]!.options) && 
                          questions[currentQuestionIdx]!.options.map((opt: any, i: number) => {
                            const letter = String.fromCharCode(65 + i)
                            const isSelected = answers[questions[currentQuestionIdx]!.id] === letter
                            return (
                              <button
                                key={i}
                                onClick={() => handleAnswer(questions[currentQuestionIdx]!.id, letter)}
                                className={cn(
                                  "w-full flex items-start p-4 rounded-xl border-2 text-left transition-all min-h-[56px]",
                                  isSelected 
                                    ? "border-primary bg-primary/5 shadow-sm" 
                                    : "border-muted bg-background hover:border-primary/30 hover:bg-muted/50"
                                )}
                              >
                                <span className={cn(
                                  "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mr-4 text-sm font-bold border-2 transition-colors",
                                  isSelected ? "bg-primary text-primary-foreground border-primary" : "border-muted-foreground/30 text-muted-foreground"
                                )}>
                                  {letter}
                                </span>
                                <span className="pt-1 text-sm md:text-base">{opt}</span>
                              </button>
                            )
                        })}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <Label>Sua resposta discursiva:</Label>
                        <Textarea 
                          value={answers[questions[currentQuestionIdx]!.id] || ''}
                          onChange={(e) => handleAnswer(questions[currentQuestionIdx]!.id, e.target.value)}
                          placeholder="Digite sua resposta aqui..."
                          className="min-h-[200px] resize-y text-base p-4"
                        />
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Navegação */}
              <div className="flex items-center justify-between bg-card p-4 rounded-2xl border shadow-sm">
                <Button 
                  variant="outline" 
                  onClick={() => setCurrentQuestionIdx(prev => Math.max(0, prev - 1))}
                  disabled={currentQuestionIdx === 0}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Anterior
                </Button>

                <div className="flex gap-1 overflow-x-auto max-w-[50%] px-2 py-1 scrollbar-hide">
                  {questions.map((q, i) => (
                    <button
                      key={q.id}
                      onClick={() => setCurrentQuestionIdx(i)}
                      className={cn(
                        "w-2.5 h-2.5 rounded-full flex-shrink-0 transition-all",
                        i === currentQuestionIdx ? "w-4 bg-primary" :
                        flagged[q.id] ? "bg-orange-500" :
                        answers[q.id] ? "bg-primary/40" : "bg-muted-foreground/20"
                      )}
                      title={`Questão ${i + 1}`}
                    />
                  ))}
                </div>

                {currentQuestionIdx === questions.length - 1 ? (
                  <Button onClick={handleFinishExam}>
                    Finalizar
                    <CheckCircle2 className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button 
                    onClick={() => setCurrentQuestionIdx(prev => Math.min(questions.length - 1, prev + 1))}
                  >
                    Próxima
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>
            </motion.div>
          )}

          {phase === 'grading' && (
            <motion.div
              key="grading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center min-h-[50vh] space-y-6"
            >
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
              <h2 className="text-xl font-medium text-center">
                A IA está corrigindo seu simulado...<br/>
                <span className="text-sm text-muted-foreground">Isso pode levar alguns segundos, especialmente para questões discursivas.</span>
              </h2>
            </motion.div>
          )}

          {phase === 'results' && scoreData && results && questions && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              {/* Cabeçalho de Pontuação */}
              <div className="bg-gradient-to-br from-primary/10 via-background to-background p-8 rounded-3xl border shadow-sm text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                  <BrainCircuit className="w-64 h-64" />
                </div>
                
                <h2 className="text-2xl font-bold mb-8">Resultado do Simulado</h2>
                
                <div className="flex flex-col items-center justify-center space-y-2 mb-8">
                  <div className="text-7xl font-black text-primary flex items-baseline">
                    <AnimatedNumber value={Math.round((scoreData.score / 100) * 10)} />
                    <span className="text-3xl text-muted-foreground font-medium">/10</span>
                  </div>
                  <p className="text-lg font-medium text-muted-foreground">Nota Final</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
                  <div className="bg-card p-4 rounded-2xl border shadow-sm flex flex-col items-center">
                    <CheckCircle2 className="w-6 h-6 text-green-500 mb-2" />
                    <span className="text-2xl font-bold">{scoreData.correct}</span>
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">Acertos</span>
                  </div>
                  <div className="bg-card p-4 rounded-2xl border shadow-sm flex flex-col items-center">
                    <XCircle className="w-6 h-6 text-red-500 mb-2" />
                    <span className="text-2xl font-bold">{scoreData.total - scoreData.correct}</span>
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">Erros</span>
                  </div>
                  <div className="bg-card p-4 rounded-2xl border shadow-sm flex flex-col items-center">
                    <FileQuestion className="w-6 h-6 text-blue-500 mb-2" />
                    <span className="text-2xl font-bold">{scoreData.total}</span>
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">Total</span>
                  </div>
                  <div className="bg-card p-4 rounded-2xl border shadow-sm flex flex-col items-center">
                    <Timer className="w-6 h-6 text-orange-500 mb-2" />
                    <span className="text-2xl font-bold">{formatTime(Math.floor((Date.now() - startTime) / 1000))}</span>
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">Tempo</span>
                  </div>
                </div>
              </div>

              {/* Ações */}
              <div className="flex flex-wrap gap-4 justify-center">
                <Button onClick={resetBuilder} size="lg" variant="outline">
                  <RefreshCcw className="w-4 h-4 mr-2" />
                  Novo Simulado
                </Button>
                <Button onClick={() => navigate({ to: '/desempenho' })} size="lg" variant="secondary">
                  <History className="w-4 h-4 mr-2" />
                  Ver Histórico
                </Button>
              </div>

              {/* Revisão Detalhada */}
              <div className="space-y-6 mt-12">
                <h3 className="text-2xl font-bold flex items-center">
                  <BookMarked className="w-6 h-6 mr-2 text-primary" />
                  Revisão Detalhada
                </h3>
                
                <div className="space-y-6">
                  {questions.map((q, idx) => {
                    const ansRecord = results.find(r => r.question_id === q.id)
                    const isCorrect = ansRecord?.is_correct || false
                    
                    return (
                      <div key={q.id} className={cn(
                        "p-6 rounded-2xl border shadow-sm space-y-4",
                        isCorrect ? "bg-green-500/5 border-green-500/20" : "bg-red-500/5 border-red-500/20"
                      )}>
                        <div className="flex gap-4">
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1",
                            isCorrect ? "bg-green-500/20 text-green-600" : "bg-red-500/20 text-red-600"
                          )}>
                            {isCorrect ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                          </div>
                          <div className="space-y-4 flex-1">
                            <div>
                              <p className="text-sm text-muted-foreground font-medium mb-1">Questão {idx + 1}</p>
                              <p className="text-base font-medium">{q.statement}</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="p-4 rounded-xl bg-background border">
                                <p className="text-xs text-muted-foreground mb-2 uppercase font-semibold">Sua Resposta</p>
                                {q.question_type === 'objetiva' ? (
                                  <p className="font-medium">
                                    <span className="font-bold mr-2">{ansRecord?.answer})</span>
                                    {q.options[(ansRecord?.answer?.charCodeAt(0) ?? 0) - 65] || 'Não respondida'}
                                  </p>
                                ) : (
                                  <p className="text-sm italic">{ansRecord?.answer || 'Não respondida'}</p>
                                )}
                              </div>
                              
                              <div className="p-4 rounded-xl bg-background border">
                                <p className="text-xs text-muted-foreground mb-2 uppercase font-semibold">Resposta Correta</p>
                                {q.question_type === 'objetiva' ? (
                                  <p className="font-medium text-green-600 dark:text-green-500">
                                    <span className="font-bold mr-2">{q.correct_answer})</span>
                                    {q.options[q.correct_answer.charCodeAt(0) - 65]}
                                  </p>
                                ) : (
                                  <p className="text-sm text-green-600 dark:text-green-500">{q.correct_answer}</p>
                                )}
                              </div>
                            </div>

                            {ansRecord?.explanation && (
                              <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 flex gap-3">
                                <BrainCircuit className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-xs text-primary font-semibold uppercase mb-1">Feedback da IA</p>
                                  <p className="text-sm text-muted-foreground">{ansRecord.explanation}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </AppShell>
  )
}

// Componente auxiliar para números animados
function AnimatedNumber({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    let start = 0
    const duration = 1500
    const increment = value / (duration / 16)
    
    const timer = setInterval(() => {
      start += increment
      if (start >= value) {
        setDisplayValue(value)
        clearInterval(timer)
      } else {
        setDisplayValue(Number(start.toFixed(1)))
      }
    }, 16)

    return () => clearInterval(timer)
  }, [value])

  return <span>{displayValue}</span>
}

function Settings2Icon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 7h-9" />
      <path d="M14 17H5" />
      <circle cx="17" cy="17" r="3" />
      <circle cx="7" cy="7" r="3" />
    </svg>
  )
}
