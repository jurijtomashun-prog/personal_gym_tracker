export type DayKey = 'monday' | 'wednesday' | 'friday'
export type ExerciseStatus = 'pending' | 'done' | 'skipped'

export interface ExerciseTemplate {
  id: string
  name: string
  sets: string
  note: string
  category: 'warmup' | 'main' | 'leadup' | 'max' | 'accessory'
  defaultWeight?: number
  planWeeks?: number[]
}

export interface DayTemplate {
  key: DayKey
  title: string
  focus: string
  exercises: ExerciseTemplate[]
}

export type ProgramTemplate = DayTemplate[]

export interface PlanWeekOverride {
  weight?: string
  sets?: string
}

export interface PlanWeek {
  label: string
  days: Partial<Record<DayKey, Record<string, PlanWeekOverride>>>
}

export interface ExerciseState {
  weight: string
  sets: string
  status: ExerciseStatus
}

export interface WeekState {
  label: string
  days: Record<DayKey, Record<string, ExerciseState>>
  updatedAt: string
}

export interface HistoryEntry {
  id: string
  weekLabel: string
  dayKey: DayKey
  dayTitle: string
  completedAt: string
  completed: number
  total: number
}

export interface AppState {
  program: ProgramTemplate
  planCycle: PlanWeek[]
  cyclePhase: number
  selectedWeekOffset: number
  weeks: Record<string, WeekState>
  history: HistoryEntry[]
}
