import { getPackageLabel, pricingConfig } from '../../../shared/config/pricing'
import { getVisualPresetLabel } from '../../../shared/config/visual-preview'
import type {
  CalculatorFormValues,
  EstimateResult,
  EstimateSubmission,
  OptionKey,
} from '../../../shared/contracts/estimate'

const APP_VERSION = 'mvp-local'

export function buildEstimateSubmission(
  values: CalculatorFormValues,
  estimate: EstimateResult,
): EstimateSubmission {
  const options = (Object.entries(values.options) as [OptionKey, boolean][])
    .filter(([, enabled]) => enabled)
    .map(([key]) => ({
      key,
      label: pricingConfig.options[key].label,
    }))

  return {
    contact: {
      name: values.contact.name.trim(),
      phone: values.contact.phone.trim(),
    },
    property: {
      propertyType: values.propertyType,
      area: values.area,
      rooms: values.rooms,
      bathrooms: values.bathrooms,
      condition: values.condition,
    },
    package: {
      type: values.packageType,
      label: getPackageLabel(values.packageType),
    },
    visual: {
      preset: values.visualPreset,
      label: getVisualPresetLabel(values.visualPreset),
    },
    options,
    estimate,
    meta: {
      timestamp: new Date().toISOString(),
      source: 'repaircalc-web',
      appVersion: APP_VERSION,
    },
  }
}
