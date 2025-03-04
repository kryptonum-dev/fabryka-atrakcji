import styles from './Button.module.scss'

export type Props = React.HTMLAttributes<HTMLAnchorElement> &
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    text?: string | React.ReactNode
    children?: React.ReactNode
    theme?: 'primary' | 'secondary'
    linkType?: 'external' | 'internal'
    href?: string
    className?: string
    shade?: 'light' | 'dark'
  }

export default function Button({
  children,
  text,
  theme = 'primary',
  linkType = 'internal',
  href,
  className,
  shade = 'dark',
  ...props
}: Props) {
  const Element = href ? 'a' : 'button'
  const isExternal = linkType === 'external'
  const renderedProps = {
    ...(href && { href }),
    ...(isExternal && { target: '_blank', rel: 'noreferrer' }),
    'data-theme': theme,
    'data-shade': shade,
    className: `${styles.Button}${className ? ` ${className}` : ''}`,
    ...props,
  }

  return <Element {...renderedProps}>{children}</Element>
}
