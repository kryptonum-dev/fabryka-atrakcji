import React, { useMemo } from 'react'
import { Box, Card, Flex, Stack, Text } from '@sanity/ui'
import { useFormValue } from 'sanity'

// Helper to format currency in Polish format
const formatPrice = (price: number = 0) =>
  new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
    minimumFractionDigits: 0,
  }).format(price)

// Helper to format netto price with label
const formatNettoPrice = (nettoPrice: number = 0) => `${formatPrice(nettoPrice)} netto`

// Helper to format brutto price with label
const formatBruttoPrice = (bruttoPrice: number = 0) => `${formatPrice(bruttoPrice)} brutto`

// Function to get the correct Polish plural form for 'osoba'
const getPolishPersonPlural = (count: number): string => {
  // Get last digit and last two digits
  const lastDigit = count % 10
  const lastTwoDigits = count % 100

  // Special cases for teen numbers (11-19)
  if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
    return 'osób'
  }

  // For numbers ending with 2-4, except those ending with 12-14
  if (lastDigit >= 2 && lastDigit <= 4) {
    return 'osoby'
  }

  // For numbers ending with 1, except those ending with 11
  if (lastDigit === 1) {
    return 'osoba'
  }

  // Default case (0, 5-9)
  return 'osób'
}

// Format date to display in a nice format
const formatDate = (dateString: string): string => {
  if (!dateString) return ''

  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('pl-PL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch (e) {
    return dateString
  }
}

// Helper function to separate transport items from regular extras
function separateTransportItems(extras: any[] = []) {
  const transportItems: any[] = []
  const regularExtras: any[] = []

  if (extras && extras.length > 0) {
    extras.forEach((extra) => {
      if (extra.pricing && extra.pricing.isTransport) {
        transportItems.push(extra)
      } else {
        regularExtras.push(extra)
      }
    })
  }

  return { transportItems, regularExtras }
}

// Main component to display pricing summary
export const PricingSummary = (props: {
  documentId?: string
  document?: {
    displayed?: any
    draft?: any
    published?: any
  }
}) => {
  // Extract the document data - prefer displayed, fall back to draft or published
  const docData = props.document?.displayed || props.document?.draft || props.document?.published || {}

  // Use form values directly, augmented with document data if available
  const items = (docData.items || useFormValue(['items']) || []) as any[]
  const participantCount = (docData.participantCount || useFormValue(['participantCount']) || 0) as number
  const quoteId = (docData.quoteId || useFormValue(['quoteId']) || '') as string
  const selectedDates = (docData.selectedDates || useFormValue(['selectedDates']) || []) as any[]

  // Calculate the total price for all items (netto and brutto)
  const { totalNettoPrice, totalBruttoPrice } = useMemo(() => {
    const netto = items.reduce((sum, item) => sum + (item.totalNettoPrice || 0), 0)
    const brutto = items.reduce((sum, item) => sum + (item.totalPrice || 0), 0)
    return { totalNettoPrice: netto, totalBruttoPrice: brutto }
  }, [items])

  // If there are no items yet, show a message
  if (!items || items.length === 0) {
    return (
      <Card padding={3} radius={2} tone="caution">
        <Text>Brak elementów do podsumowania cenowego.</Text>
      </Card>
    )
  }

  return (
    <Card padding={4} radius={2} shadow={1}>
      <Stack space={4}>
        <Box>
          <Text size={3} weight="bold">
            Podsumowanie cenowe
          </Text>
          <br />
          <Text size={2} muted>
            Wycena: {quoteId}
          </Text>
        </Box>

        <Card padding={3} radius={2} tone="default">
          <Stack space={3}>
            <Flex justify="flex-start" wrap="wrap" gap={4}>
              <Box>
                <Text size={1} muted>
                  Liczba uczestników
                </Text>
                <br />
                <Text size={2} weight="semibold">
                  {participantCount} {getPolishPersonPlural(participantCount)}
                </Text>
              </Box>
              <Box>
                <Text size={1} muted>
                  Liczba elementów
                </Text>
                <br />
                <Text size={2} weight="semibold">
                  {items.length}
                </Text>
              </Box>
            </Flex>

            {selectedDates && selectedDates.length > 0 && (
              <>
                <Box style={{ height: '1px', background: '#e1e1e1', margin: '0.5rem 0' }} />
                <Box>
                  <Text size={1} muted>
                    Wybrane daty
                  </Text>
                  <br />
                  <Stack space={2}>
                    {selectedDates.map((dateRange, idx) => (
                      <Text key={idx} size={2} weight="semibold">
                        {formatDate(dateRange.start)} - {formatDate(dateRange.end)}
                      </Text>
                    ))}
                  </Stack>
                </Box>
              </>
            )}
          </Stack>
        </Card>

        {items.map((item: any, index: number) => (
          <Card key={index} padding={3} radius={2} shadow={1}>
            <Stack space={3}>
              {/* Hotel details */}
              {item.type === 'hotel' && item.hotels && item.hotels.length > 0 && (
                <Box>
                  <Text weight="semibold" size={1} style={{ marginBottom: '0.5rem' }}>
                    Hotel:
                  </Text>
                  <Card padding={3} radius={2} tone="positive">
                    <Stack space={3}>
                      <Flex justify="space-between" align="flex-start">
                        <Text weight="semibold">{item.hotels[0].name}</Text>
                        <Box style={{ textAlign: 'right' }}>
                          {item.hotels[0].pricing?.pricingNotVisible ||
                          item.hotels[0].pricing?.pricingModel === 'individual' ? (
                            <Text weight="semibold" style={{ color: '#F67258' }}>
                              Wycena indywidualna
                            </Text>
                          ) : (
                            <>
                              <Text weight="semibold">
                                {formatNettoPrice(item.hotels[0].pricing?.nettoFinalPrice || 0)}
                              </Text>
                              <br />
                              <Text size={1} muted>
                                {formatBruttoPrice(item.hotels[0].pricing?.finalPrice || 0)}
                              </Text>
                            </>
                          )}
                        </Box>
                      </Flex>

                      {item.hotels[0].maxPeople && (
                        <Flex justify="space-between">
                          <Text size={1}>Maksymalna liczba osób</Text>
                          <Text size={1}>{item.hotels[0].maxPeople}</Text>
                        </Flex>
                      )}

                      {/* Hotel addons */}
                      {item.hotels[0].addons && item.hotels[0].addons.length > 0 && (
                        <Box>
                          <Text size={1} weight="semibold">
                            Dodatki hotelu:
                          </Text>
                          <Stack space={2} marginTop={2}>
                            {item.hotels[0].addons.map((addon: any, addonIndex: number) => (
                              <Flex key={addonIndex} justify="space-between" align="flex-start" paddingLeft={2}>
                                <Text size={1}>{addon.name}</Text>
                                <Box style={{ textAlign: 'right' }}>
                                  <Text size={1}>{formatNettoPrice(addon.pricing?.nettoTotalPrice || 0)}</Text>
                                  <br />
                                  <Text size={0} muted>
                                    {formatBruttoPrice(addon.pricing?.totalPrice || 0)}
                                  </Text>
                                </Box>
                              </Flex>
                            ))}
                          </Stack>
                        </Box>
                      )}

                      {/* Hotel gastronomy */}
                      {item.hotels[0].gastronomy && item.hotels[0].gastronomy.length > 0 && (
                        <Box>
                          <Text size={1} weight="semibold">
                            Gastronomia:
                          </Text>
                          <Stack space={2} marginTop={2}>
                            {item.hotels[0].gastronomy.map((gastronomyItem: any, gastroIndex: number) => (
                              <Flex
                                key={gastroIndex}
                                justify="space-between"
                                align="flex-start"
                                paddingLeft={2}
                                style={{
                                  borderBottom: '1px solid #0c6826',
                                  paddingBottom: '0.5rem',
                                  marginBottom: '0.5rem',
                                }}
                              >
                                <Box padding={0} style={{ paddingTop: '0.5rem' }}>
                                  <Text size={1}>
                                    {gastronomyItem.name}
                                    {gastronomyItem.count > 1 && (
                                      <Text
                                        size={0}
                                        muted
                                        style={{ marginLeft: '0.5rem', marginTop: '0.25rem', marginBottom: '0.5rem' }}
                                      >
                                        • {gastronomyItem.count} usług
                                      </Text>
                                    )}
                                  </Text>
                                </Box>
                                <Box style={{ textAlign: 'right' }}>
                                  {gastronomyItem.pricing?.unavailable ? (
                                    <Text size={1} style={{ color: '#F67258', marginTop: '0.25rem' }}>
                                      Niedostępne
                                    </Text>
                                  ) : gastronomyItem.pricing?.pricingNotVisible ? (
                                    <Text size={1} style={{ color: '#F67258', marginTop: '0.25rem' }}>
                                      Cena ukryta
                                    </Text>
                                  ) : (
                                    <>
                                      <Text size={1} style={{ marginTop: '0.25rem' }}>
                                        {formatNettoPrice(gastronomyItem.pricing?.nettoTotalPrice || 0)}
                                      </Text>
                                      <br />
                                      <Text size={0} muted style={{ marginTop: '0.25rem' }}>
                                        {formatBruttoPrice(gastronomyItem.pricing?.totalPrice || 0)}
                                      </Text>
                                    </>
                                  )}
                                </Box>
                              </Flex>
                            ))}
                          </Stack>
                        </Box>
                      )}
                    </Stack>
                  </Card>
                </Box>
              )}

              {/* Activities details */}
              {item.activities && item.activities.length > 0 && (
                <Box>
                  <Text weight="semibold" size={1} style={{ marginBottom: '0.5rem' }}>
                    Integracje:
                  </Text>
                  <Stack space={2}>
                    {item.activities.map((activity: any, activityIndex: number) => (
                      <Card key={activityIndex} padding={3} radius={2} tone="caution">
                        <Stack space={3}>
                          <Flex justify="space-between" align="flex-start">
                            <Text weight="semibold" size={1}>
                              {activity.name}
                            </Text>
                            <Box style={{ textAlign: 'right' }}>
                              <Text weight="semibold" size={1}>
                                {formatNettoPrice(activity.pricing?.nettoFinalPrice || 0)}
                              </Text>
                              <br />
                              <Text size={0} muted>
                                {formatBruttoPrice(activity.pricing?.finalPrice || 0)}
                              </Text>
                            </Box>
                          </Flex>

                          {/* Activity addons */}
                          {activity.addons && activity.addons.length > 0 && (
                            <Box>
                              <Text size={1} weight="semibold">
                                Dodatki integracji:
                              </Text>
                              <Stack space={2} marginTop={2}>
                                {activity.addons.map((addon: any, addonIndex: number) => (
                                  <Flex key={addonIndex} justify="space-between" align="flex-start" paddingLeft={2}>
                                    <Text size={1}>{addon.name}</Text>
                                    <Box style={{ textAlign: 'right' }}>
                                      <Text size={1}>{formatNettoPrice(addon.pricing?.nettoTotalPrice || 0)}</Text>
                                      <br />
                                      <Text size={0} muted>
                                        {formatBruttoPrice(addon.pricing?.totalPrice || 0)}
                                      </Text>
                                    </Box>
                                  </Flex>
                                ))}
                              </Stack>
                            </Box>
                          )}
                        </Stack>
                      </Card>
                    ))}
                  </Stack>
                </Box>
              )}

              {/* Transport details - clearly separated section */}
              {item.transport && item.transport.pricing && item.transport.pricing.totalPrice > 0 && (
                <Box marginTop={3}>
                  <Text weight="semibold" size={1} style={{ marginBottom: '0.5rem' }}>
                    Transport:
                  </Text>
                  <Card padding={3} radius={2} tone="critical">
                    <Flex justify="space-between" align="flex-start">
                      <Text size={1}>
                        {item.transport.distance > 0 ? `${item.transport.distance} km` : 'Transport'}
                      </Text>
                      <Box style={{ textAlign: 'right' }}>
                        <Text weight="semibold" size={1}>
                          {formatNettoPrice(item.transport.pricing.nettoTotalPrice || 0)}
                        </Text>
                        <br />
                        <Text size={0} muted>
                          {formatBruttoPrice(item.transport.pricing.totalPrice)}
                        </Text>
                      </Box>
                    </Flex>
                  </Card>
                </Box>
              )}

              {/* Extras - clearly separated section */}
              {item.extras &&
                item.extras.length > 0 &&
                (() => {
                  const { transportItems, regularExtras } = separateTransportItems(item.extras)

                  return (
                    <Box marginTop={3}>
                      {/* Regular extras */}
                      {regularExtras.length > 0 && (
                        <>
                          <Text weight="semibold" size={1} style={{ marginBottom: '0.5rem' }}>
                            Dodatki:
                          </Text>
                          <Stack space={2}>
                            {regularExtras.map((extra: any, extraIndex: number) => (
                              <Card key={extraIndex} padding={3} radius={2} tone="primary">
                                <Flex justify="space-between" align="flex-start">
                                  <Text size={1}>{extra.name}</Text>
                                  <Box style={{ textAlign: 'right' }}>
                                    <Text size={1}>{formatNettoPrice(extra.pricing?.nettoTotalPrice || 0)}</Text>
                                    <br />
                                    <Text size={0} muted>
                                      {formatBruttoPrice(extra.pricing?.totalPrice || 0)}
                                    </Text>
                                  </Box>
                                </Flex>
                              </Card>
                            ))}
                          </Stack>
                        </>
                      )}

                      {/* Transport in extras */}
                      {transportItems.length > 0 && (
                        <Box marginTop={regularExtras.length > 0 ? 3 : 0}>
                          <Text weight="semibold" size={1} style={{ marginBottom: '0.5rem' }}>
                            Transport:
                          </Text>
                          <Stack space={2}>
                            {transportItems.map((transport: any, transportIndex: number) => (
                              <Card key={transportIndex} padding={3} radius={2} tone="critical">
                                <Flex justify="space-between" align="flex-start">
                                  <Text size={1}>{transport.name}</Text>
                                  <Box style={{ textAlign: 'right' }}>
                                    <Text weight="semibold" size={1}>
                                      {formatNettoPrice(transport.pricing?.nettoTotalPrice || 0)}
                                    </Text>
                                    <br />
                                    <Text size={0} muted>
                                      {formatBruttoPrice(transport.pricing?.totalPrice || 0)}
                                    </Text>
                                  </Box>
                                </Flex>
                              </Card>
                            ))}
                          </Stack>
                        </Box>
                      )}
                    </Box>
                  )
                })()}

              {/* Item Total */}
              <Flex
                justify="space-between"
                align="flex-start"
                marginTop={4}
                style={{ borderTop: '1px solid #eee', paddingTop: '1rem' }}
              >
                <Text weight="semibold" size={2}>
                  Suma częściowa
                </Text>
                <Box style={{ textAlign: 'right' }}>
                  <Text weight="semibold" size={2}>
                    {formatNettoPrice(item.totalNettoPrice || 0)}
                  </Text>
                  <br />
                  <Text size={1} muted>
                    {formatBruttoPrice(item.totalPrice || 0)}
                  </Text>
                </Box>
              </Flex>
            </Stack>
          </Card>
        ))}
      </Stack>
    </Card>
  )
}
