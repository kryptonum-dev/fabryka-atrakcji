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

  const isPrimary = theme === 'primary'

  return (
    <Element {...renderedProps}>
      {isPrimary ? (
        <div className={styles.box}>
          <div className={styles.icon}>
            <ArrowIcon />
            <ArrowIcon />
          </div>
        </div>
      ) : (
        <div className={styles.wrapper} />
      )}
      <span>{text || children}</span>
    </Element>
  )
}

const ArrowIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 20 20">
    <path
      stroke="#DB2A50"
      stroke-linecap="round"
      stroke-width="1.5"
      d="M4.164 10h10.833m-4.166-5 4.41 4.41a.833.833 0 0 1 0 1.18L10.832 15"
    />
  </svg>
)
