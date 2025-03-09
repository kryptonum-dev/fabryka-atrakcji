import type { GetImageResult } from 'astro'
import useEmblaCarousel from 'embla-carousel-react'
import { useCallback } from 'preact/hooks'
import styles from './carousel.module.scss'

type CarouselProps = {
  children: React.ReactNode
  activities: {
    name: string
    image: GetImageResult
    description: string
    details: {
      participantsCount: {
        min: number
        max: number
      }
    }
    slug: string
  }[]
  index: number
}

export default function Carousel({ children, activities, index }: CarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: 'start',
    skipSnaps: false,
  })

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev()
  }, [emblaApi])

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext()
  }, [emblaApi])

  return (
    <>
      <div className={styles.container}>
        {children}
        <div className={styles.controls}>
          <button className={`${styles.control} ${styles.prev}`} onClick={scrollPrev}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="m15 17-5-5 5-5"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="m15 17-5-5 5-5"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>
          <button className={`${styles.control} ${styles.controlNext}`} onClick={scrollNext}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="m10 7 5 5-5 5"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="m10 7 5 5-5 5"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
      <div className={styles.embla}>
        <div className={styles.embla__viewport} ref={emblaRef}>
          <ul className={styles.embla__container}>
            {activities.map(({ image, name, details, description, slug }, i) => (
              <li className={styles.embla__slide}>
                <article>
                  <a href={slug || '/'}>
                    <div className={styles.imgWrapper}>
                      <img
                        src={image.src}
                        srcSet={image.srcSet.attribute}
                        alt={''}
                        loading={index === 0 ? 'eager' : 'lazy'}
                        fetchPriority={index === 0 && i === 0 ? 'high' : 'auto'}
                        sizes="324px"
                      />
                      <div className={styles.participants}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="17" height="16" viewBox="0 0 17 16" fill="none">
                          <path
                            d="M10.83 5a2.333 2.333 0 1 1-4.666 0 2.333 2.333 0 0 1 4.667 0ZM12.5 11c0 1.288-1.79 2.333-4 2.333s-4-1.045-4-2.334c0-1.288 1.79-2.333 4-2.333s4 1.045 4 2.333ZM5.25 3.334c.119 0 .234.012.346.034A3.318 3.318 0 0 0 5.169 5c0 .578.148 1.123.407 1.597-.105.02-.214.03-.325.03-.943 0-1.708-.737-1.708-1.647s.765-1.647 1.708-1.647ZM4.134 12.658c-.378-.453-.631-1.008-.631-1.657 0-.63.237-1.171.597-1.616-1.27.099-2.264.793-2.264 1.635 0 .85 1.011 1.55 2.298 1.638ZM11.833 5c0 .58-.148 1.124-.407 1.598.105.02.214.03.326.03.942 0 1.707-.737 1.707-1.647s-.764-1.647-1.707-1.647c-.119 0-.234.012-.346.034.272.482.427 1.04.427 1.633ZM12.868 12.658c1.287-.088 2.298-.788 2.298-1.638 0-.842-.994-1.536-2.264-1.635.36.445.598.986.598 1.616 0 .649-.253 1.204-.632 1.657Z"
                            fill="#F67258"
                          />
                        </svg>
                        <span>
                          {details.participantsCount.min} - {details.participantsCount.max} osób
                        </span>
                      </div>
                    </div>
                    <div className={styles.heading}>
                      {index === 0 ? <h2>{name}</h2> : <h3>{name}</h3>}
                      <span aria-hidden>{name}</span>
                    </div>
                    <p>{description}</p>
                  </a>
                </article>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  )
}
