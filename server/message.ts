import type { EstimateSubmission } from '../src/shared/contracts/estimate'
import { formatCurrency } from '../src/shared/lib/format'

const propertyLabels = {
  apartment: 'Квартира',
  house: 'Дом',
} as const

const conditionLabels = {
  new_build: 'Новостройка',
  secondary: 'Вторичка',
} as const

export function buildEstimateMessage(submission: EstimateSubmission) {
  const lines: string[] = [
    'RepairCalc - новая заявка',
    '',
    `Имя: ${submission.contact.name}`,
    `Телефон: ${submission.contact.phone}`,
    '',
    'Объект',
    `- Тип: ${propertyLabels[submission.property.propertyType]}`,
    `- Площадь: ${submission.property.area} м2`,
    `- Комнаты: ${submission.property.rooms}`,
    `- Санузлы: ${submission.property.bathrooms}`,
    `- Состояние: ${conditionLabels[submission.property.condition]}`,
    '',
    `Пакет: ${submission.package.label}`,
    `Стиль: ${submission.visual.label}`,
  ]

  if (submission.options.length > 0) {
    lines.push('Опции')

    for (const option of submission.options) {
      lines.push(`- ${option.label}`)
    }
  }

  lines.push('', 'Смета')

  for (const section of submission.estimate.sections) {
    const suffix = section.note ? ` (${section.note})` : ''
    lines.push(`- ${section.label}: ${formatCurrency(section.amount)}${suffix}`)
  }

  lines.push('', `Итого: ${formatCurrency(submission.estimate.total)}`)
  lines.push('', `Источник: ${submission.meta.source}`)
  lines.push(`Время: ${submission.meta.timestamp}`)

  return lines.join('\n')
}
