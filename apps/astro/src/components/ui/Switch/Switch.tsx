import type { JSX } from 'preact'

import styles from './Switch.module.scss'

export type SwitchSize = 'sm' | 'md'

export type SwitchProps = {
  asLabel?: boolean
  inputProps?: Record<string, any>
  size?: SwitchSize
  className?: string
} & Record<string, unknown>

export default function Switch({
  asLabel = false,
  inputProps,
  size = 'md',
  className,
  ...rest
}: SwitchProps) {
  const Element: any = asLabel ? 'label' : 'div'
  const combinedClassName = [styles.root, className].filter(Boolean).join(' ')

  return (
    <Element className={combinedClassName} data-size={size} data-switch-root {...rest}>
      <input type="checkbox" {...(inputProps ?? {})} />
      <div className={styles.dot}>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none">
          <path
            stroke="#F67258"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
            d="m13.33 4-7.333 7.333L2.664 8"
          />
        </svg>
      </div>
    </Element>
  )
}

