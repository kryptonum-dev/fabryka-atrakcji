import type { PortableTextProps } from 'astro-portabletext/types';

export const ArticleToPlainText = (blocks: PortableTextProps['value']) => {
  function extractTextFromBlock(block: any): string {
    if (!block) return '';

    // Handle regular text blocks
    if (block._type === 'block' && block.children) {
      return block.children.map((child: any) => child.text || '').join('');
    }

    // Skip purely visual components
    const skipTypes = ['image', 'reference', 'ImageCta', 'Video'];
    if (skipTypes.includes(block._type)) {
      return '';
    }

    // Handle special components
    if (block._type === 'Quote') {
      const quote = block.quote || '';
      const author = block.author ? `${block.author.name}, ${block.author.title}` : '';
      return `${quote} ${author}`;
    }

    if (block._type === 'ComparisonTable') {
      const headings = (block.comparisonHeading || []).join(' ');
      const items = (block.comparisonTable || [])
        .map((item: any) => {
          const heading = extractTextFromBlock(item.heading);
          const comparisons = (item.comparisonItems || []).join(' ');
          return `${heading} ${comparisons}`;
        })
        .join(' ');
      return `${headings} ${items}`;
    }

    if (block._type === 'BulletHeadingsList') {
      return (block.list || [])
        .map((item: any) => {
          const heading = extractTextFromBlock(item.heading);
          const paragraph = extractTextFromBlock(item.paragraph);
          return `${heading} ${paragraph}`;
        })
        .join(' ');
    }

    if (block._type === 'NumberedStepsList') {
      const paragraph = extractTextFromBlock(block.paragraph);
      if (block.type === 'list') {
        return (
          (block.listBullet || [])
            .map((item: any) => {
              const heading = extractTextFromBlock(item.heading);
              const items = (item.itemList || []).join(' ');
              return `${heading} ${items}`;
            })
            .join(' ') +
          ' ' +
          paragraph
        );
      } else {
        return (
          (block.listText || [])
            .map((item: any) => {
              return `${item.heading} ${item.paragraph || ''}`;
            })
            .join(' ') +
          ' ' +
          paragraph
        );
      }
    }

    // Handle arrays (for nested content)
    if (Array.isArray(block)) {
      return block.map((item) => extractTextFromBlock(item)).join(' ');
    }

    // Handle objects (for custom components and nested structures)
    if (typeof block === 'object' && block !== null) {
      // Only process text-related fields
      const textFields = ['text', 'heading', 'paragraph', 'quote', 'name', 'title'];
      const relevantValues = Object.entries(block)
        .filter(
          ([key, value]) =>
            !key.startsWith('_') &&
            !['asset', 'reference', 'image', 'video', 'cta', 'ctas', 'source', 'background'].includes(key) &&
            (textFields.includes(key) || typeof value === 'object')
        )
        .map(([, value]) => extractTextFromBlock(value));
      return relevantValues.join(' ');
    }

    // Handle primitive values - only include strings
    return typeof block === 'string' ? block : '';
  }

  return (Array.isArray(blocks) ? blocks : [blocks])
    .map((block: any) => extractTextFromBlock(block))
    .filter((text: string) => text.trim() !== '')
    .join('\n\n');
};

export const getEstimatedReadingTime = (content: PortableTextProps['value']) => {
  const plainText = ArticleToPlainText(content);

  const readingTime = (text: string) => {
    const countWords = (text: string) => {
      const trimmedText = text.trim();
      if (trimmedText === '') return 0;
      const words = trimmedText.split(/\s+/);
      return words.length;
    };
    const words = countWords(text);
    const averageReadingSpeedWordsPerMinute = 200;
    const readingTime = Math.ceil(words / averageReadingSpeedWordsPerMinute);
    return readingTime;
  };

  const getMinuteText = (minutes: number) => {
    if (minutes === 1) return 'minuta';
    if (minutes >= 2 && minutes <= 4) return 'minuty';
    return 'minut';
  };

  return `${readingTime(plainText)} ${getMinuteText(readingTime(plainText))} czytania`;
};
