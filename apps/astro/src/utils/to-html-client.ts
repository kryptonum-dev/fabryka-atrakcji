import type { PortableTextValue } from '@/components/ui/portable-text'

type Block = {
  _type: string
  style?: string
  listItem?: 'bullet' | 'number'
  children?: Array<{
    text: string
    marks?: string[]
  }>
  markDefs?: Array<{
    _key: string
    _type: string
    href?: string
    linkType?: string
    internal?: string
    external?: string
  }>
}

const handleMarksClient = (text: string, marks: string[] = []): string => {
  return marks.reduce((acc, mark) => {
    // Only handle basic formatting marks
    const markTags: Record<string, [string, string]> = {
      strong: ['<strong>', '</strong>'],
      em: ['<em>', '</em>'],
      underline: ['<u>', '</u>'],
    }

    const [openTag, closeTag] = markTags[mark] || ['', '']
    return `${openTag}${acc}${closeTag}`
  }, text)
}

const renderBlockClient = (style: string, content: string): string => {
  const blockTags: Record<string, [string, string]> = {
    h1: ['<h1>', '</h1>'],
    h2: ['<h2>', '</h2>'],
    h3: ['<h3>', '</h3>'],
    h4: ['<h4>', '</h4>'],
    blockquote: ['<blockquote>', '</blockquote>'],
    normal: ['<p>', '</p>'],
  }

  const [openTag, closeTag] = blockTags[style] || blockTags.normal
  return `${openTag}${content}${closeTag}`
}

export const toHTMLClient = (blocks: PortableTextValue): string => {
  if (!Array.isArray(blocks)) {
    blocks = [blocks]
  }

  let html = ''

  for (const block of blocks) {
    if (block._type === 'block' && block.children) {
      const processedChildren = block.children.map((child: any) => handleMarksClient(child.text, child.marks))
      const text = processedChildren.join('')
      html += renderBlockClient(block.style || 'normal', text)
    }
  }

  return html
}
