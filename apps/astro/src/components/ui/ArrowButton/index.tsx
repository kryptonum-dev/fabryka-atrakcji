import type { MouseEventHandler } from 'react'
import styles from './arrowButton.module.scss'

export type ArrowButtonProps = {
  direction: 'left' | 'right'
  onClick: MouseEventHandler<HTMLButtonElement>
  disabled?: boolean
  className?: string
}

export const ArrowButton = ({ direction, onClick, disabled = false, className = '' }: ArrowButtonProps) => {
  const svgPath = direction === 'left' ? 'm15 17-5-5 5-5' : 'm10 7 5 5-5 5'

  return (
    <button
      className={`${styles.control} ${styles[direction]} ${className}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={`Move ${direction}`}
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d={svgPath} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d={svgPath} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  )
}

export default ArrowButton
