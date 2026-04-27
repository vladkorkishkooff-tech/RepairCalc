import type { CalculatorFormValues } from '../../../shared/contracts/estimate'

export const defaultCalculatorValues: CalculatorFormValues = {
  propertyType: 'apartment',
  area: 62,
  rooms: 2,
  bathrooms: 1,
  condition: 'new_build',
  packageType: 'capital',
  visualPreset: 'light_minimal',
  options: {
    demolition: false,
    electrical: true,
    plumbing: true,
    finishingMaterials: false,
    designSupport: false,
  },
  contact: {
    name: '',
    phone: '',
  },
}
