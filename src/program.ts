import type { DayTemplate, PlanWeek, ProgramTemplate } from './types'

export const initialProgram: ProgramTemplate = [
  {
    key: 'monday',
    title: 'Понедельник',
    focus: 'Тяжелый день',
    exercises: [
      { id: 'mon-warm-20', name: 'Жим лежа', sets: '1 x 15', note: 'Разминка', category: 'warmup', defaultWeight: 20 },
      { id: 'mon-warm-40', name: 'Жим лежа', sets: '1 x 8', note: 'Разминка', category: 'warmup', defaultWeight: 40 },
      { id: 'mon-warm-50', name: 'Жим лежа', sets: '1 x 5', note: 'Разминка', category: 'warmup', defaultWeight: 50 },
      { id: 'mon-main-55', name: 'Жим лежа', sets: '5 x 4', note: 'Работа', category: 'main', defaultWeight: 55 },
      { id: 'mon-acc-lat', name: 'Тяга верхнего блока к груди', sets: '3 x 10-12', note: 'Подушка из широчайших', category: 'accessory' },
      { id: 'mon-acc-row', name: 'Тяга блока сидя к животу', sets: '3 x 12', note: 'Середина спины и лопатки', category: 'accessory' },
      { id: 'mon-acc-hyper', name: 'Гиперэкстензия', sets: '3 x 15', note: 'Низ спины и мост', category: 'accessory' },
    ],
  },
  {
    key: 'wednesday',
    title: 'Среда',
    focus: 'Средний день',
    exercises: [
      { id: 'wed-warm-20', name: 'Жим лежа', sets: '1 x 15', note: 'Разминка', category: 'warmup', defaultWeight: 20 },
      { id: 'wed-warm-35', name: 'Жим лежа', sets: '1 x 8', note: 'Разминка', category: 'warmup', defaultWeight: 35 },
      { id: 'wed-warm-45', name: 'Жим лежа', sets: '1 x 5', note: 'Разминка', category: 'warmup', defaultWeight: 45 },
      { id: 'wed-main-52-5', name: 'Жим лежа', sets: '5 x 3', note: 'Работа', category: 'main', defaultWeight: 52.5 },
      { id: 'wed-acc-facepull', name: 'Face Pulls', sets: '3 x 15-20', note: 'Плечи и задняя дельта', category: 'accessory' },
      { id: 'wed-acc-lateral', name: 'Махи гантелями в стороны', sets: '3 x 12-15', note: 'Средняя дельта', category: 'accessory' },
      { id: 'wed-acc-biceps', name: 'Бицепс', sets: '3 x 12', note: 'Стабилизация локтя', category: 'accessory' },
    ],
  },
  {
    key: 'friday',
    title: 'Пятница',
    focus: 'Пиковый день',
    exercises: [
      { id: 'fri-warm-20', name: 'Жим лежа', sets: '1 x 15', note: 'Разминка', category: 'warmup', defaultWeight: 20 },
      { id: 'fri-warm-40', name: 'Жим лежа', sets: '1 x 8', note: 'Разминка', category: 'warmup', defaultWeight: 40 },
      { id: 'fri-warm-52-5', name: 'Жим лежа', sets: '1 x 5', note: 'Разминка', category: 'warmup', defaultWeight: 52.5 },
      { id: 'fri-main-60', name: 'Жим лежа', sets: '2 x 2', note: 'Работа', category: 'main', defaultWeight: 60, planWeeks: [0, 1, 2] },
      { id: 'fri-lead-60', name: 'Жим лежа', sets: '1 x 1', note: 'Подводка', category: 'leadup', defaultWeight: 60, planWeeks: [3] },
      { id: 'fri-lead-65', name: 'Жим лежа', sets: '1 x 1', note: 'Подводка', category: 'leadup', defaultWeight: 65, planWeeks: [3] },
      { id: 'fri-max-70', name: 'Жим лежа', sets: '1 x 1', note: 'Максимум', category: 'max', defaultWeight: 70, planWeeks: [3] },
      { id: 'fri-max-72-5', name: 'Жим лежа', sets: '1 x 1', note: 'Максимум', category: 'max', defaultWeight: 72.5, planWeeks: [3] },
      { id: 'fri-max-75', name: 'Жим лежа', sets: '1 x 1', note: 'Максимум', category: 'max', defaultWeight: 75, planWeeks: [3] },
      { id: 'fri-acc-triceps', name: 'Трицепс с канатом вниз', sets: '3-4 x 12-15', note: 'Дожим верхней фазы', category: 'accessory' },
      { id: 'fri-acc-press', name: 'Жим гантелей сидя', sets: '3 x 10', note: 'Сила плечевого пояса', category: 'accessory' },
      { id: 'fri-acc-abs', name: 'Пресс', sets: '3 x макс', note: 'Жесткость корпуса', category: 'accessory' },
    ],
  },
]

export function cloneProgram(program: ProgramTemplate = initialProgram): ProgramTemplate {
  return program.map((day: DayTemplate) => ({
    ...day,
    exercises: day.exercises.map((exercise) => ({ ...exercise })),
  }))
}

export const initialPlanCycle: PlanWeek[] = [
  {
    label: 'Неделя 1',
    days: {
      monday: {
        'mon-warm-20': { weight: '20', sets: '1 x 15' },
        'mon-warm-40': { weight: '40', sets: '1 x 8' },
        'mon-warm-50': { weight: '50', sets: '1 x 5' },
        'mon-main-55': { weight: '60', sets: '5 x 5' },
      },
      wednesday: {
        'wed-warm-20': { weight: '20', sets: '1 x 15' },
        'wed-warm-35': { weight: '40', sets: '1 x 8' },
        'wed-warm-45': { weight: '50', sets: '1 x 5' },
        'wed-main-52-5': { weight: '55', sets: '5 x 4' },
      },
      friday: {
        'fri-warm-20': { weight: '20', sets: '1 x 15' },
        'fri-warm-40': { weight: '45', sets: '1 x 8' },
        'fri-warm-52-5': { weight: '55', sets: '1 x 5' },
        'fri-main-60': { weight: '62.5', sets: '3 x 3' },
      },
    },
  },
  {
    label: 'Неделя 2',
    days: {
      monday: {
        'mon-warm-20': { weight: '20', sets: '1 x 15' },
        'mon-warm-40': { weight: '45', sets: '1 x 8' },
        'mon-warm-50': { weight: '55', sets: '1 x 5' },
        'mon-main-55': { weight: '62.5', sets: '5 x 4' },
      },
      wednesday: {
        'wed-warm-20': { weight: '20', sets: '1 x 15' },
        'wed-warm-35': { weight: '40', sets: '1 x 8' },
        'wed-warm-45': { weight: '52.5', sets: '1 x 5' },
        'wed-main-52-5': { weight: '60', sets: '5 x 3' },
      },
      friday: {
        'fri-warm-20': { weight: '20', sets: '1 x 15' },
        'fri-warm-40': { weight: '45', sets: '1 x 8' },
        'fri-warm-52-5': { weight: '57.5', sets: '1 x 5' },
        'fri-main-60': { weight: '67.5', sets: '2 x 2' },
      },
    },
  },
  {
    label: 'Неделя 3',
    days: {
      monday: {
        'mon-warm-20': { weight: '20', sets: '1 x 15' },
        'mon-warm-40': { weight: '45', sets: '1 x 8' },
        'mon-warm-50': { weight: '57.5', sets: '1 x 5' },
        'mon-main-55': { weight: '67.5', sets: '4 x 3' },
      },
      wednesday: {
        'wed-warm-20': { weight: '20', sets: '1 x 15' },
        'wed-warm-35': { weight: '45', sets: '1 x 8' },
        'wed-warm-45': { weight: '55', sets: '1 x 5' },
        'wed-main-52-5': { weight: '62.5', sets: '4 x 2' },
      },
      friday: {
        'fri-warm-20': { weight: '20', sets: '1 x 15' },
        'fri-warm-40': { weight: '50', sets: '1 x 8' },
        'fri-warm-52-5': { weight: '62.5', sets: '1 x 5' },
        'fri-main-60': { weight: '70', sets: '2 x 1' },
      },
    },
  },
  {
    label: 'Неделя 4',
    days: {
      monday: {
        'mon-warm-20': { weight: '20', sets: '1 x 15' },
        'mon-warm-40': { weight: '40', sets: '1 x 8' },
        'mon-warm-50': { weight: '50', sets: '1 x 5' },
        'mon-main-55': { weight: '55', sets: '3 x 3' },
      },
      wednesday: {
        'wed-warm-20': { weight: '20', sets: '1 x 15' },
        'wed-warm-35': { weight: '30', sets: '1 x 8' },
        'wed-warm-45': { weight: '40', sets: '1 x 5' },
        'wed-main-52-5': { weight: '60', sets: '3 x 3' },
      },
      friday: {
        'fri-warm-20': { weight: '20', sets: '1 x 15' },
        'fri-warm-40': { weight: '45', sets: '1 x 6' },
        'fri-warm-52-5': { weight: '60', sets: '1 x 3' },
        'fri-lead-60': { weight: '70', sets: '1 x 1' },
        'fri-lead-65': { weight: '75', sets: '1 x 1' },
        'fri-max-70': { weight: '80', sets: '1 x 1' },
        'fri-max-72-5': { weight: '82.5', sets: '1 x 1' },
        'fri-max-75': { weight: '85', sets: '1 x 1' },
      },
    },
  },
]
