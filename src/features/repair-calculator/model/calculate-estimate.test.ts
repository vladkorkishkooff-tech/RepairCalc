import { describe, expect, it } from 'vitest'

import { calculateEstimate } from './calculate-estimate'
import { defaultCalculatorValues } from './default-values'

describe('calculateEstimate', () => {
  it('keeps total equal to the sum of sections', () => {
    const result = calculateEstimate(defaultCalculatorValues)
    const sectionsTotal = result.sections.reduce((sum, section) => sum + section.amount, 0)

    expect(result.total).toBe(sectionsTotal)
  })

  it('increases total for house versus apartment', () => {
    const apartment = calculateEstimate(defaultCalculatorValues)
    const house = calculateEstimate({
      ...defaultCalculatorValues,
      propertyType: 'house',
    })

    expect(house.total).toBeGreaterThan(apartment.total)
  })

  it('adds cost when extra options are enabled', () => {
    const base = calculateEstimate({
      ...defaultCalculatorValues,
      options: {
        demolition: false,
        electrical: false,
        plumbing: false,
        finishingMaterials: false,
        designSupport: false,
      },
    })
    const rich = calculateEstimate(defaultCalculatorValues)

    expect(rich.total).toBeGreaterThan(base.total)
  })
})
