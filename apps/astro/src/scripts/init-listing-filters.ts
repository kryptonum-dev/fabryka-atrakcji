// Define the proper TypeScript types for our state
type FilterState = {
  participants: string | null
  activityType: string | null
  price: {
    min: number | null
    max: number | null
  }
  duration: string | null
}

// Create a map to store filter display values
type FilterLabels = {
  [key: string]: string
}

// Store the human-readable labels for each selected filter
let filterLabels: FilterLabels = {}

// Initialize filter state object to store temporary filter selections
let filterState: FilterState = {
  participants: null,
  activityType: null,
  price: { min: null, max: null },
  duration: null,
}

function parseParticipantsRange(value: string): { min: number | null; max: number | null } {
  const [minRaw, maxRaw] = value.split('-')
  const min = minRaw ? parseInt(minRaw, 10) : null
  const max = maxRaw ? parseInt(maxRaw, 10) : null

  return {
    min: Number.isFinite(min) ? min : null,
    max: Number.isFinite(max) ? max : null,
  }
}

function findParticipantsValueFromParams(params: URLSearchParams): string | null {
  const currentMin = params.get('minParticipants')
  const currentMax = params.get('maxParticipants')
  const participantInputs = Array.from(
    document.querySelectorAll<HTMLInputElement>('.filter-group[data-param-name="participants"] input[value]')
  )

  for (const input of participantInputs) {
    const value = input.value
    const { min, max } = parseParticipantsRange(value)

    if (max !== null) {
      const hasMatchingMax = currentMax === String(max)
      const hasMatchingMin =
        currentMin === String(min) || (currentMin === null && typeof min === 'number' && min <= 1)

      if (hasMatchingMax && hasMatchingMin) {
        return value
      }
      continue
    }

    if (currentMin === String(min) && currentMax === null) {
      return value
    }
  }

  return null
}

// Parse current URL params to initialize state
function initializeFilterState() {
  const params = new URLSearchParams(window.location.search)

  // Participants
  if (params.has('minParticipants') || params.has('maxParticipants')) {
    filterState.participants = findParticipantsValueFromParams(params)
  }

  // Activity type
  if (params.has('activityType')) {
    const activityType = params.get('activityType')
    if (activityType) {
      filterState.activityType = activityType
    }
  }

  // Price range - don't set values here, we handle this in the price range initialization
  // to ensure we respect the min/max bounds from Sanity
  // We store the URL parameters in filterState only for URL generation purposes
  if (params.has('minPrice') || params.has('maxPrice')) {
    // We'll load these values properly when initializing the price range filter
    // by checking against the allowed min/max values
  }

  // Duration
  if (params.has('duration')) {
    const duration = params.get('duration')
    if (duration) {
      filterState.duration = duration
    }
  }

  // Initialize filter display labels by reading the DOM
  initializeFilterLabels()

  // Verify the values against available options
  verifyFilterValues()

  // Update UI to reflect current state
  updateFilterUI()
}

// Verify filter values against available options
function verifyFilterValues() {
  // For each filter type, check if the value exists in available options
  for (const paramName of Object.keys(filterState)) {
    if (paramName === 'price') {
      // Price is handled separately
      // We want to preserve the price values for URL params
      // even when the price filter is disabled
      continue
    }

    const value = (filterState as any)[paramName]
    if (!value) continue

    const filterGroup = document.querySelector<HTMLDetailsElement>(`.filter-group[data-param-name="${paramName}"]`)
    if (!filterGroup) continue

    // Check if this value exists in the filter options
    const validOption = filterGroup.querySelector<HTMLInputElement>(`input[value="${value}"]`)
    if (!validOption) {
      // Value doesn't exist in options, reset it
      ;(filterState as any)[paramName] = null
      delete filterLabels[paramName]
    } else {
      // Check if this option has a count of 0 and is not selected (via URL)
      const countElement = validOption.closest('label')?.querySelector('.count')
      if (countElement && countElement.textContent === '(0)' && !validOption.checked) {
        // Hide options with zero count by marking their parent label
        const label = validOption.closest('label')
        if (label) {
          label.classList.add('zero-count')
        }
      }
    }
  }
}

// Get display labels for all selected filters
function initializeFilterLabels() {
  // For each filter type, find the selected option and get its label
  for (const paramName of Object.keys(filterState)) {
    if (paramName === 'price') continue // Price is handled separately

    const value = (filterState as any)[paramName]
    if (!value) continue

    const input = document.querySelector<HTMLInputElement>(
      `.filter-group[data-param-name="${paramName}"] input[value="${value}"]`
    )

    if (input) {
      const labelElement = input.parentElement?.querySelector('.value')
      if (labelElement) {
        filterLabels[paramName] = labelElement.textContent || ''
      }
    }
  }
}

// Toggle filter sidebar
const listingSection = document.querySelector<HTMLElement>('.Listing')! as HTMLElement
const filterButton = listingSection.querySelector<HTMLButtonElement>('.mobile-filter-button')! as HTMLButtonElement
const sidebar = listingSection.querySelector<HTMLDivElement>('.filter-sidebar')! as HTMLDivElement
const closeButton = listingSection.querySelector<HTMLButtonElement>('.close-sidebar')! as HTMLButtonElement
const overlay = listingSection.querySelector<HTMLDivElement>('.overlay')! as HTMLDivElement

filterButton.addEventListener('click', () => {
  listingSection.setAttribute('data-mobile-open', 'true')
  sidebar.setAttribute('aria-hidden', 'false')
  overlay.setAttribute('aria-hidden', 'false')
  // document.body.style.overflow = 'hidden'
})

closeButton.addEventListener('click', () => {
  listingSection.setAttribute('data-mobile-open', 'false')
  sidebar.setAttribute('aria-hidden', 'true')
  overlay.setAttribute('aria-hidden', 'true')
  // document.body.style.overflow = ''
})

overlay.addEventListener('click', () => {
  listingSection.setAttribute('data-mobile-open', 'false')
  sidebar.setAttribute('aria-hidden', 'true')
  overlay.setAttribute('aria-hidden', 'true')
  // document.body.style.overflow = ''
})

// Listen for filter changes from FilterGroup components
window.addEventListener('filterChange', ((event: CustomEvent) => {
  const { paramName, value, label } = event.detail

  if (paramName && value) {
    // Update the filterState
    ;(filterState as any)[paramName] = value

    // Store the label for this filter value
    if (label) {
      filterLabels[paramName] = label
    }

    // Update the UI to reflect new filter state
    updateFilterUI()
  }
}) as EventListener)

// Listen for filter clear events from FilterGroup components
window.addEventListener('filterClear', ((event: CustomEvent) => {
  const { paramName } = event.detail

  if (paramName) {
    // Clear the filter value
    ;(filterState as any)[paramName] = null

    // Remove the label
    delete filterLabels[paramName]

    // Update the UI to reflect new filter state
    updateFilterUI()
  }
}) as EventListener)

// Handle price range changes
const priceRangeFilter = document.querySelector<HTMLDetailsElement>('.price-range-filter')
if (priceRangeFilter) {
  // Check if the price filter is disabled
  const isDisabled = priceRangeFilter.dataset.disabled === 'true'

  // Only set up event listeners if not disabled
  if (!isDisabled) {
    const minRange = priceRangeFilter.querySelector<HTMLInputElement>('.price-min-range')
    const maxRange = priceRangeFilter.querySelector<HTMLInputElement>('.price-max-range')
    const minInput = priceRangeFilter.querySelector<HTMLInputElement>('.price-min')
    const maxInput = priceRangeFilter.querySelector<HTMLInputElement>('.price-max')
    const sliderRange = priceRangeFilter.querySelector<HTMLDivElement>('.slider-range')
    const errorMessage = priceRangeFilter.querySelector<HTMLDivElement>('.error-message')

    // Use type assertion for dataset to avoid null checks
    const dataMin = priceRangeFilter.dataset.min || '0'
    const dataMax = priceRangeFilter.dataset.max || '0'
    const minAllowed = parseInt(dataMin)
    const maxAllowed = parseInt(dataMax)
    const errorInvalid = priceRangeFilter.dataset.errorInvalid || ''
    const errorRange = priceRangeFilter.dataset.errorRange || ''
    const errorBounds = priceRangeFilter.dataset.errorBounds || ''

    // Set the initial values from URL params if they exist
    const urlParams = new URLSearchParams(window.location.search)
    const urlMinPrice = urlParams.get('minPrice') ? parseInt(urlParams.get('minPrice')!) : null
    const urlMaxPrice = urlParams.get('maxPrice') ? parseInt(urlParams.get('maxPrice')!) : null

    // Store the initial URL values in filterState
    if (urlMinPrice !== null && urlMinPrice >= minAllowed && urlMinPrice <= maxAllowed) {
      filterState.price.min = urlMinPrice
    } else {
      filterState.price.min = minAllowed
    }

    if (urlMaxPrice !== null && urlMaxPrice >= minAllowed && urlMaxPrice <= maxAllowed) {
      filterState.price.max = urlMaxPrice
    } else {
      filterState.price.max = maxAllowed
    }

    // Function to update range indicator
    function updateRangeIndicator() {
      if (!minRange || !maxRange || !sliderRange) return

      const minVal = parseInt(minRange.value)
      const maxVal = parseInt(maxRange.value)
      const totalRange = maxAllowed - minAllowed

      // Calculate percentages for positioning
      const minPercent = ((minVal - minAllowed) / totalRange) * 100
      const maxPercent = ((maxVal - minAllowed) / totalRange) * 100

      sliderRange.style.left = minPercent + '%'
      sliderRange.style.width = maxPercent - minPercent + '%'
    }

    // Function to validate price inputs
    function validatePriceInputs() {
      if (!minInput || !maxInput || !errorMessage) return false

      const min = parseInt(minInput.value)
      const max = parseInt(maxInput.value)

      if (isNaN(min) || isNaN(max)) {
        errorMessage.textContent = errorInvalid
        return false
      }

      if (min > max) {
        errorMessage.textContent = errorRange
        return false
      }

      if (min < minAllowed || max > maxAllowed) {
        errorMessage.textContent = errorBounds
        return false
      }

      errorMessage.textContent = ''
      return true
    }

    // Initialize range sliders and inputs with filterState values
    if (minRange && maxRange && minInput && maxInput) {
      // Set the range and input values based on filterState
      // This ensures the sliders cover the full possible range from Sanity
      minRange.min = minAllowed.toString()
      minRange.max = maxAllowed.toString()
      maxRange.min = minAllowed.toString()
      maxRange.max = maxAllowed.toString()

      minInput.min = minAllowed.toString()
      minInput.max = maxAllowed.toString()
      maxInput.min = minAllowed.toString()
      maxInput.max = maxAllowed.toString()

      // Set the values of the range sliders and inputs
      if (filterState.price.min !== null) {
        minRange.value = filterState.price.min.toString()
        minInput.value = filterState.price.min.toString()
      } else {
        minRange.value = minAllowed.toString()
        minInput.value = minAllowed.toString()
      }

      if (filterState.price.max !== null) {
        maxRange.value = filterState.price.max.toString()
        maxInput.value = filterState.price.max.toString()
      } else {
        maxRange.value = maxAllowed.toString()
        maxInput.value = maxAllowed.toString()
      }

      // Initialize range indicator with current values
      updateRangeIndicator()
    }

    // Set up event listeners for range sliders
    if (minRange && maxRange) {
      minRange.addEventListener('input', () => {
        const min = parseInt(minRange.value)
        const max = parseInt(maxRange.value)

        if (min > max) {
          minRange.value = maxRange.value
        }

        if (minInput) minInput.value = minRange.value
        updateRangeIndicator()
        validatePriceInputs()

        // Update temporary state
        filterState.price.min = parseInt(minRange.value)
      })

      maxRange.addEventListener('input', () => {
        const min = parseInt(minRange.value)
        const max = parseInt(maxRange.value)

        if (max < min) {
          maxRange.value = minRange.value
        }

        if (maxInput) maxInput.value = maxRange.value
        updateRangeIndicator()
        validatePriceInputs()

        // Update temporary state
        filterState.price.max = parseInt(maxRange.value)
      })
    }

    // Set up event listeners for number inputs
    if (minInput && maxInput) {
      minInput.addEventListener('input', () => {
        const value = parseInt(minInput.value)

        if (!isNaN(value) && value >= minAllowed && value <= maxAllowed) {
          if (minRange) minRange.value = value.toString()
          updateRangeIndicator()
        }

        validatePriceInputs()

        // Update temporary state
        filterState.price.min = isNaN(value) ? null : value
      })

      maxInput.addEventListener('input', () => {
        const value = parseInt(maxInput.value)

        if (!isNaN(value) && value >= minAllowed && value <= maxAllowed) {
          if (maxRange) maxRange.value = value.toString()
          updateRangeIndicator()
        }

        validatePriceInputs()

        // Update temporary state
        filterState.price.max = isNaN(value) ? null : value
      })
    }
  }
}

// Apply button - construct URL with all filters and redirect
const applyButton = document.querySelector<HTMLButtonElement>('.apply-filters')!

applyButton.addEventListener('click', () => {
  const currentPath = window.location.pathname
  // Preserve existing search parameters (like search, order, etc.)
  const params = new URLSearchParams(window.location.search)

  // Get path segments from Listing section data attributes
  const listingSection = document.querySelector('.Listing')
  const filterPathSegment = listingSection?.getAttribute('data-filter-path') || 'filtr'
  const pagePathSegment = listingSection?.getAttribute('data-page-path') || 'strona'

  let basePath = currentPath

  // Remove filter path if already present
  if (basePath.includes(`/${filterPathSegment}`)) {
    basePath = basePath.replace(`/${filterPathSegment}/`, '/').replace(`/${filterPathSegment}`, '/')
  }

  // Remove page path to always go back to first page when applying filters
  if (basePath.includes(`/${pagePathSegment}/`)) {
    basePath = basePath.replace(new RegExp(`\/${pagePathSegment}\/\\d+\/?`), '/')
  }

  // Ensure proper trailing slash and add filter path
  if (!basePath.endsWith('/')) {
    basePath += '/'
  }
  const filterPath = basePath + filterPathSegment + '/'

  // Store the current price values before clearing filter params
  const currentMinPrice = params.get('minPrice')
  const currentMaxPrice = params.get('maxPrice')
  const currentDuration = params.get('duration')

  // Clear existing filter parameters (but preserve search, order, etc.)
  ;['minParticipants', 'maxParticipants', 'activityType', 'duration', 'minPrice', 'maxPrice'].forEach((param) => {
    params.delete(param)
  })

  // Add participants filter
  if (filterState.participants) {
    const { min, max } = parseParticipantsRange(filterState.participants)

    if (max !== null) {
      params.set('maxParticipants', String(max))
      if (typeof min === 'number' && min > 1) {
        params.set('minParticipants', String(min))
      }
    } else if (min !== null) {
      params.set('minParticipants', String(min))
    }
  }

  // Add activity type filter
  if (filterState.activityType) {
    params.set('activityType', filterState.activityType)
  }

  // Handle price range filter
  const priceRangeFilter = document.querySelector<HTMLDetailsElement>('.price-range-filter')
  const isPriceFilterDisabled = priceRangeFilter && priceRangeFilter.dataset.disabled === 'true'

  if (!isPriceFilterDisabled) {
    // If price filter is enabled, use the new values from filterState
    if (filterState.price.min !== null) {
      params.set('minPrice', filterState.price.min.toString())
    }
    if (filterState.price.max !== null) {
      params.set('maxPrice', filterState.price.max.toString())
    }
  } else {
    // If price filter is disabled, retain the original URL values if they existed
    if (currentMinPrice) {
      params.set('minPrice', currentMinPrice)
    }
    if (currentMaxPrice) {
      params.set('maxPrice', currentMaxPrice)
    }
  }

  // Add duration filter
  if (filterState.duration) {
    params.set('duration', filterState.duration)
  } else {
    // Handle case where duration filter is disabled but has a selected value
    const durationFilter = document.querySelector<HTMLDetailsElement>(`.filter-group[data-param-name="duration"]`)
    const isDurationFilterDisabled = durationFilter && durationFilter.dataset.disabled === 'true'
    const hasDurationSelection = durationFilter && durationFilter.dataset.hasSelection === 'true'

    if (isDurationFilterDisabled && hasDurationSelection && currentDuration) {
      params.set('duration', currentDuration)
    }
  }

  // Redirect to filtered URL
  const finalUrl = params.toString() ? `${filterPath}?${params.toString()}` : filterPath
  window.location.href = finalUrl
})

// Update filter UI based on current state
function updateFilterUI() {
  // Update FilterGroup components to show the selected values
  updateFilterGroups()

  // Check for disabled but selected filters
  document.querySelectorAll('.filter-group[data-disabled="true"][data-has-selection="true"]').forEach((details) => {
    ;(details as HTMLDetailsElement).open = true
    details.setAttribute('data-expanded', 'true')
  })

  // Update radio buttons for participants
  if (filterState.participants) {
    const input = document.querySelector<HTMLInputElement>(
      `.filter-group[data-param-name="participants"] input[value="${filterState.participants}"]`
    )
    if (input) input.checked = true
  }

  // Update radio buttons for activity type
  if (filterState.activityType) {
    const input = document.querySelector<HTMLInputElement>(
      `.filter-group[data-param-name="activityType"] input[value="${filterState.activityType}"]`
    )
    if (input) input.checked = true
  }

  // Update radio buttons for duration
  if (filterState.duration) {
    const input = document.querySelector<HTMLInputElement>(
      `.filter-group[data-param-name="duration"] input[value="${filterState.duration}"]`
    )
    if (input) input.checked = true
  }

  // Handle price range filter
  const priceRangeFilter = document.querySelector<HTMLDetailsElement>('.price-range-filter')
  if (
    priceRangeFilter &&
    priceRangeFilter.dataset.hasValues === 'true' &&
    priceRangeFilter.dataset.disabled === 'true'
  ) {
    // If the price filter is disabled but has values, make sure it's open
    priceRangeFilter.open = true
    priceRangeFilter.setAttribute('data-expanded', 'true')
  }
}

// Update FilterGroup components based on current filter state
function updateFilterGroups() {
  document.querySelectorAll<HTMLDetailsElement>('.filter-group').forEach((details) => {
    const paramName = details.dataset.paramName || ''
    if (!paramName) return

    const selectedValueBox = details.querySelector<HTMLButtonElement>('.selected-value')
    if (!selectedValueBox) return

    const selectedValueText = selectedValueBox.querySelector<HTMLSpanElement>('span')
    if (!selectedValueText) return

    const value = (filterState as any)[paramName]
    const label = filterLabels[paramName]

    // Check if selection state is changing
    const hadSelection = details.getAttribute('data-has-selection') === 'true'
    const hasSelection = value && label

    if (hasSelection) {
      // We have a valid selection - show the selection button
      details.setAttribute('data-has-selection', 'true')

      // If it wasn't previously displayed, set initial animation state
      if (!hadSelection || selectedValueBox.style.display === 'none') {
        selectedValueBox.style.opacity = '0'
        selectedValueBox.style.transform = 'translateX(-0.5rem)'
        selectedValueBox.style.display = 'flex'

        // Trigger animation with a slight delay for the browser to recognize the display change
        setTimeout(() => {
          selectedValueBox.style.opacity = '1'
          selectedValueBox.style.transform = 'translateX(0)'
        }, 10)
      } else {
        selectedValueBox.style.display = 'flex'
      }

      selectedValueText.textContent = label

      // Set checked on the right input
      const selectedInput = details.querySelector<HTMLInputElement>(`input[value="${value}"]`)
      if (selectedInput) {
        selectedInput.checked = true
      }
    } else {
      // No selection - hide the selection button (without animation since CSS handles it)
      details.setAttribute('data-has-selection', 'false')
      selectedValueBox.style.display = 'none'

      // Uncheck all inputs in this group
      const inputs = details.querySelectorAll<HTMLInputElement>('input[type="radio"]')
      inputs.forEach((input) => {
        input.checked = false
      })
    }
  })
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initializeFilterState)

// Handle resize events for responsive behavior
let currentWidth = window.innerWidth
window.addEventListener('resize', () => {
  // Only check if width changed (to avoid triggering on height changes like mobile keyboard)
  if (currentWidth !== window.innerWidth) {
    currentWidth = window.innerWidth
    const isMobile = currentWidth < 940

    if (!isMobile && listingSection) {
      const sidebar = document.querySelector<HTMLDivElement>('.filter-sidebar')
      const overlay = document.querySelector<HTMLDivElement>('.Listing .overlay')

      // Close sidebar if user resizes to desktop while sidebar is open
      if (sidebar && overlay && sidebar.getAttribute('aria-hidden') === 'false') {
        listingSection.setAttribute('data-mobile-open', 'false')
        sidebar.setAttribute('aria-hidden', 'true')
        overlay.setAttribute('aria-hidden', 'true')
      }
    }
  }
})
