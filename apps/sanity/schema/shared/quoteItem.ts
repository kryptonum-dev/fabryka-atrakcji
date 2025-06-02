import { defineType, defineField } from 'sanity'
import { Hotel, Users, Bus, PlusCircle, Package, Receipt, Utensils } from 'lucide-react'

export default defineType({
  name: 'quoteItem',
  title: 'Element wyceny',
  type: 'object',
  preview: {
    select: {
      type: 'type',
      hotelName: 'hotels.0.name',
      hotels: 'hotels',
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
      hotels,
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
      // Calculate gastronomy contribution if hotels have gastronomy
      let gastronomyPrice = 0
      let gastronomyNettoPrice = 0
      let gastronomyCount = 0

      if (hotels && Array.isArray(hotels)) {
        hotels.forEach((hotel: any) => {
          if (hotel.gastronomy && Array.isArray(hotel.gastronomy)) {
            hotel.gastronomy.forEach((gastronomyItem: any) => {
              if (
                gastronomyItem.pricing &&
                !gastronomyItem.pricing.unavailable &&
                !gastronomyItem.pricing.pricingNotVisible
              ) {
                gastronomyPrice += gastronomyItem.pricing.totalPrice || 0
                gastronomyNettoPrice += gastronomyItem.pricing.nettoTotalPrice || 0
                gastronomyCount += gastronomyItem.count || 0
              }
            })
          }
        })
      }

      // Determine title based on type
      let title = ''
      let icon = Receipt

      // Count activities and extras
      const activityCount = activities ? Object.keys(activities).length : 0
      const extrasCount = extras ? Object.keys(extras).length : 0

      if (type === 'hotel' && hotelName) {
        // For hotel type: Show hotel name + activity count + gastronomy + extras
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

        // Add gastronomy if present
        if (gastronomyCount > 0) {
          let gastronomyText = 'usług gastronomicznych'
          if (gastronomyCount === 1) {
            gastronomyText = 'usługa gastronomiczna'
          } else if (gastronomyCount >= 2 && gastronomyCount <= 4) {
            gastronomyText = 'usługi gastronomiczne'
          }

          title += ` + ${gastronomyCount} ${gastronomyText}`
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

      // Calculate total prices including gastronomy
      let nettoToShow = totalNettoPrice + gastronomyNettoPrice
      let bruttoToShow = totalPrice + gastronomyPrice

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
              nettoFinalPrice: 'pricing.nettoFinalPrice',
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
              nettoFinalPrice = 0,
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
              }).format(nettoFinalPrice)

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
                  hidden: ({ parent }) => parent?.pricingNotVisible === true || parent?.pricingModel === 'individual',
                }),
                defineField({
                  name: 'nettoFinalPrice',
                  title: 'Cena finalna netto (PLN)',
                  type: 'number',
                  description: 'Ostateczna cena netto w złotych polskich',
                  hidden: ({ parent }) => parent?.pricingNotVisible === true || parent?.pricingModel === 'individual',
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
                      nettoTotalPrice: 'pricing.nettoTotalPrice',
                      pricingModel: 'pricing.pricingModel',
                    },
                    prepare({ name, count = 1, totalPrice = 0, nettoTotalPrice = 0, pricingModel = 'fixed' }) {
                      // Get pricing model in Polish
                      let modelText = 'Stała cena'
                      if (pricingModel === 'per_unit') modelText = 'Za jednostkę'
                      if (pricingModel === 'threshold') modelText = 'Progowy'
                      if (pricingModel === 'individual') modelText = 'Indywidualny'

                      // Format price or show individual pricing text
                      let priceText = ''
                      if (pricingModel === 'individual') {
                        priceText = 'Wycena indywidualna'
                      } else {
                        const formattedPrice = new Intl.NumberFormat('pl-PL', {
                          style: 'currency',
                          currency: 'PLN',
                          minimumFractionDigits: 0,
                        }).format(nettoTotalPrice)
                        priceText = formattedPrice
                      }

                      return {
                        title: name || 'Dodatek',
                        subtitle: `${count > 1 ? `${count}x • ` : ''}${priceText} • ${modelText}`,
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
                          hidden: ({ parent }) => parent?.pricingModel === 'individual',
                        }),
                        defineField({
                          name: 'nettoTotalPrice',
                          title: 'Cena całkowita netto (PLN)',
                          type: 'number',
                          description: 'Wartość netto w złotych polskich',
                          hidden: ({ parent }) => parent?.pricingModel === 'individual',
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
            defineField({
              name: 'gastronomy',
              title: 'Gastronomia',
              type: 'array',
              of: [
                {
                  type: 'object',
                  preview: {
                    select: {
                      name: 'name',
                      type: 'type',
                      count: 'count',
                      totalPrice: 'pricing.totalPrice',
                      nettoTotalPrice: 'pricing.nettoTotalPrice',
                      pricingNotVisible: 'pricing.pricingNotVisible',
                      unavailable: 'pricing.unavailable',
                    },
                    prepare({
                      name,
                      type,
                      count = 1,
                      totalPrice = 0,
                      nettoTotalPrice = 0,
                      pricingNotVisible,
                      unavailable,
                    }) {
                      // Get type icon based on gastronomy type
                      let typeText = type
                      if (type === 'lunch') typeText = 'Obiad'
                      if (type === 'supper') typeText = 'Kolacja'
                      if (type === 'coffee-break') typeText = 'Przerwa kawowa'
                      if (type === 'grill') typeText = 'Grill'
                      if (type === 'open-bar') typeText = 'Open bar'

                      // Format price based on availability and visibility
                      // IMPORTANT: Check flags first, don't show price even if totalPrice has a value
                      let formattedPrice = ''
                      if (unavailable === true) {
                        formattedPrice = 'Niedostępne'
                      } else if (pricingNotVisible === true) {
                        formattedPrice = 'Cena ukryta'
                      } else {
                        // Only show price if both flags are false/undefined
                        formattedPrice = new Intl.NumberFormat('pl-PL', {
                          style: 'currency',
                          currency: 'PLN',
                          minimumFractionDigits: 0,
                        }).format(nettoTotalPrice)
                      }

                      return {
                        title: name || typeText,
                        subtitle: `${count} usług • ${formattedPrice}`,
                        media: Utensils,
                      }
                    },
                  },
                  fields: [
                    defineField({
                      name: 'type',
                      title: 'Typ gastronomii',
                      type: 'string',
                      options: {
                        list: [
                          { title: 'Obiad', value: 'lunch' },
                          { title: 'Kolacja', value: 'supper' },
                          { title: 'Przerwa kawowa', value: 'coffee-break' },
                          { title: 'Grill', value: 'grill' },
                          { title: 'Open Bar', value: 'open-bar' },
                        ],
                      },
                    }),
                    defineField({
                      name: 'name',
                      title: 'Nazwa',
                      type: 'string',
                    }),
                    defineField({
                      name: 'count',
                      title: 'Liczba usług',
                      type: 'number',
                      description: 'Liczba usług gastronomicznych',
                    }),
                    defineField({
                      name: 'options',
                      title: 'Opcje',
                      type: 'object',
                      fields: [
                        defineField({
                          name: 'level',
                          title: 'Poziom',
                          type: 'string',
                          options: {
                            list: [
                              { title: 'Standard', value: 'standard' },
                              { title: 'Premium', value: 'premium' },
                              { title: 'Luxury', value: 'luxury' },
                            ],
                          },
                        }),
                        defineField({
                          name: 'style',
                          title: 'Styl',
                          type: 'string',
                          options: {
                            list: [
                              { title: 'Bufet', value: 'buffet' },
                              { title: 'Menu', value: 'menu' },
                            ],
                          },
                        }),
                      ],
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
                          hidden: ({ parent }) => parent?.unavailable === true || parent?.pricingNotVisible === true,
                          readOnly: ({ parent }) => parent?.unavailable === true || parent?.pricingNotVisible === true,
                          validation: (Rule) =>
                            Rule.custom((value, context) => {
                              const parent = context.parent as { unavailable?: boolean; pricingNotVisible?: boolean }
                              if (parent?.unavailable === true || parent?.pricingNotVisible === true) {
                                // When unavailable or price not visible, the value should be 0
                                return (
                                  value === 0 ||
                                  value === undefined ||
                                  'Cena powinna być 0 gdy usługa jest niedostępna lub ma ukrytą cenę'
                                )
                              }
                              return true
                            }),
                        }),
                        defineField({
                          name: 'nettoTotalPrice',
                          title: 'Cena całkowita netto (PLN)',
                          type: 'number',
                          description: 'Wartość netto w złotych polskich',
                          hidden: ({ parent }) => parent?.unavailable === true || parent?.pricingNotVisible === true,
                          readOnly: ({ parent }) => parent?.unavailable === true || parent?.pricingNotVisible === true,
                          validation: (Rule) =>
                            Rule.custom((value, context) => {
                              const parent = context.parent as { unavailable?: boolean; pricingNotVisible?: boolean }
                              if (parent?.unavailable === true || parent?.pricingNotVisible === true) {
                                // When unavailable or price not visible, the value should be 0
                                return (
                                  value === 0 ||
                                  value === undefined ||
                                  'Cena powinna być 0 gdy usługa jest niedostępna lub ma ukrytą cenę'
                                )
                              }
                              return true
                            }),
                        }),
                        defineField({
                          name: 'pricingNotVisible',
                          title: 'Cennik nie jest widoczny publicznie',
                          type: 'boolean',
                        }),
                        defineField({
                          name: 'unavailable',
                          title: 'Niedostępne',
                          type: 'boolean',
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
              nettoFinalPrice: 'pricing.nettoFinalPrice',
              participantCount: 'pricing.participantCount',
              exceedsMaxPeople: 'pricing.exceedsMaxPeople',
              belowMinPeople: 'pricing.belowMinPeople',
              participantsCount: 'participantsCount',
              addons: 'addons',
            },
            prepare({
              name,
              finalPrice = 0,
              nettoFinalPrice = 0,
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
              }).format(nettoFinalPrice || 0)

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
                  hidden: ({ parent }) => parent?.pricingNotVisible === true || parent?.pricingModel === 'individual',
                }),
                defineField({
                  name: 'nettoFinalPrice',
                  title: 'Cena finalna netto (PLN)',
                  type: 'number',
                  description: 'Ostateczna cena netto w złotych polskich',
                  hidden: ({ parent }) => parent?.pricingNotVisible === true || parent?.pricingModel === 'individual',
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
                      nettoTotalPrice: 'pricing.nettoTotalPrice',
                      pricingModel: 'pricing.pricingModel',
                    },
                    prepare({ name, count = 1, totalPrice = 0, nettoTotalPrice = 0, pricingModel = 'fixed' }) {
                      // Get pricing model in Polish
                      let modelText = 'Stała cena'
                      if (pricingModel === 'per_unit') modelText = 'Za jednostkę'
                      if (pricingModel === 'threshold') modelText = 'Progowy'
                      if (pricingModel === 'individual') modelText = 'Indywidualny'

                      // Format price or show individual pricing text
                      let priceText = ''
                      if (pricingModel === 'individual') {
                        priceText = 'Wycena indywidualna'
                      } else {
                        const formattedPrice = new Intl.NumberFormat('pl-PL', {
                          style: 'currency',
                          currency: 'PLN',
                          minimumFractionDigits: 0,
                        }).format(nettoTotalPrice)
                        priceText = formattedPrice
                      }

                      return {
                        title: name || 'Dodatek',
                        subtitle: `${count > 1 ? `${count}x • ` : ''}${priceText} • ${modelText}`,
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
                          hidden: ({ parent }) => parent?.pricingModel === 'individual',
                        }),
                        defineField({
                          name: 'nettoTotalPrice',
                          title: 'Cena całkowita netto (PLN)',
                          type: 'number',
                          description: 'Wartość netto w złotych polskich',
                          hidden: ({ parent }) => parent?.pricingModel === 'individual',
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
          nettoTotalPrice: 'pricing.nettoTotalPrice',
          basePrice: 'pricing.basePrice',
          distancePrice: 'pricing.distancePrice',
          noTransportAddress: 'noTransportAddress',
          hotelNoAddress: 'hotelNoAddress',
        },
        prepare({
          distance = 0,
          totalPrice = 0,
          nettoTotalPrice = 0,
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
          }).format(nettoTotalPrice)

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
              nettoTotalPrice: 'pricing.nettoTotalPrice',
              pricingModel: 'pricing.pricingModel',
            },
            prepare({ name, count = 1, totalPrice = 0, nettoTotalPrice = 0, pricingModel = 'fixed' }) {
              // Get pricing model in Polish
              let modelText = 'Stała cena'
              if (pricingModel === 'per_unit') modelText = 'Za jednostkę'
              if (pricingModel === 'threshold') modelText = 'Progowy'
              if (pricingModel === 'individual') modelText = 'Indywidualny'

              // Format price or show individual pricing text
              let priceText = ''
              if (pricingModel === 'individual') {
                priceText = 'Wycena indywidualna'
              } else {
                const formattedPrice = new Intl.NumberFormat('pl-PL', {
                  style: 'currency',
                  currency: 'PLN',
                  minimumFractionDigits: 0,
                }).format(nettoTotalPrice)
                priceText = formattedPrice
              }

              return {
                title: name || 'Dodatek',
                subtitle: `${count > 1 ? `${count}x • ` : ''}${priceText} • ${modelText}`,
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
                  hidden: ({ parent }) => parent?.pricingModel === 'individual',
                }),
                defineField({
                  name: 'nettoTotalPrice',
                  title: 'Cena całkowita netto (PLN)',
                  type: 'number',
                  description: 'Wartość netto w złotych polskich',
                  hidden: ({ parent }) => parent?.pricingModel === 'individual',
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
