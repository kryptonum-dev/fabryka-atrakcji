import { defineType, defineField } from 'sanity'
import { Hotel, Users, Bus, PlusCircle, Package, Receipt } from 'lucide-react'

export default defineType({
  name: 'quoteItem',
  title: 'Element wyceny',
  type: 'object',
  preview: {
    select: {
      type: 'type',
      hotelName: 'hotels.0.name',
      activities: 'activities',
      extras: 'extras',
      totalPrice: 'totalPrice',
      totalNettoPrice: 'totalNettoPrice',
      activityName: 'activities.0.name',
      activityPrice: 'activities.0.pricing.finalPrice',
      activityNettoPrice: 'activities.0.pricing.nettoFinalPrice',
      activityParticipantCount: 'activities.0.pricing.participantCount',
      activityMin: 'activities.0.participantsCount.min',
      activityMax: 'activities.0.participantsCount.max',
    },
    prepare({
      type,
      hotelName,
      activities,
      extras,
      totalPrice = 0,
      totalNettoPrice = 0,
      activityName,
      activityPrice = 0,
      activityNettoPrice = 0,
      activityParticipantCount = 0,
      activityMin,
      activityMax,
    }) {
      // Determine title based on type
      let title = ''
      let icon = Receipt

      // Count activities and extras
      const activityCount = activities ? Object.keys(activities).length : 0
      const extrasCount = extras ? Object.keys(extras).length : 0

      if (type === 'hotel' && hotelName) {
        // For hotel type: Show hotel name + activity count + extras
        title = hotelName
        icon = Hotel

        if (activityCount > 0) {
          // Use proper Polish plural forms for activities
          let activityText = 'atrakcji'
          if (activityCount === 1) {
            activityText = 'atrakcja'
          } else if (activityCount >= 2 && activityCount <= 4) {
            activityText = 'atrakcje'
          }

          title += ` + ${activityCount} ${activityText}`
        }

        // Add extras if present
        if (extrasCount > 0) {
          title += ' + dodatki'
        }
      } else if (type === 'activity' && activityName) {
        // For activity type: Show activity name + extras
        title = activityName
        icon = Users

        // Add extras if present
        if (extrasCount > 0) {
          title += ' + dodatki'
        }
      }

      // Format price - use netto prices as primary, fallback to activityNettoPrice if totalNettoPrice is 0
      let nettoToShow = totalNettoPrice
      let bruttoToShow = totalPrice

      if (type === 'activity' && (totalNettoPrice === 0 || !totalNettoPrice) && activityNettoPrice) {
        nettoToShow = activityNettoPrice
        bruttoToShow = activityPrice
      }

      const formattedNettoPrice = new Intl.NumberFormat('pl-PL', {
        style: 'currency',
        currency: 'PLN',
        minimumFractionDigits: 0,
      }).format(nettoToShow)

      const formattedBruttoPrice = new Intl.NumberFormat('pl-PL', {
        style: 'currency',
        currency: 'PLN',
        minimumFractionDigits: 0,
      }).format(bruttoToShow)

      // For activity type, add participant count if available
      let subtitle = `Cena: ${formattedNettoPrice} netto`

      if (type === 'activity' && activityParticipantCount) {
        // Get correct Polish form for participants
        let personText = 'osób'
        if (activityParticipantCount === 1) {
          personText = 'osoba'
        } else if (activityParticipantCount >= 2 && activityParticipantCount <= 4) {
          personText = 'osoby'
        }

        // Add participant count and price info
        subtitle = `${activityParticipantCount} ${personText}`

        // Add min/max range if available
        if (activityMin && activityMax) {
          subtitle += ` / ${activityMin}-${activityMax} osób`
        }

        // Add the netto price
        subtitle += ` • ${formattedNettoPrice} netto`
      }

      // Add brutto price below
      subtitle += `\n${formattedBruttoPrice} brutto`

      return {
        title: title || 'Wycena',
        subtitle,
        media: icon,
      }
    },
  },
  fields: [
    defineField({
      name: 'type',
      title: 'Typ',
      type: 'string',
      options: {
        list: [
          { title: 'Hotel', value: 'hotel' },
          { title: 'Integracja', value: 'activity' },
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      hidden: true,
    }),
    defineField({
      name: 'totalPrice',
      title: 'Cena całkowita brutto (PLN)',
      type: 'number',
      description: 'Suma wszystkich usług w złotych polskich (brutto)',
    }),
    defineField({
      name: 'totalNettoPrice',
      title: 'Cena całkowita netto (PLN)',
      type: 'number',
      description: 'Suma wszystkich usług w złotych polskich (netto)',
    }),
    defineField({
      name: 'hotels',
      title: 'Hotele',
      type: 'array',
      hidden: ({ parent }) => parent?.type === 'activity',
      of: [
        {
          type: 'object',
          preview: {
            select: {
              name: 'name',
              finalPrice: 'pricing.finalPrice',
              participantCount: 'pricing.participantCount',
              exceedsMaxPeople: 'pricing.exceedsMaxPeople',
              maxPeople: 'maxPeople',
              addons: 'addons',
              pricingNotVisible: 'pricing.pricingNotVisible',
              pricingModel: 'pricing.pricingModel',
            },
            prepare({
              name,
              finalPrice = 0,
              participantCount = 0,
              exceedsMaxPeople,
              maxPeople,
              addons,
              pricingNotVisible,
              pricingModel,
            }) {
              // Check if pricing is not visible
              if (pricingNotVisible || pricingModel === 'individual') {
                let title = name || 'Hotel'
                if (addons && addons.length > 0) {
                  title += ' + dodatki'
                }

                // Create description text with max capacity info
                let description = `${participantCount} `

                // Get correct Polish form for participants
                if (participantCount === 1) {
                  description += 'osoba'
                } else if (participantCount >= 2 && participantCount <= 4) {
                  description += 'osoby'
                } else {
                  description += 'osób'
                }

                if (maxPeople) {
                  description += ` / maks. ${maxPeople} osób`
                }

                if (exceedsMaxPeople) {
                  description += ' (przekracza limit)'
                }

                return {
                  title,
                  subtitle: `${description} • Wycena indywidualna`,
                  media: Hotel,
                }
              }

              // Format price in Polish currency
              const formattedPrice = new Intl.NumberFormat('pl-PL', {
                style: 'currency',
                currency: 'PLN',
                minimumFractionDigits: 0,
              }).format(finalPrice)

              // Create description text with max capacity info
              let description = `${participantCount} `

              // Get correct Polish form for participants
              if (participantCount === 1) {
                description += 'osoba'
              } else if (participantCount >= 2 && participantCount <= 4) {
                description += 'osoby'
              } else {
                description += 'osób'
              }

              if (maxPeople) {
                description += ` / maks. ${maxPeople} osób`
              }

              if (exceedsMaxPeople) {
                description += ' (przekracza limit)'
              }

              // Add title with addons indication
              let title = name || 'Hotel'
              if (addons && addons.length > 0) {
                title += ' + dodatki'
              }

              return {
                title,
                subtitle: `${description} • ${formattedPrice}`,
                media: Hotel,
              }
            },
          },
          fields: [
            defineField({
              name: 'name',
              title: 'Nazwa',
              type: 'string',
            }),
            defineField({
              name: 'itemId',
              title: 'ID',
              type: 'string',
              hidden: true,
            }),
            defineField({
              name: 'slug',
              title: 'Slug',
              type: 'string',
            }),
            defineField({
              name: 'maxPeople',
              title: 'Maksymalna liczba osób',
              type: 'number',
              description: 'Maksymalna liczba osób w hotelu',
            }),
            defineField({
              name: 'pricing',
              title: 'Cennik',
              type: 'object',
              fields: [
                defineField({
                  name: 'finalPrice',
                  title: 'Cena finalna brutto (PLN)',
                  type: 'number',
                  description: 'Ostateczna cena brutto w złotych polskich',
                  hidden: ({ parent }) => parent?.pricingNotVisible === true,
                }),
                defineField({
                  name: 'nettoFinalPrice',
                  title: 'Cena finalna netto (PLN)',
                  type: 'number',
                  description: 'Ostateczna cena netto w złotych polskich',
                  hidden: ({ parent }) => parent?.pricingNotVisible === true,
                }),
                defineField({
                  name: 'participantCount',
                  title: 'Liczba uczestników',
                  type: 'number',
                  description: 'Liczba osób, dla której wyliczono cenę',
                }),
                defineField({
                  name: 'exceedsMaxPeople',
                  title: 'Przekracza maksymalną liczbę osób',
                  type: 'boolean',
                }),
                defineField({
                  name: 'pricingModel',
                  title: 'Model cenowy',
                  type: 'string',
                  options: {
                    list: [
                      { title: 'Stała cena', value: 'fixed' },
                      { title: 'Za jednostkę', value: 'per_unit' },
                      { title: 'Progowy', value: 'threshold' },
                      { title: 'Indywidualny', value: 'individual' },
                    ],
                    layout: 'radio',
                  },
                }),
                defineField({
                  name: 'pricingNotVisible',
                  title: 'Cennik nie jest widoczny publicznie',
                  type: 'boolean',
                }),
              ],
            }),
            defineField({
              name: 'addons',
              title: 'Dodatki',
              type: 'array',
              of: [
                {
                  type: 'object',
                  preview: {
                    select: {
                      name: 'name',
                      count: 'count',
                      totalPrice: 'pricing.totalPrice',
                      pricingModel: 'pricing.pricingModel',
                    },
                    prepare({ name, count = 1, totalPrice = 0, pricingModel = 'fixed' }) {
                      // Format price in Polish currency
                      const formattedPrice = new Intl.NumberFormat('pl-PL', {
                        style: 'currency',
                        currency: 'PLN',
                        minimumFractionDigits: 0,
                      }).format(totalPrice)

                      // Get pricing model in Polish
                      let modelText = 'Stała cena'
                      if (pricingModel === 'per_unit') modelText = 'Za jednostkę'
                      if (pricingModel === 'threshold') modelText = 'Progowy'
                      if (pricingModel === 'individual') modelText = 'Indywidualny'

                      return {
                        title: name || 'Dodatek',
                        subtitle: `${count > 1 ? `${count}x • ` : ''}${formattedPrice} • ${modelText}`,
                        media: PlusCircle,
                      }
                    },
                  },
                  fields: [
                    defineField({
                      name: 'name',
                      title: 'Nazwa',
                      type: 'string',
                    }),
                    defineField({
                      name: 'itemId',
                      title: 'ID',
                      type: 'string',
                      hidden: true,
                    }),
                    defineField({
                      name: 'count',
                      title: 'Ilość',
                      type: 'number',
                    }),
                    defineField({
                      name: 'pricing',
                      title: 'Cennik',
                      type: 'object',
                      fields: [
                        defineField({
                          name: 'totalPrice',
                          title: 'Cena całkowita brutto (PLN)',
                          type: 'number',
                          description: 'Wartość brutto w złotych polskich',
                        }),
                        defineField({
                          name: 'nettoTotalPrice',
                          title: 'Cena całkowita netto (PLN)',
                          type: 'number',
                          description: 'Wartość netto w złotych polskich',
                        }),
                        defineField({
                          name: 'pricingModel',
                          title: 'Model cenowy',
                          type: 'string',
                          options: {
                            list: [
                              { title: 'Stała cena', value: 'fixed' },
                              { title: 'Za jednostkę', value: 'per_unit' },
                              { title: 'Progowy', value: 'threshold' },
                              { title: 'Indywidualny', value: 'individual' },
                            ],
                            layout: 'radio',
                          },
                        }),
                      ],
                    }),
                  ],
                },
              ],
            }),
          ],
        },
      ],
    }),
    defineField({
      name: 'activities',
      title: 'Integracje',
      type: 'array',
      of: [
        {
          type: 'object',
          preview: {
            select: {
              name: 'name',
              finalPrice: 'pricing.finalPrice',
              participantCount: 'pricing.participantCount',
              exceedsMaxPeople: 'pricing.exceedsMaxPeople',
              belowMinPeople: 'pricing.belowMinPeople',
              participantsCount: 'participantsCount',
              addons: 'addons',
            },
            prepare({
              name,
              finalPrice = 0,
              participantCount = 0,
              exceedsMaxPeople,
              belowMinPeople,
              participantsCount,
              addons,
            }) {
              // Format price in Polish currency
              const formattedPrice = new Intl.NumberFormat('pl-PL', {
                style: 'currency',
                currency: 'PLN',
                minimumFractionDigits: 0,
              }).format(finalPrice || 0)

              // Create description text with min/max capacity
              let description = `${participantCount || 0} `

              // Get correct Polish form for participants
              if (participantCount === 1) {
                description += 'osoba'
              } else if (participantCount >= 2 && participantCount <= 4) {
                description += 'osoby'
              } else {
                description += 'osób'
              }

              // Add min-max participants info if available
              if (participantsCount && participantsCount.min && participantsCount.max) {
                description += ` / ${participantsCount.min}-${participantsCount.max} osób`
              }

              if (exceedsMaxPeople) {
                description += ' (przekracza limit)'
              }

              if (belowMinPeople) {
                description += ' (poniżej minimum)'
              }

              // Add title with addons indication
              let title = name || 'Integracja'
              if (addons && addons.length > 0) {
                title += ' + dodatki'
              }

              return {
                title,
                subtitle: `${description} • ${formattedPrice}`,
                media: Users,
              }
            },
          },
          fields: [
            defineField({
              name: 'name',
              title: 'Nazwa',
              type: 'string',
            }),
            defineField({
              name: 'itemId',
              title: 'ID',
              type: 'string',
              // hidden: true,
            }),
            defineField({
              name: 'slug',
              title: 'Slug',
              type: 'string',
            }),
            defineField({
              name: 'participantsCount',
              title: 'Limit uczestników',
              type: 'object',
              fields: [
                defineField({
                  name: 'min',
                  title: 'Minimalna liczba osób',
                  type: 'number',
                }),
                defineField({
                  name: 'max',
                  title: 'Maksymalna liczba osób',
                  type: 'number',
                }),
              ],
            }),
            defineField({
              name: 'pricing',
              title: 'Cennik',
              type: 'object',
              fields: [
                defineField({
                  name: 'finalPrice',
                  title: 'Cena finalna brutto (PLN)',
                  type: 'number',
                  description: 'Ostateczna cena brutto w złotych polskich',
                }),
                defineField({
                  name: 'nettoFinalPrice',
                  title: 'Cena finalna netto (PLN)',
                  type: 'number',
                  description: 'Ostateczna cena netto w złotych polskich',
                }),
                defineField({
                  name: 'participantCount',
                  title: 'Liczba uczestników',
                  type: 'number',
                  description: 'Liczba osób, dla której wyliczono cenę',
                }),
                defineField({
                  name: 'exceedsMaxPeople',
                  title: 'Przekracza maksymalną liczbę osób',
                  type: 'boolean',
                }),
                defineField({
                  name: 'belowMinPeople',
                  title: 'Poniżej minimalnej liczby osób',
                  type: 'boolean',
                }),
              ],
            }),
            defineField({
              name: 'addons',
              title: 'Dodatki',
              type: 'array',
              of: [
                {
                  type: 'object',
                  preview: {
                    select: {
                      name: 'name',
                      count: 'count',
                      totalPrice: 'pricing.totalPrice',
                      pricingModel: 'pricing.pricingModel',
                    },
                    prepare({ name, count = 1, totalPrice = 0, pricingModel = 'fixed' }) {
                      // Format price in Polish currency
                      const formattedPrice = new Intl.NumberFormat('pl-PL', {
                        style: 'currency',
                        currency: 'PLN',
                        minimumFractionDigits: 0,
                      }).format(totalPrice)

                      // Get pricing model in Polish
                      let modelText = 'Stała cena'
                      if (pricingModel === 'per_unit') modelText = 'Za jednostkę'
                      if (pricingModel === 'threshold') modelText = 'Progowy'
                      if (pricingModel === 'individual') modelText = 'Indywidualny'

                      return {
                        title: name || 'Dodatek',
                        subtitle: `${count > 1 ? `${count}x • ` : ''}${formattedPrice} • ${modelText}`,
                        media: PlusCircle,
                      }
                    },
                  },
                  fields: [
                    defineField({
                      name: 'name',
                      title: 'Nazwa',
                      type: 'string',
                    }),
                    defineField({
                      name: 'itemId',
                      title: 'ID',
                      type: 'string',
                      // hidden: true,
                    }),
                    defineField({
                      name: 'count',
                      title: 'Ilość',
                      type: 'number',
                    }),
                    defineField({
                      name: 'pricing',
                      title: 'Cennik',
                      type: 'object',
                      fields: [
                        defineField({
                          name: 'totalPrice',
                          title: 'Cena całkowita brutto (PLN)',
                          type: 'number',
                          description: 'Wartość brutto w złotych polskich',
                        }),
                        defineField({
                          name: 'nettoTotalPrice',
                          title: 'Cena całkowita netto (PLN)',
                          type: 'number',
                          description: 'Wartość netto w złotych polskich',
                        }),
                        defineField({
                          name: 'pricingModel',
                          title: 'Model cenowy',
                          type: 'string',
                          options: {
                            list: [
                              { title: 'Stała cena', value: 'fixed' },
                              { title: 'Za jednostkę', value: 'per_unit' },
                              { title: 'Progowy', value: 'threshold' },
                              { title: 'Indywidualny', value: 'individual' },
                            ],
                            layout: 'radio',
                          },
                        }),
                      ],
                    }),
                  ],
                },
              ],
            }),
          ],
        },
      ],
    }),
    defineField({
      name: 'transport',
      title: 'Transport',
      type: 'object',
      preview: {
        select: {
          distance: 'distance',
          totalPrice: 'pricing.totalPrice',
          basePrice: 'pricing.basePrice',
          distancePrice: 'pricing.distancePrice',
          noTransportAddress: 'noTransportAddress',
          hotelNoAddress: 'hotelNoAddress',
        },
        prepare({
          distance = 0,
          totalPrice = 0,
          basePrice = 0,
          distancePrice = 0,
          noTransportAddress,
          hotelNoAddress,
        }) {
          // Format prices in Polish currency
          const formattedTotalPrice = new Intl.NumberFormat('pl-PL', {
            style: 'currency',
            currency: 'PLN',
            minimumFractionDigits: 0,
          }).format(totalPrice)

          let subtitle = ''

          if (distance > 0) {
            subtitle = `${distance} km • ${formattedTotalPrice}`
          } else {
            subtitle = formattedTotalPrice

            // Add status info if applicable
            if (noTransportAddress) subtitle += ' • Brak adresu odbioru'
            if (hotelNoAddress) subtitle += ' • Hotel bez adresu'
          }

          return {
            title: 'Transport',
            subtitle,
            media: Bus,
          }
        },
      },
      fields: [
        defineField({
          name: 'distance',
          title: 'Dystans (km)',
          type: 'number',
        }),
        defineField({
          name: 'itemId',
          title: 'ID',
          type: 'string',
          hidden: true,
        }),
        defineField({
          name: 'peoplePerBus',
          title: 'Liczba osób w autobusie',
          type: 'number',
        }),
        defineField({
          name: 'numberOfBuses',
          title: 'Liczba autobusów',
          type: 'number',
        }),
        defineField({
          name: 'maxKilometers',
          title: 'Maksymalny dystans w cenie podstawowej (km)',
          type: 'number',
        }),
        defineField({
          name: 'pricing',
          title: 'Cennik',
          type: 'object',
          options: {
            collapsed: false,
            collapsible: false,
          },
          fields: [
            defineField({
              name: 'basePrice',
              title: 'Cena podstawowa (PLN)',
              type: 'number',
              description: 'Wartość w złotych polskich',
            }),
            defineField({
              name: 'distancePrice',
              title: 'Cena za dystans (PLN)',
              type: 'number',
              description: 'Wartość w złotych polskich',
            }),
            defineField({
              name: 'totalPrice',
              title: 'Cena całkowita brutto (PLN)',
              type: 'number',
              description: 'Wartość brutto w złotych polskich',
            }),
            defineField({
              name: 'nettoTotalPrice',
              title: 'Cena całkowita netto (PLN)',
              type: 'number',
              description: 'Wartość netto w złotych polskich',
            }),
            defineField({
              name: 'pricePerKm',
              title: 'Cena za kilometr (PLN/km)',
              type: 'number',
              description: 'Wartość w złotych polskich za kilometr',
            }),
          ],
        }),
        // Status fields for different scenarios
        defineField({
          name: 'transportAddressNotFound',
          title: 'Nie znaleziono adresu odbioru',
          type: 'boolean',
          hidden: ({ value }) => !value,
        }),
        defineField({
          name: 'noTransportAddress',
          title: 'Brak adresu odbioru',
          type: 'boolean',
          hidden: ({ value }) => !value,
        }),
        defineField({
          name: 'hotelNoAddress',
          title: 'Hotel bez adresu',
          type: 'boolean',
          hidden: ({ value }) => !value,
        }),
        defineField({
          name: 'hotelAddressNotFound',
          title: 'Nie znaleziono adresu hotelu',
          type: 'boolean',
          hidden: ({ value }) => !value,
        }),
        defineField({
          name: 'bothAddressesNotFound',
          title: 'Nie znaleziono obu adresów',
          type: 'boolean',
          hidden: true,
        }),
        defineField({
          name: 'activityNoAddress',
          title: 'Integracja bez adresu',
          type: 'boolean',
          hidden: true,
        }),
        // NEW: Activity address-specific fields
        defineField({
          name: 'activityAddressNotFound',
          title: 'Nie znaleziono adresu integracji',
          type: 'boolean',
          hidden: ({ value }) => !value,
        }),
        defineField({
          name: 'userSelectedActivityAddressNotFound',
          title: 'Nie znaleziono adresu wybranego przez użytkownika dla integracji',
          type: 'boolean',
          hidden: ({ value }) => !value,
        }),
        defineField({
          name: 'nationwideActivityNoUserAddress',
          title: 'Integracja ogólnopolska bez adresu użytkownika',
          type: 'boolean',
          hidden: ({ value }) => !value,
        }),
        defineField({
          name: 'activityAddressSource',
          title: 'Źródło adresu integracji',
          type: 'string',
          options: {
            list: [
              { title: 'Adres dedykowany integracji', value: 'dedicated' },
              { title: 'Adres wybrany przez użytkownika', value: 'user_selected' },
              { title: 'Brak adresu', value: 'none' },
            ],
          },
          hidden: ({ value }) => !value || value === 'none',
        }),
        defineField({
          name: 'usingUserSelectedAddress',
          title: 'Używa adresu wybranego przez użytkownika',
          type: 'boolean',
          hidden: ({ value }) => !value,
        }),
      ],
    }),
    defineField({
      name: 'extras',
      title: 'Dodatki',
      type: 'array',
      of: [
        {
          type: 'object',
          preview: {
            select: {
              name: 'name',
              count: 'count',
              totalPrice: 'pricing.totalPrice',
              pricingModel: 'pricing.pricingModel',
            },
            prepare({ name, count = 1, totalPrice = 0, pricingModel = 'fixed' }) {
              // Format price in Polish currency
              const formattedPrice = new Intl.NumberFormat('pl-PL', {
                style: 'currency',
                currency: 'PLN',
                minimumFractionDigits: 0,
              }).format(totalPrice)

              // Get pricing model in Polish
              let modelText = 'Stała cena'
              if (pricingModel === 'per_unit') modelText = 'Za jednostkę'
              if (pricingModel === 'threshold') modelText = 'Progowy'
              if (pricingModel === 'individual') modelText = 'Indywidualny'

              return {
                title: name || 'Dodatek',
                subtitle: `${count > 1 ? `${count}x • ` : ''}${formattedPrice} • ${modelText}`,
                media: Package,
              }
            },
          },
          fields: [
            defineField({
              name: 'name',
              title: 'Nazwa',
              type: 'string',
            }),
            defineField({
              name: 'itemId',
              title: 'ID',
              type: 'string',
              hidden: true,
            }),

            defineField({
              name: 'count',
              title: 'Ilość',
              type: 'number',
            }),
            defineField({
              name: 'pricing',
              title: 'Cennik',
              type: 'object',
              fields: [
                defineField({
                  name: 'totalPrice',
                  title: 'Cena całkowita brutto (PLN)',
                  type: 'number',
                  description: 'Wartość brutto w złotych polskich',
                }),
                defineField({
                  name: 'nettoTotalPrice',
                  title: 'Cena całkowita netto (PLN)',
                  type: 'number',
                  description: 'Wartość netto w złotych polskich',
                }),
                defineField({
                  name: 'pricingModel',
                  title: 'Model cenowy',
                  type: 'string',
                  options: {
                    list: [
                      { title: 'Stała cena', value: 'fixed' },
                      { title: 'Za jednostkę', value: 'per_unit' },
                      { title: 'Progowy', value: 'threshold' },
                      { title: 'Indywidualny', value: 'individual' },
                    ],
                    layout: 'radio',
                  },
                }),
                defineField({
                  name: 'isTransport',
                  title: 'Czy transport',
                  type: 'boolean',
                  hidden: true,
                }),
              ],
            }),
          ],
        },
      ],
    }),
  ],
})
