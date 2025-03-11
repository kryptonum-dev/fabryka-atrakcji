import ArrowButton from '@/src/components/ui/ArrowButton'
import type { BlogCardProps } from '@/src/components/ui/BlogCard'
import BlogCard from '@/src/components/ui/BlogCard'
import useEmblaCarousel from 'embla-carousel-react'
import { useCallback, useEffect, useState } from 'preact/hooks'
import styles from './carousel.module.scss'

type CarouselProps = {
  children: React.ReactNode
  index: number
  blogPosts: BlogCardProps[]
}

export default function Carousel({ children, index, blogPosts }: CarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: 'start',
    skipSnaps: false,
  })

  const [currentSlide, setCurrentSlide] = useState(1)

  useEffect(() => {
    if (!emblaApi) return

    const onSelect = () => {
      setCurrentSlide(emblaApi.selectedScrollSnap() + 1)
    }

    onSelect()

    emblaApi.on('select', onSelect)

    return () => {
      emblaApi.off('select', onSelect)
    }
  }, [emblaApi])

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev()
  }, [emblaApi])

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext()
  }, [emblaApi])

  return (
    <>
      <div className={styles.embla}>
        <div className={styles.embla__viewport} ref={emblaRef}>
          <div className={styles.embla__container}>
            {blogPosts.map((blogPost, idx) => (
              <div className={styles.embla__slide} key={idx}>
                <BlogCard {...blogPost} />
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className={styles.controlers}>
        {children}
        <div className={styles.pagination}>
          {Array.from({ length: blogPosts.length }).map((_, idx) => (
            <div key={idx} className={`${styles.dot} ${currentSlide === idx + 1 ? styles.dot_active : ''}`} />
          ))}
        </div>

        <div className={styles.buttons}>
          <ArrowButton direction="left" onClick={scrollPrev} />
          <ArrowButton direction="right" onClick={scrollNext} />
        </div>
      </div>
    </>
  )
}
