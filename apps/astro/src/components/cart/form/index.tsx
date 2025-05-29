import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import Input from '../../ui/input'
import styles from './styles.module.scss'
import Button from '../../ui/Button'

// We'll dynamically import Leaflet when needed instead of static imports
// import 'leaflet/dist/leaflet.css'
// import L from 'leaflet'

// Define Leaflet types but we'll load the actual module dynamically
declare global {
  interface Window {
    L: any
  }
}

// Add a module-level reference to Leaflet
let L: any = null

type FormValues = {
  street: string
  postal: string
  city: string
  peoplePerBus: number
  coordinates?: {
    lat: number
    lng: number
  }
}

type TranslationType = {
  title: string
  street: string
  streetPlaceholder: string
  streetRequired: string
  postal: string
  postalPlaceholder: string
  postalRequired: string
  postalPattern: string
  city: string
  cityRequired: string
  peoplePerBus: string
  peoplePerBusPlaceholder: string
  peoplePerBusRequired: string
  peoplePerBusMax: string
  submit: string
  pickFromMap?: string
  searchLocation?: string
  confirm?: string
  cancel?: string
  mapTooltip?: string
}

interface AddressFormProps {
  onSubmit?: (data: FormValues) => void
  defaultValues?: Partial<FormValues>
  translations: TranslationType
}

// Default map coordinates (Warsaw, Poland)
const DEFAULT_COORDS = { lat: 52.2297, lng: 21.0122 }

export default function AddressForm({ onSubmit, defaultValues = {}, translations }: AddressFormProps) {
  // Keep a reference to the original values for cancellation
  const [originalValues, setOriginalValues] = useState<Partial<FormValues>>({})
  const formInitialized = useRef(false)
  const [leafletLoaded, setLeafletLoaded] = useState(false)
  const [currentPeoplePerBus, setCurrentPeoplePerBus] = useState<number | null>(null)

  // Helper function to get max participants from localStorage
  const getMaxParticipants = (): number => {
    if (typeof window === 'undefined' || !window.localStorage) {
      return 50 // Default value for SSR
    }
    const savedCount = localStorage.getItem('cart_participant_count')
    return savedCount ? parseInt(savedCount) : 50
  }

  // Helper function to get stored peoplePerBus value
  const getStoredPeoplePerBus = (): number => {
    if (typeof window === 'undefined' || !window.localStorage) {
      return Math.min(getMaxParticipants(), 50) // Default value for SSR
    }

    // First try to get from dedicated peoplePerBus storage
    const storedPeoplePerBus = localStorage.getItem('cart_people_per_bus')
    if (storedPeoplePerBus) {
      return parseInt(storedPeoplePerBus)
    }

    // Fallback to transport address data
    const transportAddress = localStorage.getItem('transport_address')
    if (transportAddress) {
      try {
        const addressData = JSON.parse(transportAddress)
        if (addressData.peoplePerBus) {
          return addressData.peoplePerBus
        }
      } catch (error) {
        console.error('Error parsing transport address:', error)
      }
    }

    // Final fallback to participant count or 50
    return Math.min(getMaxParticipants(), 50)
  }

  // Map state
  const [isMapOpen, setIsMapOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const mapRef = useRef<HTMLDivElement>(null)
  const mapPopupRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const [lastMapPosition, setLastMapPosition] = useState(DEFAULT_COORDS)
  const [isRequestingLocation, setIsRequestingLocation] = useState(false)
  const mapInitializedRef = useRef(false)
  const previousFormValues = useRef<Partial<FormValues>>({})
  const hasManualChanges = useRef(false)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
    clearErrors,
    trigger,
  } = useForm<FormValues>({
    defaultValues,
  })

  // Watch form values for map updates
  const formValues = watch()

  // Store previous form values to detect manual changes
  useEffect(() => {
    // Store a copy of current form values if they're different
    if (
      formValues.street !== previousFormValues.current.street ||
      formValues.city !== previousFormValues.current.city ||
      formValues.postal !== previousFormValues.current.postal
    ) {
      // Only mark as manual changes if map is closed (to ignore changes from map itself)
      if (!isMapOpen) {
        hasManualChanges.current = true
      }

      previousFormValues.current = {
        street: formValues.street,
        city: formValues.city,
        postal: formValues.postal,
      }
    }
  }, [formValues.street, formValues.city, formValues.postal, isMapOpen])

  // Load default values from localStorage on mount
  useEffect(() => {
    if (formInitialized.current) return

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const savedAddress = localStorage.getItem('transport_address')
        if (savedAddress) {
          const parsedAddress = JSON.parse(savedAddress)
          // Only reset if we have valid data
          if (parsedAddress.street || parsedAddress.postal || parsedAddress.city) {
            setOriginalValues(parsedAddress)

            // Always use the stored peoplePerBus value (might be more recent)
            const currentPeoplePerBus = getStoredPeoplePerBus()
            parsedAddress.peoplePerBus = currentPeoplePerBus
            setCurrentPeoplePerBus(currentPeoplePerBus)

            reset(parsedAddress)

            // If coordinates exist, set last map position
            if (parsedAddress.coordinates) {
              setLastMapPosition(parsedAddress.coordinates)
            }

            // Initialize previous form values
            previousFormValues.current = {
              street: parsedAddress.street,
              city: parsedAddress.city,
              postal: parsedAddress.postal,
            }

            formInitialized.current = true
            return
          }
        }

        // If no saved address or incomplete data, set default peoplePerBus
        const defaultPeoplePerBus = getStoredPeoplePerBus()
        setValue('peoplePerBus', defaultPeoplePerBus)
        setCurrentPeoplePerBus(defaultPeoplePerBus)

        // Store the default value
        localStorage.setItem('cart_people_per_bus', defaultPeoplePerBus.toString())
      } else {
        // Set default peoplePerBus value for SSR
        setValue('peoplePerBus', 50)
      }
    } catch (error) {
      console.error('Error loading saved address data:', error)
      // Set default peoplePerBus value in case of error
      const fallbackValue = Math.min(getMaxParticipants(), 50)
      setValue('peoplePerBus', fallbackValue)
      setCurrentPeoplePerBus(fallbackValue)
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('cart_people_per_bus', fallbackValue.toString())
      }
    }
  }, [reset, setValue])

  // Load Leaflet dynamically when needed
  useEffect(() => {
    if (isMapOpen && !leafletLoaded && !L) {
      const loadLeaflet = async () => {
        try {
          // Load Leaflet CSS
          const linkElement = document.createElement('link')
          linkElement.rel = 'stylesheet'
          linkElement.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
          document.head.appendChild(linkElement)

          // Import Leaflet dynamically
          const leaflet = await import('leaflet')
          L = leaflet.default
          setLeafletLoaded(true)
        } catch (error) {
          console.error('Error loading Leaflet:', error)
        }
      }

      loadLeaflet()
    }
  }, [isMapOpen, leafletLoaded])

  // Function to get user's current position
  const getUserLocation = () => {
    return new Promise<{ lat: number; lng: number }>((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'))
        return
      }

      setIsRequestingLocation(true)

      navigator.geolocation.getCurrentPosition(
        (position) => {
          setIsRequestingLocation(false)
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
        },
        (error) => {
          setIsRequestingLocation(false)
          console.error('Error getting location:', error)
          reject(error)
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      )
    })
  }

  // Function to geocode address from form inputs
  const geocodeFormAddress = async (addressInput?: {
    street?: string
    city?: string
    postal?: string
  }): Promise<{ lat: number; lng: number } | null> => {
    // Use provided address or current form values
    const address = addressInput || formValues

    // Only attempt geocoding if we have at least street and city
    if (!address.street || !address.city) return null

    const query = `${address.street}, ${address.postal || ''} ${address.city}`.trim()

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`
      )
      const data = await response.json()

      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
        }
      }
      return null
    } catch (error) {
      console.error('Geocoding error:', error)
      return null
    }
  }

  // Check if manual address changes have been made and update map accordingly
  const checkAndUpdateMapForManualChanges = async () => {
    if (!mapInstanceRef.current || !markerRef.current) return

    // Use the hasManualChanges flag
    if (hasManualChanges.current) {
      // Try to geocode the new address
      const newPosition = await geocodeFormAddress()
      if (newPosition) {
        // Update the map position and marker
        mapInstanceRef.current.setView([newPosition.lat, newPosition.lng], 15)
        markerRef.current.setLatLng([newPosition.lat, newPosition.lng])

        // Save coordinates to form
        setValue('coordinates', newPosition)
        setLastMapPosition(newPosition)

        // Reset the manual changes flag
        hasManualChanges.current = false

        // Update previous form values
        previousFormValues.current = {
          street: formValues.street,
          city: formValues.city,
          postal: formValues.postal,
        }

        return true
      } else {
        // Reset the flag even if geocoding failed
        hasManualChanges.current = false
      }
    }

    return false
  }

  // Cleanup map when component unmounts or map is closed
  const cleanupMap = () => {
    // Only cleanup if we have a map instance
    if (mapInstanceRef.current) {
      // Save the current position before unmounting (if marker exists)
      if (markerRef.current) {
        try {
          const position = markerRef.current.getLatLng()
          setLastMapPosition({
            lat: position.lat,
            lng: position.lng,
          })
        } catch (error) {
          console.warn('Could not get marker position during cleanup')
        }
      }

      // Remove event listeners
      try {
        if (markerRef.current) {
          markerRef.current.off('dragend')
          markerRef.current.remove()
        }
        mapInstanceRef.current.off('click')
        mapInstanceRef.current.remove()
      } catch (error) {
        console.warn('Error during map cleanup:', error)
      }

      // Reset refs
      mapInstanceRef.current = null
      markerRef.current = null
      mapInitializedRef.current = false
    }
  }

  // Initialize map when popup opens
  useEffect(() => {
    // If map is not open, clean up and return
    if (!isMapOpen) {
      // Let's not clean up immediately to avoid conflicts with animation
      if (mapInstanceRef.current) {
        // Delay cleanup to avoid issues during transitions
        const timer = setTimeout(() => {
          cleanupMap()
        }, 300)
        return () => clearTimeout(timer)
      }
      return
    }

    // If no map container, Leaflet not loaded, or map is already initialized, return
    if (!mapRef.current || !L || !leafletLoaded || mapInitializedRef.current) {
      // If map is already initialized, check for manual changes
      if (mapInitializedRef.current && mapInstanceRef.current) {
        checkAndUpdateMapForManualChanges()
      }
      return
    }

    // Initialize map with a slight delay to ensure the container is visible
    const initMapTimer = setTimeout(async () => {
      if (!mapRef.current || !L) {
        console.error('Leaflet not loaded or container not available')
        return
      }

      try {
        // Create map centered on default position initially
        const map = L.map(mapRef.current).setView([lastMapPosition.lat, lastMapPosition.lng], 13)
        mapInstanceRef.current = map
        mapInitializedRef.current = true

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map)

        // Add marker for selection
        markerRef.current = L.marker([lastMapPosition.lat, lastMapPosition.lng], { draggable: true }).addTo(map)

        // Handle marker drag events
        markerRef.current.on('dragend', handleMarkerDrag)

        // Handle map click events
        map.on('click', handleMapClick)

        // Refresh map size after rendering
        map.invalidateSize()

        // Check if we should update the map based on manual input changes
        const manuallyUpdated = await checkAndUpdateMapForManualChanges()

        // If no manual update was needed, proceed with normal initialization
        if (!manuallyUpdated) {
          // SCENARIO 1: If we have valid coordinates in form data, center there
          if (formValues.coordinates) {
            map.setView([formValues.coordinates.lat, formValues.coordinates.lng], 15)
            markerRef.current.setLatLng([formValues.coordinates.lat, formValues.coordinates.lng])
          }
          // SCENARIO 2: If we have address info but no coordinates, try to geocode it
          else if (formValues.street && formValues.city) {
            const position = await geocodeFormAddress()
            if (position) {
              map.setView([position.lat, position.lng], 15)
              markerRef.current.setLatLng([position.lat, position.lng])

              // Save these coordinates
              setValue('coordinates', position)
              setLastMapPosition(position)
            } else {
              // SCENARIO 3: If geocoding fails, use last known position or try geolocation
              tryToUseGeolocation(map)
            }
          }
          // SCENARIO 3: No form values, try to get user location
          else {
            tryToUseGeolocation(map)
          }
        }
      } catch (error) {
        console.error('Error initializing map:', error)
        mapInitializedRef.current = false
      }
    }, 200) // Slightly longer delay to ensure DOM is ready

    // Helper function for geolocation scenarios
    const tryToUseGeolocation = async (map: any) => {
      try {
        const position = await getUserLocation()
        if (!map || !markerRef.current) return

        map.setView([position.lat, position.lng], 16)
        markerRef.current.setLatLng([position.lat, position.lng])
        setLastMapPosition(position)

        // Also update coordinates in form
        setValue('coordinates', position)

        // Get address details for this location
        const address = await reverseGeocode(position.lat, position.lng)
        if (address) {
          setValue('street', address.street || '', { shouldValidate: true })
          setValue('postal', address.postal || '', { shouldValidate: true })
          setValue('city', address.city || '', { shouldValidate: true })

          if (address.street) clearErrors('street')
          if (address.postal) clearErrors('postal')
          if (address.city) clearErrors('city')

          // Update previous form values
          previousFormValues.current = {
            street: address.street,
            city: address.city,
            postal: address.postal,
          }
        }
      } catch (error) {
        console.warn('Could not get user location:', error)

        // Check if map and marker still exist
        if (!map || !markerRef.current) return

        // Fall back to last known position or default
        map.setView([lastMapPosition.lat, lastMapPosition.lng], 13)
        markerRef.current.setLatLng([lastMapPosition.lat, lastMapPosition.lng])
      }
    }

    // Cleanup on effect tear-down
    return () => {
      clearTimeout(initMapTimer)
    }
  }, [
    isMapOpen,
    leafletLoaded,
    formValues.coordinates,
    formValues.street,
    formValues.city,
    formValues.postal,
    setValue,
    clearErrors,
    lastMapPosition,
  ])

  // Effect to handle map resize and refresh when popup is visible
  useEffect(() => {
    if (isMapOpen && mapInstanceRef.current) {
      // Short delay before refresh to ensure the popup is fully visible
      const refreshTimer = setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize()

          // Also reposition the popup
          positionMapPopup()

          // Check if we need to update map based on manual input
          checkAndUpdateMapForManualChanges()
        }
      }, 100)

      return () => clearTimeout(refreshTimer)
    }
  }, [isMapOpen])

  // Clean up the map when component unmounts
  useEffect(() => {
    return () => {
      cleanupMap()
    }
  }, [])

  // Handle marker drag to update form
  const handleMarkerDrag = async (e: any) => {
    if (!markerRef.current) return

    try {
      const marker = e.target
      const position = marker.getLatLng()

      // Update coordinates in form
      setValue('coordinates', {
        lat: position.lat,
        lng: position.lng,
      })

      // Save current position
      setLastMapPosition({
        lat: position.lat,
        lng: position.lng,
      })

      // Reverse geocode to get address
      const address = await reverseGeocode(position.lat, position.lng)
      if (address) {
        // Update form fields with the new values
        setValue('street', address.street || '', { shouldValidate: true })
        setValue('postal', address.postal || '', { shouldValidate: true })
        setValue('city', address.city || '', { shouldValidate: true })

        // Clear any validation errors for the updated fields
        if (address.street) clearErrors('street')
        if (address.postal) clearErrors('postal')
        if (address.city) clearErrors('city')

        // Update previous form values
        previousFormValues.current = {
          street: address.street,
          city: address.city,
          postal: address.postal,
        }

        // Reset manual changes flag since we've updated via map
        hasManualChanges.current = false
      }
    } catch (error) {
      console.error('Error handling marker drag:', error)
    }
  }

  // Handle map click to move marker
  const handleMapClick = async (e: any) => {
    if (!markerRef.current) return

    try {
      const { lat, lng } = e.latlng
      markerRef.current.setLatLng([lat, lng])

      // Update coordinates in form
      setValue('coordinates', {
        lat: lat,
        lng: lng,
      })

      // Save current position
      setLastMapPosition({ lat, lng })

      // Reverse geocode to get address
      const address = await reverseGeocode(lat, lng)
      if (address) {
        // Update form fields with the new values
        setValue('street', address.street || '', { shouldValidate: true })
        setValue('postal', address.postal || '', { shouldValidate: true })
        setValue('city', address.city || '', { shouldValidate: true })

        // Clear any validation errors for the updated fields
        if (address.street) clearErrors('street')
        if (address.postal) clearErrors('postal')
        if (address.city) clearErrors('city')

        // Update previous form values
        previousFormValues.current = {
          street: address.street,
          city: address.city,
          postal: address.postal,
        }

        // Reset manual changes flag since we've updated via map
        hasManualChanges.current = false
      }
    } catch (error) {
      console.error('Error handling map click:', error)
    }
  }

  // Reverse geocoding function
  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
      )
      const data = await response.json()

      return {
        street: `${data.address.road || ''} ${data.address.house_number || ''}`.trim(),
        postal: data.address.postcode || '',
        city: data.address.city || data.address.town || data.address.village || '',
      }
    } catch (error) {
      console.error('Geocoding error:', error)
      return null
    }
  }

  // Handle search
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim() || !mapInstanceRef.current || !markerRef.current) return

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`
      )
      const data = await response.json()

      if (data && data.length > 0) {
        const { lat, lon } = data[0]
        const position = {
          lat: parseFloat(lat),
          lng: parseFloat(lon),
        }

        // Update map view and marker
        mapInstanceRef.current.setView([position.lat, position.lng], 16)
        markerRef.current.setLatLng([position.lat, position.lng])

        // Save current position
        setLastMapPosition(position)

        // Get address details and update form
        const address = await reverseGeocode(position.lat, position.lng)
        if (address) {
          setValue('street', address.street || '', { shouldValidate: true })
          setValue('postal', address.postal || '', { shouldValidate: true })
          setValue('city', address.city || '', { shouldValidate: true })
          setValue('coordinates', position)

          // Clear any validation errors for the updated fields
          if (address.street) clearErrors('street')
          if (address.postal) clearErrors('postal')
          if (address.city) clearErrors('city')

          // Update previous form values
          previousFormValues.current = {
            street: address.street,
            city: address.city,
            postal: address.postal,
          }

          // Reset manual changes flag since we've updated via map
          hasManualChanges.current = false
        }
      }
    } catch (error) {
      console.error('Search error:', error)
    }
  }

  // Toggle map popup
  const toggleMap = () => {
    setIsMapOpen(!isMapOpen)
  }

  // Function to position map popup relative to street input
  const positionMapPopup = () => {
    const streetInput = document.querySelector('input[name="street"]') as HTMLInputElement
    const mapPopup = mapPopupRef.current

    if (streetInput && mapPopup) {
      const inputRect = streetInput.getBoundingClientRect()
      const viewportWidth = window.innerWidth

      // Check if we're in mobile breakpoint (739px = 46.1875rem)
      const isMobileBreakpoint = viewportWidth <= 739

      // Set width first
      mapPopup.style.width = `${Math.max(inputRect.width, 350)}px`
      mapPopup.style.left = `${inputRect.left}px`

      if (isMobileBreakpoint) {
        // On mobile (≤739px): Always position above
        // Get actual height to position correctly above
        const actualPopupHeight = mapPopup.offsetHeight || 350 // fallback height
        mapPopup.style.top = `${inputRect.top - actualPopupHeight - 8}px`
        mapPopup.style.marginTop = '0'
      } else {
        // On desktop (>739px): Always position below
        mapPopup.style.top = `${inputRect.bottom + 8}px`
        mapPopup.style.marginTop = '0'
      }
    }
  }

  // Position map popup when it opens and handle repositioning
  useEffect(() => {
    if (isMapOpen) {
      // Initial positioning
      requestAnimationFrame(() => {
        positionMapPopup()
      })

      // Add event listeners for repositioning
      const handleReposition = () => {
        if (isMapOpen) {
          positionMapPopup()
        }
      }

      window.addEventListener('resize', handleReposition)
      window.addEventListener('scroll', handleReposition, true) // Use capture to catch all scroll events

      return () => {
        window.removeEventListener('resize', handleReposition)
        window.removeEventListener('scroll', handleReposition, true)
      }
    }
  }, [isMapOpen])

  // Handle clicks outside the map popup
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!isMapOpen) return

      // Get references to the elements
      const mapPopup = mapPopupRef.current
      const toggleButton = document.querySelector(`.${styles.mapToggleButton}`)

      // Check if click is inside map popup or on the toggle button
      const isClickInsidePopup = mapPopup && mapPopup.contains(event.target as Node)
      const isClickOnToggleButton = toggleButton && toggleButton.contains(event.target as Node)

      // Only close if click is outside both the popup and toggle button
      if (!isClickInsidePopup && !isClickOnToggleButton) {
        setIsMapOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isMapOpen])

  // Set up event listeners for popup close to reset form
  useEffect(() => {
    // Find the close button in the popup
    const popupCloseBtn = document.querySelector('.address-popup .CloseButton')
    const popupContent = document.querySelector('.address-popup')

    const handleClose = () => {
      // Reset form to original values when popup is closed without submitting
      reset(originalValues)
    }

    // Listen for close button click
    if (popupCloseBtn) {
      popupCloseBtn.addEventListener('click', handleClose)
    }

    // Listen for click outside (assuming your popup system has a click-outside-to-close feature)
    const handleClickOutside = (e: MouseEvent) => {
      if (
        popupContent &&
        !popupContent.contains(e.target as Node) &&
        e.target &&
        !(e.target as Element).closest('.address-popup')
      ) {
        handleClose()
      }
    }

    document.addEventListener('click', handleClickOutside)

    return () => {
      if (popupCloseBtn) {
        popupCloseBtn.removeEventListener('click', handleClose)
      }
      document.removeEventListener('click', handleClickOutside)
    }
  }, [reset, originalValues])

  // Watch for participant count changes and re-validate peoplePerBus
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleStorageChange = () => {
      // Trigger validation for peoplePerBus field when participant count changes
      trigger('peoplePerBus')
    }

    const handleTransportPeopleSync = (event: CustomEvent) => {
      const { newPeoplePerBus, participantCount } = event.detail

      // Update the peoplePerBus field to match the synced value
      setValue('peoplePerBus', newPeoplePerBus, { shouldValidate: true })

      // Update state to force re-render
      setCurrentPeoplePerBus(newPeoplePerBus)

      // Also store in localStorage
      localStorage.setItem('cart_people_per_bus', newPeoplePerBus.toString())

      // Clear any validation errors
      clearErrors('peoplePerBus')

      // Force update the input element directly as a fallback
      setTimeout(() => {
        const peoplePerBusInput = document.querySelector('input[name="peoplePerBus"]') as HTMLInputElement
        if (peoplePerBusInput && peoplePerBusInput.value !== newPeoplePerBus.toString()) {
          peoplePerBusInput.value = newPeoplePerBus.toString()

          // Trigger input event to notify React Hook Form
          const inputEvent = new Event('input', { bubbles: true })
          peoplePerBusInput.dispatchEvent(inputEvent)
        }
      }, 100)
    }

    // Listen for storage changes
    window.addEventListener('storage', handleStorageChange)

    // Also listen for custom events (in case participant count is updated within same page)
    window.addEventListener('cart-participant-updated', handleStorageChange)

    // Listen for transport people sync events
    window.addEventListener('transport-people-synced', handleTransportPeopleSync as EventListener)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('cart-participant-updated', handleStorageChange)
      window.removeEventListener('transport-people-synced', handleTransportPeopleSync as EventListener)
    }
  }, [trigger, setValue, clearErrors])

  const submitHandler = (data: FormValues) => {
    // Validate peoplePerBus against current participant count
    let participantCount = 0
    if (typeof window !== 'undefined' && window.localStorage) {
      const savedCount = localStorage.getItem('cart_participant_count')
      participantCount = savedCount ? parseInt(savedCount) : 0
    }

    if (data.peoplePerBus > participantCount && participantCount > 0) {
      // Show error - this shouldn't happen due to form validation, but safety check
      console.error('People per bus cannot exceed participant count')
      return
    }

    const addressData = {
      street: data.street.trim(),
      postal: data.postal.trim(),
      city: data.city.trim(),
      peoplePerBus: data.peoplePerBus,
      coordinates: data.coordinates,
    }

    // Update original values on successful submit
    setOriginalValues(addressData)

    // Save data to localStorage (only in browser)
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('transport_address', JSON.stringify(addressData))
      // Also store peoplePerBus separately for easier access
      localStorage.setItem('cart_people_per_bus', data.peoplePerBus.toString())
    }

    // Update previous form values
    previousFormValues.current = {
      street: addressData.street,
      city: addressData.city,
      postal: addressData.postal,
    }

    // Dispatch custom event for CartPage.astro to handle
    const event = new CustomEvent('address-form-submitted', {
      detail: { data: addressData },
      bubbles: true,
    })
    document.dispatchEvent(event)

    // Call onSubmit prop if provided
    if (onSubmit) {
      onSubmit(addressData)
    }

    // Try to close the popup
    try {
      const popup = document.querySelector('.address-popup')
      if (popup) {
        const closeButton = popup.querySelector('.CloseButton')
        if (closeButton && closeButton instanceof HTMLElement) {
          closeButton.click()
        }
      }
    } catch (error) {
      console.error('Error closing popup:', error)
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit(submitHandler)}>
      <div className={styles.inputWithMap}>
        <Input
          register={register('street', {
            required: translations.streetRequired,
          })}
          label={translations.street}
          placeholder={translations.streetPlaceholder}
          errors={errors}
        />
        <button
          type="button"
          className={styles.mapToggleButton}
          onClick={toggleMap}
          title={translations.pickFromMap || 'Pick from map'}
          aria-label={translations.pickFromMap || 'Pick from map'}
          data-tooltip={translations.mapTooltip || 'Open map to select location'}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none">
            <path
              fill="#F67258"
              d="M8.5 4.054a.5.5 0 1 0 1 0h-1Zm1-3.2a.5.5 0 0 0-1 0h1Zm-1 16a.5.5 0 1 0 1 0h-1Zm1-3.2a.5.5 0 0 0-1 0h1Zm4.3-5.3a.5.5 0 0 0 0 1v-1Zm3.2 1a.5.5 0 0 0 0-1v1Zm-16-1a.5.5 0 1 0 0 1v-1Zm3.2 1a.5.5 0 0 0 0-1v1Zm10.7-.5a5.9 5.9 0 0 1-5.9 5.9v1a6.9 6.9 0 0 0 6.9-6.9h-1Zm-5.9 5.9a5.9 5.9 0 0 1-5.9-5.9h-1a6.9 6.9 0 0 0 6.9 6.9v-1Zm-5.9-5.9a5.9 5.9 0 0 1 5.9-5.9v-1a6.9 6.9 0 0 0-6.9 6.9h1Zm5.9-5.9a5.9 5.9 0 0 1 5.9 5.9h1a6.9 6.9 0 0 0-6.9-6.9v1Zm.5 1.1v-3.2h-1v3.2h1Zm0 12.8v-3.2h-1v3.2h1Zm4.3-7.5H17v-1h-3.2v1Zm-12.8 0h3.2v-1H1v1Zm9.9-.5a1.9 1.9 0 0 1-1.9 1.9v1a2.9 2.9 0 0 0 2.9-2.9h-1Zm-1.9 1.9a1.9 1.9 0 0 1-1.9-1.9h-1a2.9 2.9 0 0 0 2.9 2.9v-1Zm-1.9-1.9c0-1.05.85-1.9 1.9-1.9v-1a2.9 2.9 0 0 0-2.9 2.9h1Zm1.9-1.9c1.05 0 1.9.85 1.9 1.9h1a2.9 2.9 0 0 0-2.9-2.9v1Z"
            />
          </svg>
        </button>
        {isMapOpen && (
          <div className={styles.mapPickerPopup} role="dialog" aria-modal="true" ref={mapPopupRef}>
            {isRequestingLocation && (
              <div className={styles.locationRequest}>
                <p>Requesting your location...</p>
              </div>
            )}
            <div className={styles.mapContainer} ref={mapRef}></div>

            <div className={styles.searchBox}>
              <input
                type="text"
                placeholder={translations.searchLocation || 'Search for location...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
              />
              <button type="button" onClick={handleSearch}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
                  <path
                    fill="currentColor"
                    fill-rule="evenodd"
                    d="M6.667 2.333a4.333 4.333 0 1 0 0 8.667 4.333 4.333 0 0 0 0-8.667ZM1 6.667a5.667 5.667 0 1 1 11.333 0A5.667 5.667 0 0 1 1 6.667Z"
                    clip-rule="evenodd"
                  />
                  <path
                    fill="currentColor"
                    fill-rule="evenodd"
                    d="M10.138 10.138a.667.667 0 0 1 .943 0l3.585 3.585a.667.667 0 1 1-.943.943l-3.585-3.585a.667.667 0 0 1 0-.943Z"
                    clip-rule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Map popup */}

      <div className={styles.row} style={{ marginBottom: errors.postal ? '1.5rem' : '0' }}>
        <Input
          register={register('postal', {
            required: translations.postalRequired,
            pattern: {
              value: /^\d{2}-\d{3}$/,
              message: translations.postalPattern,
            },
          })}
          label={translations.postal}
          placeholder={translations.postalPlaceholder}
          errors={errors}
        />

        <Input
          register={register('city', {
            required: translations.cityRequired,
          })}
          label={translations.city}
          errors={errors}
        />
      </div>

      <Input
        register={register('peoplePerBus', {
          required: translations.peoplePerBusRequired,
          min: {
            value: 1,
            message: 'Minimalna liczba osób to 1',
          },
          validate: (value) => {
            const numValue = parseInt(value.toString())
            if (!Number.isInteger(numValue)) return 'Wprowadź liczbę całkowitą'
            if (numValue < 1) return 'Minimalna liczba osób to 1'

            // Get current participant count at validation time
            const currentMaxParticipants = getMaxParticipants()
            if (numValue > currentMaxParticipants) {
              return translations.peoplePerBusMax
            }
            return true
          },
        })}
        label={translations.peoplePerBus}
        type="number"
        placeholder={translations.peoplePerBusPlaceholder}
        errors={errors}
        min="1"
        step="1"
      />

      <Button type="submit" className={styles.submit}>
        {translations.submit}
      </Button>
    </form>
  )
}
