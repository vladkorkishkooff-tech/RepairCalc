import { z } from 'zod'

export const propertyTypes = ['apartment', 'house'] as const
export const packageTypes = ['cosmetic', 'capital', 'designer'] as const
export const conditionTypes = ['new_build', 'secondary'] as const
export const visualPresetTypes = [
  'light_minimal',
  'warm_natural',
  'graphite_modern',
] as const
export const optionKeys = [
  'demolition',
  'electrical',
  'plumbing',
  'finishingMaterials',
  'designSupport',
] as const
export const sectionKeys = [
  'prep',
  'rough',
  'finish',
  'engineering',
  'wetZones',
  'extras',
] as const

const phoneValidator = z
  .string()
  .trim()
  .min(1, 'Укажите номер телефона')
  .refine((value) => value.replace(/\D/g, '').length >= 10, {
    message: 'Укажите номер телефона',
  })

export const calculatorFormSchema = z.object({
  propertyType: z.enum(propertyTypes),
  area: z
    .number()
    .min(20, 'Минимальная площадь - 20 м2')
    .max(1000, 'Площадь выглядит нереалистично'),
  rooms: z
    .number()
    .int('Укажите целое число')
    .min(1, 'Минимум 1 комната')
    .max(20, 'Слишком много комнат для MVP'),
  bathrooms: z
    .number()
    .int('Укажите целое число')
    .min(1, 'Минимум 1 санузел')
    .max(10, 'Слишком много санузлов для MVP'),
  condition: z.enum(conditionTypes),
  packageType: z.enum(packageTypes),
  visualPreset: z.enum(visualPresetTypes),
  options: z.object({
    demolition: z.boolean(),
    electrical: z.boolean(),
    plumbing: z.boolean(),
    finishingMaterials: z.boolean(),
    designSupport: z.boolean(),
  }),
  contact: z.object({
    name: z.string().trim().min(2, 'Введите имя'),
    phone: phoneValidator,
  }),
})

export const estimateSectionSchema = z.object({
  key: z.enum(sectionKeys),
  label: z.string(),
  amount: z.number().nonnegative(),
  note: z.string().optional(),
})

export const estimateAdjustmentSchema = z.object({
  label: z.string(),
  value: z.string(),
})

export const estimateResultSchema = z.object({
  sections: z.array(estimateSectionSchema).min(1),
  subtotal: z.number().nonnegative(),
  adjustments: z.array(estimateAdjustmentSchema),
  total: z.number().nonnegative(),
  disclaimer: z.string(),
})

export const estimateSubmissionSchema = z.object({
  contact: z.object({
    name: z.string().trim().min(2),
    phone: phoneValidator,
  }),
  property: z.object({
    propertyType: z.enum(propertyTypes),
    area: z.number().positive(),
    rooms: z.number().int().positive(),
    bathrooms: z.number().int().positive(),
    condition: z.enum(conditionTypes),
  }),
  package: z.object({
    type: z.enum(packageTypes),
    label: z.string(),
  }),
  visual: z.object({
    preset: z.enum(visualPresetTypes),
    label: z.string(),
  }),
  options: z.array(
    z.object({
      key: z.enum(optionKeys),
      label: z.string(),
    }),
  ),
  estimate: estimateResultSchema,
  meta: z.object({
    timestamp: z.string(),
    source: z.string(),
    appVersion: z.string(),
  }),
})

export type PropertyType = (typeof propertyTypes)[number]
export type PackageType = (typeof packageTypes)[number]
export type ConditionType = (typeof conditionTypes)[number]
export type VisualPresetType = (typeof visualPresetTypes)[number]
export type OptionKey = (typeof optionKeys)[number]
export type SectionKey = (typeof sectionKeys)[number]

export type CalculatorFormValues = z.infer<typeof calculatorFormSchema>
export type EstimateSection = z.infer<typeof estimateSectionSchema>
export type EstimateAdjustment = z.infer<typeof estimateAdjustmentSchema>
export type EstimateResult = z.infer<typeof estimateResultSchema>
export type EstimateSubmission = z.infer<typeof estimateSubmissionSchema>
