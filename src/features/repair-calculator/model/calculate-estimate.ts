import {
  getOptionConfig,
  getPackageLabel,
  getRoomAdjustment,
  pricingConfig,
  sectionLabels,
} from '../../../shared/config/pricing'
import type {
  CalculatorFormValues,
  EstimateAdjustment,
  EstimateResult,
  EstimateSection,
  OptionKey,
  SectionKey,
} from '../../../shared/contracts/estimate'
import { formatCurrency } from '../../../shared/lib/format'

function roundAmount(value: number) {
  return Math.round(value / 1000) * 1000
}

export function calculateEstimate(values: CalculatorFormValues): EstimateResult {
  const packageConfig = pricingConfig.packages[values.packageType]
  const propertyAdjustment =
    pricingConfig.propertyTypeAdjustments[values.propertyType]
  const conditionAdjustment =
    pricingConfig.conditionAdjustments[values.condition]
  const roomAdjustment = getRoomAdjustment(values.rooms)

  const baseSubtotal = values.area * packageConfig.baseRate
  const adjustedBase = roundAmount(
    baseSubtotal * propertyAdjustment * conditionAdjustment * roomAdjustment,
  )

  const distributionEntries = Object.entries(packageConfig.distribution) as [
    SectionKey,
    number,
  ][]

  const sectionMap = new Map<SectionKey, number>(
    distributionEntries.map(([key, share]) => [key, roundAmount(adjustedBase * share)]),
  )

  const bathroomAddon =
    pricingConfig.bathroomAddons.first +
    Math.max(values.bathrooms - 1, 0) * pricingConfig.bathroomAddons.additional

  sectionMap.set(
    'wetZones',
    (sectionMap.get('wetZones') ?? 0) + roundAmount(bathroomAddon),
  )

  const selectedOptions = (
    Object.entries(values.options) as [OptionKey, boolean][]
  ).filter(([, enabled]) => enabled)

  const optionAdjustments: EstimateAdjustment[] = []

  for (const [optionKey] of selectedOptions) {
    const optionConfig = getOptionConfig(optionKey)
    const optionAmount = roundAmount(adjustedBase * optionConfig.value)

    sectionMap.set(
      optionConfig.section,
      (sectionMap.get(optionConfig.section) ?? 0) + optionAmount,
    )

    optionAdjustments.push({
      label: optionConfig.label,
      value: `+ ${formatCurrency(optionAmount)}`,
    })
  }

  const sections = Array.from(sectionMap.entries()).map(([key, amount]) => {
    const section: EstimateSection = {
      key,
      label: sectionLabels[key],
      amount,
    }

    if (key === 'wetZones') {
      section.note = `${values.bathrooms} ${
        values.bathrooms > 1 ? 'санузла' : 'санузел'
      }`
    }

    return section
  })

  const subtotal = sections.reduce((sum, section) => sum + section.amount, 0)

  const adjustments: EstimateAdjustment[] = [
    {
      label: 'Формат объекта',
      value: values.propertyType === 'house' ? 'Дом x1.12' : 'Квартира x1.00',
    },
    {
      label: 'Состояние',
      value:
        values.condition === 'secondary'
          ? 'Вторичка x1.11'
          : 'Новостройка x1.03',
    },
    {
      label: 'Комнатность',
      value: `${values.rooms} комн. x${roomAdjustment.toFixed(2)}`,
    },
    {
      label: 'Санузлы',
      value: `${values.bathrooms} шт. (+ ${formatCurrency(roundAmount(bathroomAddon))})`,
    },
    {
      label: 'Пакет',
      value: getPackageLabel(values.packageType),
    },
    ...optionAdjustments,
  ]

  return {
    sections,
    subtotal,
    adjustments,
    total: subtotal,
    disclaimer: pricingConfig.disclaimer,
  }
}
