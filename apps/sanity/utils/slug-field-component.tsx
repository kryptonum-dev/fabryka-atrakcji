import { CopyIcon, SyncIcon, WarningOutlineIcon } from '@sanity/icons'
import { Badge, Box, Button, Card, Flex, Stack, Text, TextInput } from '@sanity/ui'
import type { FocusEvent } from 'react'
import { useCallback, useMemo, useRef } from 'react'
import {
  type ObjectFieldProps,
  type SanityDocument,
  set,
  type SlugValue,
  unset,
  useFormValue,
  useValidationStatus,
} from 'sanity'
import { styled } from 'styled-components'
import { DOMAIN } from '../constants'
import { LANGUAGES } from '../structure/languages'
import { slugify } from './slugify'

const presentationOriginUrl = process.env.SANITY_STUDIO_PRESENTATION_URL

// Add the LanguageValues type
type LanguageValues = {
  [key in (typeof LANGUAGES)[number]['id']]: string
}

function stringToPathname(
  input: string,
  options?: {
    allowTrailingSlash?: boolean
  }
) {
  if (typeof input !== 'string') {
    return '/'
  }

  const sanitized = input
    .toLowerCase()
    // Convert spaces to hyphens
    .replace(/\s+/g, '-')
    // Normalize slashes except at start
    .replace(/(?!^)\/+/g, '/')
    // Remove invalid characters
    .replace(/[^a-z0-9\-/]+/g, '')
    // Normalize multiple hyphens
    .replace(/-+/g, '-')
    // Normalize multiple slashes
    .replace(/\/+/g, '/')

  // Remove trailing slash temporarily for processing
  const withoutTrailingSlash = sanitized.replace(/\/$/, '')

  // Ensure leading slash and normalize any remaining multiple slashes
  let result = `/${withoutTrailingSlash}`.replace(/\/+/g, '/')

  // Always add trailing slash unless it's the root path
  if (result !== '/' && !result.endsWith('/')) {
    result += '/'
  }

  return result
}

function formatPath(path: string | undefined | null): string {
  if (typeof path !== 'string') return '/'

  return (
    path
      .trim()
      // Remove any double slashes
      .replace(/\/{2,}/g, '/')
      // Remove leading and trailing slashes
      .replace(/^\/+|\/+$/g, '')
      // Add single leading slash
      .replace(/^/, '/')
  )
}

interface DocumentWithLocale extends SanityDocument {}

const getDocumentPath = (document: DocumentWithLocale) => {
  if (typeof document.slug !== 'string') return
  return formatPath(document.slug)
}

const GenerateButton = styled(Button)`
  cursor: pointer;
  > span:nth-of-type(2) {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    box-sizing: border-box;
  }
`

const CopyButton = styled(Button)`
  margin-left: auto;
  cursor: pointer;
  > span:nth-of-type(2) {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    box-sizing: border-box;
  }
`

// Update the component props interface
interface PathnameFieldComponentProps extends ObjectFieldProps<SlugValue> {
  prefixes?: LanguageValues
}

export function PathnameFieldComponent(props: PathnameFieldComponentProps) {
  const document = useFormValue([]) as DocumentWithLocale
  const validation = useValidationStatus(document?._id.replace(/^drafts\./, ''), document?._type)
  const nameField = useFormValue(['name']) as string

  const slugValidationError = useMemo(
    () => validation.validation.find((v) => (v?.path.includes('current') || v?.path.includes('slug')) && v.message),
    [validation.validation]
  )
  const {
    inputProps: { onChange, value, readOnly },
    title,
    description,
    prefixes,
  } = props

  const segments = useMemo(() => {
    if (!value?.current) return []

    // Parse the slug to separate prefix and content
    const slug = value.current

    // Check if this follows the pattern: /prefix/content/ or /content/
    const parts = slug.split('/').filter(Boolean)

    return parts
  }, [value])

  // Extract prefix and main content for display
  const { prefix, mainContent } = useMemo(() => {
    if (!value?.current) return { prefix: '', mainContent: '' }

    const language = (document?.language as keyof LanguageValues) ?? 'pl'
    const expectedPrefix = prefixes?.[language] ?? ''

    if (expectedPrefix && value.current.startsWith(expectedPrefix)) {
      // Remove the expected prefix and trailing slash to get the main content
      const contentWithoutPrefix = value.current.replace(expectedPrefix, '').replace(/\/$/, '')
      return {
        prefix: expectedPrefix.replace(/\/$/, ''), // Remove trailing slash from prefix for display
        mainContent: contentWithoutPrefix,
      }
    }

    // If no expected prefix but starts with /, try to extract first segment as prefix
    if (value.current.startsWith('/')) {
      const parts = value.current.split('/').filter(Boolean)
      if (parts.length > 1) {
        return {
          prefix: `/${parts[0]}`,
          mainContent: parts.slice(1).join('/'),
        }
      }
      // Single segment, no prefix
      return {
        prefix: '',
        mainContent: parts[0] || '',
      }
    }

    // If no prefix, treat the whole thing as main content (minus trailing slash)
    return {
      prefix: '',
      mainContent: value.current.replace(/\/$/, ''),
    }
  }, [value, prefixes, document?.language])

  const fullPathInputRef = useRef<HTMLInputElement>(null)

  const handleChange = useCallback(
    (value?: string) => {
      if (!value) {
        onChange(unset())
        return
      }

      const language = (document?.language as keyof LanguageValues) ?? 'pl'
      const expectedPrefix = prefixes?.[language] ?? ''

      let finalValue: string

      // If user is typing a full path (starts with /), use it as-is but ensure trailing slash
      if (value.startsWith('/')) {
        finalValue = value.endsWith('/') ? value : `${value}/`
      } else {
        // If user is typing just the content part, add prefix and trailing slash
        const cleanValue = value.trim()
        if (expectedPrefix && cleanValue) {
          finalValue = `${expectedPrefix}${cleanValue}/`
        } else if (cleanValue) {
          finalValue = `/${cleanValue}/`
        } else {
          finalValue = expectedPrefix || '/'
        }
      }

      onChange(
        set({
          current: finalValue,
          _type: 'slug',
        })
      )
    },
    [onChange, prefixes, document?.language]
  )

  const handleBlur = useCallback((e: FocusEvent<HTMLInputElement>) => {
    // No longer need to set folder lock state
  }, [])

  const localizedPathname = `${DOMAIN}${value?.current?.slice(1) || ''}`

  // Function to generate slug from name field
  const generateSlug = useCallback(() => {
    if (!nameField) return

    // Generate the slugified version of the name (this will be the main content)
    const slugified = slugify(nameField)

    // Use handleChange to properly construct the full path with prefix and trailing slash
    handleChange(slugified)
  }, [nameField, handleChange])

  const pathInput = useMemo(() => {
    // Determine if we should show the generate button
    const showGenerateButton = Boolean(nameField) && !readOnly

    return (
      <Stack space={2}>
        <Flex gap={1} align="center">
          {/* Prefix indicator */}
          {prefix && (
            <>
              <Card
                paddingX={2}
                paddingY={2}
                border
                radius={1}
                tone="transparent"
                style={{
                  backgroundColor: 'var(--card-muted-bg-color)',
                }}
              >
                <Text muted size={2}>
                  {prefix}
                </Text>
              </Card>
              <Text muted size={2}>
                /
              </Text>
            </>
          )}

          {/* Main content input */}
          <Box flex={1}>
            <TextInput
              value={mainContent}
              onChange={(e) => handleChange(e.currentTarget.value)}
              ref={fullPathInputRef}
              onBlur={handleBlur}
              disabled={readOnly}
              placeholder="Wprowadź nazwę strony"
              style={{ width: '100%' }}
            />
          </Box>

          {/* Trailing slash indicator */}
          <Card
            paddingX={2}
            paddingY={2}
            border
            radius={1}
            tone="transparent"
            style={{
              backgroundColor: 'var(--card-muted-bg-color)',
            }}
          >
            <Text muted size={2}>
              /
            </Text>
          </Card>

          {/* Generate button */}
          {showGenerateButton && (
            <GenerateButton
              icon={SyncIcon}
              onClick={generateSlug}
              title="Wygeneruj slug z nazwy"
              mode="bleed"
              tone="primary"
              padding={2}
              fontSize={1}
            >
              <span />
            </GenerateButton>
          )}
        </Flex>
      </Stack>
    )
  }, [prefix, mainContent, handleChange, handleBlur, readOnly, generateSlug, nameField])

  return (
    <Stack space={3}>
      <Stack space={2} flex={1}>
        <Text size={1} weight="semibold">
          {title}
        </Text>
        {description && (
          <Text size={1} style={{ color: 'var(--card-fg-color)', marginTop: '8px' }}>
            {description}
          </Text>
        )}
      </Stack>

      {typeof value?.current === 'string' && (
        <Flex direction="column" gap={2}>
          <Flex align="center">
            <p
              style={{
                textOverflow: 'ellipsis',
                margin: 0,
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                color: 'var(--card-muted-fg-color)',
                fontSize: '0.8125rem',
              }}
            >
              {`${presentationOriginUrl ?? ''}${localizedPathname}`}
            </p>
            <CopyButton
              icon={CopyIcon}
              onClick={() => navigator.clipboard.writeText(`${presentationOriginUrl ?? ''}${localizedPathname}`)}
              title="Kopiuj link"
              mode="bleed"
              tone="primary"
              fontSize={1}
            >
              <span />
            </CopyButton>
          </Flex>
        </Flex>
      )}

      {pathInput}
      {slugValidationError ? (
        <Badge
          tone="critical"
          padding={4}
          style={{
            borderRadius: 'var(--card-radius)',
          }}
        >
          <Flex gap={4} align="center">
            <WarningOutlineIcon />
            <Text size={1} color="red">
              {slugValidationError.message}
            </Text>
          </Flex>
        </Badge>
      ) : null}
    </Stack>
  )
}
