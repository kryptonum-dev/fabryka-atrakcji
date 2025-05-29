import type { APIRoute } from 'astro'
import type { AddonItem, AddonProps, BaseActivityProps, BaseHotelProps, ExtraItem } from '@/src/global/types'
import { client } from '@/src/utils/sanity.fetch'

// Define QuoteItem interface to fix TypeScript errors
interface QuoteItem {
  type: string
  _type?: string
  _key?: string
  hotels?: Array<{
    itemId: string
    name: string
    slug: string
    maxPeople: number
    pricing: any
    addons: any[]
    gastronomy?: Array<{
      type: string
      count: number
      name: string
      options?: any
      pricing: any
    }>
  }>
  activities?: Array<any>
  transport?: any
  extras?: Array<any>
  totalPrice: number
  totalNettoPrice?: number
}

/**
 * Calculate the price for a hotel based on its pricing model and participant count
 *
 * @param hotel Hotel object with pricing information
 * @param participantCount Number of participants
 * @returns Object with calculated price and flags
 */
function calculateHotelPrice(
  hotel: {
    pricing: {
      pricingVisible?: boolean
      hasFixedGroupPrice?: boolean
      groupPrice?: number
      groupPeopleCount?: number
      pricePerPerson: number
    }
    maxPeople?: {
      overnight: number
    }
  },
  participantCount: number
) {
  // Initialize result
  const result = {
    bruttoPrice: 0,
    nettoPrice: 0,
    exceedsMaxPeople: false,
    calculatedFor: participantCount,
    pricingNotVisible: false,
    pricingModel: 'individual' as string,
  }

  // Check if pricing is visible
  if (hotel.pricing.pricingVisible === false) {
    result.pricingNotVisible = true
    result.pricingModel = 'individual'
    // Return early with 0 prices for non-visible pricing
    return result
  }

  // Check if participants exceed max people
  let effectiveParticipantCount = participantCount

  if (hotel.maxPeople?.overnight && participantCount > hotel.maxPeople.overnight) {
    result.exceedsMaxPeople = true
    // Use the max people count for calculation instead
    effectiveParticipantCount = hotel.maxPeople.overnight
    result.calculatedFor = effectiveParticipantCount
  }

  // Calculate price based on pricing model
  if (hotel.pricing.hasFixedGroupPrice && hotel.pricing.groupPrice && hotel.pricing.groupPeopleCount) {
    // Fixed group price + additional per person
    result.pricingModel = 'threshold'
    if (effectiveParticipantCount <= hotel.pricing.groupPeopleCount) {
      // Just the group price (netto)
      result.nettoPrice = hotel.pricing.groupPrice
    } else {
      // Group price + additional people at per-person rate (netto)
      const additionalPeople = effectiveParticipantCount - hotel.pricing.groupPeopleCount
      result.nettoPrice = hotel.pricing.groupPrice + additionalPeople * hotel.pricing.pricePerPerson
    }
  } else {
    // Simple per person pricing (netto)
    result.pricingModel = 'per_unit'
    result.nettoPrice = effectiveParticipantCount * hotel.pricing.pricePerPerson
  }

  // Calculate brutto price (netto * 1.23)
  result.bruttoPrice = Math.round(result.nettoPrice * 1.23)

  return result
}

/**
 * Calculate the price for an activity based on its pricing model and participant count
 *
 * @param activity Activity object with pricing information
 * @param participantCount Number of participants
 * @returns Object with calculated price
 */
function calculateActivityPrice(
  activity: {
    pricing: {
      basePrice: number
      maxParticipants: number
      additionalPersonPrice: number
    }
    participantsCount?: {
      min: number
      max: number
    }
  },
  participantCount: number
) {
  // Initialize result
  const result = {
    bruttoPrice: 0,
    nettoPrice: 0,
    exceedsMaxPeople: false,
    calculatedFor: participantCount,
    belowMinPeople: false,
  }

  // Check if we have valid pricing data
  if (!activity.pricing || typeof activity.pricing.basePrice !== 'number') {
    console.error('Invalid activity pricing data:', activity.pricing)
    return result
  }

  // Check if participants are within activity limits
  let effectiveParticipantCount = participantCount

  // Check minimum participants requirement
  if (activity.participantsCount?.min && participantCount < activity.participantsCount.min) {
    result.belowMinPeople = true
    // Use minimum required participants for calculation
    effectiveParticipantCount = activity.participantsCount.min
    result.calculatedFor = effectiveParticipantCount
  }

  // Check maximum participants limit
  if (activity.participantsCount?.max && participantCount > activity.participantsCount.max) {
    result.exceedsMaxPeople = true
    // Use maximum allowed participants for calculation
    effectiveParticipantCount = activity.participantsCount.max
    result.calculatedFor = effectiveParticipantCount
  }

  // Calculate price based on threshold model
  if (effectiveParticipantCount <= activity.pricing.maxParticipants) {
    // Base price covers all participants (netto)
    result.nettoPrice = activity.pricing.basePrice
  } else {
    // Base price + additional per person pricing (netto)
    const additionalPeople = effectiveParticipantCount - activity.pricing.maxParticipants
    result.nettoPrice = activity.pricing.basePrice + additionalPeople * activity.pricing.additionalPersonPrice
  }

  // Calculate brutto price (netto * 1.23)
  result.bruttoPrice = Math.round(result.nettoPrice * 1.23)

  return result
}

/**
 * Calculate the price for an addon based on its pricing model, count, and participant count
 *
 * @param addon The addon item with pricing information
 * @param addonCount Number of units of this addon (for per_unit pricing)
 * @param participantCount Total number of participants (for threshold pricing)
 * @returns Object with calculated price and details
 */
function calculateAddonPrice(
  addon: AddonItem,
  addonCount: number = 1,
  participantCount: number = 0
): {
  bruttoPrice: number
  nettoPrice: number
  priceDetails: {
    unitPrice?: number
    units?: number
    basePrice?: number
    additionalUnits?: number
    additionalUnitPrice?: number
  }
  pricingModel: string
} {
  // Default result structure
  const result = {
    bruttoPrice: 0,
    nettoPrice: 0,
    priceDetails: {
      unitPrice: undefined,
      units: undefined,
      basePrice: undefined,
      additionalUnits: undefined,
      additionalUnitPrice: undefined,
    } as {
      unitPrice?: number
      units?: number
      basePrice?: number
      additionalUnits?: number
      additionalUnitPrice?: number
    },
    pricingModel: addon.pricing.type,
  }

  // Calculate based on pricing type
  switch (addon.pricing.type) {
    // Fixed price (same price regardless of count or participants)
    case 'fixed':
      if (typeof addon.pricing.fixedPrice === 'number') {
        result.nettoPrice = addon.pricing.fixedPrice
        result.priceDetails = {
          unitPrice: addon.pricing.fixedPrice,
          units: 1,
        }
      }
      break

    // Per unit pricing (like "per hour" or "per vehicle")
    case 'per_unit':
      if (addon.pricing.perUnit && typeof addon.pricing.perUnit.price === 'number') {
        const unitPrice = addon.pricing.perUnit.price
        // If the add-on has count capability, use the specified count
        let units = addon.pricing.perUnit.hasCount ? addonCount : 1

        // Special handling for per-person addons
        // If the unit is "osoba" (person), multiply by participant count as well
        const isPerPersonAddon = addon.pricing.perUnit.singular === 'osoba'
        if (isPerPersonAddon) {
          units = units * participantCount
        }

        result.nettoPrice = unitPrice * units
        result.priceDetails = {
          unitPrice,
          units,
        }
      }
      break

    // Threshold pricing (base price for X people, then additional per person)
    case 'threshold':
      if (addon.pricing.threshold) {
        const { basePrice, maxUnits, additionalPrice } = addon.pricing.threshold

        // Start with base price (netto)
        result.nettoPrice = basePrice
        result.priceDetails = {
          basePrice,
          units: Math.min(participantCount, maxUnits),
        }

        // If participant count exceeds threshold, add additional pricing (netto)
        if (participantCount > maxUnits) {
          const additionalUnits = participantCount - maxUnits
          const additionalCost = additionalUnits * additionalPrice

          result.nettoPrice += additionalCost
          result.priceDetails.additionalUnits = additionalUnits
          result.priceDetails.additionalUnitPrice = additionalPrice
        }
      }
      break

    // Individual pricing (custom quote needed)
    case 'individual':
      // For individual pricing, we can't calculate automatically
      result.nettoPrice = 0
      result.priceDetails = {
        unitPrice: 0,
        units: 0,
      }
      break

    default:
      // Capitalize first letter for any other types
      result.nettoPrice = 0
      result.priceDetails = {
        unitPrice: 0,
        units: 0,
      }
      break
  }

  // Calculate brutto price (netto * 1.23)
  result.bruttoPrice = Math.round(result.nettoPrice * 1.23)

  return result
}

/**
 * Calculate the price for a global extra item (non-transport)
 *
 * @param extra Extra item with pricing information
 * @param participantCount Number of participants
 * @returns Object with calculated price and details
 */
function calculateExtraPrice(
  extra: ExtraItem & {
    id?: string
    count?: number
  },
  participantCount: number
) {
  // Initialize result
  const result = {
    totalPrice: 0,
    nettoTotalPrice: 0,
    priceDetails: {} as Record<string, any>,
    pricingModel: '',
    isTransport: false,
  }

  // Check if this is a transport item (to be handled separately)
  if (extra.id === 'transport' || extra._key === 'transport') {
    result.isTransport = true
    return result
  }

  // Extract pricing information
  const pricing = extra.pricing
  if (!pricing) return result

  // Set pricing model
  result.pricingModel = pricing.type

  // Calculate based on pricing type
  switch (pricing.type) {
    case 'fixed':
      // Simple fixed price (netto)
      if (typeof pricing.fixedPrice === 'number') {
        result.nettoTotalPrice = pricing.fixedPrice
        result.priceDetails = {
          unitPrice: pricing.fixedPrice,
          units: 1,
        }
      }
      break

    case 'per_unit':
      // Per unit pricing (like "per hour" or "per person")
      if ((pricing as any).perUnit && typeof (pricing as any).perUnit.price === 'number') {
        const perUnit = (pricing as any).perUnit
        const unitPrice = perUnit.price
        // If the add-on has count capability, use the specified count
        let units = perUnit.hasCount ? extra.count || 1 : 1

        // Special handling for per-person addons
        // If the unit is "osoba" (person), multiply by participant count as well
        const isPerPersonAddon = perUnit.singular === 'osoba'
        if (isPerPersonAddon) {
          units = units * participantCount
        }

        result.nettoTotalPrice = unitPrice * units
        result.priceDetails = {
          unitPrice,
          units,
        }
      }
      break

    case 'threshold':
      // Threshold pricing based on participant count
      if (pricing.threshold) {
        const { basePrice, maxUnits, additionalPrice } = pricing.threshold

        // Start with base price (netto)
        result.nettoTotalPrice = basePrice
        result.priceDetails = {
          basePrice,
          maxUnits,
          participants: participantCount,
          calculatedFor: Math.min(participantCount, maxUnits),
        }

        // If participant count exceeds threshold, add additional pricing (netto)
        if (participantCount > maxUnits) {
          const additionalUnits = participantCount - maxUnits
          const additionalCost = additionalUnits * additionalPrice

          result.nettoTotalPrice += additionalCost
          result.priceDetails.additionalUnits = additionalUnits
          result.priceDetails.additionalUnitPrice = additionalPrice
          result.priceDetails.additionalCost = additionalCost
        }
      }
      break
  }

  // Calculate totalPrice (brutto) from nettoTotalPrice
  result.totalPrice = Math.round(result.nettoTotalPrice * 1.23)

  return result
}

/**
 * Geocode an address into lat/lng coordinates using OSM Nominatim.
 *
 * @param address Address object with street, postal, city properties
 * @returns Promise resolving to coordinates or null if geocoding fails
 */
async function geocodeAddress(address: {
  street: string
  postal: string
  city: string
}): Promise<{ lat: number; lng: number } | null> {
  // Only attempt geocoding if we have at least street and city
  if (!address.street || !address.city) {
    console.warn('Insufficient address information for geocoding:', address)
    return null
  }

  const query = `${address.street}, ${address.postal || ''} ${address.city}`.trim()

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      query
    )}&countrycodes=pl&limit=1`

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Fabryka-Atrakcji/1.0', // Proper user-agent as required by Nominatim
        'Accept-Language': 'pl', // Prioritize Polish results
      },
    })

    if (!response.ok) {
      throw new Error(`Geocoding request failed with status: ${response.status}`)
    }

    const data = await response.json()

    if (data && data.length > 0) {
      const result = {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
      }
      return result
    }

    console.warn('No geocoding results found for address:', query)
    return null
  } catch (error) {
    console.error('Geocoding error:', error)
    return null
  }
}

/**
 * Calculate transport price based on distance, bus capacity, and number of buses
 *
 * @param params Object containing pricing configuration and calculation parameters
 * @returns Object with calculated transport pricing details
 */
function calculateTransportPrice(params: {
  distance: number
  basePrice: number
  maxKilometers: number
  pricePerKm: number
  numberOfBuses: number
  peoplePerBus: number
}): {
  basePrice: number
  distancePrice: number
  totalPrice: number
  nettoTotalPrice: number
  pricePerKm: number
  numberOfBuses: number
  peoplePerBus: number
  maxKilometers: number
} {
  const { distance, basePrice, maxKilometers, pricePerKm, numberOfBuses, peoplePerBus } = params

  // Calculate price per single bus (netto)
  let singleBusNettoPrice = basePrice

  // Add distance pricing if distance exceeds maxKilometers (netto)
  let distancePrice = 0
  if (distance > maxKilometers) {
    const extraKm = distance - maxKilometers
    distancePrice = extraKm * pricePerKm
    singleBusNettoPrice += distancePrice
  }

  // Calculate total netto price for all buses
  const totalNettoPrice = Math.round(singleBusNettoPrice * numberOfBuses)
  // Calculate total brutto price (netto * 1.23)
  const totalBruttoPrice = Math.round(totalNettoPrice * 1.23)

  return {
    basePrice,
    distancePrice,
    totalPrice: totalBruttoPrice,
    nettoTotalPrice: totalNettoPrice,
    pricePerKm,
    numberOfBuses,
    peoplePerBus,
    maxKilometers,
  }
}

/**
 * Calculate distance between two points using the Haversine formula.
 *
 * @param lat1 Latitude of first point
 * @param lng1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lng2 Longitude of second point
 * @returns Distance in kilometers
 */
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  // Convert degrees to radians
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180

  const R = 6371 // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1)
  const dLng = toRadians(lng2 - lng1)

  // Haversine formula
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c

  // Round to nearest kilometer
  return Math.round(distance)
}

// Helper to handle date strings from DatePicker (already in YYYY-MM-DD format)
// or convert ISO strings to Sanity date format (YYYY-MM-DD)
const formatDateForSanity = (dateString: string): string => {
  try {
    // If it's already in YYYY-MM-DD format, just return it
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString
    }

    // Otherwise, parse the ISO string and format it
    const date = new Date(dateString)

    // Extract date components directly (avoids timezone issues)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0') // Add 1 because months are 0-indexed
    const day = String(date.getDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
  } catch (e) {
    console.error('Error formatting date:', e)
    return new Date().toISOString().split('T')[0]
  }
}

// Generate a unique key for Sanity array items
const generateKey = (): string => {
  return Math.random().toString(36).substring(2, 10)
}

// Generate a 7-character uppercase alphanumeric ID for the quote
const generateQuoteId = (): string => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 7; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  return result
}

function combineGastronomyItems(
  gastronomyItems: Array<{
    id: string
    type: 'lunch' | 'supper' | 'coffee-break' | 'grill' | 'open-bar'
    count: number
    options?: {
      level?: 'standard' | 'premium' | 'luxury'
      style?: 'buffet' | 'menu'
    }
  }>
): Array<{
  type: 'lunch' | 'supper' | 'coffee-break' | 'grill' | 'open-bar'
  count: number
  options?: {
    level?: 'standard' | 'premium' | 'luxury'
    style?: 'buffet' | 'menu'
  }
}> {
  const combinedItems = new Map<
    string,
    {
      type: 'lunch' | 'supper' | 'coffee-break' | 'grill' | 'open-bar'
      count: number
      options?: {
        level?: 'standard' | 'premium' | 'luxury'
        style?: 'buffet' | 'menu'
      }
    }
  >()

  gastronomyItems.forEach((item, index) => {
    // Create a unique key based on type and options
    const optionsKey = item.options ? `${item.options.level || ''}-${item.options.style || ''}` : ''
    const uniqueKey = `${item.type}-${optionsKey}`

    if (combinedItems.has(uniqueKey)) {
      const existing = combinedItems.get(uniqueKey)!
      existing.count += item.count
    } else {
      combinedItems.set(uniqueKey, {
        type: item.type,
        count: item.count,
        options: item.options,
      })
    }
  })

  const result = Array.from(combinedItems.values())

  return result
}

function calculateGastronomyPricing(
  gastronomyItems: Array<{
    type: 'lunch' | 'supper' | 'coffee-break' | 'grill' | 'open-bar'
    count: number
    options?: {
      level?: 'standard' | 'premium' | 'luxury'
      style?: 'buffet' | 'menu'
    }
  }>,
  hotelGastronomy: any,
  participantCount: number
): Array<{
  type: 'lunch' | 'supper' | 'coffee-break' | 'grill' | 'open-bar'
  count: number
  name: string
  options?: {
    level?: 'standard' | 'premium' | 'luxury'
    style?: 'buffet' | 'menu'
  }
  pricing: {
    totalPrice: number
    nettoTotalPrice: number
    pricingNotVisible?: boolean
    unavailable?: boolean
  }
}> {
  return gastronomyItems.map((item) => {
    let name: string = item.type
    let totalPrice = 0
    let nettoTotalPrice = 0
    let pricingNotVisible = false
    let unavailable = false

    // Map gastronomy type to Sanity field name
    let serviceFieldName = ''
    switch (item.type) {
      case 'lunch':
        serviceFieldName = 'lunch'
        break
      case 'supper':
        serviceFieldName = 'supper'
        break
      case 'coffee-break':
        serviceFieldName = 'coffeeBreak'
        break
      case 'grill':
        serviceFieldName = 'grill'
        break
      case 'open-bar':
        serviceFieldName = 'openBar'
        break
    }

    // Get the service data from hotel gastronomy
    const serviceData = hotelGastronomy?.[serviceFieldName]

    if (!serviceData) {
      unavailable = true
    } else {
      // Handle simple services (coffee-break, grill) with availability field
      if (serviceData.availability) {
        switch (serviceData.availability) {
          case 'disabled':
            unavailable = true
            break
          case 'priceHidden':
            pricingNotVisible = true
            break
          case 'withPrice':
            const servicePrice = serviceData.pricePerService || 0
            nettoTotalPrice = servicePrice * item.count
            totalPrice = Math.round(nettoTotalPrice * 1.23)
            break
        }
      }
      // Handle complex services (lunch, supper, openBar) with options array
      else if (Array.isArray(serviceData)) {
        // Find matching option based on level and style
        const matchingOption = serviceData.find((option: any) => {
          const levelMatch = !item.options?.level || option.level === item.options.level
          const styleMatch = !item.options?.style || option.style === item.options.style
          return levelMatch && styleMatch
        })

        if (matchingOption) {
          if (matchingOption.hidePricing) {
            pricingNotVisible = true
          } else {
            const optionPrice = matchingOption.pricePerService || 0
            nettoTotalPrice = optionPrice * item.count
            totalPrice = Math.round(nettoTotalPrice * 1.23)
          }
        } else {
          unavailable = true
        }
      } else {
        unavailable = true
      }
    }

    // Format the name properly
    switch (item.type) {
      case 'lunch':
        name = 'Obiad'
        if (item.options) {
          const details = []
          if (item.options.level) details.push(item.options.level)
          if (item.options.style) details.push(item.options.style)
          if (details.length > 0) {
            name += ` (${details.join(', ')})`
          }
        }
        break
      case 'supper':
        name = 'Kolacja'
        if (item.options) {
          const details = []
          if (item.options.level) details.push(item.options.level)
          if (item.options.style) details.push(item.options.style)
          if (details.length > 0) {
            name += ` (${details.join(', ')})`
          }
        }
        break
      case 'coffee-break':
        name = 'Przerwa kawowa'
        break
      case 'grill':
        name = 'Grill'
        break
      case 'open-bar':
        name = 'Open bar'
        if (item.options && item.options.level) {
          name += ` (${item.options.level})`
        }
        break
      default:
        name = (item.type as string).charAt(0).toUpperCase() + (item.type as string).slice(1)
        break
    }

    const result = {
      type: item.type,
      count: item.count,
      name,
      options: item.options,
      pricing: {
        totalPrice,
        nettoTotalPrice,
        pricingNotVisible,
        unavailable,
      },
    }

    return result
  })
}

export const POST: APIRoute = async ({ request }) => {
  try {
    // Parse the incoming request body
    const data = await request.json()

    const {
      hotels,
      activities,
      extras,
      language,
      selectedDates,
      participantCount,
      activityAddress,
      gastronomy,
    }: {
      hotels: BaseHotelProps[]
      activities: BaseActivityProps[]
      extras: (ExtraItem & {
        id?: string
        count?: number
        address?: {
          street: string
          postal: string
          city: string
          lat?: number
          lng?: number
          peoplePerBus?: number
        }
      })[]
      participantCount: number
      language: string
      selectedDates: Array<string | { start: string; end: string }>
      activityAddress?: {
        street: string
        postal: string
        city: string
        lat?: number
        lng?: number
      }
      gastronomy?: Array<{
        id: string
        type: 'lunch' | 'supper' | 'coffee-break' | 'grill' | 'open-bar'
        count: number
        options?: {
          level?: 'standard' | 'premium' | 'luxury'
          style?: 'buffet' | 'menu'
        }
      }>
    } = data

    // Array to store all quote items
    const quoteItems = []

    // Combine gastronomy items if present
    let combinedGastronomy: Array<{
      type: 'lunch' | 'supper' | 'coffee-break' | 'grill' | 'open-bar'
      count: number
      options?: {
        level?: 'standard' | 'premium' | 'luxury'
        style?: 'buffet' | 'menu'
      }
    }> = []

    if (gastronomy && gastronomy.length > 0) {
      combinedGastronomy = combineGastronomyItems(gastronomy)
    }

    // Process transport extras if present to handle distance calculations
    let transportExtra = extras.find((extra) => extra.id === 'transport')
    let transportPickupCoordinates = null
    let transportGeocodingFailed = false
    let transportConfig = null
    let peoplePerBus = 0
    let numberOfBuses = 0

    // Fetch transport configuration from Sanity if transport is requested
    if (transportExtra) {
      try {
        transportConfig = await client.fetch(
          `
          *[_type == "Cart_Page" && language == $language][0] {
            orderAddons {
              transportOptions {
                pricing {
                  basePrice,
                  maxKilometers,
                  pricePerKm,
                  maxPeoplePerBus
                }
              }
            }
          }
        `,
          { language }
        )

        // Extract peoplePerBus from address data
        if (transportExtra.address && transportExtra.address.peoplePerBus) {
          peoplePerBus = transportExtra.address.peoplePerBus
        } else {
          // Fallback to participant count if no peoplePerBus specified
          peoplePerBus = participantCount
        }

        // Calculate number of buses needed
        const maxPeoplePerBus = transportConfig?.orderAddons?.transportOptions?.pricing?.maxPeoplePerBus || 50

        // Ensure peoplePerBus doesn't exceed maxPeoplePerBus
        peoplePerBus = Math.min(peoplePerBus, maxPeoplePerBus)

        // Calculate number of buses (minimum 1 if transport is selected)
        numberOfBuses = Math.max(1, Math.ceil(participantCount / peoplePerBus))
      } catch (error) {
        console.error('Error fetching transport config:', error)
        // Fallback values
        peoplePerBus = participantCount
        numberOfBuses = 1
      }
    }

    if (transportExtra && transportExtra.address) {
      // Get pickup coordinates from the address
      if (transportExtra.address.lat && transportExtra.address.lng) {
        // Coordinates already present (from map selection)
        transportPickupCoordinates = {
          lat: transportExtra.address.lat,
          lng: transportExtra.address.lng,
        }
      } else {
        // Need to geocode the address
        transportPickupCoordinates = await geocodeAddress({
          street: transportExtra.address.street,
          postal: transportExtra.address.postal,
          city: transportExtra.address.city,
        })

        if (transportPickupCoordinates) {
          // Save the coordinates for later use
          transportExtra.address.lat = transportPickupCoordinates.lat
          transportExtra.address.lng = transportPickupCoordinates.lng
        } else {
          transportGeocodingFailed = true
        }
      }
    }

    // Process each hotel if present
    if (hotels && hotels.length > 0) {
      for (const hotel of hotels) {
        // Calculate hotel base price
        const hotelPriceResult = calculateHotelPrice(hotel, participantCount)

        // Get hotel coordinates (for transport distance calculation if needed)
        let hotelCoordinates = null
        let hotelGeocodingFailed = false
        let hotelHasAddress = hotel.address ? true : false

        if (hotelHasAddress && hotel.address) {
          // Try to geocode the hotel address
          hotelCoordinates = await geocodeAddress({
            street: hotel.address.street.replace('ul.', ''), // Remove "ul." prefix if present
            postal: hotel.address.postalCode,
            city: hotel.address.city,
          })

          if (!hotelCoordinates) {
            // Geocoding failed
            hotelGeocodingFailed = true
            console.warn(`Failed to geocode hotel address for: ${hotel.name}`)
          }
        }

        // Process hotel addons if any
        const hotelAddonsResults = []
        if (hotel.addons && Array.isArray(hotel.addons)) {
          for (const addon of hotel.addons) {
            const addonResult = calculateAddonPrice(addon, addon.count || 1, participantCount)
            hotelAddonsResults.push({
              id: addon.id,
              name: addon.name,
              count: addon.count || 1,
              pricing: addonResult,
            })
          }
        }

        // Create hotel quote item
        const hotelQuoteItem = {
          type: 'hotel',
          hotels: [
            {
              itemId: hotel._id || hotel.id,
              name: hotel.name,
              slug: hotel.slug,
              maxPeople: hotel.maxPeople?.overnight || 0,
              pricing: {
                finalPrice: hotelPriceResult.bruttoPrice,
                nettoFinalPrice: hotelPriceResult.nettoPrice,
                participantCount: hotelPriceResult.calculatedFor,
                exceedsMaxPeople: hotelPriceResult.exceedsMaxPeople,
                pricingModel: hotelPriceResult.pricingModel,
                pricingNotVisible: hotelPriceResult.pricingNotVisible,
              },
              addons: hotelAddonsResults,
              gastronomy:
                combinedGastronomy.length > 0 && hotel.gastronomy
                  ? calculateGastronomyPricing(combinedGastronomy, hotel.gastronomy, participantCount)
                  : [],
            },
          ],
          activities: [] as any[],
          transport: null as any,
          extras: [] as any[], // Add empty extras array for each hotel
          totalPrice: 0, // Will be calculated after all components are added
        }

        // Process activities for this hotel if any
        const hotelActivitiesResults = []
        if (activities && activities.length > 0) {
          for (const activity of activities) {
            // Calculate activity price
            const activityPriceResult = calculateActivityPrice(activity, participantCount)

            // Process activity addons if any
            const activityAddonsResults = []
            if (activity.addons && Array.isArray(activity.addons)) {
              for (const addon of activity.addons) {
                const addonResult = calculateAddonPrice(addon, addon.count || 1, participantCount)
                activityAddonsResults.push({
                  id: addon.id,
                  name: addon.name,
                  count: addon.count || 1,
                  pricing: addonResult,
                })
              }
            }

            hotelActivitiesResults.push({
              itemId: activity._id || activity.id,
              name: activity.name,
              slug: activity.slug,
              participantsCount: activity.participantsCount
                ? {
                    min: activity.participantsCount.min || 0,
                    max: activity.participantsCount.max || 0,
                  }
                : null,
              pricing: {
                finalPrice: activityPriceResult.bruttoPrice,
                nettoFinalPrice: activityPriceResult.nettoPrice,
                participantCount: activityPriceResult.calculatedFor,
                exceedsMaxPeople: activityPriceResult.exceedsMaxPeople,
                belowMinPeople: activityPriceResult.belowMinPeople,
              },
              addons: activityAddonsResults,
            })
          }
        }

        // Add activities to hotel quote item
        hotelQuoteItem.activities = hotelActivitiesResults

        // Calculate transport distance from pickup to hotel if both coordinates available
        if (transportPickupCoordinates && hotelCoordinates && transportExtra) {
          const distance = calculateDistance(
            transportPickupCoordinates.lat,
            transportPickupCoordinates.lng,
            hotelCoordinates.lat,
            hotelCoordinates.lng
          )

          // Check if pickup and destination are at the same location (within 0.001 degrees ≈ 100m)
          const latDiff = Math.abs(transportPickupCoordinates.lat - hotelCoordinates.lat)
          const lngDiff = Math.abs(transportPickupCoordinates.lng - hotelCoordinates.lng)
          const isSameLocation = latDiff < 0.001 && lngDiff < 0.001

          // If same location, don't add transport (no charge for 0km transport)
          if (isSameLocation) {
            // Don't set transport - user is already at the destination
            hotelQuoteItem.transport = null
          } else {
            // Different locations - add normal transport
            hotelQuoteItem.transport = {
              itemId: 'transport',
              distance: distance,
              pickupCoordinates: transportPickupCoordinates,
              destinationCoordinates: hotelCoordinates,
              peoplePerBus: peoplePerBus,
              numberOfBuses: numberOfBuses,
            }

            // Calculate transport price using new bus-based system
            if (transportConfig?.orderAddons?.transportOptions?.pricing) {
              const pricing = transportConfig.orderAddons.transportOptions.pricing

              const transportPricing = calculateTransportPrice({
                distance: distance,
                basePrice: pricing.basePrice || 0,
                maxKilometers: pricing.maxKilometers || 0,
                pricePerKm: pricing.pricePerKm || 0,
                numberOfBuses: numberOfBuses,
                peoplePerBus: peoplePerBus,
              })

              hotelQuoteItem.transport.pricing = transportPricing
            }
          }
        } else if (transportExtra) {
          // Handle different cases when we can't calculate proper distance
          if (transportGeocodingFailed && hotelCoordinates) {
            // Transport address geocoding failed but hotel coordinates are present
            hotelQuoteItem.transport = {
              id: 'transport',
              transportAddressNotFound: true,
              destinationCoordinates: hotelCoordinates,
            }
          } else if (!transportPickupCoordinates && hotelCoordinates) {
            // No transport address provided but hotel coordinates are present
            hotelQuoteItem.transport = {
              id: 'transport',
              noTransportAddress: true,
              destinationCoordinates: hotelCoordinates,
            }
          } else if (!hotelHasAddress) {
            // No address provided for hotel
            hotelQuoteItem.transport = {
              itemId: 'transport',
              hotelNoAddress: true,
              pickupCoordinates: transportPickupCoordinates,
            }
          } else if (hotelGeocodingFailed && transportPickupCoordinates) {
            // Address provided but geocoding failed for hotel
            hotelQuoteItem.transport = {
              itemId: 'transport',
              hotelAddressNotFound: true,
              pickupCoordinates: transportPickupCoordinates,
            }
          } else if (hotelGeocodingFailed && transportGeocodingFailed) {
            // Both addresses failed geocoding
            hotelQuoteItem.transport = {
              itemId: 'transport',
              bothAddressesNotFound: true,
            }
          }

          // Calculate base transport price without distance
          if (transportConfig?.orderAddons?.transportOptions?.pricing && hotelQuoteItem.transport) {
            const pricing = transportConfig.orderAddons.transportOptions.pricing

            // Calculate transport price with 0 distance (base price only)
            const transportPricing = calculateTransportPrice({
              distance: 0,
              basePrice: pricing.basePrice || 0,
              maxKilometers: pricing.maxKilometers || 0,
              pricePerKm: pricing.pricePerKm || 0,
              numberOfBuses: numberOfBuses,
              peoplePerBus: peoplePerBus,
            })

            hotelQuoteItem.transport.pricing = transportPricing
            hotelQuoteItem.transport.peoplePerBus = peoplePerBus
            hotelQuoteItem.transport.numberOfBuses = numberOfBuses
          }
        }

        // Add hotel item to quote items
        quoteItems.push(hotelQuoteItem)
      }
    } else if (activities && activities.length > 0) {
      // No hotels, process activities only

      // NEW: Fetch activity location data from Sanity to determine address handling
      const activitiesWithLocation = await Promise.all(
        activities.map(async (activity) => {
          try {
            const locationData = await client.fetch(
              `*[_type == "Activities_Collection" && _id == $activityId][0] {
                location {
                  isNationwide,
                  address {
                    street,
                    postalCode,
                    city,
                    voivodeship
                  }
                }
              }`,
              { activityId: activity._id || activity.id }
            )

            return {
              ...activity,
              location: locationData?.location || null,
            }
          } catch (error) {
            console.error(`Error fetching location for activity ${activity._id || activity.id}:`, error)
            return {
              ...activity,
              location: null,
            }
          }
        })
      )

      for (const activity of activitiesWithLocation) {
        // Calculate activity price
        const activityPriceResult = calculateActivityPrice(activity, participantCount)

        // Process activity addons if any
        const activityAddonsResults = []
        if (activity.addons && Array.isArray(activity.addons)) {
          for (const addon of activity.addons) {
            const addonResult = calculateAddonPrice(addon, addon.count || 1, participantCount)
            activityAddonsResults.push({
              id: addon.id,
              name: addon.name,
              count: addon.count || 1,
              pricing: addonResult,
            })
          }
        }

        // Create activity quote item
        const activityQuoteItem = {
          type: 'activity',
          hotels: [] as any[],
          activities: [
            {
              itemId: activity._id || activity.id,
              name: activity.name,
              slug: activity.slug,
              participantsCount: activity.participantsCount
                ? {
                    min: activity.participantsCount.min || 0,
                    max: activity.participantsCount.max || 0,
                  }
                : null,
              pricing: {
                finalPrice: activityPriceResult.bruttoPrice,
                nettoFinalPrice: activityPriceResult.nettoPrice,
                participantCount: activityPriceResult.calculatedFor,
                exceedsMaxPeople: activityPriceResult.exceedsMaxPeople,
                belowMinPeople: activityPriceResult.belowMinPeople,
              },
              addons: activityAddonsResults,
            },
          ],
          transport: null as any,
          extras: [] as any[], // Add empty extras array for each activity
          totalPrice: 0, // Will be properly calculated later
        }

        // Calculate activity quote item's initial price (activity + its addons)
        let initialActivityPrice = activityPriceResult.bruttoPrice

        // Add addon prices
        for (const addon of activityAddonsResults) {
          initialActivityPrice += addon.pricing.bruttoPrice || 0
        }

        // Set the initial total price
        activityQuoteItem.totalPrice = initialActivityPrice

        // NEW: Handle transport for activities with proper address logic
        if (transportExtra && transportPickupCoordinates) {
          // Determine which address to use for the activity destination
          let activityDestinationCoordinates = null
          let activityGeocodingFailed = false
          let usingUserSelectedAddress = false
          let activityAddressSource = 'none'

          if (activity.location && !activity.location.isNationwide && activity.location.address) {
            // Activity has a dedicated address - use it
            activityAddressSource = 'dedicated'

            const addressToGeocode = {
              street: activity.location.address.street,
              postal: activity.location.address.postalCode,
              city: activity.location.address.city,
            }

            activityDestinationCoordinates = await geocodeAddress(addressToGeocode)

            if (!activityDestinationCoordinates) {
              activityGeocodingFailed = true
              console.warn(`Failed to geocode activity address for: ${activity.name}`)
            }
          } else if (activity.location && activity.location.isNationwide && activityAddress) {
            // Activity is nationwide and user provided address - use user's address
            activityAddressSource = 'user_selected'
            usingUserSelectedAddress = true

            if (activityAddress.lat && activityAddress.lng) {
              // Coordinates already present (from map selection)
              activityDestinationCoordinates = {
                lat: activityAddress.lat,
                lng: activityAddress.lng,
              }
            } else {
              // Need to geocode the user-provided address
              const addressToGeocode = {
                street: activityAddress.street,
                postal: activityAddress.postal,
                city: activityAddress.city,
              }

              activityDestinationCoordinates = await geocodeAddress(addressToGeocode)

              if (!activityDestinationCoordinates) {
                activityGeocodingFailed = true
                console.warn('Failed to geocode user-selected activity address')
              }
            }
          }

          // Calculate distance and set transport data
          if (activityDestinationCoordinates) {
            // We have both pickup and destination coordinates - calculate distance
            const distance = calculateDistance(
              transportPickupCoordinates.lat,
              transportPickupCoordinates.lng,
              activityDestinationCoordinates.lat,
              activityDestinationCoordinates.lng
            )

            // Check if pickup and destination are at the same location (within 0.001 degrees ≈ 100m)
            const latDiff = Math.abs(transportPickupCoordinates.lat - activityDestinationCoordinates.lat)
            const lngDiff = Math.abs(transportPickupCoordinates.lng - activityDestinationCoordinates.lng)
            const isSameLocation = latDiff < 0.001 && lngDiff < 0.001

            // If same location, don't add transport (no charge for 0km transport)
            if (isSameLocation) {
              // Don't set transport - user is already at the destination
              activityQuoteItem.transport = null
            } else {
              // Different locations - add normal transport
              activityQuoteItem.transport = {
                itemId: 'transport',
                distance: distance,
                pickupCoordinates: transportPickupCoordinates,
                destinationCoordinates: activityDestinationCoordinates,
                peoplePerBus: peoplePerBus,
                numberOfBuses: numberOfBuses,
                activityAddressSource: activityAddressSource,
                usingUserSelectedAddress: usingUserSelectedAddress,
              }

              // Calculate transport price with distance
              if (transportConfig?.orderAddons?.transportOptions?.pricing) {
                const pricing = transportConfig.orderAddons.transportOptions.pricing

                const transportPricing = calculateTransportPrice({
                  distance: distance,
                  basePrice: pricing.basePrice || 0,
                  maxKilometers: pricing.maxKilometers || 0,
                  pricePerKm: pricing.pricePerKm || 0,
                  numberOfBuses: numberOfBuses,
                  peoplePerBus: peoplePerBus,
                })

                activityQuoteItem.transport.pricing = transportPricing
              }
            }
          } else {
            // Could not get destination coordinates - handle different error cases
            let transportFlags: any = {
              itemId: 'transport',
              peoplePerBus: peoplePerBus,
              numberOfBuses: numberOfBuses,
              pickupCoordinates: transportPickupCoordinates,
            }

            if (activityGeocodingFailed && activityAddressSource === 'dedicated') {
              transportFlags.activityAddressNotFound = true
            } else if (activityGeocodingFailed && activityAddressSource === 'user_selected') {
              transportFlags.userSelectedActivityAddressNotFound = true
            } else if (activity.location && activity.location.isNationwide && !activityAddress) {
              transportFlags.nationwideActivityNoUserAddress = true
            } else if (!activity.location) {
              transportFlags.activityNoAddress = true
            } else {
              // Fallback case
              transportFlags.activityNoAddress = true
            }

            activityQuoteItem.transport = transportFlags

            // Add base transport price even when we can't calculate distance
            if (transportConfig?.orderAddons?.transportOptions?.pricing) {
              const pricing = transportConfig.orderAddons.transportOptions.pricing

              const transportPricing = calculateTransportPrice({
                distance: 0,
                basePrice: pricing.basePrice || 0,
                maxKilometers: pricing.maxKilometers || 0,
                pricePerKm: pricing.pricePerKm || 0,
                numberOfBuses: numberOfBuses,
                peoplePerBus: peoplePerBus,
              })

              activityQuoteItem.transport.pricing = transportPricing
            }
          }
        } else if (transportGeocodingFailed) {
          // Transport address geocoding failed
          activityQuoteItem.transport = {
            itemId: 'transport',
            transportAddressNotFound: true,
            peoplePerBus: peoplePerBus,
            numberOfBuses: numberOfBuses,
          }

          // Still add base transport price even when address lookup fails
          if (transportConfig?.orderAddons?.transportOptions?.pricing) {
            const pricing = transportConfig.orderAddons.transportOptions.pricing

            const transportPricing = calculateTransportPrice({
              distance: 0,
              basePrice: pricing.basePrice || 0,
              maxKilometers: pricing.maxKilometers || 0,
              pricePerKm: pricing.pricePerKm || 0,
              numberOfBuses: numberOfBuses,
              peoplePerBus: peoplePerBus,
            })

            activityQuoteItem.transport.pricing = transportPricing
          }
        } else if (transportExtra) {
          // Transport requested but no pickup address provided
          activityQuoteItem.transport = {
            itemId: 'transport',
            noTransportAddress: true,
            peoplePerBus: peoplePerBus,
            numberOfBuses: numberOfBuses,
          }

          // Add base transport price using new system
          if (transportConfig?.orderAddons?.transportOptions?.pricing) {
            const pricing = transportConfig.orderAddons.transportOptions.pricing

            const transportPricing = calculateTransportPrice({
              distance: 0,
              basePrice: pricing.basePrice || 0,
              maxKilometers: pricing.maxKilometers || 0,
              pricePerKm: pricing.pricePerKm || 0,
              numberOfBuses: numberOfBuses,
              peoplePerBus: peoplePerBus,
            })

            activityQuoteItem.transport.pricing = transportPricing
          }
        }

        // Add activity item to quote items
        quoteItems.push(activityQuoteItem)
      }
    }

    // Process global extras that are not transport
    if (extras && extras.length > 0) {
      for (const extra of extras) {
        // Skip transport as it's handled per hotel/activity
        if (extra.id === 'transport' || extra._key === 'transport') continue

        const extraPriceResult = calculateExtraPrice(extra, participantCount)
        const extraItem = {
          itemId: extra.id || extra._key,
          name: extra.name,
          count: extra.count || 1,
          pricing: extraPriceResult,
        }

        // Add extra to all quote items instead of a global extras array
        quoteItems.forEach((item) => {
          item.extras.push({ ...extraItem })
        })
      }
    }

    // Function to calculate total price for a quote item
    function calculateQuoteItemTotalPrice(quoteItem: QuoteItem) {
      let totalPrice = 0
      let totalNettoPrice = 0

      // Add hotel prices - check if hotels array exists and has items first
      if (quoteItem.hotels && quoteItem.hotels.length > 0) {
        for (const hotel of quoteItem.hotels) {
          totalPrice += hotel.pricing?.finalPrice || 0
          totalNettoPrice += hotel.pricing?.nettoFinalPrice || 0

          // Add hotel addon prices
          if (hotel.addons && hotel.addons.length > 0) {
            for (const addon of hotel.addons) {
              totalPrice += addon.pricing?.bruttoPrice || addon.pricing?.totalPrice || 0
              totalNettoPrice += addon.pricing?.nettoPrice || addon.pricing?.nettoTotalPrice || 0
            }
          }

          // Add hotel gastronomy prices
          if (hotel.gastronomy && hotel.gastronomy.length > 0) {
            for (const gastronomyItem of hotel.gastronomy) {
              totalPrice += gastronomyItem.pricing?.totalPrice || 0
              totalNettoPrice += gastronomyItem.pricing?.nettoTotalPrice || 0
            }
          }
        }
      }

      // Add activity prices - check if activities array exists and has items first
      if (quoteItem.activities && quoteItem.activities.length > 0) {
        for (const activity of quoteItem.activities) {
          totalPrice += activity.pricing?.finalPrice || 0
          totalNettoPrice += activity.pricing?.nettoFinalPrice || 0

          // Add activity addon prices
          if (activity.addons && activity.addons.length > 0) {
            for (const addon of activity.addons) {
              totalPrice += addon.pricing?.bruttoPrice || addon.pricing?.totalPrice || 0
              totalNettoPrice += addon.pricing?.nettoPrice || addon.pricing?.nettoTotalPrice || 0
            }
          }
        }
      }

      // Add transport price if present
      if (quoteItem.transport && quoteItem.transport.pricing) {
        totalPrice += quoteItem.transport.pricing.totalPrice || 0
        totalNettoPrice += quoteItem.transport.pricing.nettoTotalPrice || 0
      }

      // Add extras prices
      if (quoteItem.extras && quoteItem.extras.length > 0) {
        for (const extra of quoteItem.extras) {
          totalPrice += extra.pricing?.totalPrice || 0
          totalNettoPrice += extra.pricing?.nettoTotalPrice || 0
        }
      }

      // Set the calculated total price
      quoteItem.totalPrice = totalPrice

      // Use the sum of individual netto prices for accuracy
      quoteItem.totalNettoPrice = totalNettoPrice

      return quoteItem
    }

    // Calculate total price for each quote item
    quoteItems.forEach((item) => {
      calculateQuoteItemTotalPrice(item)
    })

    // Create final quote object
    const quoteObject: {
      quoteId: string
      createdAt: string
      participantCount: number
      selectedDates: Array<string | { start: string; end: string }>
      language: string
      items: any[]
      id?: string
    } = {
      quoteId: generateQuoteId(),
      createdAt: new Date().toISOString(),
      participantCount,
      selectedDates,
      language,
      items: quoteItems,
    }

    // Helper to convert booleans to strings for Sanity
    const toBoolString = (value: any): boolean => {
      return value === true || value === 'true' || value === 1
    }

    // Format the data for Sanity
    const sanityQuote = {
      _type: 'Quotes_Collection',
      quoteId: quoteObject.quoteId,
      createdAt: quoteObject.createdAt,
      language: quoteObject.language,
      participantCount: quoteObject.participantCount,
      selectedDates: Array.isArray(quoteObject.selectedDates)
        ? typeof quoteObject.selectedDates[0] === 'object'
          ? quoteObject.selectedDates.map((dateObj) => {
              const typedDateObj = dateObj as { start: string; end: string }
              return {
                _key: generateKey(),
                start: formatDateForSanity(typedDateObj.start),
                end: formatDateForSanity(typedDateObj.end),
              }
            })
          : [
              {
                // Convert array of strings to a single date range object
                _key: generateKey(),
                start: formatDateForSanity(String(quoteObject.selectedDates[0] || new Date().toISOString())),
                end: formatDateForSanity(
                  String(quoteObject.selectedDates[quoteObject.selectedDates.length - 1] || new Date().toISOString())
                ),
              },
            ]
        : [
            {
              _key: generateKey(),
              start: formatDateForSanity(new Date().toISOString()),
              end: formatDateForSanity(new Date().toISOString()),
            },
          ], // Fallback
      items: quoteObject.items.map((item) => {
        // For activity-only quotes, ensure totalPrice is set correctly
        if (
          item.type === 'activity' &&
          (!item.totalPrice || item.totalPrice === 0) &&
          item.activities &&
          item.activities.length > 0 &&
          item.activities[0].pricing &&
          item.activities[0].pricing.finalPrice
        ) {
          item.totalPrice = item.activities[0].pricing.finalPrice
        }

        // Clean up undefined values or complex data structures that might cause issues with Sanity
        return {
          _key: generateKey(),
          type: item.type,
          totalPrice: item.totalPrice || 0, // Ensure totalPrice has a fallback
          totalNettoPrice: item.totalNettoPrice || 0, // Add the netto price
          hotels: item.hotels.map((hotel: any) => ({
            _key: generateKey(),
            itemId: hotel.itemId,
            name: hotel.name,
            slug: hotel.slug,
            maxPeople: hotel.maxPeople || 0,
            pricing: {
              finalPrice: hotel.pricing.finalPrice || 0,
              nettoFinalPrice: hotel.pricing.nettoFinalPrice || 0,
              participantCount: hotel.pricing.participantCount || 0,
              exceedsMaxPeople: toBoolString(hotel.pricing.exceedsMaxPeople),
              pricingModel: hotel.pricing.pricingModel || 'per_unit',
              pricingNotVisible: toBoolString(hotel.pricing.pricingNotVisible),
            },
            addons: hotel.addons.map((addon: { name: string; count?: number; pricing: any }) => ({
              _key: generateKey(),
              name: addon.name,
              count: addon.count || 1,
              pricing: {
                totalPrice: addon.pricing.bruttoPrice || addon.pricing.totalPrice || 0,
                nettoTotalPrice: addon.pricing.nettoPrice || addon.pricing.nettoTotalPrice || 0,
                pricingModel: addon.pricing.pricingModel || 'fixed',
              },
            })),
            gastronomy:
              hotel.gastronomy?.map((gastronomyItem: any) => ({
                _key: generateKey(),
                type: gastronomyItem.type,
                count: gastronomyItem.count,
                name: gastronomyItem.name,
                options: gastronomyItem.options || null,
                pricing: {
                  totalPrice: gastronomyItem.pricing.totalPrice || 0,
                  nettoTotalPrice: gastronomyItem.pricing.nettoTotalPrice || 0,
                  pricingNotVisible: toBoolString(gastronomyItem.pricing.pricingNotVisible),
                  unavailable: toBoolString(gastronomyItem.pricing.unavailable),
                },
              })) || [],
          })),
          activities: item.activities.map((activity: any) => ({
            _key: generateKey(),
            itemId: activity.itemId,
            name: activity.name,
            slug: activity.slug,
            participantsCount: activity.participantsCount
              ? {
                  min: activity.participantsCount.min || 0,
                  max: activity.participantsCount.max || 0,
                }
              : null,
            pricing: {
              finalPrice: activity.pricing.finalPrice || 0,
              nettoFinalPrice: activity.pricing.nettoFinalPrice || 0,
              participantCount: activity.pricing.participantCount || 0,
              exceedsMaxPeople: toBoolString(activity.pricing.exceedsMaxPeople),
              belowMinPeople: toBoolString(activity.pricing.belowMinPeople),
            },
            addons: activity.addons.map((addon: { name: string; count?: number; pricing: any }) => ({
              _key: generateKey(),
              name: addon.name,
              count: addon.count || 1,
              pricing: {
                totalPrice: addon.pricing.bruttoPrice || addon.pricing.totalPrice || 0,
                nettoTotalPrice: addon.pricing.nettoPrice || addon.pricing.nettoTotalPrice || 0,
                pricingModel: addon.pricing.pricingModel || 'fixed',
              },
            })),
          })),
          transport: item.transport
            ? {
                distance: item.transport.distance || 0,
                peoplePerBus: item.transport.peoplePerBus || 0,
                numberOfBuses: item.transport.numberOfBuses || 0,
                maxKilometers: item.transport.pricing?.maxKilometers || 0,
                pricing: item.transport.pricing
                  ? {
                      basePrice: item.transport.pricing.basePrice || 0,
                      distancePrice: item.transport.pricing.distancePrice || 0,
                      totalPrice: item.transport.pricing.totalPrice || 0,
                      nettoTotalPrice:
                        item.transport.pricing.nettoTotalPrice ||
                        Math.round((item.transport.pricing.totalPrice || 0) / 1.23),
                      pricePerKm: item.transport.pricing.pricePerKm || 0,
                    }
                  : null,
                transportAddressNotFound: toBoolString(item.transport.transportAddressNotFound),
                noTransportAddress: toBoolString(item.transport.noTransportAddress),
                itemId: item.transport.itemId,
                hotelNoAddress: toBoolString(item.transport.hotelNoAddress),
                hotelAddressNotFound: toBoolString(item.transport.hotelAddressNotFound),
                bothAddressesNotFound: toBoolString(item.transport.bothAddressesNotFound),
                activityNoAddress: toBoolString(item.transport.activityNoAddress),
                activityAddressNotFound: toBoolString(item.transport.activityAddressNotFound),
                userSelectedActivityAddressNotFound: toBoolString(item.transport.userSelectedActivityAddressNotFound),
                nationwideActivityNoUserAddress: toBoolString(item.transport.nationwideActivityNoUserAddress),
                activityAddressSource: item.transport.activityAddressSource || null,
                usingUserSelectedAddress: toBoolString(item.transport.usingUserSelectedAddress),
              }
            : null,
          extras: item.extras.map((extra: any) => ({
            _key: generateKey(),
            name: extra.name,
            itemId: extra.itemId,
            count: extra.count || 1,
            pricing: {
              totalPrice: extra.pricing.totalPrice || extra.pricing.bruttoPrice || 0,
              nettoTotalPrice: extra.pricing.nettoTotalPrice || extra.pricing.nettoPrice || 0,
              pricingModel: extra.pricing.pricingModel || 'fixed',
              isTransport: toBoolString(extra.pricing.isTransport),
            },
          })),
        }
      }),
    }

    try {
      // Save to Sanity using the existing client
      const savedQuote = await client.create(sanityQuote)

      // Add the Sanity document ID to the quote object
      quoteObject.id = savedQuote._id

      // Return success response with the Sanity document ID
      return new Response(
        JSON.stringify({
          success: true,
          quoteId: quoteObject.quoteId,
          quote: quoteObject,
          sanityId: savedQuote._id,
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    } catch (sanityError) {
      // Return failure response indicating Sanity error
      return new Response(
        JSON.stringify({
          success: false,
          quote: quoteObject,
          error: 'Failed to save quote to Sanity',
          errorDetails:
            typeof sanityError === 'object'
              ? (sanityError as Error).message || JSON.stringify(sanityError)
              : 'Unknown error',
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    }
  } catch (error) {
    console.error('Error processing quote request:', error)

    // Return error response
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to process quote request',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  }
}
