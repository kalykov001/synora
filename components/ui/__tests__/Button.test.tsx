import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { Button } from '../Button'

describe('Button', () => {
  it('renders label', async () => {
    const { getByText } = await render(<Button label="Войти" onPress={() => {}} />)
    expect(getByText('Войти')).toBeTruthy()
  })

  it('calls onPress when tapped', async () => {
    const onPress = jest.fn()
    const { getByText } = await render(<Button label="Submit" onPress={onPress} />)
    fireEvent.press(getByText('Submit'))
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('does not call onPress when disabled', async () => {
    const onPress = jest.fn()
    const { getByTestId } = await render(
      <Button label="Submit" onPress={onPress} disabled testID="btn" />
    )
    fireEvent.press(getByTestId('btn'))
    expect(onPress).not.toHaveBeenCalled()
  })

  it('shows ActivityIndicator when loading', async () => {
    const { getByTestId } = await render(
      <Button label="Submit" onPress={() => {}} loading testID="btn" />
    )
    expect(getByTestId('btn-spinner')).toBeTruthy()
  })
})
