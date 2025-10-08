import type { PortableTextProps } from 'astro-portabletext/types'
import type { Language } from '../global/languages'

export const ArticleToPlainText = (blocks: PortableTextProps['value']) => {
  function extractTextFromBlock(block: any): string {
    if (!block) return ''

    // Handle regular text blocks
    if (block._type === 'block' && block.children) {
      return block.children.map((child: any) => child.text || '').join('')
    }

    // Skip purely visual components
    const skipTypes = ['image', 'reference', 'Cta', 'Newsletter']
    if (skipTypes.includes(block._type)) {
      return ''
    }

    // Handle special components
    if (block._type === 'Quote') {
      const quote = block.quote || ''
      const author = block.author ? `${block.author.name}, ${block.author.title}` : ''
      return `${quote} ${author}`
    }

    if (block._type === 'ComparisonTable') {
      const headingLeft = block.comparisonHeading?.leftColumn || ''
      const headingRight = block.comparisonHeading?.rightColumn || ''
      const items = (block.comparisonTable || [])
        .map((item: any) => {
          const heading = extractTextFromBlock(item.heading)
          const leftCol = item.comparisonItems?.leftColumn || ''
          const rightCol = item.comparisonItems?.rightColumn || ''
          return `${heading} ${leftCol} ${rightCol}`
        })
        .join(' ')
      return `${headingLeft} ${headingRight} ${items}`
    }

    if (block._type === 'BulletList') {
      return block.children ? block.children.map((child: any) => extractTextFromBlock(child)).join(' ') : ''
    }

    if (block._type === 'Buttons') {
      return (block.buttons || []).map((button: any) => button.text || '').join(' ')
    }

    if (block._type === 'Checklist') {
      return (block.items || []).join(' ')
    }

    if (block._type === 'Faq') {
      const heading = extractTextFromBlock(block.heading)
      const questions = (block.questions || [])
        .map((q: any) => {
          const question = extractTextFromBlock(q.question)
          const answer = extractTextFromBlock(q.answer)
          return `${question} ${answer}`
        })
        .join(' ')
      return `${heading} ${questions}`
    }

    if (block._type === 'NumberedList') {
      return block.children ? block.children.map((child: any) => extractTextFromBlock(child)).join(' ') : ''
    }

    // Handle arrays (for nested content)
    if (Array.isArray(block)) {
      return block.map((item) => extractTextFromBlock(item)).join(' ')
    }

    // Handle objects (for custom components and nested structures)
    if (typeof block === 'object' && block !== null) {
      // Only process text-related fields
      const textFields = ['text', 'heading', 'paragraph', 'quote', 'name', 'title']
      const relevantValues = Object.entries(block)
        .filter(
          ([key, value]) =>
            !key.startsWith('_') &&
            !['asset', 'reference', 'image', 'video', 'cta', 'ctas', 'source', 'background'].includes(key) &&
            (textFields.includes(key) || typeof value === 'object')
        )
        .map(([, value]) => extractTextFromBlock(value))
      return relevantValues.join(' ')
    }

    // Handle primitive values - only include strings
    return typeof block === 'string' ? block : ''
  }

  return (Array.isArray(blocks) ? blocks : [blocks])
    .map((block: any) => extractTextFromBlock(block))
    .filter((text: string) => text.trim() !== '')
    .join('\n\n')
}

export const getEstimatedReadingTime = ({
  content,
  lang = 'pl',
}: {
  content: PortableTextProps['value']
  lang?: Language
}) => {
  const translations = {
    pl: {
      minute: 'minuta',
      minutes: 'minut',
      minutes_plural: 'minuty',
      readingTime: 'czytania',
    },
    en: {
      minute: 'minute',
      minutes: 'minutes',
      minutes_plural: 'minutes',
      readingTime: 'read',
    },
  }

  const t = translations[lang]

  const plainText = ArticleToPlainText(content)

  const readingTime = (text: string) => {
    const countWords = (text: string) => {
      const trimmedText = text.trim()
      if (trimmedText === '') return 0
      const words = trimmedText.split(/\s+/)
      return words.length
    }
    const words = countWords(text)
    const averageReadingSpeedWordsPerMinute = 200
    const readingTime = Math.ceil(words / averageReadingSpeedWordsPerMinute)
    return readingTime
  }

  const getMinuteText = (minutes: number) => {
    if (lang === 'pl') {
      // Polish plural rules: 1 = minuta, 2-4 = minuty, 5+ = minut
      if (minutes === 1) return t.minute
      if (minutes >= 2 && minutes <= 4) return t.minutes_plural
      return t.minutes
    } else {
      // English plural rules: 1 = minute, 2+ = minutes
      return minutes === 1 ? t.minute : t.minutes
    }
  }

  return `${readingTime(plainText)} ${getMinuteText(readingTime(plainText))} ${t.readingTime}`
}
