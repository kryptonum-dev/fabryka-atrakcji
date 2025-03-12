import type { PortableTextValue } from '@/components/ui/portable-text';

export const toPlainText = (value: PortableTextValue | null = null) => {
  if (!value) return '';

  const blocks = Array.isArray(value) ? value : [value];

  return blocks
    .map((block) => {
      if (block._type !== 'block' || !block.children) {
        return '';
      }
      return block.children.map((child: { text: string }) => child.text).join('');
    })
    .filter(Boolean)
    .join('\n\n');
};
