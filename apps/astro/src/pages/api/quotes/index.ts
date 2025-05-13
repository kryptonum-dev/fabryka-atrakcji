import type { APIRoute } from 'astro'
import type { AddonItem, AddonProps, BaseActivityProps, BaseHotelProps, ExtraItem } from '@/src/global/types'
import { client } from '@/src/utils/sanity.fetch'

// Define QuoteItem interface to fix TypeScript errors
interface QuoteItem {
  type: string
  _type?: string
  _key?: string
  hotels?: Array<any>
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
    if (effectiveParticipantCount <= hotel.pricing.groupPeopleCount) {
      // Just the group price
      result.bruttoPrice = hotel.pricing.groupPrice
    } else {
      // Group price + additional people at per-person rate
      const additionalPeople = effectiveParticipantCount - hotel.pricing.groupPeopleCount
      result.bruttoPrice = hotel.pricing.groupPrice + additionalPeople * hotel.pricing.pricePerPerson
    }
  } else {
    // Simple per person pricing
    result.bruttoPrice = effectiveParticipantCount * hotel.pricing.pricePerPerson
  }

  // Calculate netto price (brutto / 1.23)
  result.nettoPrice = Math.round(result.bruttoPrice / 1.23)

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
  console.log(`Calculating price for activity`)
  console.log(`Input - participantCount: ${participantCount}, activity pricing:`, activity.pricing)
  console.log(`Input - participants limits:`, activity.participantsCount)

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
    console.log(
      `Below min people (${activity.participantsCount.min}), using min for calculation: ${effectiveParticipantCount}`
    )
  }

  // Check maximum participants limit
  if (activity.participantsCount?.max && participantCount > activity.participantsCount.max) {
    result.exceedsMaxPeople = true
    // Use maximum allowed participants for calculation
    effectiveParticipantCount = activity.participantsCount.max
    result.calculatedFor = effectiveParticipantCount
    console.log(
      `Exceeds max people (${activity.participantsCount.max}), using max for calculation: ${effectiveParticipantCount}`
    )
  }

  // Calculate price based on threshold model
  if (effectiveParticipantCount <= activity.pricing.maxParticipants) {
    // Base price covers all participants
    result.bruttoPrice = activity.pricing.basePrice
    console.log(
      `Using base price: ${activity.pricing.basePrice} (participants: ${effectiveParticipantCount} <= maxParticipants: ${activity.pricing.maxParticipants})`
    )
  } else {
    // Base price + additional per person pricing
    const additionalPeople = effectiveParticipantCount - activity.pricing.maxParticipants
    result.bruttoPrice = activity.pricing.basePrice + additionalPeople * activity.pricing.additionalPersonPrice
    console.log(
      `Base price: ${activity.pricing.basePrice} + additional: ${additionalPeople} people * ${activity.pricing.additionalPersonPrice} = ${result.bruttoPrice}`
    )
  }

  // Calculate netto price (brutto / 1.23)
  result.nettoPrice = Math.round(result.bruttoPrice / 1.23)

  console.log(`Final activity price result:`, result)
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
        result.bruttoPrice = addon.pricing.fixedPrice
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
        const units = addon.pricing.perUnit.hasCount ? addonCount : 1

        result.bruttoPrice = unitPrice * units
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

        // Start with base price
        result.bruttoPrice = basePrice
        result.priceDetails = {
          basePrice,
          units: Math.min(participantCount, maxUnits),
        }

        // If participant count exceeds threshold, add additional pricing
        if (participantCount > maxUnits) {
          const additionalUnits = participantCount - maxUnits
          const additionalCost = additionalUnits * additionalPrice

          result.bruttoPrice += additionalCost
          result.priceDetails.additionalUnits = additionalUnits
          result.priceDetails.additionalUnitPrice = additionalPrice
        }
      }
      break

    // Individual pricing (custom quote needed)
    case 'individual':
      // For individual pricing, we can't calculate automatically
      result.bruttoPrice = 0
      result.priceDetails = {
        unitPrice: 0,
        units: 0,
      }
      break
  }

  // Calculate netto price (brutto / 1.23)
  result.nettoPrice = Math.round(result.bruttoPrice / 1.23)

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
      // Simple fixed price
      if (typeof pricing.fixedPrice === 'number') {
        result.totalPrice = pricing.fixedPrice
        result.priceDetails = {
          unitPrice: pricing.fixedPrice,
          units: 1,
        }
      }
      break

    case 'threshold':
      // Threshold pricing based on participant count
      if (pricing.threshold) {
        const { basePrice, maxUnits, additionalPrice } = pricing.threshold

        // Start with base price
        result.totalPrice = basePrice
        result.priceDetails = {
          basePrice,
          maxUnits,
          participants: participantCount,
          calculatedFor: Math.min(participantCount, maxUnits),
        }

        // If participant count exceeds threshold, add additional pricing
        if (participantCount > maxUnits) {
          const additionalUnits = participantCount - maxUnits
          const additionalCost = additionalUnits * additionalPrice

          result.totalPrice += additionalCost
          result.priceDetails.additionalUnits = additionalUnits
          result.priceDetails.additionalUnitPrice = additionalPrice
          result.priceDetails.additionalCost = additionalCost
        }
      }
      break
  }

  // Calculate nettoTotalPrice directly from totalPrice
  result.nettoTotalPrice = Math.round(result.totalPrice / 1.23)

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
    console.warn('Insufficient address information for geocoding')
    return null
  }

  const query = `${address.street}, ${address.postal || ''} ${address.city}`.trim()

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=pl&limit=1`,
      {
        headers: {
          'User-Agent': 'Fabryka-Atrakcji/1.0', // Proper user-agent as required by Nominatim
          'Accept-Language': 'pl', // Prioritize Polish results
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Geocoding request failed with status: ${response.status}`)
    }

    const data = await response.json()

    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
      }
    }

    console.warn('No geocoding results found for address:', query)
    return null
  } catch (error) {
    console.error('Geocoding error:', error)
    return null
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
    }: {
      hotels: BaseHotelProps[]
      activities: BaseActivityProps[]
      extras: (ExtraItem & {
        id?: string
        count?: number
        address?: { street: string; postal: string; city: string; lat?: number; lng?: number }
      })[]
      participantCount: number
      language: string
      selectedDates: Array<string | { start: string; end: string }>
    } = data

    console.log(
      `Processing quote with ${hotels.length} hotels, ${activities.length} activities, ${extras.length} extras`
    )

    // Array to store all quote items
    const quoteItems = []

    // Process transport extras if present to handle distance calculations
    let transportExtra = extras.find((extra) => extra.id === 'transport')
    let transportPickupCoordinates = null
    let transportGeocodingFailed = false

    if (transportExtra && transportExtra.address) {
      console.log('Processing transport with address:', transportExtra.address)

      // Get pickup coordinates from the address
      if (transportExtra.address.lat && transportExtra.address.lng) {
        // Coordinates already present (from map selection)
        transportPickupCoordinates = {
          lat: transportExtra.address.lat,
          lng: transportExtra.address.lng,
        }
        console.log('Using provided coordinates:', transportPickupCoordinates)
      } else {
        // Need to geocode the address
        transportPickupCoordinates = await geocodeAddress({
          street: transportExtra.address.street,
          postal: transportExtra.address.postal,
          city: transportExtra.address.city,
        })

        if (transportPickupCoordinates) {
          console.log('Successfully geocoded address to:', transportPickupCoordinates)
          // Save the coordinates for later use
          transportExtra.address.lat = transportPickupCoordinates.lat
          transportExtra.address.lng = transportPickupCoordinates.lng
        } else {
          console.warn('Failed to geocode transport address')
          transportGeocodingFailed = true
        }
      }
    }

    // Process each hotel if present
    if (hotels && hotels.length > 0) {
      for (const hotel of hotels) {
        console.log(`Processing hotel: ${hotel.name}`)

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

          console.log(hotelCoordinates)

          if (hotelCoordinates) {
            console.log('Hotel coordinates:', hotelCoordinates)
          } else {
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
              id: hotel._id || hotel.id,
              name: hotel.name,
              slug: hotel.slug,
              maxPeople: hotel.maxPeople?.overnight || 0,
              pricing: {
                finalPrice: hotelPriceResult.bruttoPrice,
                nettoFinalPrice: hotelPriceResult.nettoPrice,
                participantCount: hotelPriceResult.calculatedFor,
                exceedsMaxPeople: hotelPriceResult.exceedsMaxPeople,
              },
              addons: hotelAddonsResults,
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
            console.log(`Processing activity: ${activity.name} for hotel: ${hotel.name}`)

            // Calculate activity price
            const activityPriceResult = calculateActivityPrice(activity, participantCount)
            console.log(`Activity price for ${activity.name}:`, {
              totalPrice: activityPriceResult.bruttoPrice,
              participantCount: activityPriceResult.calculatedFor,
              exceedsMaxPeople: activityPriceResult.exceedsMaxPeople,
              belowMinPeople: activityPriceResult.belowMinPeople,
            })

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
              id: activity._id || activity.id,
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

          console.log(`Distance from pickup to hotel ${hotel.name}: ${distance} km`)

          // Store distance for this hotel
          hotelQuoteItem.transport = {
            distance: distance,
            pickupCoordinates: transportPickupCoordinates,
            destinationCoordinates: hotelCoordinates,
          }

          // If transport has pricePerKm, calculate transport price
          if (transportExtra.pricing && transportExtra.pricing.pricePerKm) {
            const distancePrice = distance * transportExtra.pricing.pricePerKm

            // Calculate base transport price
            let baseTransportPrice = 0
            if (transportExtra.pricing.type === 'fixed' && transportExtra.pricing.fixedPrice) {
              baseTransportPrice = transportExtra.pricing.fixedPrice
            } else if (transportExtra.pricing.type === 'threshold' && transportExtra.pricing.threshold) {
              const { basePrice, maxUnits, additionalPrice } = transportExtra.pricing.threshold

              baseTransportPrice = basePrice

              if (participantCount > maxUnits) {
                const additionalPeople = participantCount - maxUnits
                baseTransportPrice += additionalPeople * additionalPrice
              }
            }

            const totalPrice = baseTransportPrice + distancePrice
            const nettoPrice = Math.round(totalPrice / 1.23)

            hotelQuoteItem.transport.pricing = {
              basePrice: baseTransportPrice,
              distancePrice: distancePrice,
              totalPrice: totalPrice,
              nettoTotalPrice: nettoPrice,
              pricePerKm: transportExtra.pricing.pricePerKm,
            }
          }
        } else if (transportExtra) {
          // Handle different cases when we can't calculate proper distance
          if (transportGeocodingFailed && hotelCoordinates) {
            // Transport address geocoding failed but hotel coordinates are present
            hotelQuoteItem.transport = {
              transportAddressNotFound: true,
              destinationCoordinates: hotelCoordinates,
            }
          } else if (!transportPickupCoordinates && hotelCoordinates) {
            // No transport address provided but hotel coordinates are present
            hotelQuoteItem.transport = {
              noTransportAddress: true,
              destinationCoordinates: hotelCoordinates,
            }
          } else if (!hotelHasAddress) {
            // No address provided for hotel
            hotelQuoteItem.transport = {
              hotelNoAddress: true,
              pickupCoordinates: transportPickupCoordinates,
            }
          } else if (hotelGeocodingFailed && transportPickupCoordinates) {
            // Address provided but geocoding failed for hotel
            hotelQuoteItem.transport = {
              hotelAddressNotFound: true,
              pickupCoordinates: transportPickupCoordinates,
            }
          } else if (hotelGeocodingFailed && transportGeocodingFailed) {
            // Both addresses failed geocoding
            hotelQuoteItem.transport = {
              bothAddressesNotFound: true,
            }
          }

          // Calculate base transport price without distance
          if (transportExtra.pricing && hotelQuoteItem.transport) {
            let baseTransportPrice = 0
            if (transportExtra.pricing.type === 'fixed' && transportExtra.pricing.fixedPrice) {
              baseTransportPrice = transportExtra.pricing.fixedPrice
            } else if (transportExtra.pricing.type === 'threshold' && transportExtra.pricing.threshold) {
              const { basePrice, maxUnits, additionalPrice } = transportExtra.pricing.threshold

              baseTransportPrice = basePrice

              if (participantCount > maxUnits) {
                const additionalPeople = participantCount - maxUnits
                baseTransportPrice += additionalPeople * additionalPrice
              }
            }

            const nettoPrice = Math.round(baseTransportPrice / 1.23)

            hotelQuoteItem.transport.pricing = {
              basePrice: baseTransportPrice,
              totalPrice: baseTransportPrice,
              nettoTotalPrice: nettoPrice,
            }
          }
        }

        // Add hotel item to quote items
        quoteItems.push(hotelQuoteItem)
      }
    } else if (activities && activities.length > 0) {
      // No hotels, process activities only
      for (const activity of activities) {
        console.log(`Processing activity without hotel: ${activity.name}`)

        // Calculate activity price
        const activityPriceResult = calculateActivityPrice(activity, participantCount)
        console.log(`Activity price for ${activity.name}:`, {
          totalPrice: activityPriceResult.bruttoPrice,
          participantCount: activityPriceResult.calculatedFor,
          exceedsMaxPeople: activityPriceResult.exceedsMaxPeople,
          belowMinPeople: activityPriceResult.belowMinPeople,
        })

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
              id: activity._id || activity.id,
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
        console.log(`Initial activity quote total price for ${activity.name}:`, initialActivityPrice)

        // Handle transport for activities (without coordinates or distance calculation)
        if (transportExtra && transportPickupCoordinates) {
          // Since we don't have activity coordinates, we can only add base transport price
          activityQuoteItem.transport = {
            activityNoAddress: true,
            pickupCoordinates: transportPickupCoordinates,
          }

          // Add base transport price
          if (transportExtra.pricing) {
            let baseTransportPrice = 0
            if (transportExtra.pricing.type === 'fixed' && transportExtra.pricing.fixedPrice) {
              baseTransportPrice = transportExtra.pricing.fixedPrice
            } else if (transportExtra.pricing.type === 'threshold' && transportExtra.pricing.threshold) {
              const { basePrice, maxUnits, additionalPrice } = transportExtra.pricing.threshold

              baseTransportPrice = basePrice

              if (participantCount > maxUnits) {
                const additionalPeople = participantCount - maxUnits
                baseTransportPrice += additionalPeople * additionalPrice
              }
            }

            const nettoPrice = Math.round(baseTransportPrice / 1.23)

            if (activityQuoteItem.transport) {
              activityQuoteItem.transport.pricing = {
                basePrice: baseTransportPrice,
                totalPrice: baseTransportPrice,
                nettoTotalPrice: nettoPrice,
              }
            }
          }
        } else if (transportGeocodingFailed) {
          // Transport address geocoding failed
          activityQuoteItem.transport = {
            transportAddressNotFound: true,
          }

          // Still add base transport price even when address lookup fails
          if (transportExtra && transportExtra.pricing) {
            let baseTransportPrice = 0
            if (transportExtra.pricing.type === 'fixed' && transportExtra.pricing.fixedPrice) {
              baseTransportPrice = transportExtra.pricing.fixedPrice
            } else if (transportExtra.pricing.type === 'threshold' && transportExtra.pricing.threshold) {
              const { basePrice, maxUnits, additionalPrice } = transportExtra.pricing.threshold

              baseTransportPrice = basePrice

              if (participantCount > maxUnits) {
                const additionalPeople = participantCount - maxUnits
                baseTransportPrice += additionalPeople * additionalPrice
              }
            }

            const nettoPrice = Math.round(baseTransportPrice / 1.23)

            if (activityQuoteItem.transport) {
              activityQuoteItem.transport.pricing = {
                basePrice: baseTransportPrice,
                totalPrice: baseTransportPrice,
                nettoTotalPrice: nettoPrice,
              }
            }
          }
        } else if (transportExtra) {
          // Transport requested but no address provided
          activityQuoteItem.transport = {
            noTransportAddress: true,
          }

          // Add base transport price
          if (transportExtra.pricing) {
            let baseTransportPrice = 0
            if (transportExtra.pricing.type === 'fixed' && transportExtra.pricing.fixedPrice) {
              baseTransportPrice = transportExtra.pricing.fixedPrice
            } else if (transportExtra.pricing.type === 'threshold' && transportExtra.pricing.threshold) {
              const { basePrice, maxUnits, additionalPrice } = transportExtra.pricing.threshold

              baseTransportPrice = basePrice

              if (participantCount > maxUnits) {
                const additionalPeople = participantCount - maxUnits
                baseTransportPrice += additionalPeople * additionalPrice
              }
            }

            if (activityQuoteItem.transport) {
              activityQuoteItem.transport.pricing = {
                basePrice: baseTransportPrice,
                totalPrice: baseTransportPrice,
              }
            }
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
          id: extra.id || extra._key,
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

      // Instead of adding up individual netto prices which can lead to inconsistencies,
      // calculate the netto price directly from the total brutto price
      quoteItem.totalNettoPrice = Math.round(totalPrice / 1.23)

      console.log(
        `Total price for ${quoteItem.type} quote: ${totalPrice} (brutto), ${quoteItem.totalNettoPrice} (netto)`
      )

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

    console.log('Final quote object:', JSON.stringify(quoteObject, null, 2))

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
          console.log('Fixed missing totalPrice for activity quote:', item.totalPrice)
        }

        // Clean up undefined values or complex data structures that might cause issues with Sanity
        return {
          _key: generateKey(),
          type: item.type,
          totalPrice: item.totalPrice || 0, // Ensure totalPrice has a fallback
          totalNettoPrice: item.totalNettoPrice || 0, // Add the netto price
          hotels: item.hotels.map((hotel: any) => ({
            _key: generateKey(),
            name: hotel.name,
            slug: hotel.slug,
            maxPeople: hotel.maxPeople || 0,
            pricing: {
              finalPrice: hotel.pricing.finalPrice || 0,
              nettoFinalPrice: hotel.pricing.nettoFinalPrice || 0,
              participantCount: hotel.pricing.participantCount || 0,
              exceedsMaxPeople: toBoolString(hotel.pricing.exceedsMaxPeople),
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
          })),
          activities: item.activities.map((activity: any) => ({
            _key: generateKey(),
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
                pricing: item.transport.pricing
                  ? {
                      basePrice: item.transport.pricing.basePrice || 0,
                      distancePrice: item.transport.pricing.distancePrice || 0,
                      totalPrice: item.transport.pricing.totalPrice || 0,
                      nettoTotalPrice: Math.round((item.transport.pricing.totalPrice || 0) / 1.23),
                      pricePerKm: item.transport.pricing.pricePerKm || 0,
                    }
                  : null,
                transportAddressNotFound: toBoolString(item.transport.transportAddressNotFound),
                noTransportAddress: toBoolString(item.transport.noTransportAddress),
                hotelNoAddress: toBoolString(item.transport.hotelNoAddress),
                hotelAddressNotFound: toBoolString(item.transport.hotelAddressNotFound),
                bothAddressesNotFound: toBoolString(item.transport.bothAddressesNotFound),
                activityNoAddress: toBoolString(item.transport.activityNoAddress),
              }
            : null,
          extras: item.extras.map((extra: any) => ({
            _key: generateKey(),
            name: extra.name,
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
      console.log(sanityQuote)
      const savedQuote = await client.create(sanityQuote)

      console.log(savedQuote)

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
      console.error('Error saving quote to Sanity:', sanityError)

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
