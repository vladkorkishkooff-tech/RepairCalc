import type { FieldPath } from 'react-hook-form'

import type { CalculatorFormValues } from '../../../shared/contracts/estimate'

export const calculatorSteps = [
  {
    id: 'property',
    label: 'Параметры',
    title: 'Параметры объекта',
    description: 'Тип объекта, площадь и состояние.',
  },
  {
    id: 'package',
    label: 'Пакет',
    title: 'Пакет ремонта',
    description: 'Выберите формат работ и визуальный стиль.',
  },
  {
    id: 'options',
    label: 'Опции',
    title: 'Дополнительные опции',
    description: 'Отметьте нужные работы.',
  },
  {
    id: 'final',
    label: 'Итог',
    title: 'Итог и отправка',
    description: 'Проверьте смету и отправьте ее в Telegram.',
  },
] as const

export const stepFields: FieldPath<CalculatorFormValues>[][] = [
  ['propertyType', 'area', 'rooms', 'bathrooms', 'condition'],
  ['packageType', 'visualPreset'],
  [],
  ['contact.name', 'contact.phone'],
]
