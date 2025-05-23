import React, { useState, useRef, useEffect } from 'react'
import Button from '@/src/components/ui/Button'
import styles from './styles.module.scss'

// Leaflet types
declare global {
  interface Window {
    L: any
  }
}

interface ActivityAddressFormProps {
  translations: {
    street: string
    streetPlaceholder: string
    streetRequired: string
    postal: string
    postalPlaceholder: string
    postalRequired: string
    postalPattern: string
    city: string
    cityRequired: string
    submit: string
    pickFromMap: string
    searchLocation: string
    confirm: string
    cancel: string
    mapTooltip: string
  }
}

interface FormData {
  street: string
  postal: string
  city: string
  coordinates?: { lat: number; lng: number }
}

export default function ActivityAddressForm({ translations }: ActivityAddressFormProps) {
  const [formData, setFormData] = useState<FormData>({
    street: '',
    postal: '',
    city: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isMapOpen, setIsMapOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isRequestingLocation, setIsRequestingLocation] = useState(false)

  const mapRef = useRef<HTMLDivElement>(null)
  const mapPopupRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markerRef = useRef<any>(null)

  // Load Leaflet when component mounts
  useEffect(() => {
    const loadLeaflet = async () => {
      if (typeof window === 'undefined' || window.L) return

      // Load Leaflet CSS
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)

      // Load Leaflet JS
      const script = document.createElement('script')
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
      script.onload = () => {}
      document.head.appendChild(script)
    }

    loadLeaflet()
  }, [])

  // Initialize map when popup opens
  useEffect(() => {
    if (isMapOpen && !mapInstanceRef.current && window.L && mapRef.current) {
      // Add a delay to ensure the popup is fully rendered
      const initTimer = setTimeout(() => {
        initializeMap()
      }, 150)

      return () => clearTimeout(initTimer)
    }
  }, [isMapOpen])

  // Effect to handle map resize and refresh when popup is visible
  useEffect(() => {
    if (isMapOpen && mapInstanceRef.current) {
      // Multiple refresh attempts with different timings
      const refreshTimers = [
        setTimeout(() => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.invalidateSize(true)
          }
        }, 100),
        setTimeout(() => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.invalidateSize(true)
          }
        }, 300),
        setTimeout(() => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.invalidateSize(true)
          }
        }, 500),
      ]

      return () => {
        refreshTimers.forEach((timer) => clearTimeout(timer))
      }
    }
  }, [isMapOpen])

  // Clean up the map when component unmounts or popup closes
  useEffect(() => {
    if (!isMapOpen && mapInstanceRef.current) {
      // Clean up when popup closes
      cleanupMap()
    }

    return () => {
      cleanupMap()
    }
  }, [isMapOpen])

  // Reset function to clear all form state
  const resetForm = () => {
    setFormData({
      street: '',
      postal: '',
      city: '',
    })
    setErrors({})
    setIsMapOpen(false)
    setSearchQuery('')
    setIsRequestingLocation(false)

    // Clean up map if it exists
    if (mapInstanceRef.current) {
      cleanupMap()
    }
  }

  // Listen for reset events from parent
  useEffect(() => {
    const handleReset = () => {
      resetForm()
    }

    document.addEventListener('activity-address-reset', handleReset)
    return () => {
      document.removeEventListener('activity-address-reset', handleReset)
    }
  }, [])

  const initializeMap = async () => {
    if (!window.L || !mapRef.current) return

    try {
      // Ensure the container is visible and has dimensions
      const container = mapRef.current
      const rect = container.getBoundingClientRect()

      if (rect.width === 0 || rect.height === 0) {
        setTimeout(() => initializeMap(), 100)
        return
      }

      // Default to Warsaw center
      const defaultCenter = { lat: 52.2297, lng: 21.0122 }

      // Create map
      mapInstanceRef.current = window.L.map(mapRef.current, {
        zoomControl: true,
        scrollWheelZoom: true,
        doubleClickZoom: true,
        boxZoom: true,
        keyboard: true,
        dragging: true,
        touchZoom: true,
      }).setView([defaultCenter.lat, defaultCenter.lng], 13)

      // Add tile layer
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(mapInstanceRef.current)

      // Create draggable marker
      markerRef.current = window.L.marker([defaultCenter.lat, defaultCenter.lng], {
        draggable: true,
      }).addTo(mapInstanceRef.current)

      // Add event listeners
      markerRef.current.on('dragend', handleMarkerDrag)
      mapInstanceRef.current.on('click', handleMapClick)

      // Force invalidate size after everything is set up
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize(true)
        }
      }, 50)
    } catch (error) {
      console.error('Error initializing map:', error)
    }
  }

  const cleanupMap = () => {
    try {
      // Remove marker event listeners first
      if (markerRef.current) {
        markerRef.current.off('dragend', handleMarkerDrag)
        markerRef.current = null
      }

      // Remove map event listeners and destroy map
      if (mapInstanceRef.current) {
        mapInstanceRef.current.off('click', handleMapClick)
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }

      // Clear the container
      if (mapRef.current) {
        mapRef.current.innerHTML = ''
      }
    } catch (error) {
      console.error('Error cleaning up map:', error)
      // Force cleanup even if there's an error
      mapInstanceRef.current = null
      markerRef.current = null
    }
  }

  // Handle marker drag to update form
  const handleMarkerDrag = async (e: any) => {
    if (!markerRef.current) return

    try {
      const marker = e.target
      const position = marker.getLatLng()

      // Reverse geocode to get address
      const address = await reverseGeocode(position.lat, position.lng)
      if (address) {
        setFormData((prev) => ({
          ...prev,
          street: address.street || '',
          postal: address.postal || '',
          city: address.city || '',
          coordinates: { lat: position.lat, lng: position.lng },
        }))

        // Clear errors
        setErrors({})
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

      // Reverse geocode to get address
      const address = await reverseGeocode(lat, lng)
      if (address) {
        setFormData((prev) => ({
          ...prev,
          street: address.street || '',
          postal: address.postal || '',
          city: address.city || '',
          coordinates: { lat, lng },
        }))

        // Clear errors
        setErrors({})
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

        // Get address details and update form
        const address = await reverseGeocode(position.lat, position.lng)
        if (address) {
          setFormData((prev) => ({
            ...prev,
            street: address.street || '',
            postal: address.postal || '',
            city: address.city || '',
            coordinates: position,
          }))

          // Clear errors
          setErrors({})
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

  // Handle clicks outside the map popup
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!isMapOpen) return

      const mapPopup = mapPopupRef.current
      const toggleButton = document.querySelector(`.${styles.mapToggleButton}`)

      const isClickInsidePopup = mapPopup && mapPopup.contains(event.target as Node)
      const isClickOnToggleButton = toggleButton && toggleButton.contains(event.target as Node)

      if (!isClickInsidePopup && !isClickOnToggleButton) {
        setIsMapOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isMapOpen])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.street.trim()) {
      newErrors.street = translations.streetRequired
    }
    if (!formData.postal.trim()) {
      newErrors.postal = translations.postalRequired
    } else if (!/^\d{2}-\d{3}$/.test(formData.postal)) {
      newErrors.postal = translations.postalPattern
    }
    if (!formData.city.trim()) {
      newErrors.city = translations.cityRequired
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: keyof FormData, value: string) => {
    if (field === 'postal') {
      // Auto-format postal code
      let formatted = value.replace(/\D/g, '')
      if (formatted.length > 2) {
        formatted = formatted.slice(0, 2) + '-' + formatted.slice(2, 5)
      }
      value = formatted
    }

    setFormData((prev) => ({ ...prev, [field]: value }))

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }))
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    // Dispatch custom event with form data
    const event = new CustomEvent('activity-address-submitted', {
      detail: { data: formData },
    })
    document.dispatchEvent(event)
  }

  return (
    <div className={styles.container}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.inputWithMap}>
          <div className={styles.field}>
            <label htmlFor="activity-street" className={styles.label}>
              {translations.street}
            </label>
            <div className={`${styles.inputWrapper} ${errors.street ? styles.error : ''}`}>
              <div className={styles.gradient}></div>
              <input
                id="activity-street"
                type="text"
                value={formData.street}
                onChange={(e) => handleInputChange('street', e.target.value)}
                placeholder={translations.streetPlaceholder}
                className={styles.input}
              />
            </div>
            {errors.street && <span className={styles.errorText}>{errors.street}</span>}
          </div>

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
                      fillRule="evenodd"
                      d="M6.667 2.333a4.333 4.333 0 1 0 0 8.667 4.333 4.333 0 0 0 0-8.667ZM1 6.667a5.667 5.667 0 1 1 11.333 0A5.667 5.667 0 0 1 1 6.667Z"
                      clipRule="evenodd"
                    />
                    <path
                      fill="currentColor"
                      fillRule="evenodd"
                      d="M10.138 10.138a.667.667 0 0 1 .943 0l3.585 3.585a.667.667 0 1 1-.943.943l-3.585-3.585a.667.667 0 0 1 0-.943Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label htmlFor="activity-postal" className={styles.label}>
              {translations.postal}
            </label>
            <div className={`${styles.inputWrapper} ${errors.postal ? styles.error : ''}`}>
              <div className={styles.gradient}></div>
              <input
                id="activity-postal"
                type="text"
                value={formData.postal}
                onChange={(e) => handleInputChange('postal', e.target.value)}
                placeholder={translations.postalPlaceholder}
                className={styles.input}
                maxLength={6}
              />
            </div>
            {errors.postal && <span className={styles.errorText}>{errors.postal}</span>}
          </div>

          <div className={styles.field}>
            <label htmlFor="activity-city" className={styles.label}>
              {translations.city}
            </label>
            <div className={`${styles.inputWrapper} ${errors.city ? styles.error : ''}`}>
              <div className={styles.gradient}></div>
              <input
                id="activity-city"
                type="text"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                className={styles.input}
              />
            </div>
            {errors.city && <span className={styles.errorText}>{errors.city}</span>}
          </div>
        </div>

        <Button type="submit" theme="primary" shade="dark" className={styles.submitButton}>
          {translations.submit}
        </Button>
      </form>
    </div>
  )
}
