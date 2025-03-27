import type { GetImageResult } from 'astro'
import { useEffect, useRef, useState } from 'preact/hooks'
import RatingBox from '../RatingBox'
import styles from './testimonialsPopup.module.scss'

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
}

export default function TestimonialsPopup({ testimonials, googleData }: Props) {
  const [visibleCount, setVisibleCount] = useState(10)
  const testimonialsRef = useRef<HTMLUListElement>(null)

  const showMore = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.stopPropagation()
    setVisibleCount((prev) => Math.min(prev + 10, testimonials.length))
  }

  const showLess = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.stopPropagation()
    setVisibleCount(10)
    if (testimonialsRef.current) {
      testimonialsRef.current.style.scrollBehavior = 'auto'
      testimonialsRef.current.scrollTop = 0
      setTimeout(() => {
        if (testimonialsRef.current) {
          testimonialsRef.current.style.scrollBehavior = 'smooth'
        }
      }, 50)
    }
  }

  const visibleTestimonials = testimonials.slice(0, visibleCount)
  const hasMore = visibleCount < testimonials.length
  const showingExtra = visibleCount > 10

  return (
    <div className={styles.content}>
      <span className={styles.title}>Opinie</span>
      <RatingBox {...googleData} />
      <button
        className={styles.closeButton}
        onClick={() => window.dispatchEvent(new Event('popup:close'))}
        aria-label="Zamknij wszystkie opinie"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none">
          <circle cx={12} cy={12} r={10} stroke="#F67258" strokeWidth={1.5} />
          <path
            d="M14.5 9.50002L9.5 14.5M9.49998 9.5L14.5 14.5"
            stroke="#F67258"
            strokeWidth={1.5}
            strokeLinecap="round"
          />
        </svg>
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
              <button
                className={styles.showMore}
                onClick={(e) => {
                  showMore(e)
                }}
                aria-label="Pokaż więcej opinii"
              >
                Pokaż więcej
              </button>
            )}
            {showingExtra && (
              <button
                className={styles.showLess}
                onClick={(e) => {
                  showLess(e)
                }}
                aria-label="Pokaż mniej opinii"
              >
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
  )
}
