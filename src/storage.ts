import { cloneProgram, initialPlanCycle, initialProgram } from './program'
import type { AppState, DayKey, ExerciseState, HistoryEntry, PlanWeek, PlanWeekOverride, ProgramTemplate, WeekState } from './types'

const STORAGE_KEY = 'gym-tracker-state-v2'
const LEGACY_STORAGE_KEY = 'gym-tracker-state-v1'
const DB_NAME = 'gym-tracker-db'
const STORE_NAME = 'app-state'
const STATE_ID = 'singleton'

function buildDayState(program: ProgramTemplate, dayKey: DayKey, overrides?: Record<string, PlanWeekOverride>) {
  const day = program.find((entry) => entry.key === dayKey)

  return Object.fromEntries(
    (day?.exercises ?? []).map((exercise) => {
      const override = overrides?.[exercise.id]
      return [
        exercise.id,
        {
          weight: (override?.weight ?? exercise.defaultWeight)?.toString() ?? '',
          sets: override?.sets ?? exercise.sets,
          status: 'pending',
        } satisfies ExerciseState,
      ]
    }),
  )
}

function createWeekState(program: ProgramTemplate, label: string, planWeek?: PlanWeek): WeekState {
  return {
    label,
    updatedAt: new Date().toISOString(),
    days: {
      monday: buildDayState(program, 'monday', planWeek?.days.monday),
      wednesday: buildDayState(program, 'wednesday', planWeek?.days.wednesday),
      friday: buildDayState(program, 'friday', planWeek?.days.friday),
    },
  }
}

function createInitialState(): AppState {
  const program = cloneProgram()
  const planCycle = [...initialPlanCycle]
  const cyclePhase = 0
  const fallbackWeek = getWeekLabel(0)

  return {
    program,
    planCycle,
    cyclePhase,
    selectedWeekOffset: 0,
    weeks: { [fallbackWeek]: createWeekState(program, fallbackWeek, planCycle[cyclePhase]) },
    history: [],
  }
}

function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('IndexedDB is not available'))
      return
    }

    const request = window.indexedDB.open(DB_NAME, 1)

    request.onerror = () => reject(request.error)
    request.onupgradeneeded = () => {
      const database = request.result
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME)
      }
    }
    request.onsuccess = () => resolve(request.result)
  })
}

async function readFromDatabase() {
  const database = await openDatabase()

  return new Promise<string | undefined>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readonly')
    const request = transaction.objectStore(STORE_NAME).get(STATE_ID)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result as string | undefined)
    transaction.oncomplete = () => database.close()
  })
}

async function writeToDatabase(payload: string) {
  const database = await openDatabase()

  return new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite')
    transaction.objectStore(STORE_NAME).put(payload, STATE_ID)
    transaction.onerror = () => reject(transaction.error)
    transaction.oncomplete = () => {
      database.close()
      resolve()
    }
  })
}

function normalizeState(candidate: Partial<AppState> | undefined): AppState {
  const safeProgram = candidate?.program && Array.isArray(candidate.program) && candidate.program.length > 0
    ? cloneProgram(candidate.program)
    : cloneProgram(initialProgram)

  const selectedWeekOffset = typeof candidate?.selectedWeekOffset === 'number' ? candidate.selectedWeekOffset : 0
  const history = Array.isArray(candidate?.history) ? candidate.history : []
  const weeks = candidate?.weeks && typeof candidate.weeks === 'object' ? candidate.weeks : {}
  const safePlanCycle = Array.isArray(candidate?.planCycle) && (candidate.planCycle as unknown[]).length > 0
    ? candidate.planCycle as PlanWeek[]
    : [...initialPlanCycle]
  const cyclePhase = typeof candidate?.cyclePhase === 'number' ? candidate.cyclePhase : 0
  const currentWeekLabel = getWeekLabel(selectedWeekOffset)
  const n = safePlanCycle.length
  const cycleIdx = n > 0 ? (((selectedWeekOffset + cyclePhase) % n) + n) % n : 0

  const baseState: AppState = {
    program: safeProgram,
    planCycle: safePlanCycle,
    cyclePhase,
    selectedWeekOffset,
    weeks: Object.keys(weeks).length > 0 ? weeks : { [currentWeekLabel]: createWeekState(safeProgram, currentWeekLabel, safePlanCycle[cycleIdx]) },
    history,
  }

  return syncWeeksWithProgram(baseState)
}

export function syncWeeksWithProgram(state: AppState): AppState {
  const nextWeeks = Object.fromEntries(
    Object.entries(state.weeks).map(([weekLabel, week]) => {
      const nextDays = Object.fromEntries(
        state.program.map((day) => {
          const currentDay = week.days[day.key] ?? {}
          const nextDay = Object.fromEntries(
            day.exercises.map((exercise) => [
              exercise.id,
              currentDay[exercise.id] ?? {
                weight: exercise.defaultWeight?.toString() ?? '',
                sets: exercise.sets,
                status: 'pending',
              },
            ]),
          )

          return [day.key, nextDay]
        }),
      ) as WeekState['days']

      return [weekLabel, { ...week, days: nextDays }]
    }),
  )

  return {
    ...state,
    weeks: nextWeeks,
  }
}

export function getWeekLabel(offset: number) {
  const now = new Date()
  const monday = new Date(now)
  const day = monday.getDay()
  const diffToMonday = day === 0 ? -6 : 1 - day
  monday.setDate(now.getDate() + diffToMonday + offset * 7)

  const end = new Date(monday)
  end.setDate(monday.getDate() + 6)

  const formatter = new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit' })
  return `${formatter.format(monday)} - ${formatter.format(end)}`
}

export async function loadState(): Promise<AppState> {
  if (typeof window === 'undefined') {
    return createInitialState()
  }

  try {
    const indexedDbState = await readFromDatabase()
    if (indexedDbState) {
      return normalizeState(JSON.parse(indexedDbState) as AppState)
    }
  } catch {
    // Fall through to localStorage backup.
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY) ?? window.localStorage.getItem(LEGACY_STORAGE_KEY)
    if (raw) {
      return normalizeState(JSON.parse(raw) as AppState)
    }
  } catch {
    return createInitialState()
  }

  return createInitialState()
}

export async function saveState(state: AppState) {
  const normalizedState = syncWeeksWithProgram(state)
  const payload = JSON.stringify(normalizedState)

  window.localStorage.setItem(STORAGE_KEY, payload)

  try {
    await writeToDatabase(payload)
  } catch {
    // Keep localStorage backup even if IndexedDB is unavailable.
  }
}

export function ensureWeek(state: AppState, weekLabel: string, weekOffset = 0): AppState {
  if (state.weeks[weekLabel]) {
    return state
  }

  const n = state.planCycle.length
  const cycleIdx = n > 0 ? (((weekOffset + state.cyclePhase) % n) + n) % n : 0

  return {
    ...state,
    weeks: {
      ...state.weeks,
      [weekLabel]: createWeekState(state.program, weekLabel, state.planCycle[cycleIdx]),
    },
  }
}

export function recordHistory(
  history: HistoryEntry[],
  weekLabel: string,
  dayKey: DayKey,
  dayTitle: string,
  completed: number,
  total: number,
) {
  const entry: HistoryEntry = {
    id: `${weekLabel}-${dayKey}`,
    weekLabel,
    dayKey,
    dayTitle,
    completedAt: new Date().toISOString(),
    completed,
    total,
  }

  return [entry, ...history.filter((item) => item.id !== entry.id)].slice(0, 24)
}

export function exportState(state: AppState) {
  const payload = JSON.stringify(syncWeeksWithProgram(state), null, 2)
  const blob = new Blob([payload], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  const stamp = new Intl.DateTimeFormat('sv-SE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())

  link.href = url
  link.download = `gym-tracker-backup-${stamp}.json`
  link.click()
  URL.revokeObjectURL(url)
}

export function importState(payload: string) {
  return normalizeState(JSON.parse(payload) as AppState)
}
