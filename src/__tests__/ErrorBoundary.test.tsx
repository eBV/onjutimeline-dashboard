import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import { ErrorBoundary } from '../components/ErrorBoundary'

const ThrowingChild = () => {
  throw new Error('test error')
}

describe('ErrorBoundary', () => {
  // React logs caught errors to console.error — suppress for cleaner output
  const suppressError = vi.spyOn(console, 'error')
  afterEach(() => suppressError.mockReset())

  test('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <p>healthy content</p>
      </ErrorBoundary>
    )
    expect(screen.getByText('healthy content')).toBeInTheDocument()
  })

  test('renders error UI when a child throws', () => {
    suppressError.mockImplementation(() => {})
    render(
      <ErrorBoundary>
        <ThrowingChild />
      </ErrorBoundary>
    )
    expect(screen.getByText('Something went wrong.')).toBeInTheDocument()
  })

  test('displays the error message in the error UI', () => {
    suppressError.mockImplementation(() => {})
    render(
      <ErrorBoundary>
        <ThrowingChild />
      </ErrorBoundary>
    )
    expect(screen.getByText(/test error/)).toBeInTheDocument()
  })
})
