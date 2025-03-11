import { getRelativeDate } from '@/src/utils/get-relative-date'
import type { GetImageResult } from 'astro'
import styles from './blogCard.module.scss'

export type BlogCardProps = {
  name: string
  slug: string
  description: string
  image: GetImageResult & { sizes: string; loading: 'lazy' | 'eager' }
  readTime: string
  createdAt: string
}

export default function BlogCard({ name, slug, description, image, readTime, createdAt }: BlogCardProps) {
  return (
    <article className={styles.blogCard}>
      <a href={slug}>
        <div className={styles.wrapper}>
          <img src={image.src} srcSet={image.srcSet.attribute} alt={''} sizes={image.sizes} loading={image.loading} />
        </div>
        <p className={styles.name}>{name}</p>
        <p className={styles.description}>{description}</p>
        <div className={styles.details}>
          <div className={styles.detailsRow}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16">
              <path fill="#F67258" d="M14.67 8A6.667 6.667 0 1 1 1.335 8a6.667 6.667 0 0 1 13.333 0Z" />
              <path
                fill="#FAF7F7"
                fill-rule="evenodd"
                d="M8.003 4.834a.5.5 0 0 1 .5.5v2.46l1.52 1.52a.5.5 0 1 1-.707.707L7.649 8.354a.5.5 0 0 1-.146-.353V5.334a.5.5 0 0 1 .5-.5Z"
                clip-rule="evenodd"
              />
            </svg>
            <span>{readTime}</span>
          </div>
          <div className={styles.detailsRow}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16">
              <path
                fill="#F67258"
                d="M5.17 1.666a.5.5 0 1 0-1 0v1.053c-.96.077-1.59.265-2.053.728-.463.463-.651 1.093-.728 2.052h13.227c-.076-.96-.265-1.59-.728-2.052-.463-.463-1.092-.651-2.052-.728V1.666a.5.5 0 1 0-1 0v1.009c-.444-.009-.94-.009-1.5-.009H6.669c-.56 0-1.056 0-1.5.009V1.666Z"
              />
              <path
                fill="#F67258"
                fill-rule="evenodd"
                d="M1.336 8c0-.56 0-1.057.009-1.5H14.66c.008.443.008.94.008 1.5v1.333c0 2.514 0 3.77-.78 4.552-.782.781-2.039.781-4.553.781H6.669c-2.514 0-3.771 0-4.552-.781-.781-.781-.781-2.038-.781-4.552V7.999Zm10 1.333a.667.667 0 1 0 0-1.334.667.667 0 0 0 0 1.334Zm0 2.666a.667.667 0 1 0 0-1.333.667.667 0 0 0 0 1.333ZM8.669 8.666a.667.667 0 1 1-1.333 0 .667.667 0 0 1 1.333 0Zm0 2.667a.667.667 0 1 1-1.333 0 .667.667 0 0 1 1.333 0Zm-4-2a.667.667 0 1 0 0-1.334.667.667 0 0 0 0 1.334Zm0 2.666a.667.667 0 1 0 0-1.333.667.667 0 0 0 0 1.333Z"
                clip-rule="evenodd"
              />
            </svg>
            <span>{getRelativeDate({ date: createdAt, upperCase: true })}</span>
          </div>
        </div>
      </a>
    </article>
  )
}
