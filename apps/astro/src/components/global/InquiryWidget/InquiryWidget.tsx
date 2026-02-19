import { useState, useEffect, useRef } from 'preact/hooks'
import { getInquiryItems, removeFromInquiry, type InquiryItem } from '@/src/utils/inquiry-store'
import { dispatchToast } from '@/src/utils/events'
import { trackEvent } from '@/utils/track-event'
import Button from '@/components/ui/Button/Button'
import styles from './InquiryWidget.module.scss'

type Props = {
  lang?: 'pl' | 'en'
}

const translations = {
  pl: {
    heading: 'Twoje zapytanie',
    cta: 'Przejdź do formularza',
    empty: 'Dodaj oferty do zapytania',
    remove: 'Usuń',
    removedAlert: 'Usunięto z zapytania',
    contactUrl: '/pl/kontakt/',
  },
  en: {
    heading: 'Your inquiry',
    cta: 'Go to contact form',
    empty: 'Add offers to your inquiry',
    remove: 'Remove',
    removedAlert: 'Removed from inquiry',
    contactUrl: '/en/contact/',
  },
}

export default function InquiryWidget({ lang = 'pl' }: Props) {
  const [items, setItems] = useState<InquiryItem[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [animate, setAnimate] = useState(false)
  const widgetRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const prevCountRef = useRef(0)

  const t = translations[lang]

  useEffect(() => {
    const sync = () => {
      const current = getInquiryItems()
      if (current.length > prevCountRef.current && prevCountRef.current > 0) {
        setAnimate(true)
        setTimeout(() => setAnimate(false), 600)
      }
      prevCountRef.current = current.length
      setItems(current)
    }
    sync()
    document.addEventListener('inquiry-updated', sync)
    window.addEventListener('storage', sync)
    return () => {
      document.removeEventListener('inquiry-updated', sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  useEffect(() => {
    if (!isOpen) return
    const handler = (e: MouseEvent) => {
      const target = e.target as Node
      const clickedPanel = panelRef.current?.contains(target)
      const clickedTrigger = triggerRef.current?.contains(target)

      if (!clickedPanel && !clickedTrigger) setIsOpen(false)
    }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [isOpen])

  if (items.length === 0) return null

  const handleToggle = () => {
    const opening = !isOpen
    setIsOpen(opening)
    if (opening) {
      trackEvent({
        ga4: {
          eventName: 'inquiry_widget_opened',
          params: { item_count: items.length },
        },
      })
    }
  }

  const handleRemove = (e: { preventDefault: () => void; stopPropagation: () => void }, id: string) => {
    e.preventDefault()
    e.stopPropagation()
    removeFromInquiry(id)
    dispatchToast(t.removedAlert, 'success')
  }

  return (
    <div
      ref={widgetRef}
      className={`${styles.InquiryWidget} ${isOpen ? styles.open : ''}`}
    >
      {isOpen && (
        <div ref={panelRef} className={styles.panel}>
          <div className={styles.panelHeader}>
            <p className={styles.heading}>
              {t.heading}
              <span className={styles.headingCount}>{items.length}</span>
            </p>
          </div>

          <ul className={styles.list}>
            {items.map((item, index) => (
              <li
                key={item.id}
                className={styles.item}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <a href={item.url} className={styles.itemLink}>
                  {item.image && (
                    <img
                      src={`${item.image}?w=120&h=120&fit=crop`}
                      alt=""
                      width={48}
                      height={48}
                      className={styles.thumb}
                      loading="lazy"
                    />
                  )}
                  <div className={styles.itemInfo}>
                    <span className={styles.name}>{item.name}</span>
                    <span className={styles.itemType}>
                      {item.type === 'hotel' ? 'Hotel' : (lang === 'pl' ? 'Integracja' : 'Activity')}
                    </span>
                  </div>
                </a>
                <button
                  type="button"
                  className={styles.removeBtn}
                  onClick={(e) => handleRemove(e, item.id)}
                  aria-label={`${t.remove} ${item.name}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>

          <div className={styles.ctaWrapper}>
            <Button theme="primary" shade="dark" href={t.contactUrl} className="ctaBtn">
              {t.cta}
            </Button>
          </div>
        </div>
      )}

      <button
        ref={triggerRef}
        type="button"
        className={`${styles.trigger} ${animate ? styles.bounce : ''}`}
        onClick={handleToggle}
        aria-label={`${t.heading} (${items.length})`}
      >
        <div className={styles.triggerInner}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            className={`${styles.triggerIcon} ${isOpen ? styles.rotated : ''}`}
          >
            <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2Z" stroke="currentColor" strokeWidth="1.5" />
            <path d="M9 12h6M9 16h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
        <span className={styles.count}>{items.length}</span>
      </button>
    </div>
  )
}
