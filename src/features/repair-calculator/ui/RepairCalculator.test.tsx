import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { RepairCalculator } from './RepairCalculator'

describe('RepairCalculator', () => {
  it('requires contact details before submission', async () => {
    const user = userEvent.setup()

    render(<RepairCalculator />)

    for (let step = 0; step < 3; step += 1) {
      await user.click(screen.getByRole('button', { name: 'Далее' }))
    }

    await user.click(screen.getByRole('button', { name: 'Отправить смету' }))

    expect(await screen.findByText('Введите имя')).toBeInTheDocument()
    expect(await screen.findByText('Укажите номер телефона')).toBeInTheDocument()
  })

  it('keeps edited values when moving back', async () => {
    const user = userEvent.setup()

    render(<RepairCalculator />)

    const areaInput = screen.getByLabelText('Площадь, м2')

    await user.clear(areaInput)
    await user.type(areaInput, '120')
    await user.click(screen.getAllByRole('button', { name: 'Далее' })[0])
    await user.click(screen.getAllByRole('button', { name: 'Назад' })[0])

    expect(screen.getByLabelText('Площадь, м2')).toHaveValue(120)
  })

  it('updates preview when package and visual preset change', async () => {
    const user = userEvent.setup()

    const view = render(<RepairCalculator />)
    const scoped = within(view.container)

    expect(scoped.getAllByLabelText('Визуальный предпросмотр комнаты')[0]).toBeInTheDocument()
    expect(scoped.getAllByLabelText('Выбранный визуальный сценарий')[0]).toHaveTextContent(
      'Капитальный · Светлый минимал',
    )

    await user.click(within(scoped.getByLabelText('Этапы расчета')).getAllByRole('button')[1])
    await scoped.findByText('Стиль отделки')

    const designerInput = await waitFor(() => {
      const input = view.container.querySelector(
        'input[name="packageType"][value="designer"]',
      ) as HTMLInputElement | null

      expect(input).not.toBeNull()
      return input as HTMLInputElement
    })
    const graphiteInput = await waitFor(() => {
      const input = view.container.querySelector(
        'input[name="visualPreset"][value="graphite_modern"]',
      ) as HTMLInputElement | null

      expect(input).not.toBeNull()
      return input as HTMLInputElement
    })

    designerInput.click()
    graphiteInput.click()

    await waitFor(() => {
      expect(scoped.getAllByLabelText('Выбранный визуальный сценарий')[0]).toHaveTextContent(
        'Дизайнерский · Графит modern',
      )
    })

    await user.click(within(scoped.getByLabelText('Этапы расчета')).getAllByRole('button')[2])
    await user.click(within(scoped.getByLabelText('Этапы расчета')).getAllByRole('button')[1])

    await waitFor(() => {
      expect(scoped.getAllByLabelText('Выбранный визуальный сценарий')[0]).toHaveTextContent(
        'Дизайнерский · Графит modern',
      )
    })
  })

  it('fills a portfolio demo scenario', async () => {
    const user = userEvent.setup()

    const view = render(<RepairCalculator />)
    const scoped = within(view.container)

    await user.click(scoped.getByRole('button', { name: 'Заполнить демо' }))

    expect(await scoped.findByText('Итог и отправка')).toBeInTheDocument()
    expect(await scoped.findByLabelText('Имя')).toHaveValue('Алексей')
    expect(await scoped.findByLabelText('Телефон')).toHaveValue('+7 999 123-45-67')
    expect(scoped.getByText('Демо-сценарий заполнен. Можно сразу перейти к отправке.')).toBeInTheDocument()
  })

  it('shows detailed estimate only on the final step', async () => {
    const user = userEvent.setup()

    const view = render(<RepairCalculator />)
    const scoped = within(view.container)

    expect(scoped.getByLabelText('Краткий итог расчета')).toBeInTheDocument()
    expect(scoped.queryByText('Что уйдет в Telegram')).not.toBeInTheDocument()

    for (let step = 0; step < 3; step += 1) {
      await user.click(scoped.getAllByRole('button', { name: 'Далее' })[0])
    }

    expect(await scoped.findByText('Подготовка и демонтаж')).toBeInTheDocument()
    expect(await scoped.findByText('Что уйдет в Telegram')).toBeInTheDocument()
    expect(scoped.queryByLabelText('Краткий итог расчета')).not.toBeInTheDocument()
  })
})
