import { z } from 'zod'

import pricingJson from './pricing.json'

import type { OptionKey, PackageType, SectionKey } from '../contracts/estimate'

const distributionSchema = z
  .object({
    prep: z.number().positive(),
    rough: z.number().positive(),
    finish: z.number().positive(),
    engineering: z.number().positive(),
    wetZones: z.number().positive(),
    extras: z.number().positive(),
  })
  .refine((value) => {
    const total = Object.values(value).reduce((sum, item) => sum + item, 0)
    return Math.abs(total - 1) < 0.0001
  }, 'Сумма долей должна быть равна 1')

const optionSchema = z.object({
  label: z.string(),
  description: z.string(),
  type: z.literal('percent'),
  value: z.number().nonnegative(),
  section: z.enum([
    'prep',
    'rough',
    'finish',
    'engineering',
    'wetZones',
    'extras',
  ]),
})

const pricingSchema = z.object({
  currency: z.literal('RUB'),
  disclaimer: z.string().min(10),
  propertyTypeAdjustments: z.object({
    apartment: z.number().positive(),
    house: z.number().positive(),
  }),
  conditionAdjustments: z.object({
    new_build: z.number().positive(),
    secondary: z.number().positive(),
  }),
  roomAdjustments: z.object({
    '1': z.number().positive(),
    '2': z.number().positive(),
    '3': z.number().positive(),
    '4plus': z.number().positive(),
  }),
  bathroomAddons: z.object({
    first: z.number().nonnegative(),
    additional: z.number().nonnegative(),
  }),
  packages: z.object({
    cosmetic: z.object({
      label: z.string(),
      baseRate: z.number().positive(),
      distribution: distributionSchema,
    }),
    capital: z.object({
      label: z.string(),
      baseRate: z.number().positive(),
      distribution: distributionSchema,
    }),
    designer: z.object({
      label: z.string(),
      baseRate: z.number().positive(),
      distribution: distributionSchema,
    }),
  }),
  options: z.object({
    demolition: optionSchema,
    electrical: optionSchema,
    plumbing: optionSchema,
    finishingMaterials: optionSchema,
    designSupport: optionSchema,
  }),
})

export const pricingConfig = pricingSchema.parse(pricingJson)

export const sectionLabels: Record<SectionKey, string> = {
  prep: 'Подготовка и демонтаж',
  rough: 'Черновые работы',
  finish: 'Чистовая отделка',
  engineering: 'Инженерные системы',
  wetZones: 'Санузлы и мокрые зоны',
  extras: 'Дополнительные опции',
}

export function getRoomAdjustment(rooms: number) {
  if (rooms <= 1) {
    return pricingConfig.roomAdjustments['1']
  }

  if (rooms === 2) {
    return pricingConfig.roomAdjustments['2']
  }

  if (rooms === 3) {
    return pricingConfig.roomAdjustments['3']
  }

  return pricingConfig.roomAdjustments['4plus']
}

export function getPackageLabel(packageType: PackageType) {
  return pricingConfig.packages[packageType].label
}

export function getOptionConfig(optionKey: OptionKey) {
  return pricingConfig.options[optionKey]
}
