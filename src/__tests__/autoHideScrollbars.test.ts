import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { initAutoHideScrollbars, SCROLLBAR_IDLE_MS } from '../lib/autoHideScrollbars'

describe('autoHideScrollbars', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  test('adds scrolling on scroll and removes it after the idle timeout', () => {
    const cleanup = initAutoHideScrollbars(document)
    expect(document.documentElement.classList.contains('scrolling')).toBe(false)
    document.dispatchEvent(new Event('scroll'))
    expect(document.documentElement.classList.contains('scrolling')).toBe(true)
    vi.advanceTimersByTime(SCROLLBAR_IDLE_MS - 1)
    expect(document.documentElement.classList.contains('scrolling')).toBe(true)
    vi.advanceTimersByTime(1)
    expect(document.documentElement.classList.contains('scrolling')).toBe(false)
    cleanup()
  })

  test('repeated scrolling resets the idle timer', () => {
    const cleanup = initAutoHideScrollbars(document)
    document.dispatchEvent(new Event('scroll'))
    vi.advanceTimersByTime(SCROLLBAR_IDLE_MS - 1)
    document.dispatchEvent(new Event('wheel'))
    vi.advanceTimersByTime(SCROLLBAR_IDLE_MS - 1)
    expect(document.documentElement.classList.contains('scrolling')).toBe(true)
    vi.advanceTimersByTime(1)
    expect(document.documentElement.classList.contains('scrolling')).toBe(false)
    cleanup()
  })

  test('cleanup removes the class and stops later scrolls from re-adding it', () => {
    const cleanup = initAutoHideScrollbars(document)
    document.dispatchEvent(new Event('scroll'))
    expect(document.documentElement.classList.contains('scrolling')).toBe(true)
    cleanup()
    expect(document.documentElement.classList.contains('scrolling')).toBe(false)
    document.dispatchEvent(new Event('scroll'))
    vi.advanceTimersByTime(SCROLLBAR_IDLE_MS + 100)
    expect(document.documentElement.classList.contains('scrolling')).toBe(false)
  })
})
