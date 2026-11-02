// From 'react', which is preact/compat here: compat is what makes onBlur bubble like focusout
import { useEffect, useRef, useState } from 'react'
import type { Language } from '@/src/global/languages'
import styles from './AddressFilter.module.scss'

type Point = { lat: number; lng: number }
type Suggestion = Point & { label: string }
type Message = 'none' | 'hint' | 'empty' | 'error'

type Props = {
  heading: string
  placeholder: string
  lang: Language
  radii: number[]
  point: Point | null
  radius: number | null
  disabled?: boolean
}

// The label stays in this tab only, so the address never reaches the URL
const STORAGE_KEY = 'fa:address-filter'
const INPUT_ID = 'address-filter-input'
const RADIUS_ID = 'address-filter-radius'
const LIST_ID = 'address-filter-suggestions'
const MESSAGE_ID = 'address-filter-message'
const DEBOUNCE_MS = 250
const MIN_TEXT_LENGTH = 3

const translations = {
  pl: {
    address: 'Adres',
    radius: 'Promień',
    clear: 'Wyczyść adres',
    suggestions: 'Podpowiedzi adresów',
    selectedPoint: 'Wybrany punkt',
    found: (count: number) => `Podpowiedzi: ${count}`,
    hint: 'Wybierz adres z listy podpowiedzi.',
    empty: 'Brak podpowiedzi dla tego adresu.',
    error: 'Nie udało się pobrać podpowiedzi. Pozostałe filtry działają.',
  },
  en: {
    address: 'Address',
    radius: 'Radius',
    clear: 'Clear address',
    suggestions: 'Address suggestions',
    selectedPoint: 'Selected point',
    found: (count: number) => `Suggestions: ${count}`,
    hint: 'Choose an address from the suggestions.',
    empty: 'No suggestions for this address.',
    error: 'Suggestions could not be loaded. Other filters still work.',
  },
}

const round = (value: number) => Math.round(value * 1000) / 1000

const emit = (name: 'filterChange' | 'filterClear', paramName: string, value?: string) =>
  window.dispatchEvent(new CustomEvent(name, { detail: { paramName, value } }))

// Storage can throw in a private window, and the filter works without the label
function readStoredLabel(point: Point): string | null {
  try {
    const stored = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? 'null') as Suggestion | null
    return stored?.lat === point.lat && stored?.lng === point.lng ? stored.label : null
  } catch {
    return null
  }
}

function writeStoredLabel(suggestion: Suggestion | null) {
  try {
    if (suggestion) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(suggestion))
    else sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // Same as above
  }
}

export default function AddressFilter({ heading, placeholder, lang, radii, point, radius, disabled = false }: Props) {
  const t = translations[lang]

  const [query, setQuery] = useState(point ? t.selectedPoint : '')
  const [selection, setSelection] = useState(point)
  // The middle of the list: a wide radius loses nothing, because results sort nearest first
  const [selectedRadius, setSelectedRadius] = useState(radius ?? radii[Math.floor(radii.length / 2)])
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [activeIndex, setActiveIndex] = useState(-1)
  const [message, setMessage] = useState<Message>('none')

  const detailsRef = useRef<HTMLDetailsElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const requestRef = useRef<AbortController>(undefined)
  const isAnimatingRef = useRef(false)

  const isOpen = suggestions.length > 0

  useEffect(() => {
    const label = point && readStoredLabel(point)
    if (label) setQuery(label)
  }, [])

  const cancelPending = () => {
    clearTimeout(debounceRef.current)
    requestRef.current?.abort()
  }

  const closeSuggestions = () => {
    setSuggestions([])
    setActiveIndex(-1)
  }

  const fetchSuggestions = async (text: string) => {
    const controller = new AbortController()
    requestRef.current = controller

    try {
      const response = await fetch('/api/geocode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, lang }),
        signal: controller.signal,
      })
      if (!response.ok) throw new Error()

      const results = (await response.json()) as Suggestion[]
      setSuggestions(results)
      setActiveIndex(-1)
      setMessage(results.length > 0 ? 'none' : 'empty')
    } catch {
      if (controller.signal.aborted) return
      closeSuggestions()
      setMessage('error')
    }
  }

  // The filter state is emptied too: free text has no coordinates, so it can never be applied
  const forgetSelection = () => {
    if (!selection) return
    setSelection(null)
    writeStoredLabel(null)
    emit('filterClear', 'lat')
    emit('filterClear', 'lng')
    emit('filterClear', 'radius')
  }

  const handleInput = (event: React.FormEvent<HTMLInputElement>) => {
    const text = event.currentTarget.value
    setQuery(text)
    setMessage('none')
    forgetSelection()
    cancelPending()

    if (text.trim().length < MIN_TEXT_LENGTH) {
      closeSuggestions()
      return
    }
    debounceRef.current = setTimeout(() => fetchSuggestions(text.trim()), DEBOUNCE_MS)
  }

  const selectSuggestion = (suggestion: Suggestion) => {
    const rounded = { lat: round(suggestion.lat), lng: round(suggestion.lng) }

    cancelPending()
    closeSuggestions()
    setMessage('none')
    setQuery(suggestion.label)
    setSelection(rounded)
    writeStoredLabel({ ...rounded, label: suggestion.label })

    emit('filterChange', 'lat', String(rounded.lat))
    emit('filterChange', 'lng', String(rounded.lng))
    emit('filterChange', 'radius', String(selectedRadius))
  }

  const clearAddress = (event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault()
    event.stopPropagation()
    cancelPending()
    closeSuggestions()
    setMessage('none')
    setQuery('')
    forgetSelection()
    writeStoredLabel(null)
    inputRef.current?.focus()
  }

  const handleRadiusChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = Number(event.currentTarget.value)
    setSelectedRadius(value)
    if (selection) emit('filterChange', 'radius', String(value))
  }

  const showHintIfUnresolved = () => {
    if (!selection && query.trim()) setMessage((current) => (current === 'none' ? 'hint' : current))
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      // Enter must not reach a surrounding form, and text alone cannot be applied
      event.preventDefault()
      if (activeIndex >= 0) selectSuggestion(suggestions[activeIndex])
      else showHintIfUnresolved()
      return
    }

    if (!isOpen) return

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      const step = event.key === 'ArrowDown' ? 1 : -1
      const start = activeIndex === -1 && step === -1 ? 0 : activeIndex
      setActiveIndex((start + step + suggestions.length) % suggestions.length)
    }

    if (event.key === 'Escape') {
      event.preventDefault()
      closeSuggestions()
      showHintIfUnresolved()
    }
  }

  const handleBlur = (event: React.FocusEvent<HTMLDivElement>) => {
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) return
    closeSuggestions()
    showHintIfUnresolved()
  }

  const toggle = (event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault()
    const details = detailsRef.current
    const content = contentRef.current
    if (disabled || isAnimatingRef.current || !details || !content) return

    isAnimatingRef.current = true
    const isClosing = details.open
    details.setAttribute('data-expanded', String(!isClosing))

    if (!isClosing) details.open = true
    const openHeight = content.scrollHeight
    content.style.height = `${isClosing ? openHeight : 0}px`
    requestAnimationFrame(() => {
      content.style.height = `${isClosing ? 0 : openHeight}px`
    })

    content.addEventListener(
      'transitionend',
      () => {
        details.open = !isClosing
        content.style.height = ''
        isAnimatingRef.current = false
      },
      { once: true }
    )
  }

  const messageText = {
    none: isOpen ? t.found(suggestions.length) : '',
    hint: t.hint,
    empty: t.empty,
    error: t.error,
  }[message]

  return (
    <details
      ref={detailsRef}
      className={styles.AddressFilter}
      data-disabled={String(disabled)}
      data-expanded={String(!disabled)}
      open={!disabled}
    >
      <summary aria-disabled={disabled || undefined} onClick={toggle}>
        <span>{heading}</span>
        {/* A mouse shortcut, not a control: a summary can't hold one, and the field below clears from the keyboard */}
        {selection && (
          <span className={styles.selectedValue} title={t.clear} onClick={clearAddress}>
            <span>
              {query}, {selectedRadius} km
            </span>
          </span>
        )}
        <div className={styles.icon} aria-hidden="true">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="17" fill="none">
            <path
              stroke="#600D2A"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.25"
              d="m4 6.25 4 4 4-4"
            ></path>
          </svg>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="17" fill="none">
            <path
              stroke="#600D2A"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.25"
              d="m4 6.25 4 4 4-4"
            ></path>
          </svg>
        </div>
      </summary>

      <div ref={contentRef} className={styles.content}>
        <div className={styles.fields} onBlur={handleBlur}>
          <div className={styles.field}>
            <label htmlFor={INPUT_ID}>{t.address}</label>
            <div className={styles.inputBox}>
              <input
                ref={inputRef}
                id={INPUT_ID}
                type="text"
                role="combobox"
                autoComplete="off"
                aria-autocomplete="list"
                aria-expanded={isOpen}
                aria-controls={isOpen ? LIST_ID : undefined}
                aria-activedescendant={activeIndex >= 0 ? `${LIST_ID}-${activeIndex}` : undefined}
                aria-describedby={MESSAGE_ID}
                placeholder={placeholder}
                maxLength={100}
                disabled={disabled}
                value={query}
                onInput={handleInput}
                onKeyDown={handleKeyDown}
              />
              {query && !disabled && (
                <button className={styles.clearInput} type="button" aria-label={t.clear} onClick={clearAddress}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <circle cx="9.9974" cy="10.0003" r="8.33333" stroke="#74535e"></circle>
                    <path
                      d="M12.0807 7.91701L7.91406 12.0837M7.91404 7.91699L12.0807 12.0836"
                      stroke="#74535e"
                      stroke-linecap="round"
                    ></path>
                  </svg>
                </button>
              )}
            </div>
          </div>

          {isOpen && (
            <div className={styles.popup}>
              {/* Mouse down would move focus to the option and close the list before the click lands */}
              <ul
                id={LIST_ID}
                role="listbox"
                aria-label={t.suggestions}
                onMouseDown={(event) => event.preventDefault()}
              >
                {suggestions.map((suggestion, index) => (
                  <li
                    key={`${suggestion.label}-${index}`}
                    id={`${LIST_ID}-${index}`}
                    role="option"
                    aria-selected={index === activeIndex}
                    onClick={() => selectSuggestion(suggestion)}
                  >
                    {suggestion.label}
                  </li>
                ))}
              </ul>
              <p className={styles.attribution}>
                <a href="https://www.geoapify.com/" target="_blank" rel="noopener noreferrer">
                  Powered by Geoapify
                </a>
                <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">
                  © OpenStreetMap
                </a>
              </p>
            </div>
          )}

          <p id={MESSAGE_ID} className={styles.message} role="status" data-visually-hidden={message === 'none'}>
            {messageText}
          </p>

          <div className={styles.field}>
            <label htmlFor={RADIUS_ID}>{t.radius}</label>
            <select
              id={RADIUS_ID}
              autoComplete="off"
              disabled={disabled || !selection}
              value={selectedRadius}
              onChange={handleRadiusChange}
            >
              {radii.map((value) => (
                <option key={value} value={value}>
                  {value} km
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </details>
  )
}
