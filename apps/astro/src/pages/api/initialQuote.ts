export const prerender = false

import { REGEX } from '@/src/global/constants'
import { htmlToString } from '@/src/utils/html-to-string'
import type { APIRoute } from 'astro'

const RESEND_API_KEY = import.meta.env.RESEND_API_KEY || process.env.RESEND_API_KEY

// Helper to format date in a readable format (for Polish business email)
const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  const day = date.getDate()
  const months = [
    'styczeń',
    'luty',
    'marzec',
    'kwiecień',
    'maj',
    'czerwiec',
    'lipiec',
    'sierpień',
    'wrzesień',
    'październik',
    'listopad',
    'grudzień',
  ]
  const month = months[date.getMonth()]
  const year = date.getFullYear()

  return `${day} ${month} ${year}`
}

// Business email template - ALWAYS IN POLISH
const quoteTemplate = ({
  email,
  phone,
  additionalInfo,
  quoteId,
  participantCount,
  selectedDates,
  items,
  newsletter,
}: {
  email: string
  phone?: string
  additionalInfo?: string
  quoteId: string
  participantCount: number
  selectedDates: Array<{ start: string; end: string }>
  items: any[]
  newsletter: boolean
}) => {
  const datesHtml = selectedDates.map((date) => `<p>• ${formatDate(date.start)} - ${formatDate(date.end)}</p>`).join('')

  // Format items (hotels, activities, extras)
  const itemsHtml = items
    .map((item) => {
      let itemHtml = `<div style="margin-bottom: 15px; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">`

      // Handle hotels
      if (item.type === 'hotel' && item.hotels && item.hotels.length > 0) {
        const hotel = item.hotels[0]
        itemHtml += `<h3>Hotel: ${hotel.name}</h3>`

        // Add warning if hotel exceeds max people (moved to the top)
        if (hotel.pricing.exceedsMaxPeople) {
          itemHtml += `<p style="color: #F67258; margin-top: 5px;"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" style="vertical-align: middle; margin-right: 5px;"><path fill="#F67258" fill-rule="evenodd" d="M5.229 2.535C6.58 1.734 7.257 1.333 8 1.333c.743 0 1.419.4 2.771 1.202l.458.27c1.352.801 2.028 1.202 2.4 1.862.371.66.371 1.46.371 3.062v.542c0 1.602 0 2.403-.371 3.062-.372.66-1.048 1.06-2.4 1.861l-.458.271C9.42 14.266 8.743 14.667 8 14.667c-.743 0-1.419-.4-2.771-1.202l-.458-.27c-1.352-.802-2.028-1.202-2.4-1.862C2 10.673 2 9.873 2 8.271v-.542c0-1.602 0-2.403.371-3.062.372-.66 1.048-1.06-2.4-1.861l.458-.271Zm3.438 8.132a.667.667 0 1 1-1.334 0 .667.667 0 0 1 1.334 0ZM8 4.167a.5.5 0 0 1 .5.5v4a.5.5 0 1 1-1 0v-4a.5.5 0 0 1 .5-.5Z" clip-rule="evenodd"/></svg> <b>Uwaga:</b> Ten hotel jest maksymalnie dla ${hotel.maxPeople} osób. Wycena została przygotowana dla ${hotel.pricing.participantCount} osób.</p>`
        }

        // Add hotel-specific pricing
        const hasPricingModel = hotel.pricing.pricingModel === 'individual'
        itemHtml += `<p>Cena hotelu: <b>${hasPricingModel ? 'Wycena indywidualna' : `${hotel.pricing.nettoFinalPrice} PLN netto <span style="color: #888888;">(${hotel.pricing.finalPrice} PLN brutto)</span>`}</b></p>`

        if (hotel.addons && hotel.addons.length > 0) {
          itemHtml += `<p><b>Dodatki do hotelu:</b></p><ul>`
          hotel.addons.forEach(
            (addon: {
              name: string
              count: number
              pricing: {
                totalPrice: number
                nettoTotalPrice: number
                pricingModel?: 'fixed' | 'per_unit' | 'threshold' | 'individual'
              }
            }) => {
              const isIndividual = addon.pricing.pricingModel === 'individual'
              itemHtml += `<li>${addon.name} - <b>${isIndividual ? 'Wycena indywidualna' : `${addon.pricing.nettoTotalPrice} PLN netto <span style="color: #888888;">(${addon.pricing.totalPrice} PLN brutto)</span>`}</b>${isIndividual ? ' <span style="color: #F67258; font-weight: bold;"></span>' : ''}</li>`
            }
          )
          itemHtml += `</ul>`
        }

        // For hotel type, also check if there are activities
        if (item.activities && item.activities.length > 0) {
          itemHtml += `<h3>Aktywności do hotelu:</h3>`
          item.activities.forEach((activity: any) => {
            itemHtml += `<div style="margin: 10px 0; padding-left: 10px; border-left: 2px solid #f67258;">`
            itemHtml += `<p><strong>${activity.name}</strong></p>`

            // Add warnings about activity limits first
            if (activity.pricing.exceedsMaxPeople && activity.participantsCount?.max) {
              itemHtml += `<p style="color: #F67258; margin-top: 5px;"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" style="vertical-align: middle; margin-right: 5px;"><path fill="#F67258" fill-rule="evenodd" d="M5.229 2.535C6.58 1.734 7.257 1.333 8 1.333c.743 0 1.419.4 2.771 1.202l.458.27c1.352.801 2.028 1.202 2.4 1.862.371.66.371 1.46.371 3.062v.542c0 1.602 0 2.403-.371 3.062-.372.66-1.048 1.06-2.4 1.861l-.458.271C9.42 14.266 8.743 14.667 8 14.667c-.743 0-1.419-.4-2.771-1.202l-.458-.27c-1.352-.802-2.028-1.202-2.4-1.862C2 10.673 2 9.873 2 8.271v-.542c0-1.602 0-2.403.371-3.062.372-.66 1.048-1.06-2.4-1.861l.458-.271Zm3.438 8.132a.667.667 0 1 1-1.334 0 .667.667 0 0 1 1.334 0ZM8 4.167a.5.5 0 0 1 .5.5v4a.5.5 0 1 1-1 0v-4a.5.5 0 0 1 .5-.5Z" clip-rule="evenodd"/></svg> <b>Uwaga:</b> Ta aktywność jest maksymalnie dla ${activity.participantsCount.max} osób. Wycena została przygotowana dla ${activity.pricing.participantCount} osób.</p>`
            }
            if (activity.pricing.belowMinPeople && activity.participantsCount?.min) {
              itemHtml += `<p style="color: #F67258; margin-top: 5px;"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" style="vertical-align: middle; margin-right: 5px;"><path fill="#F67258" fill-rule="evenodd" d="M5.229 2.535C6.58 1.734 7.257 1.333 8 1.333c.743 0 1.419.4 2.771 1.202l.458.27c1.352.801 2.028 1.202 2.4 1.862.371.66.371 1.46.371 3.062v.542c0 1.602 0 2.403-.371 3.062-.372.66-1.048 1.06-2.4 1.861l-.458.271C9.42 14.266 8.743 14.667 8 14.667c-.743 0-1.419-.4-2.771-1.202l-.458-.27c-1.352-.802-2.028-1.202-2.4-1.862C2 10.673 2 9.873 2 8.271v-.542c0-1.602 0-2.403.371-3.062.372-.66 1.048-1.06-2.4-1.861l.458-.271Zm3.438 8.132a.667.667 0 1 1-1.334 0 .667.667 0 0 1 1.334 0ZM8 4.167a.5.5 0 0 1 .5.5v4a.5.5 0 1 1-1 0v-4a.5.5 0 0 1 .5-.5Z" clip-rule="evenodd"/></svg> <b>Uwaga:</b> Ta aktywność wymaga minimum ${activity.participantsCount.min} osób. Wycena została przygotowana dla ${activity.pricing.participantCount} osób.</p>`
            }

            if (activity.pricing) {
              const activityHasIndividualPricing = activity.pricing.pricingModel === 'individual'
              itemHtml += `<p>Cena: <b>${activityHasIndividualPricing ? 'Wycena indywidualna' : `${activity.pricing.nettoFinalPrice} PLN netto <span style="color: #888888;">(${activity.pricing.finalPrice} PLN brutto)</span>`}</b></p>`

              if (activity.addons && activity.addons.length > 0) {
                itemHtml += `<p><b>Dodatki do integracji:</b></p><ul>`
                activity.addons.forEach(
                  (addon: {
                    name: string
                    count: number
                    pricing: {
                      totalPrice: number
                      nettoTotalPrice: number
                      pricingModel?: 'fixed' | 'per_unit' | 'threshold' | 'individual'
                    }
                  }) => {
                    const isIndividual = addon.pricing.pricingModel === 'individual'
                    itemHtml += `<li>${addon.name} - <b>${isIndividual ? 'Wycena indywidualna' : `${addon.pricing.nettoTotalPrice} PLN netto <span style="color: #888888;">(${addon.pricing.totalPrice} PLN brutto)</span>`}</b>${isIndividual ? ' <span style="color: #F67258; font-weight: bold;"></span>' : ''}</li>`
                  }
                )
                itemHtml += `</ul>`
              }
            }
            itemHtml += `</div>`
          })
        }

        // Handle transport if present for hotel
        if (item.transport) {
          itemHtml += `<h3>Transport</h3>`
          if (item.transport.distance) {
            itemHtml += `<p>Dystans: ${item.transport.distance} km</p>`
          } else {
            itemHtml += `<p>Dystans: Nie obliczono</p>`
          }

          // Add transport issues
          let transportIssues = ''
          if (item.transport.transportAddressNotFound) {
            transportIssues += `<p style="color: #F67258;"><em>Uwaga: Nie znaleziono adresu transportu</em></p>`
          }
          if (item.transport.noTransportAddress) {
            transportIssues += `<p style="color: #F67258;"><em>Uwaga: Brak adresu transportu</em></p>`
          }
          if (item.transport.hotelNoAddress) {
            transportIssues += `<p style="color: #F67258;"><em>Uwaga: Brak adresu hotelu</em></p>`
          }
          if (item.transport.hotelAddressNotFound) {
            transportIssues += `<p style="color: #F67258;"><em>Uwaga: Nie znaleziono adresu hotelu</em></p>`
          }
          if (item.transport.bothAddressesNotFound) {
            transportIssues += `<p style="color: #F67258;"><em>Uwaga: Nie znaleziono obu adresów</em></p>`
          }
          if (item.transport.activityNoAddress) {
            transportIssues += `<p style="color: #F67258;"><em>Uwaga: Brak adresu aktywności</em></p>`
          }
          if (item.transport.activityAddressNotFound) {
            transportIssues += `<p style="color: #F67258;"><em>Uwaga: Nie znaleziono adresu integracji</em></p>`
          }
          if (item.transport.userSelectedActivityAddressNotFound) {
            transportIssues += `<p style="color: #F67258;"><em>Uwaga: Nie znaleziono adresu wybranego przez użytkownika dla integracji</em></p>`
          }
          if (item.transport.nationwideActivityNoUserAddress) {
            transportIssues += `<p style="color: #F67258;"><em>Uwaga: Integracja ogólnopolska wymaga adresu użytkownika</em></p>`
          }
          if (item.transport.activityAddressSource === 'dedicated') {
            transportIssues += `<p style="color: #4CAF50;"><em>Używa adresu dedykowanego integracji</em></p>`
          }
          if (item.transport.activityAddressSource === 'user_selected') {
            transportIssues += `<p style="color: #4CAF50;"><em>Używa adresu wybranego przez użytkownika</em></p>`
          }

          // Insert the issues right after the heading
          if (transportIssues) {
            itemHtml += transportIssues
          }

          if (item.transport.pricing && item.transport.pricing.totalPrice) {
            itemHtml += `<p>Cena: <b>${item.transport.pricing.nettoTotalPrice} PLN netto</b> <span style="color: #888888;">(${item.transport.pricing.totalPrice} PLN brutto)</span></p>`
          } else {
            itemHtml += `<p>Cena: Do wyceny</p>`
          }
        }

        // Handle extras for hotel
        if (item.extras && item.extras.length > 0) {
          itemHtml += `<h3>Dodatki</h3><ul>`
          item.extras.forEach(
            (extra: {
              name: string
              count: number
              pricing: {
                totalPrice: number
                nettoTotalPrice: number
                pricingModel?: 'fixed' | 'per_unit' | 'threshold' | 'individual'
              }
            }) => {
              const isIndividual = extra.pricing.pricingModel === 'individual'
              itemHtml += `<li>${extra.name} - <b>${isIndividual ? 'Wycena indywidualna' : `${extra.pricing.nettoTotalPrice} PLN netto <span style="color: #888888;">(${extra.pricing.totalPrice} PLN brutto)</span>`}</b>${isIndividual ? ' <span style="color: #F67258; font-weight: bold;"></span>' : ''}</li>`
            }
          )
          itemHtml += `</ul>`
        }

        // Add total price for the whole item at the very end (after all components)
        itemHtml += `<div style="margin-top: 15px; padding: 10px; background-color: #f8f8f8; border-radius: 5px;">
          <p style="font-size: 1.2em; font-weight: bold; margin: 0;">Łączna cena: <span style="color: #45051c;">${item.totalNettoPrice} PLN netto</span> <span style="color: #888888; font-size: 0.9em;">(${item.totalPrice} PLN brutto)</span></p>
        </div>`
      }
      // Handle standalone activities (activity type)
      else if (item.type === 'activity' && item.activities && item.activities.length > 0) {
        const activity = item.activities[0]
        itemHtml += `<h3>Integracja: ${activity.name}</h3>`

        // Add warnings about activity limits first
        if (activity.pricing.exceedsMaxPeople && activity.participantsCount?.max) {
          itemHtml += `<p style="color: #F67258; margin-top: 5px;"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" style="vertical-align: middle; margin-right: 5px;"><path fill="#F67258" fill-rule="evenodd" d="M5.229 2.535C6.58 1.734 7.257 1.333 8 1.333c.743 0 1.419.4 2.771 1.202l.458.27c1.352.801 2.028 1.202 2.4 1.862.371.66.371 1.46.371 3.062v.542c0 1.602 0 2.403-.371 3.062-.372.66-1.048 1.06-2.4 1.861l-.458.271C9.42 14.266 8.743 14.667 8 14.667c-.743 0-1.419-.4-2.771-1.202l-.458-.27c-1.352-.802-2.028-1.202-2.4-1.862C2 10.673 2 9.873 2 8.271v-.542c0-1.602 0-2.403.371-3.062.372-.66 1.048-1.06-2.4-1.861l.458-.271Zm3.438 8.132a.667.667 0 1 1-1.334 0 .667.667 0 0 1 1.334 0ZM8 4.167a.5.5 0 0 1 .5.5v4a.5.5 0 1 1-1 0v-4a.5.5 0 0 1 .5-.5Z" clip-rule="evenodd"/></svg> <b>Uwaga:</b> Ta aktywność jest maksymalnie dla ${activity.participantsCount.max} osób. Wycena została przygotowana dla ${activity.pricing.participantCount} osób.</p>`
        }
        if (activity.pricing.belowMinPeople && activity.participantsCount?.min) {
          itemHtml += `<p style="color: #F67258; margin-top: 5px;"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" style="vertical-align: middle; margin-right: 5px;"><path fill="#F67258" fill-rule="evenodd" d="M5.229 2.535C6.58 1.734 7.257 1.333 8 1.333c.743 0 1.419.4 2.771 1.202l.458.27c1.352.801 2.028 1.202 2.4 1.862.371.66.371 1.46.371 3.062v.542c0 1.602 0 2.403-.371 3.062-.372.66-1.048 1.06-2.4 1.861l-.458.271C9.42 14.266 8.743 14.667 8 14.667c-.743 0-1.419-.4-2.771-1.202l-.458-.27c-1.352-.802-2.028-1.202-2.4-1.862C2 10.673 2 9.873 2 8.271v-.542c0-1.602 0-2.403.371-3.062.372-.66 1.048-1.06-2.4-1.861l.458-.271Zm3.438 8.132a.667.667 0 1 1-1.334 0 .667.667 0 0 1 1.334 0ZM8 4.167a.5.5 0 0 1 .5.5v4a.5.5 0 1 1-1 0v-4a.5.5 0 0 1 .5-.5Z" clip-rule="evenodd"/></svg> <b>Uwaga:</b> Ta aktywność wymaga minimum ${activity.participantsCount.min} osób. Wycena została przygotowana dla ${activity.pricing.participantCount} osób.</p>`
        }

        // Activity-specific pricing
        const activityHasIndividualPricing = activity.pricing.pricingModel === 'individual'
        itemHtml += `<p>Cena aktywności: <b>${activityHasIndividualPricing ? 'Wycena indywidualna' : `${activity.pricing.nettoFinalPrice} PLN netto <span style="color: #888888;">(${activity.pricing.finalPrice} PLN brutto)</span>`}</b></p>`

        if (activity.addons && activity.addons.length > 0) {
          itemHtml += `<p><b>Dodatki do integracji:</b></p><ul>`
          activity.addons.forEach(
            (addon: {
              name: string
              count: number
              pricing: {
                totalPrice: number
                nettoTotalPrice: number
                pricingModel?: 'fixed' | 'per_unit' | 'threshold' | 'individual'
              }
            }) => {
              const isIndividual = addon.pricing.pricingModel === 'individual'
              itemHtml += `<li>${addon.name} - <b>${isIndividual ? 'Wycena indywidualna' : `${addon.pricing.nettoTotalPrice} PLN netto <span style="color: #888888;">(${addon.pricing.totalPrice} PLN brutto)</span>`}</b>${isIndividual ? ' <span style="color: #F67258; font-weight: bold;"></span>' : ''}</li>`
            }
          )
          itemHtml += `</ul>`
        }

        // Handle transport if present for activity
        if (item.transport) {
          itemHtml += `<h3>Transport</h3>`
          if (item.transport.distance) {
            itemHtml += `<p>Dystans: ${item.transport.distance} km</p>`
          } else {
            itemHtml += `<p>Dystans: Nie obliczono</p>`
          }

          // Add transport issues
          let transportIssues = ''
          if (item.transport.transportAddressNotFound) {
            transportIssues += `<p style="color: #F67258;"><em>Uwaga: Nie znaleziono adresu transportu</em></p>`
          }
          if (item.transport.noTransportAddress) {
            transportIssues += `<p style="color: #F67258;"><em>Uwaga: Brak adresu transportu</em></p>`
          }
          if (item.transport.hotelNoAddress) {
            transportIssues += `<p style="color: #F67258;"><em>Uwaga: Brak adresu hotelu</em></p>`
          }
          if (item.transport.hotelAddressNotFound) {
            transportIssues += `<p style="color: #F67258;"><em>Uwaga: Nie znaleziono adresu hotelu</em></p>`
          }
          if (item.transport.bothAddressesNotFound) {
            transportIssues += `<p style="color: #F67258;"><em>Uwaga: Nie znaleziono obu adresów</em></p>`
          }
          if (item.transport.activityNoAddress) {
            transportIssues += `<p style="color: #F67258;"><em>Uwaga: Brak adresu aktywności</em></p>`
          }
          if (item.transport.activityAddressNotFound) {
            transportIssues += `<p style="color: #F67258;"><em>Uwaga: Nie znaleziono adresu integracji</em></p>`
          }
          if (item.transport.userSelectedActivityAddressNotFound) {
            transportIssues += `<p style="color: #F67258;"><em>Uwaga: Nie znaleziono adresu wybranego przez użytkownika dla integracji</em></p>`
          }
          if (item.transport.nationwideActivityNoUserAddress) {
            transportIssues += `<p style="color: #F67258;"><em>Uwaga: Integracja ogólnopolska wymaga adresu użytkownika</em></p>`
          }
          if (item.transport.activityAddressSource === 'dedicated') {
            transportIssues += `<p style="color: #4CAF50;"><em>Używa adresu dedykowanego integracji</em></p>`
          }
          if (item.transport.activityAddressSource === 'user_selected') {
            transportIssues += `<p style="color: #4CAF50;"><em>Używa adresu wybranego przez użytkownika</em></p>`
          }

          // Insert the issues right after the heading
          if (transportIssues) {
            itemHtml += transportIssues
          }

          if (item.transport.pricing && item.transport.pricing.totalPrice) {
            itemHtml += `<p>Cena: <b>${item.transport.pricing.nettoTotalPrice} PLN netto</b> <span style="color: #888888;">(${item.transport.pricing.totalPrice} PLN brutto)</span></p>`
          } else {
            itemHtml += `<p>Cena: Do wyceny</p>`
          }
        }

        // Handle extras for activity
        if (item.extras && item.extras.length > 0) {
          itemHtml += `<h3>Dodatki</h3><ul>`
          item.extras.forEach(
            (extra: {
              name: string
              count: number
              pricing: {
                totalPrice: number
                nettoTotalPrice: number
                pricingModel?: 'fixed' | 'per_unit' | 'threshold' | 'individual'
              }
            }) => {
              const isIndividual = extra.pricing.pricingModel === 'individual'
              itemHtml += `<li>${extra.name} - <b>${isIndividual ? 'Wycena indywidualna' : `${extra.pricing.nettoTotalPrice} PLN netto <span style="color: #888888;">(${extra.pricing.totalPrice} PLN brutto)</span>`}</b>${isIndividual ? ' <span style="color: #F67258; font-weight: bold;"></span>' : ''}</li>`
            }
          )
          itemHtml += `</ul>`
        }

        // Add total price for the whole item at the very end (after all components)
        itemHtml += `<div style="margin-top: 15px; padding: 10px; background-color: #f8f8f8; border-radius: 5px;">
          <p style="font-size: 1.2em; font-weight: bold; margin: 0;">Łączna cena: <span style="color: #45051c;">${item.totalNettoPrice} PLN netto</span> <span style="color: #888888; font-size: 0.9em;">(${item.totalPrice} PLN brutto)</span></p>
        </div>`
      }
      // Handle extras-only items
      else if (!item.hotels?.length && !item.activities?.length && item.extras && item.extras.length > 0) {
        itemHtml += `<h3>Zestaw dodatków</h3>`

        itemHtml += `<p><b>Dodatki:</b></p><ul>`
        item.extras.forEach(
          (extra: {
            name: string
            count: number
            pricing: {
              totalPrice: number
              nettoTotalPrice: number
              pricingModel?: 'fixed' | 'per_unit' | 'threshold' | 'individual'
            }
          }) => {
            const isIndividual = extra.pricing.pricingModel === 'individual'
            itemHtml += `<li>${extra.name} - <b>${isIndividual ? 'Wycena indywidualna' : `${extra.pricing.nettoTotalPrice} PLN netto <span style="color: #888888;">(${extra.pricing.totalPrice} PLN brutto)</span>`}</b>${isIndividual ? ' <span style="color: #F67258; font-weight: bold;"></span>' : ''}</li>`
          }
        )
        itemHtml += `</ul>`

        // Add total price for extras-only items
        itemHtml += `<div style="margin-top: 15px; padding: 10px; background-color: #f8f8f8; border-radius: 5px;">
          <p style="font-size: 1.2em; font-weight: bold; margin: 0;">Łączna cena: <span style="color: #45051c;">${item.totalNettoPrice} PLN netto</span> <span style="color: #888888; font-size: 0.9em;">(${item.totalPrice} PLN brutto)</span></p>
        </div>`
      }

      itemHtml += `</div>`
      return itemHtml
    })
    .join('')

  // Always in Polish
  return `
    <h2>Nowe zapytanie o wycenę (ID: ${quoteId})</h2>
    <p>Email: <b>${email}</b></p>
    ${!!phone && phone !== '+48' ? `<p>Telefon: <b>${phone}</b></p>` : ''}
    ${!!additionalInfo ? `<p>Dodatkowe informacje:<br>${additionalInfo.replace(/\n/g, '<br>')}</p>` : ''}
    <p>Zapisano do newslettera: <b>${newsletter ? 'Tak' : 'Nie'}</b></p>
    <hr>
    <h3>Szczegóły wyceny:</h3>
    <p>Liczba uczestników: <b>${participantCount}</b></p>
    <p>Wybrane terminy:</p>
    ${datesHtml}
    <h3>Pozycje:</h3>
    ${itemsHtml}
  `
}

// User confirmation template - language specific
const userConfirmationTemplate = ({ email, quoteId, lang }: { email: string; quoteId: string; lang: string }) => {
  if (lang === 'en') {
    return `
      <h2>Thank you for your quote request</h2>
      <p>Hello,</p>
      <p>Thank you for requesting a quote from Fabryka Atrakcji. We have received your request and will prepare a detailed quote for you as soon as possible.</p>
      <p>Your quote reference number: <b>${quoteId}</b></p>
      <p>Please keep this number for future reference. We will contact you via the email address you provided (${email}).</p>
      <p>Best regards,<br>Fabryka Atrakcji Team</p>
    `
  } else {
    return `
      <h2>Dziękujemy za prośbę o wycenę</h2>
      <p>Cześć,</p>
      <p>Dziękujemy za wysłanie prośby o wycenę do Fabryki Atrakcji. Otrzymaliśmy Twoje zapytanie i przygotujemy dla Ciebie szczegółową wycenę tak szybko, jak to możliwe.</p>
      <p>Twój numer referencyjny wyceny: <b>${quoteId}</b></p>
      <p>Prosimy o zachowanie tego numeru. Skontaktujemy się z Tobą poprzez adres email, który podałeś (${email}).</p>
      <p>Z poważaniem,<br>Zespół Fabryki Atrakcji</p>
    `
  }
}

type Props = {
  email: string
  phone?: string
  additionalInfo?: string
  legal: boolean
  newsletter: boolean
  quoteId: string
  quoteRecipients: string[]
  lang: string
  quote: any
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const { email, phone, additionalInfo, legal, newsletter, quoteId, quoteRecipients, lang, quote } =
      (await request.json()) as Props

    // Validate required fields
    if (!REGEX.email.test(email) || !legal || !quoteId || !quoteRecipients?.length) {
      return new Response(JSON.stringify({ message: 'Missing required fields', success: false }), { status: 400 })
    }

    // Extract necessary quote details for the template
    const { participantCount, selectedDates, items } = quote

    // Define success response
    const successResponse = {
      message: 'Quote sent successfully',
      success: true,
      redirectUrl: lang === 'pl' ? '/pl/strona-podziekowania' : '/en/thank-you',
    }

    // Define error response
    const errorResponse = {
      message: 'Failed to send quote',
      success: false,
    }

    // Send email to business with quote details (always in Polish)
    const businessEmailRes = await fetch(`https://api.resend.com/emails`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: `Zapytanie o wycenę <wycena@send.fabryka-atrakcji.com>`,
        to: quoteRecipients,
        reply_to: email,
        subject: `Nowe zapytanie o wycenę (ID: ${quoteId})`,
        html: quoteTemplate({
          email,
          phone,
          additionalInfo,
          quoteId,
          participantCount,
          selectedDates,
          items,
          newsletter,
        }),
        text: htmlToString(
          quoteTemplate({
            email,
            phone,
            additionalInfo,
            quoteId,
            participantCount,
            selectedDates,
            items,
            newsletter,
          })
        ),
      }),
    })

    if (businessEmailRes.status !== 200) {
      return new Response(JSON.stringify(errorResponse), { status: 400 })
    }

    // Send confirmation email to user
    const userEmailRes = await fetch(`https://api.resend.com/emails`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: `Fabryka Atrakcji <wycena@send.fabryka-atrakcji.com>`,
        to: email,
        subject: `${lang === 'en' ? 'Your Quote Request Confirmation' : 'Potwierdzenie zapytania o wycenę'}`,
        html: userConfirmationTemplate({ email, quoteId, lang }),
        text: htmlToString(userConfirmationTemplate({ email, quoteId, lang })),
      }),
    })

    // Return success response even if user email failed (quote was still sent)
    return new Response(JSON.stringify(successResponse), { status: 200 })
  } catch (error) {
    console.error('Error processing quote submission:', error)
    return new Response(JSON.stringify({ message: 'An error occurred while sending the quote', success: false }), {
      status: 400,
    })
  }
}
