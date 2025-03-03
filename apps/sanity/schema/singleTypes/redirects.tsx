import { Box, Button, Card, Dialog, Stack, Text, Tooltip, useToast } from '@sanity/ui'
import { useCallback, useState } from 'react'
import { defineField, defineType, useClient, type SlugRule } from 'sanity'
import { Link } from 'lucide-react'

type RedirectTypes = {
  _key: string
  source: { current: string }
  destination: { current: string }
  isPermanent: boolean
}

const SlugValidation = (Rule: SlugRule) =>
  Rule.custom((value) => {
    if (!value || !value.current) return 'Wartość nie może być pusta'
    if (!value.current.startsWith('/')) return 'Ścieżka musi być ścieżką względną (zaczynać się od /)'
    if (value.current !== '/' && value.current.endsWith('/'))
      return 'Ścieżki źródłowe nie mogą kończyć się ukośnikiem (/)'
    return true
  })

const ProcessJsonButton = (props: { value: any; renderDefault: any }) => {
  const { value, renderDefault } = props
  const client = useClient({ apiVersion: '2024-11-29' })
  const toast = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

  const processJson = useCallback(async () => {
    if (!value) return
    setIsLoading(true)
    try {
      const parsed = JSON.parse(value) as RedirectTypes[]
      const processedRedirects = parsed.map((redirect) => ({
        _key: crypto.randomUUID(),
        source: { current: redirect.source },
        destination: { current: redirect.destination },
        isPermanent: redirect.isPermanent ?? true,
      }))
      await client.patch('drafts.redirects').set({ redirects: processedRedirects }).commit()
      toast.push({
        status: 'success',
        title: 'Sukces',
        description: `${processedRedirects.length} przekierowań zostało pomyślnie przetworzonych i zaktualizowanych`,
      })
    } catch {
      toast.push({
        status: 'error',
        title: 'Błąd',
        description: 'Nie udało się przetworzyć i zaktualizować przekierowań',
      })
    } finally {
      setIsLoading(false)
      setShowConfirmDialog(false)
    }
  }, [value, client, toast])

  return (
    <Stack space={3}>
      {renderDefault(props)}
      <Button
        tone="caution"
        onClick={() => setShowConfirmDialog(true)}
        disabled={!value || isLoading}
        loading={isLoading}
        style={{ textAlign: 'center' }}
      >
        Przetwórz JSON i zaktualizuj przekierowania
      </Button>
      {showConfirmDialog && (
        <Dialog
          header="Potwierdź aktualizację"
          id="confirm-dialog"
          onClose={() => setShowConfirmDialog(false)}
          zOffset={1000}
        >
          <Box padding={4}>
            <Stack space={5}>
              <Text>
                Czy na pewno chcesz przetworzyć ten JSON? Spowoduje to nadpisanie wszystkich istniejących przekierowań.
              </Text>
              <Stack space={3}>
                <Button tone="caution" onClick={processJson} loading={isLoading} style={{ textAlign: 'center' }}>
                  Tak, przetwórz i zaktualizuj
                </Button>
                <Button
                  mode="ghost"
                  onClick={() => setShowConfirmDialog(false)}
                  disabled={isLoading}
                  style={{ textAlign: 'center' }}
                >
                  Anuluj
                </Button>
              </Stack>
            </Stack>
          </Box>
        </Dialog>
      )}
    </Stack>
  )
}

export default defineType({
  name: 'redirects',
  type: 'document',
  title: 'Przekierowania',
  icon: Link,
  fields: [
    defineField({
      name: 'redirects',
      type: 'array',
      description:
        'Przekierowania służą do przekierowywania użytkowników na inną stronę. Jest to przydatne dla celów SEO. Pamiętaj o dobrych praktykach dotyczących przekierowań, ponieważ mogą one wpływać na SEO.',
      of: [
        defineField({
          name: 'redirect',
          type: 'object',
          fields: [
            defineField({
              name: 'source',
              type: 'slug',
              validation: (Rule) => [
                SlugValidation(Rule),
                Rule.custom((value, context) => {
                  const redirects = (context.document?.redirects || []) as RedirectTypes[]
                  const currentRedirect = context.parent as RedirectTypes
                  const isDuplicate = redirects.some(
                    (redirect) => redirect._key !== currentRedirect._key && redirect.source?.current === value?.current
                  )
                  if (isDuplicate)
                    return 'Ta ścieżka źródłowa jest już używana w innym przekierowaniu. Ścieżki źródłowe muszą być unikalne.'
                  return true
                }),
              ],
            }),
            defineField({
              name: 'destination',
              type: 'slug',
              validation: SlugValidation,
            }),
            defineField({
              name: 'isPermanent',
              type: 'boolean',
              initialValue: true,
            }),
          ],
          preview: {
            select: {
              source: 'source.current',
              destination: 'destination.current',
              isPermanent: 'isPermanent',
            },
            prepare({ source, destination, isPermanent }) {
              return {
                title: `Źródło: ${source}`,
                subtitle: `Cel: ${destination}`,
                media: () => (
                  <Tooltip
                    content={
                      <Box padding={1}>
                        <Text size={1}>{isPermanent ? '🔒 Stałe' : '🔄 Tymczasowe'}</Text>
                      </Box>
                    }
                    placement="top"
                    portal
                  >
                    <span>{isPermanent ? '🔒' : '🔄'}</span>
                  </Tooltip>
                ),
              }
            },
          },
        }),
      ],
    }),
    defineField({
      name: 'jsonEditor',
      type: 'text',
      title: 'Edytor JSON',
      description: (
        <>
          Wklej tablicę JSON obiektów przekierowań. Wymagane właściwości:
          <ul>
            <li>Źródło musi zaczynać się od "/" (np. "/stara-sciezka")</li>
            <li>Cel musi zaczynać się od "/" (np. "/nowa-sciezka")</li>
            <li>isPermanent to opcjonalny boolean (domyślnie true dla stałego przekierowania 301)</li>
          </ul>
        </>
      ),
      components: {
        input: (props) => (
          <Stack space={3}>
            <Card tone="caution" padding={4} border radius={2}>
              <Stack space={3}>
                <Text weight="semibold">⚠️ Ostrzeżenie: Używaj ostrożnie!</Text>
                <Text size={1}>
                  Ten edytor nadpisze wszystkie istniejące przekierowania. Wymagana jest techniczna znajomość formatu
                  JSON. Nieprawidłowe użycie może skutkować uszkodzonymi przekierowaniami.
                </Text>
              </Stack>
            </Card>
            <ProcessJsonButton {...props} />
          </Stack>
        ),
      },
      validation: (Rule) =>
        Rule.custom((value) => {
          if (!value) return true
          const allowedKeys = ['source', 'destination', 'isPermanent']
          try {
            const parsed = JSON.parse(value)
            if (!Array.isArray(parsed)) return 'JSON musi być tablicą obiektów przekierowań'
            for (const redirect of parsed) {
              const objectKeys = Object.keys(redirect)
              const hasInvalidKeys = objectKeys.some((key) => !allowedKeys.includes(key))
              if (hasInvalidKeys) {
                const invalidKeys = objectKeys.filter((key) => !allowedKeys.includes(key))
                return `Znaleziono nieprawidłowe właściwości: ${invalidKeys.join(', ')}. Dozwolone są tylko "source", "destination" i "isPermanent".`
              }
              if (!redirect.source || typeof redirect.source !== 'string')
                return 'Każde przekierowanie musi mieć właściwość "source" z wartością typu string'
              if (!redirect.source.startsWith('/')) return 'Ścieżki źródłowe muszą zaczynać się od ukośnika (/)'
              if (redirect.source !== '/' && redirect.source.endsWith('/'))
                return 'Ścieżki źródłowe nie mogą kończyć się ukośnikiem (/)'
              if (!redirect.destination || typeof redirect.destination !== 'string')
                return 'Każde przekierowanie musi mieć właściwość "destination" z wartością typu string'
              if (!redirect.destination.startsWith('/')) return 'Ścieżki docelowe muszą zaczynać się od ukośnika (/)'
              if (redirect.isPermanent !== undefined && typeof redirect.isPermanent !== 'boolean')
                return 'Właściwość "isPermanent" musi być wartością logiczną (true/false), jeśli jest podana'
            }
            const sources = parsed.map((r) => r.source)
            const duplicates = sources.filter((item, index) => sources.indexOf(item) !== index)
            if (duplicates.length > 0) {
              return `Znaleziono zduplikowane ścieżki źródłowe: ${duplicates.join(', ')}. Każda ścieżka źródłowa musi być unikalna.`
            }
            return true
          } catch {
            return 'Nieprawidłowy format JSON. Sprawdź składnię.'
          }
        }),
    }),
  ],
  preview: {
    prepare: () => ({
      title: 'Przekierowania',
    }),
  },
})
