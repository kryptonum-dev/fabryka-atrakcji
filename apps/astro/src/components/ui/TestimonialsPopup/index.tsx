import type { GetImageResult } from 'astro'
import { Fragment } from 'preact'
import { useEffect, useRef, useState } from 'preact/hooks'
import RatingBox from '../RatingBox'
import styles from './TestimonialsPopup.module.scss'

type Props = {
  testimonials: {
    name: string
    position: string
    company: string
    review: string
    date: string
    image: {
      profileImage: GetImageResult | null
    }
    logo: string | null
  }[]
  googleData: {
    rating: number
    ratingCount: number
  }
  popupId: string
}

export default function TestimonialsPopup({ testimonials, googleData, popupId }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [visibleCount, setVisibleCount] = useState(10)
  const popupRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const testimonialsRef = useRef<HTMLUListElement>(null)

  const showMore = () => {
    setVisibleCount((prev) => Math.min(prev + 10, testimonials.length))
    // No scrolling logic here, as requested
  }

  const showLess = () => {
    setVisibleCount(10)
    // Immediately scroll to top without animation
    if (testimonialsRef.current) {
      // Temporarily disable smooth scrolling
      testimonialsRef.current.style.scrollBehavior = 'auto'
      testimonialsRef.current.scrollTop = 0
      // Re-enable smooth scrolling after a short delay
      setTimeout(() => {
        if (testimonialsRef.current) {
          testimonialsRef.current.style.scrollBehavior = 'smooth'
        }
      }, 50)
    }
  }

  // Reset visible count when popup opens
  useEffect(() => {
    if (isOpen) {
      setVisibleCount(10)
    }
  }, [isOpen])

  useEffect(() => {
    const handleOpen = () => {
      setIsOpen(true)
      document.body.style.overflow = 'hidden'
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && contentRef.current && !contentRef.current.contains(event.target as Node)) {
        closePopup()
      }
    }

    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closePopup()
      }
    }

    window.addEventListener(`testimonials-${popupId}:open`, handleOpen)
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscKey)

    return () => {
      window.removeEventListener(`testimonials-${popupId}:open`, handleOpen)
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscKey)
    }
  }, [popupId])

  const closePopup = () => {
    setIsOpen(false)
    document.body.style.overflow = ''
  }

  if (!isOpen) return null

  const visibleTestimonials = testimonials.slice(0, visibleCount)
  const hasMore = visibleCount < testimonials.length
  const showingExtra = visibleCount > 10

  return (
    <div className={styles.testimonialsPopup} ref={popupRef}>
      <div className={styles.content} ref={contentRef}>
        <span className={styles.title}>Opinie</span>
        <RatingBox {...googleData} />
        <button className={styles.closeButton} onClick={closePopup} aria-label="Zamknij wszystkie opinie">
          <CloseIcon />
        </button>
        <ul className={styles.testimonials} ref={testimonialsRef}>
          {visibleTestimonials.map(({ name, position, company, review, date, image, logo }, index) => (
            <li className={styles.testimonial} key={index}>
              {(image?.profileImage || logo) && (
                <div className={styles.wrapper}>
                  {image?.profileImage ? (
                    <img
                      src={image.profileImage?.src}
                      alt=""
                      srcSet={image.profileImage?.srcSet.attribute}
                      loading="lazy"
                      sizes="36px"
                    />
                  ) : (
                    <div dangerouslySetInnerHTML={{ __html: logo as unknown as string }} />
                  )}
                </div>
              )}
              <span className={styles.name}>{name}</span>
              <span className={styles.position}>
                {position} - {company}
              </span>
              <span className={styles.date}>{date}</span>
              <p className={styles.review}>{review}</p>
            </li>
          ))}
          {(hasMore || showingExtra) && (
            <li className={styles.paginationButtons}>
              {hasMore && (
                <button className={styles.showMore} onClick={showMore} aria-label="Pokaż więcej opinii">
                  Pokaż więcej
                </button>
              )}
              {showingExtra && (
                <button className={styles.showLess} onClick={showLess} aria-label="Pokaż mniej opinii">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m18 15-6-6-6 6" />
                  </svg>
                  Pokaż mniej
                </button>
              )}
            </li>
          )}
        </ul>
      </div>
    </div>
  )
}

const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none">
    <circle cx={12} cy={12} r={10} stroke="#F67258" strokeWidth={1.5} />
    <path d="M14.5 9.50002L9.5 14.5M9.49998 9.5L14.5 14.5" stroke="#F67258" strokeWidth={1.5} strokeLinecap="round" />
  </svg>
)
