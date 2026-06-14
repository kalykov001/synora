import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { Button } from '../Button'

describe('Button', () => {
  it('renders label', () => {
    const { getByText } = render(<Button label="Войти" onPress={() => {}} />)
    expect(getByText('Войти')).toBeTruthy()
  })

  it('calls onPress when tapped', () => {
    const onPress = jest.fn()
    const { getByText } = render(<Button label="Submit" onPress={onPress} />)
    fireEvent.press(getByText('Submit'))
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('does not call onPress when disabled', () => {
    const onPress = jest.fn()
    const { getByTestId } = render(
      <Button label="Submit" onPress={onPress} disabled testID="btn" />
    )
    fireEvent.press(getByTestId('btn'))
    expect(onPress).not.toHaveBeenCalled()
  })

  it('shows ActivityIndicator when loading', () => {
    const { getByTestId } = render(
      <Button label="Submit" onPress={() => {}} loading testID="btn" />
    )
    expect(getByTestId('btn-spinner')).toBeTruthy()
  })
})
