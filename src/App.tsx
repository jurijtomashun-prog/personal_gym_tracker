import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import { cloneProgram, initialPlanCycle } from './program'
import { ensureWeek, exportState, getWeekLabel, importState, loadState, recordHistory, saveState, syncWeeksWithProgram } from './storage'
import type { AppState, DayKey, ExerciseStatus, PlanWeek } from './types'

type Screen = 'workout' | 'progress' | 'settings'

const dayOrder: DayKey[] = ['monday', 'wednesday', 'friday']

function cycleStatus(current: ExerciseStatus): ExerciseStatus {
  if (current === 'pending') return 'done'
  if (current === 'done') return 'skipped'
  return 'pending'
}

const ico = {
  done: <svg viewBox="0 0 24 24"><path d="m9.2 16.6-3.8-3.8 1.4-1.4 2.4 2.4 8-8 1.4 1.4-9.4 9.4Z" fill="currentColor"/></svg>,
  skip: <svg viewBox="0 0 24 24"><path d="m7.4 6 4.6 4.6L16.6 6 18 7.4 13.4 12l4.6 4.6-1.4 1.4L12 13.4 7.4 18 6 16.6 10.6 12 6 7.4 7.4 6Z" fill="currentColor"/></svg>,
  bar: <svg viewBox="0 0 24 24"><path d="M5 18h14v1H4V5h1v13Zm3-2V9h2v7H8Zm4 0V6h2v10h-2Zm4 0v-4h2v4h-2Z" fill="currentColor"/></svg>,
  gear: <svg viewBox="0 0 24 24"><path d="M19.14 12.94a7.6 7.6 0 0 0 .06-.94c0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.59-.22l-2.39.96a7.04 7.04 0 0 0-1.62-.94l-.36-2.54a.48.48 0 0 0-.48-.41h-3.84a.48.48 0 0 0-.48.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.48.48 0 0 0-.59.22L2.74 9.87a.47.47 0 0 0 .12.61l2.03 1.58c-.05.3-.07.63-.07.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.37 1.03.7 1.62.94l.36 2.54c.05.24.26.41.48.41h3.84c.24 0 .44-.17.48-.41l.36-2.54c.59-.24 1.13-.57 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32a.49.49 0 0 0-.12-.61l-2.03-1.58ZM12 15.6A3.6 3.6 0 1 1 12 8.4a3.6 3.6 0 0 1 0 7.2Z" fill="currentColor"/></svg>,
  dumbbell: <svg viewBox="0 0 24 24"><path d="M20.57 14.86 22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2 5.57 4.14 4.14 2.71 2.71 4.14l1.43 1.43L2 7.71l1.43 1.43L2 10.57 3.43 12 7 8.43 15.57 17 12 20.57 13.43 22l1.43-1.43L16.29 22l2.14-2.14 1.43 1.43 1.43-1.43-1.43-1.43L22 16.29l-1.43-1.43Z" fill="currentColor"/></svg>,
  plus: <svg viewBox="0 0 24 24"><path d="M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6V5Z" fill="currentColor"/></svg>,
  trash: <svg viewBox="0 0 24 24"><path d="M7 7h10l-1 12H8L7 7Zm3-3h4l1 2h4v2H5V6h4l1-2Z" fill="currentColor"/></svg>,
  download: <svg viewBox="0 0 24 24"><path d="M5 20h14v-2H5v2Zm7-18-5 5h3v6h4V7h3l-5-5Z" fill="currentColor"/></svg>,
  upload: <svg viewBox="0 0 24 24"><path d="M5 20h14v-2H5v2Zm7-2 5-5h-3V7h-4v6H7l5 5Z" fill="currentColor"/></svg>,
}

function App() {
  const [state, setState] = useState<AppState>(() => ({
    program: cloneProgram(),
    planCycle: [...initialPlanCycle],
    cyclePhase: 0,
    selectedWeekOffset: 0,
    weeks: {},
    history: [],
  }))
  const [activeDayKey, setActiveDayKey] = useState<DayKey>('monday')
  const [activeScreen, setActiveScreen] = useState<Screen>('workout')
  const [saveStatus, setSaveStatus] = useState<'loading' | 'saving' | 'saved' | 'error'>('loading')
  const [isHydrated, setIsHydrated] = useState(false)
  const [importError, setImportError] = useState('')
  const [activePlanWeek, setActivePlanWeek] = useState(0)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    let cancelled = false
    void loadState()
      .then((s) => { if (!cancelled) { setState(syncWeeksWithProgram(s)); setSaveStatus('saved'); setIsHydrated(true) } })
      .catch(() => { if (!cancelled) { setSaveStatus('error'); setIsHydrated(true) } })
    return () => { cancelled = true }
  }, [])

  const weekLabel = getWeekLabel(state.selectedWeekOffset)
  const cycleIndex = (((state.selectedWeekOffset + state.cyclePhase) % state.planCycle.length) + state.planCycle.length) % state.planCycle.length

  useEffect(() => { setState((c) => ensureWeek(c, weekLabel, c.selectedWeekOffset)) }, [weekLabel])

  useEffect(() => {
    if (!isHydrated || Object.keys(state.weeks).length === 0) return
    setSaveStatus('saving')
    void saveState(state).then(() => setSaveStatus('saved')).catch(() => setSaveStatus('error'))
  }, [isHydrated, state])

  const week = state.weeks[weekLabel]
  const day = state.program.find((d) => d.key === activeDayKey) ?? state.program[0]

  const dayCompletion = useMemo(() => {
    if (!week) return { done: 0, total: 0, pct: 0 }
    const visibleIds = day.exercises
      .filter((e) => !e.planWeeks || e.planWeeks.includes(cycleIndex))
      .map((e) => e.id)
    const ex = Object.entries(week.days[activeDayKey] ?? {})
      .filter(([id]) => visibleIds.includes(id))
      .map(([, e]) => e)
    const done = ex.filter((e) => e.status === 'done').length
    return { done, total: ex.length, pct: ex.length ? Math.round((done / ex.length) * 100) : 0 }
  }, [activeDayKey, week, day, cycleIndex])

  const visibleExercises = day.exercises.filter((e) => !e.planWeeks || e.planWeeks.includes(cycleIndex))
  const warmups = visibleExercises.filter((e) => e.category === 'warmup')
  const mainWork = visibleExercises.filter((e) => e.category === 'main')
  const leadups = visibleExercises.filter((e) => e.category === 'leadup')
  const maxSets = visibleExercises.filter((e) => e.category === 'max')
  const accessories = visibleExercises.filter((e) => e.category === 'accessory')

  function setWeekOffset(delta: number) {
    setState((c) => ({ ...c, selectedWeekOffset: c.selectedWeekOffset + delta }))
  }

  function setWeight(exerciseId: string, value: string) {
    const normalized = value.replace(',', '.')
    setState((c) => {
      const w = ensureWeek(c, weekLabel)
      return {
        ...w, weeks: { ...w.weeks, [weekLabel]: {
          ...w.weeks[weekLabel], updatedAt: new Date().toISOString(),
          days: { ...w.weeks[weekLabel].days, [activeDayKey]: {
            ...w.weeks[weekLabel].days[activeDayKey],
            [exerciseId]: { ...w.weeks[weekLabel].days[activeDayKey][exerciseId], weight: normalized },
          }},
        }},
      }
    })
  }

  function toggleStatus(exerciseId: string) {
    setState((c) => {
      const w = ensureWeek(c, weekLabel)
      const currentStatus = w.weeks[weekLabel].days[activeDayKey][exerciseId]?.status ?? 'pending'
      const next = cycleStatus(currentStatus)
      const nextDay = {
        ...w.weeks[weekLabel].days[activeDayKey],
        [exerciseId]: { ...w.weeks[weekLabel].days[activeDayKey][exerciseId], status: next },
      }
      return {
        ...w, weeks: { ...w.weeks, [weekLabel]: {
          ...w.weeks[weekLabel], updatedAt: new Date().toISOString(),
          days: { ...w.weeks[weekLabel].days, [activeDayKey]: nextDay },
        }},
        history: recordHistory(w.history, weekLabel, day.key, day.title,
          Object.values(nextDay).filter((e) => e.status === 'done').length,
          Object.values(nextDay).length),
      }
    })
  }

  function editPlanOverride(weekIdx: number, dayKey: DayKey, exerciseId: string, field: 'weight' | 'sets', value: string) {
    setState((c) => {
      const newCycle: PlanWeek[] = c.planCycle.map((pw, i) => {
        if (i !== weekIdx) return pw
        return {
          ...pw,
          days: {
            ...pw.days,
            [dayKey]: {
              ...(pw.days[dayKey] ?? {}),
              [exerciseId]: {
                ...(pw.days[dayKey]?.[exerciseId] ?? {}),
                [field]: field === 'weight' ? (value.replace(',', '.') || undefined) : (value || undefined),
              },
            },
          },
        }
      })
      return { ...c, planCycle: newCycle }
    })
  }

  function addPlanWeek() {
    setState((c) => ({
      ...c,
      planCycle: [...c.planCycle, { label: `Неделя ${c.planCycle.length + 1}`, days: {} }],
    }))
  }

  function removePlanWeek(idx: number) {
    setState((c) => {
      if (c.planCycle.length <= 1) return c
      return { ...c, planCycle: c.planCycle.filter((_, i) => i !== idx) }
    })
  }

  async function handleImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      setState(syncWeeksWithProgram(importState(await file.text())))
      setImportError('')
      setActiveScreen('workout')
    } catch { setImportError('Не удалось прочитать файл.') }
    event.target.value = ''
  }

  // ─── Status dot component ───
  function StatusDot({ id }: { id: string }) {
    const st = week?.days[activeDayKey]?.[id]?.status ?? 'pending'
    return (
      <button type="button" className={`status-dot ${st}`} onClick={() => toggleStatus(id)}
        aria-label={st === 'done' ? 'Сделано' : st === 'skipped' ? 'Пропущено' : 'Ожидает'}>
        {st === 'done' ? ico.done : st === 'skipped' ? ico.skip : null}
      </button>
    )
  }

  return (
    <div className="app">
      {/* ── Header ── */}
      <header className="header">
        <div className="header-left">
          <span className="logo-icon">{ico.dumbbell}</span>
          <h1>Gym Tracker</h1>
        </div>
        <span className={`save-pill ${saveStatus}`}>
          {saveStatus === 'saved' ? 'Сохранено' : saveStatus === 'saving' ? 'Сохраняю…' : saveStatus === 'error' ? 'Ошибка' : '…'}
        </span>
      </header>

      {/* ── Week ── */}
      <div className="week-bar">
        <button type="button" onClick={() => setWeekOffset(-1)}>‹</button>
        <span className="week-label">{weekLabel}</span>
        <button type="button" onClick={() => setWeekOffset(1)}>›</button>
      </div>

      {/* ── Screen tabs ── */}
      <nav className="screen-nav">
        {([
          ['workout', 'Тренировка', ico.dumbbell],
          ['progress', 'Прогресс', ico.bar],
          ['settings', 'Настройки', ico.gear],
        ] as const).map(([key, label, icon]) => (
          <button key={key} type="button" className={activeScreen === key ? 'on' : ''}
            onClick={() => setActiveScreen(key as Screen)}>
            <span className="nav-ico">{icon}</span>{label}
          </button>
        ))}
      </nav>

      {/* ── Day pills ── */}
      <div className="day-pills">
        {dayOrder.map((dk) => {
          const d = state.program.find((x) => x.key === dk)
          return (
            <button key={dk} type="button" className={dk === activeDayKey ? 'on' : ''}
              onClick={() => setActiveDayKey(dk)}>
              {d?.title}<small>{d?.focus}</small>
            </button>
          )
        })}
      </div>

      {/* ════════════════════════════════════════════
           WORKOUT SCREEN
         ════════════════════════════════════════════ */}
      {activeScreen === 'workout' && (
        <div className="screen">
          {/* Day completion bar */}
          <div className="completion-bar">
            <div className="completion-fill" style={{ width: `${dayCompletion.pct}%` }} />
            <span>{dayCompletion.done} / {dayCompletion.total}</span>
          </div>
          {state.planCycle.length > 1 && (
            <p className="cycle-label">
              {state.planCycle[cycleIndex]?.label ?? `Нед. ${cycleIndex + 1}`} &mdash; цикл {cycleIndex + 1} из {state.planCycle.length}
            </p>
          )}

          {/* Warmup — compact rows */}
          {warmups.length > 0 && (
            <section className="section">
              <h2 className="section-label">Разминка</h2>
              <div className="warmup-list">
                {warmups.map((ex) => {
                  const es = week?.days[activeDayKey]?.[ex.id]
                  return (
                    <div key={ex.id} className={`warmup-row ${es?.status ?? 'pending'}`}>
                      <div className="warmup-info">
                        <span className="warmup-name">{ex.name}</span>
                        <span className="warmup-detail">
                          <input inputMode="decimal" className="weight-mini"
                            value={es?.weight ?? ''} placeholder="—"
                            onChange={(e) => setWeight(ex.id, e.target.value)} />
                          <span className="unit">кг</span>
                          <span className="warmup-sets">{es?.sets ?? ex.sets}</span>
                        </span>
                      </div>
                      <StatusDot id={ex.id} />
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {/* Main work — prominent card */}
          {mainWork.length > 0 && (
            <section className="section">
              <h2 className="section-label">Работа</h2>
              {mainWork.map((ex) => {
                const es = week?.days[activeDayKey]?.[ex.id]
                return (
                  <div key={ex.id} className={`work-card main-card ${es?.status ?? 'pending'}`}>
                    <div className="work-top">
                      <div>
                        <h3>{ex.name}</h3>
                        <span className="sets-chip">{es?.sets ?? ex.sets}</span>
                      </div>
                      <StatusDot id={ex.id} />
                    </div>
                    <label className="weight-field">
                      <span>Вес</span>
                      <div className="weight-input-wrap">
                        <input inputMode="decimal" value={es?.weight ?? ''}
                          onChange={(e) => setWeight(ex.id, e.target.value)} placeholder="—" />
                        <span className="unit">кг</span>
                      </div>
                    </label>
                    {ex.note && <p className="work-note">{ex.note}</p>}
                  </div>
                )
              })}
            </section>
          )}

          {/* Подводка */}
          {leadups.length > 0 && (
            <section className="section">
              <h2 className="section-label">Подводка</h2>
              {leadups.map((ex) => {
                const es = week?.days[activeDayKey]?.[ex.id]
                if (es?.status === 'skipped') return (
                  <div key={ex.id} className="max-dismissed">
                    <span>{es.weight || ex.defaultWeight} кг &mdash; {es.sets ?? ex.sets}</span>
                    <button type="button" className="btn-sm ghost" onClick={() => toggleStatus(ex.id)}>↩</button>
                  </div>
                )
                return (
                  <div key={ex.id} className={`work-card main-card ${es?.status ?? 'pending'}`}>
                    <div className="work-top">
                      <div>
                        <h3>{ex.name}</h3>
                        <span className="sets-chip">{es?.sets ?? ex.sets}</span>
                      </div>
                      <div className="work-actions">
                        <button type="button" className="btn-dismiss" onClick={() => toggleStatus(ex.id)} title="Убрать">×</button>
                        <StatusDot id={ex.id} />
                      </div>
                    </div>
                    <label className="weight-field">
                      <span>Вес</span>
                      <div className="weight-input-wrap">
                        <input inputMode="decimal" value={es?.weight ?? ''}
                          onChange={(e) => setWeight(ex.id, e.target.value)} placeholder="—" />
                        <span className="unit">кг</span>
                      </div>
                    </label>
                  </div>
                )
              })}
            </section>
          )}

          {/* Максимум */}
          {maxSets.length > 0 && (
            <section className="section">
              <h2 className="section-label">Максимум</h2>
              {maxSets.map((ex) => {
                const es = week?.days[activeDayKey]?.[ex.id]
                if (es?.status === 'skipped') return (
                  <div key={ex.id} className="max-dismissed">
                    <span>{es.weight || ex.defaultWeight} кг</span>
                    <button type="button" className="btn-sm ghost" onClick={() => toggleStatus(ex.id)}>↩</button>
                  </div>
                )
                return (
                  <div key={ex.id} className={`work-card main-card ${es?.status ?? 'pending'}`}>
                    <div className="work-top">
                      <div>
                        <h3>{ex.name}</h3>
                        <span className="sets-chip">{es?.sets ?? ex.sets}</span>
                      </div>
                      <div className="work-actions">
                        <button type="button" className="btn-dismiss" onClick={() => toggleStatus(ex.id)} title="Убрать">×</button>
                        <StatusDot id={ex.id} />
                      </div>
                    </div>
                    <label className="weight-field">
                      <span>Вес</span>
                      <div className="weight-input-wrap">
                        <input inputMode="decimal" value={es?.weight ?? ''}
                          onChange={(e) => setWeight(ex.id, e.target.value)} placeholder="—" />
                        <span className="unit">кг</span>
                      </div>
                    </label>
                  </div>
                )
              })}
            </section>
          )}

          {/* Accessories */}
          {accessories.length > 0 && (
            <section className="section">
              <h2 className="section-label">Подсобка</h2>
              {accessories.map((ex) => {
                const es = week?.days[activeDayKey]?.[ex.id]
                return (
                  <div key={ex.id} className={`work-card acc-card ${es?.status ?? 'pending'}`}>
                    <div className="work-top">
                      <div>
                        <h3>{ex.name}</h3>
                        <span className="sets-chip">{es?.sets ?? ex.sets}</span>
                      </div>
                      <StatusDot id={ex.id} />
                    </div>
                    <label className="weight-field">
                      <span>Вес</span>
                      <div className="weight-input-wrap">
                        <input inputMode="decimal" value={es?.weight ?? ''}
                          onChange={(e) => setWeight(ex.id, e.target.value)} placeholder="—" />
                        <span className="unit">кг</span>
                      </div>
                    </label>
                    {ex.note && <p className="work-note">{ex.note}</p>}
                  </div>
                )
              })}
            </section>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════
           PROGRESS SCREEN
         ════════════════════════════════════════════ */}
      {activeScreen === 'progress' && (
        <div className="screen">
          {state.program.map((d) => {
            const exs = Object.values(week?.days[d.key] ?? {})
            const mainEx = d.exercises.find((e) => e.category === 'main')
            const done = exs.filter((e) => e.status === 'done').length
            const pct = exs.length ? Math.round((done / exs.length) * 100) : 0
            const ww = mainEx ? (week?.days[d.key]?.[mainEx.id]?.weight ?? '—') : '—'
            return (
              <div key={d.key} className="progress-card">
                <div className="progress-head">
                  <div><small>{d.focus}</small><strong>{d.title}</strong></div>
                  <span className="pct">{pct}%</span>
                </div>
                <div className="progress-track"><span style={{ width: `${pct}%` }} /></div>
                <div className="progress-meta">
                  <span>{done}/{exs.length} упр.</span>
                  <span>Рабочий вес: <strong>{ww} кг</strong></span>
                </div>
              </div>
            )
          })}

          <section className="section">
            <h2 className="section-label">История</h2>
            {state.history.length > 0 ? (
              <div className="history-list">
                {state.history.map((h) => (
                  <div key={h.id} className="history-row">
                    <div><strong>{h.dayTitle}</strong><small>{h.weekLabel}</small></div>
                    <div className="history-right">
                      <strong>{h.completed}/{h.total}</strong>
                      <small>{new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(h.completedAt))}</small>
                    </div>
                  </div>
                ))}
              </div>
            ) : <p className="muted">Пока нет записей.</p>}
          </section>
        </div>
      )}

      {/* ════════════════════════════════════════════
           SETTINGS SCREEN (Plan + Backup)
         ════════════════════════════════════════════ */}
      {activeScreen === 'settings' && (
        <div className="screen">
          <section className="section">
            <h2 className="section-label">Позиция в цикле</h2>
            <div className="week-bar">
              <button type="button" onClick={() => setState((c) => {
                const n = c.planCycle.length
                return { ...c, cyclePhase: ((c.cyclePhase - 1) % n + n) % n }
              })}>‹</button>
              <span className="week-label">Сейчас: {state.planCycle[cycleIndex]?.label ?? `Нед. ${cycleIndex + 1}`} из {state.planCycle.length}</span>
              <button type="button" onClick={() => setState((c) => {
                const n = c.planCycle.length
                return { ...c, cyclePhase: ((c.cyclePhase + 1) % n + n) % n }
              })}>›</button>
            </div>
            <p className="muted">Укажи, на какой неделе цикла ты сейчас.</p>
          </section>

          <section className="section">
            <div className="section-head">
              <h2 className="section-label">Цикл плана</h2>
              <div style={{ display: 'flex', gap: '0.3rem' }}>
                <button type="button" className="btn-sm" onClick={addPlanWeek}>
                  <span className="btn-ico">{ico.plus}</span> Нед
                </button>
                {state.planCycle.length > 1 && (
                  <button type="button" className="btn-sm danger" onClick={() => removePlanWeek(activePlanWeek)}>
                    <span className="btn-ico">{ico.trash}</span>
                  </button>
                )}
              </div>
            </div>
            <div className="day-pills" style={{ marginBottom: '0.5rem' }}>
              {state.planCycle.map((pw, i) => (
                <button key={i} type="button" className={activePlanWeek === i ? 'on' : ''}
                  onClick={() => setActivePlanWeek(i)}>
                  {pw.label}{i === cycleIndex && <small>текущий</small>}
                </button>
              ))}
            </div>
            <p className="muted" style={{ marginBottom: '0.6rem' }}>
              Начальные веса при первом открытии недели. Фактические данные хранятся отдельно.
            </p>

            {dayOrder.map((dk) => {
              const dayTpl = state.program.find((d) => d.key === dk)
              if (!dayTpl) return null
              const benchExercises = dayTpl.exercises
                .filter((ex) => ex.category !== 'accessory' && (!ex.planWeeks || ex.planWeeks.includes(activePlanWeek)))
              if (benchExercises.length === 0) return null
              return (
                <div key={dk} className="plan-day-block">
                  <h3 className="plan-day-title">{dayTpl.title} <span className="muted">{dayTpl.focus}</span></h3>
                  {benchExercises.map((ex) => {
                    const override = state.planCycle[activePlanWeek]?.days[dk]?.[ex.id]
                    return (
                      <div key={ex.id} className="plan-row">
                        <span className="plan-row-label">{ex.note || ex.category}</span>
                        <input inputMode="decimal" className="plan-row-input"
                          value={override?.weight?.toString() ?? ''}
                          placeholder={ex.defaultWeight?.toString() ?? '—'}
                          onChange={(e) => editPlanOverride(activePlanWeek, dk, ex.id, 'weight', e.target.value)} />
                        <span className="unit">кг</span>
                        <input className="plan-row-input"
                          value={override?.sets ?? ''}
                          placeholder={ex.sets}
                          onChange={(e) => editPlanOverride(activePlanWeek, dk, ex.id, 'sets', e.target.value)} />
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </section>

          <section className="section">
            <h2 className="section-label">Резервная копия</h2>
            <p className="muted">Данные живут прямо в браузере (IndexedDB + localStorage). При переносе на другое устройство используй экспорт/импорт JSON-файла.</p>
            <div className="backup-row">
              <button type="button" className="btn-sm" onClick={() => exportState(state)}>
                <span className="btn-ico">{ico.download}</span> Экспорт
              </button>
              <button type="button" className="btn-sm ghost" onClick={() => fileInputRef.current?.click()}>
                <span className="btn-ico">{ico.upload}</span> Импорт
              </button>
              <input ref={fileInputRef} type="file" accept="application/json" className="sr-only" onChange={handleImport} />
            </div>
            {importError && <p className="muted error">{importError}</p>}
          </section>
        </div>
      )}
    </div>
  )
}

export default App
