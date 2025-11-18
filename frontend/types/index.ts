// Shared TypeScript types

export type {
  User,
  Org,
  Project,
  Keyword,
  TopicCluster,
  ContentBrief,
  ContentDraft,
  CalendarItem,
  CreditWallet,
  CreditTxn,
  Job,
} from '@prisma/client'

// API Response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    message: string
    code?: string
    details?: any
  }
  pagination?: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

// Credit system types
export interface CreditCost {
  action: string
  credits: number
  description?: string
}

export interface CreditBalance {
  balance: number
  lifetimeSpent: number
}

// Job types
export interface JobPayload {
  type: string
  data: Record<string, any>
  orgId: string
  projectId?: string
}

// AI Provider types
export interface AIProvider {
  name: string
  generateOutline(brief: any): Promise<string[]>
  generateDraft(brief: any, outline: string[], wordCount: number): Promise<string>
  scoreSEO(content: string): Promise<number>
}

// SEO Checklist types
export interface SEOChecklistItem {
  id: string
  label: string
  status: 'pass' | 'fail' | 'warning'
  description?: string
}

export interface SEOChecklist {
  score: number // 0-100
  items: SEOChecklistItem[]
  recommendations: string[]
}

// Calendar types
export interface CalendarEvent {
  id: string
  title: string
  start: Date
  end?: Date
  type: 'article' | 'social_snippet' | 'task' | 'note'
  status: string
  draftId?: string
}

// Export types
export interface ExportOptions {
  format: 'md' | 'html' | 'docx'
  draftId: string
}

// Keyword enrichment types
export interface KeywordData {
  term: string
  searchVolume?: number
  difficulty?: number
  serpResults?: {
    position: number
    title: string
    url: string
  }[]
}

// Content brief types
export interface BriefHeading {
  level: 2 | 3 | 4
  text: string
}

export interface BriefEntity {
  name: string
  type: string
  importance: 'high' | 'medium' | 'low'
}

export interface BriefFAQ {
  question: string
  answer?: string
}
