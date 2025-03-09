import { CopyIcon, EditIcon, FolderIcon, SyncIcon, WarningOutlineIcon } from '@sanity/icons'
import { Badge, Box, Button, Card, Flex, Stack, Text, TextInput } from '@sanity/ui'
import type { FocusEvent, FormEvent, MouseEvent } from 'react'
import { useCallback, useMemo, useRef, useState } from 'react'
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

  // If we're allowing trailing slashes and the original input had one, preserve it
  const hasTrailingSlash = input.endsWith('/') && options?.allowTrailingSlash
  const withoutTrailingSlash = options?.allowTrailingSlash ? sanitized : sanitized.replace(/\/$/, '')

  // Ensure leading slash and normalize any remaining multiple slashes
  let result = `/${withoutTrailingSlash}`.replace(/\/+/g, '/')

  // Add back the trailing slash if needed
  if (hasTrailingSlash && !result.endsWith('/')) {
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

const UnlockButton = styled(Button)`
  cursor: pointer;
  > span:nth-of-type(2) {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    box-sizing: border-box;
  }
`

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

const FolderText = styled(Text)`
  span {
    white-space: nowrap;
    overflow-x: hidden;
    text-overflow: ellipsis;
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

    // If the value ends with a slash, add an empty segment
    const hasTrailingSlash = value.current.endsWith('/')
    const segmentArray = value.current.split('/').filter(Boolean)

    // If there was a trailing slash, add an empty segment at the end
    if (hasTrailingSlash) {
      segmentArray.push('')
    }

    return segmentArray
  }, [value])

  const [folderLocked, setFolderLocked] = useState(segments.length > 1)

  const fullPathInputRef = useRef<HTMLInputElement>(null)
  const pathSegmentInputRef = useRef<HTMLInputElement>(null)

  const handleChange = useCallback(
    (value?: string) => {
      if (!value) {
        onChange(unset())
        return
      }

      // Check if the original input had a trailing slash
      const hasTrailingSlash = value.endsWith('/')

      // Format the value using stringToPathname
      let finalValue = stringToPathname(value, { allowTrailingSlash: true })

      // Ensure the trailing slash is preserved if it was in the original input
      if (hasTrailingSlash && !finalValue.endsWith('/')) {
        finalValue += '/'
      }

      onChange(
        set({
          current: finalValue,
          _type: 'slug',
        })
      )
    },
    [onChange]
  )

  const updateSegment = useCallback(
    (index: number, newValue: string) => {
      const newSegments = [...segments]
      // Only filter out '/' characters, allow all others including hyphens
      newSegments[index] = newValue.replace(/\//g, '')

      // Join with slashes and ensure proper formatting
      const path = newSegments.join('/')

      // If this is the last segment and it's empty, add a trailing slash
      const shouldAddTrailingSlash = index === segments.length - 1 && newValue === '' && segments.length > 1

      handleChange(shouldAddTrailingSlash ? `${path}/` : path)
    },
    [segments, handleChange]
  )

  const updateFullPath = useCallback(
    (e: FormEvent<HTMLInputElement>) => {
      handleChange(e.currentTarget.value)
    },
    [handleChange]
  )

  const unlockFolder = useCallback((e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    setFolderLocked(false)
    requestAnimationFrame(() => {
      fullPathInputRef.current?.focus()
    })
  }, [])

  const handleBlur = useCallback(
    (e: FocusEvent<HTMLInputElement>) => {
      setFolderLocked(segments.length > 1)
    },
    [segments]
  )

  const localizedPathname = `${DOMAIN}${value?.current?.slice(1) || ''}`

  // Function to generate slug from name field
  const generateSlug = useCallback(() => {
    if (!nameField) return

    const language = (document?.language as keyof LanguageValues) ?? 'pl'
    // Use the prefix from props if available
    const prefix = prefixes?.[language] ?? ''

    // Generate the slugified version of the name
    const slugified = slugify(nameField)

    let newSlug
    if (prefix) {
      // If we have a prefix for this language, use it
      newSlug = `${prefix}${slugified}`
    } else if (segments.length > 0 && /^[a-z]{2}$/.test(segments[0])) {
      // If we have segments and the first segment looks like a language code (e.g., "pl", "en")
      newSlug = `/${segments[0]}/${slugified}`
    } else if (segments.length > 0) {
      // If we have other segments but not a language prefix, preserve the first segment
      newSlug = `/${segments[0]}/${slugified}`
    } else {
      // If we have no segments, just use the slugified name
      newSlug = `/${slugified}`
    }

    handleChange(newSlug)
  }, [nameField, segments, handleChange, prefixes, document?.language])

  const pathInput = useMemo(() => {
    // Determine if we should show the generate button
    const showGenerateButton = Boolean(nameField) && !readOnly

    if (folderLocked && segments.length > 1) {
      return (
        <Stack space={2}>
          <Flex gap={2}>
            {segments.slice(0, -1).map((segment, index) => (
              <Flex key={`segment-${index}`} gap={1} align="center">
                <Card
                  paddingX={2}
                  paddingY={2}
                  border
                  radius={1}
                  tone="transparent"
                  style={{
                    position: 'relative',
                  }}
                >
                  <Flex gap={2} align="center">
                    <Text muted>
                      <FolderIcon />
                    </Text>
                    <FolderText muted>{segment}</FolderText>
                  </Flex>
                </Card>
                <Text muted size={2}>
                  /
                </Text>
              </Flex>
            ))}
            <Flex gap={1} flex={1} align="center">
              <Box flex={1}>
                <TextInput
                  width="100%"
                  value={segments[segments.length - 1] || ''}
                  onChange={(e) => updateSegment(segments.length - 1, e.currentTarget.value)}
                  ref={pathSegmentInputRef}
                  onBlur={handleBlur}
                  disabled={readOnly}
                  placeholder={
                    segments.length > 1 && segments[segments.length - 1] === '' ? 'Wprowadź nazwę strony' : ''
                  }
                />
              </Box>
            </Flex>
            {showGenerateButton && (
              <GenerateButton
                icon={SyncIcon}
                onClick={generateSlug}
                title="Wygeneruj slug z nazwy"
                mode="bleed"
                tone="primary"
                padding={2}
                fontSize={1}
                disabled={!nameField}
              >
                <span />
              </GenerateButton>
            )}
            <UnlockButton
              icon={EditIcon}
              onClick={unlockFolder}
              title="Edytuj pełną ścieżkę"
              mode="bleed"
              tone="primary"
              padding={2}
              fontSize={1}
              disabled={readOnly}
            >
              <span />
            </UnlockButton>
          </Flex>
        </Stack>
      )
    }

    return (
      <Stack space={2}>
        <Flex gap={2}>
          <Box flex={1}>
            <TextInput
              value={value?.current || ''}
              onChange={updateFullPath}
              ref={fullPathInputRef}
              onBlur={handleBlur}
              disabled={readOnly}
              style={{ width: '100%' }}
            />
          </Box>
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
  }, [
    folderLocked,
    segments,
    value,
    updateFullPath,
    handleBlur,
    readOnly,
    unlockFolder,
    updateSegment,
    generateSlug,
    nameField,
  ])

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
