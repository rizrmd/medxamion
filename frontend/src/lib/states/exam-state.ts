import { proxy } from "valtio";
import type { 
  ExamWithRelations, 
  ItemWithRelations, 
  QuestionWithRelations,
  AttemptWithRelations,
  DeliveryWithRelations
} from "shared/types";

interface ExamTakingState {
  // Current exam session
  delivery: DeliveryWithRelations | null;
  exam: ExamWithRelations | null;
  attempt: AttemptWithRelations | null;
  
  // Navigation
  currentItemIndex: number;
  currentItem: ItemWithRelations | null;
  
  // Answers
  answers: Record<string, string | null>;
  savedAnswers: Set<string>;
  
  // Question tracking
  skippedQuestions: Set<string>;
  laterQuestions: Set<string>;
  completedQuestions: Set<string>;
  
  // Timer
  remainingSeconds: number;
  timerInterval: number | null;
  
  // UI State
  isLoading: boolean;
  isSaving: boolean;
  showFinishModal: boolean;
}

export const examState = {
  write: proxy<ExamTakingState>({
    delivery: null,
    exam: null,
    attempt: null,
    currentItemIndex: 0,
    currentItem: null,
    answers: {},
    savedAnswers: new Set(),
    skippedQuestions: new Set(),
    laterQuestions: new Set(),
    completedQuestions: new Set(),
    remainingSeconds: 0,
    timerInterval: null,
    isLoading: false,
    isSaving: false,
    showFinishModal: false
  }),

  // Initialize exam session
  initExam(delivery: DeliveryWithRelations, exam: ExamWithRelations, attempt: AttemptWithRelations) {
    this.write.delivery = delivery;
    this.write.exam = exam;
    this.write.attempt = attempt;
    this.write.currentItemIndex = 0;
    this.write.currentItem = exam.items?.[0] || null;
    
    // Load saved state from localStorage
    const savedState = localStorage.getItem('exam-state');
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        this.write.skippedQuestions = new Set(parsed.skipped || []);
        this.write.laterQuestions = new Set(parsed.later || []);
        this.write.completedQuestions = new Set(parsed.completed || []);
      } catch (e) {
        console.error('Failed to parse saved exam state:', e);
      }
    }
  },

  // Navigation
  goToItem(index: number) {
    if (!this.write.exam?.items) return;
    
    if (index >= 0 && index < this.write.exam.items.length) {
      this.write.currentItemIndex = index;
      this.write.currentItem = this.write.exam.items[index];
      
      // Mark questions as skipped if not answered
      this.write.currentItem?.questions?.forEach(question => {
        if (!this.write.completedQuestions.has(question.id.toString())) {
          this.write.skippedQuestions.add(question.id.toString());
        }
      });
      
      this.saveState();
    }
  },

  nextItem() {
    this.goToItem(this.write.currentItemIndex + 1);
  },

  previousItem() {
    this.goToItem(this.write.currentItemIndex - 1);
  },

  // Answer management
  setAnswer(questionId: string, answer: string | null) {
    this.write.answers[questionId] = answer;
    
    if (answer) {
      this.write.completedQuestions.add(questionId);
      this.write.skippedQuestions.delete(questionId);
    }
  },

  markAsLater(questionId: string, isLater: boolean) {
    if (isLater) {
      this.write.laterQuestions.add(questionId);
    } else {
      this.write.laterQuestions.delete(questionId);
    }
    this.saveState();
  },

  // Save state to localStorage
  saveState() {
    const state = {
      skipped: Array.from(this.write.skippedQuestions),
      later: Array.from(this.write.laterQuestions),
      completed: Array.from(this.write.completedQuestions),
      currentIndex: this.write.currentItemIndex
    };
    localStorage.setItem('exam-state', JSON.stringify(state));
  },

  // Timer management
  startTimer(durationMinutes: number) {
    this.write.remainingSeconds = durationMinutes * 60;
    
    if (this.write.timerInterval) {
      clearInterval(this.write.timerInterval);
    }
    
    this.write.timerInterval = window.setInterval(() => {
      if (this.write.remainingSeconds > 0) {
        this.write.remainingSeconds--;
      } else {
        this.stopTimer();
        // Auto-submit exam
        window.location.href = '/exam/finished';
      }
    }, 1000);
  },

  stopTimer() {
    if (this.write.timerInterval) {
      clearInterval(this.write.timerInterval);
      this.write.timerInterval = null;
    }
  },

  getFormattedTime() {
    const minutes = Math.floor(this.write.remainingSeconds / 60);
    const seconds = this.write.remainingSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  },

  // Question statistics
  getStats() {
    const totalQuestions = this.write.exam?.items?.reduce(
      (sum, item) => sum + (item.questions?.length || 0), 
      0
    ) || 0;

    return {
      total: totalQuestions,
      completed: this.write.completedQuestions.size,
      skipped: this.write.skippedQuestions.size,
      later: this.write.laterQuestions.size,
      percentage: totalQuestions > 0 
        ? Math.round((this.write.completedQuestions.size / totalQuestions) * 100)
        : 0
    };
  },

  // Reset state
  reset() {
    this.write.delivery = null;
    this.write.exam = null;
    this.write.attempt = null;
    this.write.currentItemIndex = 0;
    this.write.currentItem = null;
    this.write.answers = {};
    this.write.savedAnswers.clear();
    this.write.skippedQuestions.clear();
    this.write.laterQuestions.clear();
    this.write.completedQuestions.clear();
    this.write.remainingSeconds = 0;
    this.write.isLoading = false;
    this.write.isSaving = false;
    this.write.showFinishModal = false;
    
    this.stopTimer();
    localStorage.removeItem('exam-state');
  }
};