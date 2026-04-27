import clsx from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import { startTransition, useDeferredValue, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  FormProvider,
  useForm,
  useFormContext,
  useWatch,
} from 'react-hook-form'

import { buildEstimateSubmission } from '../model/build-estimate-submission'
import { calculateEstimate } from '../model/calculate-estimate'
import { defaultCalculatorValues } from '../model/default-values'
import { calculatorSteps, stepFields } from '../model/steps'
import { pricingConfig } from '../../../shared/config/pricing'
import {
  getVisualPresetLabel,
  visualPresetOptions,
} from '../../../shared/config/visual-preview'
import {
  calculatorFormSchema,
  type CalculatorFormValues,
  type ConditionType,
  type EstimateResult,
  type OptionKey,
  type PackageType,
  type PropertyType,
} from '../../../shared/contracts/estimate'
import {
  formatCurrency,
  formatDateLabel,
  formatNumber,
} from '../../../shared/lib/format'
import { RoomPreview } from './RoomPreview'

const propertyLabels: Record<PropertyType, string> = {
  apartment: 'Квартира',
  house: 'Дом',
}

const conditionLabels: Record<ConditionType, string> = {
  new_build: 'Новостройка',
  secondary: 'Вторичка',
}

const packageInsights: Record<
  PackageType,
  { summary: string; badge: string; dark?: boolean }
> = {
  cosmetic: {
    summary: 'Легкое обновление без глубокой стройки.',
    badge: 'Быстро',
  },
  capital: {
    summary: 'Основной сценарий с полным набором работ.',
    badge: 'Баланс',
    dark: true,
  },
  designer: {
    summary: 'Для детального проекта и более высокого уровня отделки.',
    badge: 'Премиум',
  },
}

const sectionDescriptions = {
  prep: 'Старт, демонтаж и подготовка основания',
  rough: 'Черновая база под чистовую отделку',
  finish: 'Финишные покрытия и визуальный слой',
  engineering: 'Электрика, трассы и инженерные узлы',
  wetZones: 'Санузел и работы во влажных зонах',
  extras: 'Допуслуги, материалы и сопровождение',
} satisfies Record<EstimateResult['sections'][number]['key'], string>

type SubmitState = 'idle' | 'submitting' | 'success' | 'error'

const portfolioDemoValues: CalculatorFormValues = {
  propertyType: 'apartment',
  area: 84,
  rooms: 3,
  bathrooms: 2,
  condition: 'secondary',
  packageType: 'designer',
  visualPreset: 'graphite_modern',
  options: {
    demolition: true,
    electrical: true,
    plumbing: true,
    finishingMaterials: true,
    designSupport: true,
  },
  contact: {
    name: 'Алексей',
    phone: '+7 999 123-45-67',
  },
}

type DraftCalculatorValues = Partial<
  Omit<CalculatorFormValues, 'contact' | 'options'>
> & {
  contact?: Partial<CalculatorFormValues['contact']>
  options?: Partial<CalculatorFormValues['options']>
}

function normalizeDraft(values: DraftCalculatorValues | undefined): CalculatorFormValues {
  return {
    ...defaultCalculatorValues,
    ...values,
    contact: {
      ...defaultCalculatorValues.contact,
      ...values?.contact,
    },
    options: {
      ...defaultCalculatorValues.options,
      ...values?.options,
    },
  }
}

function ProgressStrip({
  currentStep,
  onStepSelect,
}: {
  currentStep: number
  onStepSelect: (index: number) => void
}) {
  return (
    <nav className="rc-progress-strip" aria-label="Этапы расчета">
      {calculatorSteps.map((step, index) => (
        <button
          key={step.id}
          type="button"
          className={clsx('rc-progress-item', {
            'is-active': index === currentStep,
            'is-complete': index < currentStep,
          })}
          onClick={() => onStepSelect(index)}
        >
          <span className="rc-progress-index">{index + 1}</span>
          <span className="rc-progress-label">{step.label}</span>
        </button>
      ))}
    </nav>
  )
}

function PropertyStep() {
  const {
    register,
    watch,
    formState: { errors },
  } = useFormContext<CalculatorFormValues>()

  const propertyType = watch('propertyType')
  const condition = watch('condition')

  return (
    <div className="rc-step-body">
      <div className="rc-section-block">
        <div className="rc-section-header">
          <div className="rc-section-heading">Тип объекта</div>
          <div className="rc-section-copy">Выберите формат объекта.</div>
        </div>

        <div className="rc-choice-grid">
          {(
            [
              ['apartment', 'Квартира', 'Стандартный городской сценарий.'],
              ['house', 'Дом', 'С коэффициентом для более сложного объема.'],
            ] as const
          ).map(([value, title, description]) => (
            <label
              key={value}
              className={clsx('rc-choice-card rc-card-label', {
                'is-selected': propertyType === value,
              })}
            >
              <input type="radio" value={value} {...register('propertyType')} />
              <div className="rc-card-title">
                <strong>{title}</strong>
                <span className="rc-card-pill">{value === 'house' ? 'x1.12' : 'x1.00'}</span>
              </div>
              <p>{description}</p>
            </label>
          ))}
        </div>
      </div>

      <div className="rc-section-block">
        <div className="rc-section-header">
          <div className="rc-section-heading">Состояние</div>
          <div className="rc-section-copy">Это влияет на итоговую ставку.</div>
        </div>

        <div className="rc-choice-grid">
          {(
            [
              ['new_build', 'Новостройка', 'Чистый старт без лишних вскрытий.'],
              ['secondary', 'Вторичка', 'Больше подготовительных работ.'],
            ] as const
          ).map(([value, title, description]) => (
            <label
              key={value}
              className={clsx('rc-choice-card rc-card-label', {
                'is-selected': condition === value,
              })}
            >
              <input type="radio" value={value} {...register('condition')} />
              <div className="rc-card-title">
                <strong>{title}</strong>
                <span className="rc-card-pill">{value === 'secondary' ? 'x1.11' : 'x1.03'}</span>
              </div>
              <p>{description}</p>
            </label>
          ))}
        </div>
      </div>

      <div className="rc-number-grid">
        <div className="rc-field">
          <label htmlFor="area">Площадь, м2</label>
          <input id="area" type="number" min={20} {...register('area', { valueAsNumber: true })} />
          {errors.area ? <div className="rc-error">{errors.area.message}</div> : null}
        </div>

        <div className="rc-field">
          <label htmlFor="rooms">Комнаты</label>
          <input id="rooms" type="number" min={1} {...register('rooms', { valueAsNumber: true })} />
          {errors.rooms ? <div className="rc-error">{errors.rooms.message}</div> : null}
        </div>

        <div className="rc-field">
          <label htmlFor="bathrooms">Санузлы</label>
          <input
            id="bathrooms"
            type="number"
            min={1}
            {...register('bathrooms', { valueAsNumber: true })}
          />
          {errors.bathrooms ? <div className="rc-error">{errors.bathrooms.message}</div> : null}
        </div>

        <div className="rc-inline-card">
          <div className="rc-section-label">Профиль</div>
          <div className="rc-section-heading">
            {propertyLabels[propertyType]} • {conditionLabels[condition]}
          </div>
          <div className="rc-section-copy">
            {formatNumber(watch('area'))} м² · {watch('rooms')} комн. · {watch('bathrooms')} санузел
          </div>
        </div>
      </div>
    </div>
  )
}

function PackageStep() {
  const { register, watch } = useFormContext<CalculatorFormValues>()
  const packageType = watch('packageType')
  const visualPreset = watch('visualPreset')

  return (
    <div className="rc-step-body">
      <div className="rc-section-block">
        <div className="rc-section-header">
          <div className="rc-section-heading">Пакет ремонта</div>
          <div className="rc-section-copy">Выберите базовый уровень работ.</div>
        </div>

        <div className="rc-choice-grid">
          {(Object.entries(pricingConfig.packages) as [PackageType, (typeof pricingConfig.packages)[PackageType]][]).map(
            ([key, item]) => (
              <label
                key={key}
                className={clsx('rc-choice-card rc-card-label', {
                  'is-selected': packageType === key,
                  'is-dark': packageInsights[key].dark,
                })}
              >
                <input type="radio" value={key} {...register('packageType')} />
                <div className="rc-card-title">
                  <strong>{item.label}</strong>
                  <span
                    className={clsx('rc-option-pill', {
                      'is-dark': packageInsights[key].dark,
                    })}
                  >
                    {packageInsights[key].badge}
                  </span>
                </div>
                <p>{packageInsights[key].summary}</p>
                <small>{formatCurrency(item.baseRate)} / м²</small>
              </label>
            ),
          )}
        </div>
      </div>

      <div className="rc-section-block">
        <div className="rc-section-header">
          <div className="rc-section-heading">Стиль отделки</div>
          <div className="rc-section-copy">Влияет на визуальный preview и заявку в Telegram.</div>
        </div>

        <div className="rc-choice-grid rc-choice-grid--presets">
          {visualPresetOptions.map((preset) => (
            <label
              key={preset.value}
              className={clsx('rc-choice-card rc-card-label rc-choice-card--preset', {
                'is-selected': visualPreset === preset.value,
              })}
            >
              <input type="radio" value={preset.value} {...register('visualPreset')} />
              <div className="rc-card-title">
                <strong>{preset.label}</strong>
                <span className="rc-card-pill">Preview</span>
              </div>
              <p>{preset.description}</p>
              <small>{preset.note}</small>
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}

function OptionsStep() {
  const { register, watch } = useFormContext<CalculatorFormValues>()
  const options = watch('options')

  return (
    <div className="rc-step-body">
      <div className="rc-section-header">
        <div className="rc-section-heading">Дополнительные опции</div>
        <div className="rc-section-copy">Отметьте только нужные работы.</div>
      </div>

      <div className="rc-options-grid">
        {(Object.entries(pricingConfig.options) as [OptionKey, (typeof pricingConfig.options)[OptionKey]][]).map(
          ([key, item]) => (
            <label
              key={key}
              className={clsx('rc-option-card rc-card-label', {
                'is-selected': options[key],
              })}
            >
              <input type="checkbox" {...register(`options.${key}`)} />
              <div className="rc-card-title">
                <strong>{item.label}</strong>
                <span className="rc-option-pill">+ {Math.round(item.value * 100)}%</span>
              </div>
              <p>{item.description}</p>
            </label>
          ),
        )}
      </div>
    </div>
  )
}

function FinalStep({
  estimate,
  selectedOptions,
  visualPresetLabel,
  submitState,
  submitMessage,
}: {
  estimate: EstimateResult
  selectedOptions: string[]
  visualPresetLabel: string
  submitState: SubmitState
  submitMessage: string
}) {
  const {
    register,
    formState: { errors },
  } = useFormContext<CalculatorFormValues>()

  return (
    <div className="rc-step-body">
      <div className="rc-section-block">
        <div className="rc-section-header">
          <div className="rc-section-heading">Что уйдет в Telegram</div>
          <div className="rc-section-copy">Итоговая сумма, структура сметы и выбранные опции.</div>
        </div>

        <div className="rc-inline-card rc-inline-card--final">
          <div className="rc-section-label">Предварительный итог</div>
          <div className="rc-section-heading">{formatCurrency(estimate.total)}</div>
          <div className="rc-chip-list">
            <span className="rc-chip rc-chip--accent">{visualPresetLabel}</span>
            {selectedOptions.length > 0 ? (
              selectedOptions.map((option) => (
                <span key={option} className="rc-chip">
                  {option}
                </span>
              ))
            ) : (
              <span className="rc-chip">Без дополнительных опций</span>
            )}
          </div>
        </div>
      </div>

      <div className="rc-section-block">
        <div className="rc-section-heading">Поправки</div>
        <div className="rc-line-list">
          {estimate.adjustments.map((item) => (
            <div key={`${item.label}-${item.value}`} className="rc-line-item">
              <strong>{item.label}</strong>
              <span>{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rc-section-block">
        <div className="rc-section-heading">Контакт</div>
        <div className="rc-section-copy">Укажите данные для отправки расчета.</div>
      </div>

      <div className="rc-contact-grid">
        <div className="rc-field">
          <label htmlFor="contact-name">Имя</label>
          <input id="contact-name" type="text" placeholder="Как к вам обращаться" {...register('contact.name')} />
          {errors.contact?.name ? <div className="rc-error">{errors.contact.name.message}</div> : null}
        </div>

        <div className="rc-field">
          <label htmlFor="contact-phone">Телефон</label>
          <input
            id="contact-phone"
            type="tel"
            placeholder="+7 (999) 123-45-67"
            {...register('contact.phone')}
          />
          {errors.contact?.phone ? <div className="rc-error">{errors.contact.phone.message}</div> : null}
        </div>
      </div>

      <div
        className={clsx('rc-toast', {
          'is-success': submitState === 'success',
          'is-error': submitState === 'error',
        })}
      >
        {submitMessage}
      </div>

      {submitState === 'success' ? (
        <motion.div
          className="rc-success-card"
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.24, ease: 'easeOut' }}
        >
          <span className="rc-success-mark">✓</span>
          <div>
            <strong>Заявка готова</strong>
            <p>
              Расчет, контакты, выбранные опции и стиль отделки переданы в канал
              обработки заявки.
            </p>
          </div>
        </motion.div>
      ) : null}
    </div>
  )
}

function SummaryPanel({
  values,
  estimate,
  selectedOptions,
  visualPresetLabel,
  showDetailed,
}: {
  values: CalculatorFormValues
  estimate: EstimateResult
  selectedOptions: string[]
  visualPresetLabel: string
  showDetailed: boolean
}) {
  return (
    <aside className="rc-panel-card">
      <div className="rc-total-card">
        <h3>Предварительный итог</h3>
        <div className="rc-total-amount">{formatCurrency(estimate.total)}</div>
        <p>
          {propertyLabels[values.propertyType]} • {pricingConfig.packages[values.packageType].label}
        </p>
      </div>

      {showDetailed ? (
        <>
          <div className="rc-panel-list">
            {estimate.sections.map((section) => (
              <div key={section.key} className="rc-panel-item">
                <div className="rc-panel-item-main">
                  <strong>{section.label}</strong>
                  <small>{section.note ?? sectionDescriptions[section.key]}</small>
                </div>
                <span className="rc-panel-item-amount">{formatCurrency(section.amount)}</span>
              </div>
            ))}
          </div>

          <div className="rc-note-card rc-note-card--compact">
            <h2>Опции</h2>
            <div className="rc-chip-list">
              {selectedOptions.length > 0 ? (
                selectedOptions.map((option) => (
                  <span key={option} className="rc-chip">
                    {option}
                  </span>
                ))
              ) : (
                <span className="rc-chip">Без дополнительных опций</span>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="rc-brief-list" aria-label="Краткий итог расчета">
          <div className="rc-brief-item">
            <span>Объект</span>
            <strong>
              {propertyLabels[values.propertyType]} · {values.area} м²
            </strong>
          </div>
          <div className="rc-brief-item">
            <span>Пакет</span>
            <strong>{pricingConfig.packages[values.packageType].label}</strong>
          </div>
          <div className="rc-brief-item">
            <span>Стиль</span>
            <strong>{visualPresetLabel}</strong>
          </div>
          <div className="rc-brief-item">
            <span>Опции</span>
            <strong>{selectedOptions.length > 0 ? `${selectedOptions.length} выбрано` : 'Не выбраны'}</strong>
          </div>
        </div>
      )}
    </aside>
  )
}

export function RepairCalculator() {
  const methods = useForm<CalculatorFormValues>({
    resolver: zodResolver(calculatorFormSchema),
    defaultValues: defaultCalculatorValues,
    mode: 'onBlur',
  })

  const watchedValues = useWatch({
    control: methods.control,
  })

  const values = normalizeDraft(watchedValues)
  const deferredValues = useDeferredValue(values)
  const estimate = calculateEstimate(deferredValues)
  const selectedOptions = (Object.entries(values.options) as [OptionKey, boolean][])
    .filter(([, enabled]) => enabled)
    .map(([key]) => pricingConfig.options[key].label)
  const visualPresetLabel = getVisualPresetLabel(values.visualPreset)

  const [currentStep, setCurrentStep] = useState(0)
  const [submitState, setSubmitState] = useState<SubmitState>('idle')
  const [submitMessage, setSubmitMessage] = useState(
    'Заполните контакт, и мы отправим готовую смету в Telegram.',
  )

  const isFinalStep = currentStep === calculatorSteps.length - 1

  function fillPortfolioDemo() {
    methods.reset(portfolioDemoValues)
    setSubmitState('idle')
    setSubmitMessage('Демо-сценарий заполнен. Можно сразу перейти к отправке.')
    startTransition(() => setCurrentStep(calculatorSteps.length - 1))
  }

  async function moveToStep(nextStep: number) {
    if (nextStep <= currentStep) {
      startTransition(() => setCurrentStep(nextStep))
      return
    }

    const fields = stepFields.slice(currentStep, nextStep).flat()

    if (fields.length > 0) {
      const valid = await methods.trigger(fields, { shouldFocus: true })
      if (!valid) {
        return
      }
    }

    startTransition(() => setCurrentStep(nextStep))
  }

  async function handleNext() {
    const fields = stepFields[currentStep]

    if (fields.length > 0) {
      const valid = await methods.trigger(fields, { shouldFocus: true })
      if (!valid) {
        return
      }
    }

    if (currentStep < calculatorSteps.length - 1) {
      startTransition(() => setCurrentStep((step) => step + 1))
    }
  }

  const onSubmit = methods.handleSubmit(async (formValues) => {
    setSubmitState('submitting')
    setSubmitMessage('Отправляем смету в Telegram...')

    try {
      const payload = buildEstimateSubmission(formValues, estimate)
      const response = await fetch('/api/estimate/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const data = (await response.json()) as { ok: boolean; message?: string }

      if (!response.ok || !data.ok) {
        throw new Error(data.message ?? 'Не удалось отправить смету.')
      }

      setSubmitState('success')
      setSubmitMessage(data.message ?? 'Смета отправлена.')
    } catch (error) {
      setSubmitState('error')
      setSubmitMessage(
        error instanceof Error
          ? error.message
          : 'Не удалось отправить смету. Проверьте API или env.',
      )
    }
  })

  const activeStep = calculatorSteps[currentStep]
  const stepContent = (() => {
    switch (currentStep) {
      case 0:
        return <PropertyStep />
      case 1:
        return <PackageStep />
      case 2:
        return <OptionsStep />
      default:
        return (
          <FinalStep
            estimate={estimate}
            selectedOptions={selectedOptions}
            visualPresetLabel={visualPresetLabel}
            submitState={submitState}
            submitMessage={submitMessage}
          />
        )
    }
  })()

  return (
    <FormProvider {...methods}>
      <div className="rc-app">
        <div className="rc-shell">
          <div className="rc-workspace">
            <header className="rc-topbar">
              <div className="rc-title-block">
                <div className="rc-eyebrow">RepairCalc • {formatDateLabel(new Date())}</div>
                <h2>Калькулятор ремонта</h2>
                <p className="rc-section-copy">
                  Параметры объекта, пакет и визуальный ориентир до отправки сметы.
                </p>
                <div className="rc-title-actions">
                  <button
                    type="button"
                    className="rc-button rc-button--demo"
                    onClick={fillPortfolioDemo}
                  >
                    Заполнить демо
                  </button>
                </div>
              </div>

              <RoomPreview
                packageType={values.packageType}
                visualPreset={values.visualPreset}
              />
            </header>

            <ProgressStrip currentStep={currentStep} onStepSelect={moveToStep} />

            <div className="rc-content-grid">
              <form className="rc-form-card" onSubmit={onSubmit}>
                <div className="rc-panel-header">
                  <div>
                    <div className="rc-panel-meta">
                      Шаг {currentStep + 1} из {calculatorSteps.length}
                    </div>
                    <h2>{activeStep.title}</h2>
                    <div className="rc-section-copy">{activeStep.description}</div>
                  </div>

                  <span className="rc-badge">
                    {Math.round(((currentStep + 1) / calculatorSteps.length) * 100)}%
                  </span>
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeStep.id}
                    className="rc-step-anim"
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.22, ease: 'easeOut' }}
                  >
                    {stepContent}
                  </motion.div>
                </AnimatePresence>

                <div className="rc-actions">
                  <div className="rc-disclaimer">{estimate.disclaimer}</div>

                  <div className="rc-actions-group">
                    {currentStep > 0 ? (
                      <button
                        type="button"
                        className="rc-button is-secondary"
                        onClick={() => startTransition(() => setCurrentStep((step) => step - 1))}
                      >
                        Назад
                      </button>
                    ) : null}

                    {isFinalStep ? (
                      <button
                        type="submit"
                        className="rc-button is-accent"
                        disabled={submitState === 'submitting'}
                      >
                        {submitState === 'submitting' ? 'Отправляем...' : 'Отправить смету'}
                      </button>
                    ) : (
                      <button type="button" className="rc-button is-accent" onClick={handleNext}>
                        Далее
                      </button>
                    )}
                  </div>
                </div>
              </form>

              <SummaryPanel
                values={values}
                estimate={estimate}
                selectedOptions={selectedOptions}
                visualPresetLabel={visualPresetLabel}
                showDetailed={isFinalStep}
              />
            </div>
          </div>
        </div>
      </div>
    </FormProvider>
  )
}
