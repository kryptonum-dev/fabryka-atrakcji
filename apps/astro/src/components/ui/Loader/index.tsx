import type { Language } from '@/src/global/languages'
import styles from './styles.module.scss'

export default function Loader({
  isLoading,
  hasFinishedLoading,
  lang = 'pl',
}: {
  isLoading: boolean
  hasFinishedLoading: boolean
  lang?: Language
}) {
  const translations = {
    pl: {
      loading: 'Ładowanie...',
    },
    en: {
      loading: 'Loading...',
    },
  }

  const t = translations[lang]

  if (!isLoading) return null

  return (
    <div className={styles['Loader']} data-loader aria-label={t.loading}>
      {!hasFinishedLoading && (
        <svg width="40" height="40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="5.45455" cy="5.45455" r="5.45455" transform="matrix(1 0 0 -1 14.547 40)" fill="#F67258"></circle>
          <circle
            cx="5.45455"
            cy="5.45455"
            r="5.45455"
            transform="matrix(1 0 0 -1 14.547 10.91)"
            fill="#F67258"
          ></circle>
          <circle cx="34.5455" cy="20" r="5.45455" transform="rotate(90 34.545 20)" fill="#F67258"></circle>
          <circle cx="5.4517" cy="20" r="5.45455" transform="rotate(90 5.452 20)" fill="#F67258"></circle>
        </svg>
      )}
    </div>
  )
}
