import { useLocal } from "@/lib/hooks/use-local";
import { useNavigate } from "@/lib/router";
import { api } from "@/lib/gen/exam";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  ArrowLeft, 
  Plus, 
  Edit2, 
  Trash2, 
  GripVertical,
  Save,
  X
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import type { 
  ExamWithRelations, 
  ItemWithRelations, 
  QuestionWithRelations,
  CreateItemRequest,
  CreateQuestionRequest,
  CreateAnswerRequest 
} from "shared/types";

interface Props {
  id: string;
}

export default function ExamQuestionsPage({ id }: Props) {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const local = useLocal({
    exam: null as ExamWithRelations | null,
    items: [] as ItemWithRelations[],
    loading: true,
    itemDialog: {
      open: false,
      mode: "create" as "create" | "edit",
      item: null as ItemWithRelations | null,
      form: {
        title: "",
        content: "",
        type: "simple",
        is_vignette: false,
        is_random: false,
        score: 0
      } as CreateItemRequest
    },
    questionDialog: {
      open: false,
      mode: "create" as "create" | "edit", 
      itemId: null as number | null,
      question: null as QuestionWithRelations | null,
      form: {
        item_id: 0,
        type: "single-answer",
        question: "",
        is_random: false,
        score: 100,
        order: 0,
        answers: [] as CreateAnswerRequest[]
      } as CreateQuestionRequest
    }
  }, async () => {
    // Load exam data
    try {
      const examData = await api.exam({ action: "get", id: parseInt(id) });
      local.exam = examData;
      
      // Load items for this exam
      const allItems = await api.exam_item({ action: "list" });
      
      // Get items linked to this exam
      const examItemIds = await getExamItemIds(parseInt(id));
      local.items = allItems.filter(item => examItemIds.includes(item.id));
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal memuat data ujian",
        variant: "destructive"
      });
      navigate("/admin/exam");
    } finally {
      local.loading = false;
      local.render();
    }
  });

  // Helper to get exam items
  const getExamItemIds = async (examId: number): Promise<number[]> => {
    // TODO: Need to create an API to get exam items
    // For now, return empty array
    return [];
  };

  // Item Dialog handlers
  const openItemDialog = (mode: "create" | "edit", item?: ItemWithRelations) => {
    if (mode === "edit" && item) {
      local.itemDialog.form = {
        title: item.title,
        content: item.content || "",
        type: item.type,
        is_vignette: item.is_vignette,
        is_random: item.is_random,
        score: item.score
      };
      local.itemDialog.item = item;
    } else {
      local.itemDialog.form = {
        title: "",
        content: "",
        type: "simple",
        is_vignette: false,
        is_random: false,
        score: 0
      };
      local.itemDialog.item = null;
    }
    local.itemDialog.mode = mode;
    local.itemDialog.open = true;
    local.render();
  };

  const saveItem = async () => {
    try {
      if (local.itemDialog.mode === "create") {
        const newItem = await api.exam_item({ 
          action: "create", 
          ...local.itemDialog.form 
        });
        
        // Link item to exam
        // TODO: Create API to link item to exam
        
        local.items.push(newItem);
        toast({ title: "Berhasil", description: "Item berhasil dibuat" });
      } else if (local.itemDialog.item) {
        const updated = await api.exam_item({ 
          action: "update", 
          id: local.itemDialog.item.id,
          ...local.itemDialog.form 
        });
        
        const index = local.items.findIndex(i => i.id === local.itemDialog.item!.id);
        if (index >= 0) local.items[index] = updated;
        
        toast({ title: "Berhasil", description: "Item berhasil diperbarui" });
      }
      
      local.itemDialog.open = false;
      local.render();
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal menyimpan item",
        variant: "destructive"
      });
    }
  };

  const deleteItem = async (item: ItemWithRelations) => {
    if (!confirm(`Hapus item "${item.title}"?`)) return;
    
    try {
      await api.exam_item({ action: "delete", id: item.id });
      local.items = local.items.filter(i => i.id !== item.id);
      toast({ title: "Berhasil", description: "Item berhasil dihapus" });
      local.render();
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal menghapus item",
        variant: "destructive"
      });
    }
  };

  // Question Dialog handlers
  const openQuestionDialog = (itemId: number, mode: "create" | "edit", question?: QuestionWithRelations) => {
    if (mode === "edit" && question) {
      local.questionDialog.form = {
        item_id: itemId,
        type: question.type,
        question: question.question || "",
        is_random: question.is_random,
        score: question.score,
        order: question.order,
        answers: question.answers?.map(a => ({
          answer: a.answer || "",
          is_correct_answer: a.is_correct_answer
        })) || []
      };
      local.questionDialog.question = question;
    } else {
      const item = local.items.find(i => i.id === itemId);
      const nextOrder = (item?.questions?.length || 0) + 1;
      
      local.questionDialog.form = {
        item_id: itemId,
        type: local.exam?.is_mcq ? "single-answer" : "essay",
        question: "",
        is_random: false,
        score: 100,
        order: nextOrder,
        answers: local.exam?.is_mcq ? [
          { answer: "", is_correct_answer: false },
          { answer: "", is_correct_answer: false },
          { answer: "", is_correct_answer: false },
          { answer: "", is_correct_answer: false }
        ] : []
      };
      local.questionDialog.question = null;
    }
    local.questionDialog.mode = mode;
    local.questionDialog.itemId = itemId;
    local.questionDialog.open = true;
    local.render();
  };

  const saveQuestion = async () => {
    try {
      if (local.questionDialog.mode === "create") {
        const newQuestion = await api.exam_question({ 
          action: "create", 
          ...local.questionDialog.form 
        });
        
        const item = local.items.find(i => i.id === local.questionDialog.itemId);
        if (item) {
          if (!item.questions) item.questions = [];
          item.questions.push(newQuestion);
        }
        
        toast({ title: "Berhasil", description: "Soal berhasil dibuat" });
      } else if (local.questionDialog.question) {
        const updated = await api.exam_question({ 
          action: "update", 
          id: local.questionDialog.question.id,
          ...local.questionDialog.form 
        });
        
        const item = local.items.find(i => i.id === local.questionDialog.itemId);
        if (item && item.questions) {
          const index = item.questions.findIndex(q => q.id === local.questionDialog.question!.id);
          if (index >= 0) item.questions[index] = updated;
        }
        
        toast({ title: "Berhasil", description: "Soal berhasil diperbarui" });
      }
      
      local.questionDialog.open = false;
      local.render();
    } catch (error) {
      toast({
        title: "Error", 
        description: "Gagal menyimpan soal",
        variant: "destructive"
      });
    }
  };

  const deleteQuestion = async (itemId: number, question: QuestionWithRelations) => {
    if (!confirm("Hapus soal ini?")) return;
    
    try {
      await api.exam_question({ action: "delete", id: question.id });
      
      const item = local.items.find(i => i.id === itemId);
      if (item && item.questions) {
        item.questions = item.questions.filter(q => q.id !== question.id);
      }
      
      toast({ title: "Berhasil", description: "Soal berhasil dihapus" });
      local.render();
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal menghapus soal",
        variant: "destructive"
      });
    }
  };

  const addAnswer = () => {
    local.questionDialog.form.answers.push({ answer: "", is_correct_answer: false });
    local.render();
  };

  const removeAnswer = (index: number) => {
    local.questionDialog.form.answers.splice(index, 1);
    local.render();
  };

  const setCorrectAnswer = (index: number) => {
    local.questionDialog.form.answers = local.questionDialog.form.answers.map((a, i) => ({
      ...a,
      is_correct_answer: i === index
    }));
    local.render();
  };

  if (local.loading) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="py-10 text-center">
            Memuat data...
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate("/admin/exam")}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali
        </Button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{local.exam?.name}</h1>
            <p className="text-muted-foreground">Kelola soal ujian</p>
          </div>
          <Button onClick={() => openItemDialog("create")}>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Item
          </Button>
        </div>
      </div>

      {local.items.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground mb-4">Belum ada soal</p>
            <Button onClick={() => openItemDialog("create")}>
              <Plus className="mr-2 h-4 w-4" />
              Tambah Item Pertama
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Accordion type="single" collapsible className="space-y-4">
          {local.items.map((item, itemIndex) => (
            <AccordionItem key={item.id} value={`item-${item.id}`} className="border rounded-lg">
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center justify-between w-full pr-4">
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{item.title}</span>
                    {item.is_vignette && <Badge variant="secondary">Vignette</Badge>}
                    <Badge variant="outline">{item.questions?.length || 0} soal</Badge>
                  </div>
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openItemDialog("edit", item)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteItem(item)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                {item.is_vignette && item.content && (
                  <Card className="mb-4">
                    <CardHeader>
                      <CardTitle className="text-sm">Skenario/Vignette</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: item.content }} />
                    </CardContent>
                  </Card>
                )}
                
                <div className="space-y-2">
                  {item.questions?.map((question, qIndex) => (
                    <Card key={question.id}>
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-medium">Soal {qIndex + 1}</span>
                              <Badge variant="outline">{question.score} poin</Badge>
                            </div>
                            <div className="prose prose-sm max-w-none mb-2" dangerouslySetInnerHTML={{ __html: question.question || "" }} />
                            
                            {question.answers && question.answers.length > 0 && (
                              <div className="mt-2 space-y-1">
                                {question.answers.map((answer, aIndex) => (
                                  <div key={answer.id} className="flex items-center gap-2 text-sm">
                                    <span className="font-medium">{String.fromCharCode(65 + aIndex)}.</span>
                                    <span className={answer.is_correct_answer ? "text-green-600 font-medium" : ""}>
                                      {answer.answer}
                                    </span>
                                    {answer.is_correct_answer && <Badge variant="success" className="text-xs">Benar</Badge>}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1 ml-4">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openQuestionDialog(item.id, "edit", question)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteQuestion(item.id, question)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => openQuestionDialog(item.id, "create")}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Tambah Soal
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}

      {/* Item Dialog */}
      <Dialog open={local.itemDialog.open} onOpenChange={(open) => {
        local.itemDialog.open = open;
        local.render();
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {local.itemDialog.mode === "create" ? "Tambah Item" : "Edit Item"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="item-title">Judul Item</Label>
              <Input
                id="item-title"
                value={local.itemDialog.form.title}
                onChange={(e) => {
                  local.itemDialog.form.title = e.target.value;
                  local.render();
                }}
                placeholder="Judul item soal..."
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Tipe Vignette</Label>
                <p className="text-sm text-muted-foreground">
                  Item memiliki skenario/kasus
                </p>
              </div>
              <Switch
                checked={local.itemDialog.form.is_vignette}
                onCheckedChange={(checked) => {
                  local.itemDialog.form.is_vignette = checked;
                  local.render();
                }}
              />
            </div>

            {local.itemDialog.form.is_vignette && (
              <div className="space-y-2">
                <Label htmlFor="item-content">Konten Vignette</Label>
                <Textarea
                  id="item-content"
                  value={local.itemDialog.form.content}
                  onChange={(e) => {
                    local.itemDialog.form.content = e.target.value;
                    local.render();
                  }}
                  placeholder="Skenario atau kasus..."
                  rows={5}
                />
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Acak Soal</Label>
                <p className="text-sm text-muted-foreground">
                  Urutan soal dalam item ini akan diacak
                </p>
              </div>
              <Switch
                checked={local.itemDialog.form.is_random}
                onCheckedChange={(checked) => {
                  local.itemDialog.form.is_random = checked;
                  local.render();
                }}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              local.itemDialog.open = false;
              local.render();
            }}>
              Batal
            </Button>
            <Button onClick={saveItem}>
              <Save className="mr-2 h-4 w-4" />
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Question Dialog */}
      <Dialog open={local.questionDialog.open} onOpenChange={(open) => {
        local.questionDialog.open = open;
        local.render();
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {local.questionDialog.mode === "create" ? "Tambah Soal" : "Edit Soal"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="question-text">Soal</Label>
              <Textarea
                id="question-text"
                value={local.questionDialog.form.question}
                onChange={(e) => {
                  local.questionDialog.form.question = e.target.value;
                  local.render();
                }}
                placeholder="Tulis soal..."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="question-score">Skor</Label>
                <Input
                  id="question-score"
                  type="number"
                  min="0"
                  value={local.questionDialog.form.score}
                  onChange={(e) => {
                    local.questionDialog.form.score = parseInt(e.target.value) || 0;
                    local.render();
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="question-order">Urutan</Label>
                <Input
                  id="question-order"
                  type="number"
                  min="1"
                  value={local.questionDialog.form.order}
                  onChange={(e) => {
                    local.questionDialog.form.order = parseInt(e.target.value) || 0;
                    local.render();
                  }}
                />
              </div>
            </div>

            {local.exam?.is_mcq && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Pilihan Jawaban</Label>
                  <Button size="sm" variant="outline" onClick={addAnswer}>
                    <Plus className="mr-2 h-4 w-4" />
                    Tambah Pilihan
                  </Button>
                </div>
                
                <div className="space-y-2">
                  {local.questionDialog.form.answers.map((answer, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="font-medium w-8">{String.fromCharCode(65 + index)}.</span>
                      <Input
                        value={answer.answer}
                        onChange={(e) => {
                          local.questionDialog.form.answers[index].answer = e.target.value;
                          local.render();
                        }}
                        placeholder={`Pilihan ${String.fromCharCode(65 + index)}`}
                        className="flex-1"
                      />
                      <Button
                        size="sm"
                        variant={answer.is_correct_answer ? "default" : "outline"}
                        onClick={() => setCorrectAnswer(index)}
                      >
                        Benar
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeAnswer(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Acak Jawaban</Label>
                <p className="text-sm text-muted-foreground">
                  Urutan jawaban akan diacak
                </p>
              </div>
              <Switch
                checked={local.questionDialog.form.is_random}
                onCheckedChange={(checked) => {
                  local.questionDialog.form.is_random = checked;
                  local.render();
                }}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              local.questionDialog.open = false;
              local.render();
            }}>
              Batal
            </Button>
            <Button onClick={saveQuestion}>
              <Save className="mr-2 h-4 w-4" />
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}