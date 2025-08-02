import type { 
  exams, 
  items, 
  questions, 
  answers, 
  categories,
  attempts,
  deliveries,
  groups,
  takers
} from "../models";

// Exam Types
export interface ExamWithRelations extends exams {
  items?: ItemWithRelations[];
  deliveries?: deliveries[];
  attempts?: attempts[];
  total_questions?: number;
  total_score?: number;
}

export interface ItemWithRelations extends items {
  questions?: QuestionWithRelations[];
  categories?: categories[];
  attachments?: AttachmentInfo[];
}

export interface QuestionWithRelations extends questions {
  answers?: answers[];
  categories?: categories[];
  item?: items;
}

export interface AnswerWithRelations extends answers {
  question?: questions;
}

// Delivery Types
export interface DeliveryWithRelations extends deliveries {
  exam?: ExamWithRelations;
  group?: GroupWithRelations;
  takers?: TakerWithRelations[];
  attempts?: AttemptWithRelations[];
}

export interface GroupWithRelations extends groups {
  takers?: TakerWithRelations[];
  deliveries?: deliveries[];
}

export interface TakerWithRelations extends takers {
  groups?: groups[];
  deliveries?: deliveries[];
  attempts?: attempts[];
  taker_code?: string;
}

// Attempt Types
export interface AttemptWithRelations extends attempts {
  taker?: takers;
  exam?: exams;
  delivery?: deliveries;
  questions?: AttemptQuestionInfo[];
}

export interface AttemptQuestionInfo {
  id: number;
  attempt_id: number;
  question_id: number;
  answer_id: number | null;
  answer_hash: string | null;
  answer: string | null;
  is_correct: boolean;
  score: number;
  question?: QuestionWithRelations;
}

// Attachment Types
export interface AttachmentInfo {
  id: string;
  type: string;
  title: string | null;
  path: string | null;
  mime: string | null;
  description: string | null;
  url?: string;
}

// Exam Configuration Types
export interface ExamOptions {
  show_score?: boolean;
  show_correct_answers?: boolean;
  allow_review?: boolean;
  randomize_questions?: boolean;
  randomize_answers?: boolean;
  passing_score?: number;
  max_attempts?: number;
}

export interface ItemType {
  value: 'multiple-choice' | 'essay' | 'true-false' | 'matching';
  name: string;
}

export interface QuestionType {
  value: 'single-answer' | 'multiple-answer' | 'essay' | 'short-answer';
  name: string;
}

// Scoring Types
export interface ScoringCriteria {
  question_id: number;
  max_score: number;
  rubric?: string;
  keywords?: string[];
}

export interface ScoreResult {
  attempt_id: number;
  total_score: number;
  percentage: number;
  passed: boolean;
  details: QuestionScore[];
}

export interface QuestionScore {
  question_id: number;
  score: number;
  max_score: number;
  feedback?: string;
}

// API Request/Response Types
export interface CreateExamRequest {
  code: string;
  name: string;
  description?: string;
  is_random?: boolean;
  is_mcq?: boolean;
  is_interview?: boolean;
  options?: ExamOptions;
}

export interface CreateItemRequest {
  title: string;
  content?: string;
  type: string;
  is_vignette: boolean;
  is_random: boolean;
  score: number;
  category_ids?: number[];
}

export interface CreateQuestionRequest {
  item_id: number;
  type: string;
  question: string;
  is_random: boolean;
  score: number;
  order: number;
  answers?: CreateAnswerRequest[];
}

export interface CreateAnswerRequest {
  answer: string;
  is_correct_answer: boolean;
}

export interface SubmitAnswerRequest {
  attempt_hash: string;
  answers: Record<string, string | null>;
}

export interface StartAttemptRequest {
  delivery_id: number;
  taker_id: number;
  token?: string;
}

// Enums
export enum ExamStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived'
}

export enum DeliveryStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum AttemptStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  SUBMITTED = 'submitted',
  SCORED = 'scored'
}