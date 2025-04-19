import type { GetImageResult } from 'astro'
import { ImageDataQuery, type ImageDataProps } from '../image'
import styles from './styles.module.scss'

export const ActivityCardQuery = `
  name,
  _id,
  ${ImageDataQuery('imageList[]')}
  description,
    participantsCount{
      min,
      max,
  },
  "slug": slug.current,
  _createdAt,
  publishedDate,
  pricing,
  popularityIndex,
`

export type ActivityCardProps = {
  name: string
  imageList: ImageDataProps[]
  description?: string
  participantsCount: {
    min: number
    max: number
  }
  slug: string
  _createdAt: string
}

export default function ActivityCard({
  name,
  description,
  participantsCount,
  slug,
  _createdAt,
  clientImage,
  children,
}: ActivityCardProps & {
  children?: React.ReactNode
  clientImage?: { image: GetImageResult; fetchPriority: 'high' | 'auto'; loading: 'eager' | 'lazy'; sizes: string }
}) {
  const isRecent = new Date(_createdAt) > new Date(Date.now() - 1000 * 60 * 60 * 24 * 14)

  return (
    <article className={styles['ActivityCard']}>
      <a href={slug || '/'}>
        <div className={styles.imgWrapper}>
          {isRecent && (
            <div className={styles.recent}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  fill-rule="evenodd"
                  clip-rule="evenodd"
                  d="M6.395 2.133a3.817 3.817 0 0 1-.33.266 1.809 1.809 0 0 1-.657.272 3.82 3.82 0 0 1-.422.046c-.534.042-.801.064-1.024.142-.515.183-.92.588-1.103 1.103-.079.223-.1.49-.143 1.025-.016.212-.025.319-.045.421a1.809 1.809 0 0 1-.272.657 3.818 3.818 0 0 1-.266.33c-.347.408-.521.612-.623.825a1.809 1.809 0 0 0 0 1.56c.102.213.276.417.623.825.139.162.208.244.266.33.133.199.225.422.272.657.02.102.029.209.045.421.043.534.064.802.143 1.024.182.516.588.921 1.103 1.103.223.08.49.1 1.024.143.213.017.32.026.422.046.234.046.458.139.656.272.087.058.168.127.33.265.409.348.612.522.826.624a1.808 1.808 0 0 0 1.56 0c.213-.102.417-.276.825-.623a3.81 3.81 0 0 1 .33-.266 1.81 1.81 0 0 1 .657-.272c.102-.02.208-.029.421-.046.534-.042.801-.064 1.024-.143.516-.182.921-.587 1.103-1.103.079-.222.1-.49.143-1.024.017-.212.025-.319.046-.421a1.81 1.81 0 0 1 .271-.657c.059-.086.128-.168.266-.33.348-.408.522-.612.623-.825a1.808 1.808 0 0 0 0-1.56c-.101-.213-.275-.417-.623-.825-.138-.162-.207-.244-.265-.33a1.81 1.81 0 0 1-.273-.657 3.81 3.81 0 0 1-.045-.421c-.043-.535-.064-.802-.143-1.025a1.809 1.809 0 0 0-1.103-1.103c-.223-.078-.49-.1-1.024-.142a3.82 3.82 0 0 1-.421-.046 1.809 1.809 0 0 1-.657-.272 3.817 3.817 0 0 1-.33-.266c-.408-.347-.612-.521-.825-.623a1.809 1.809 0 0 0-1.56 0c-.213.102-.417.276-.825.623Zm4.52 4.442a.543.543 0 1 0-.767-.767L6.915 9.042 5.85 7.978a.543.543 0 1 0-.767.768l1.447 1.447a.543.543 0 0 0 .767 0l3.617-3.618Z"
                  fill="#F67258"
                />
              </svg>
              <span>Nowość</span>
            </div>
          )}
          {!!children ? (
            children
          ) : !!clientImage ? (
            <img
              src={clientImage.image.src}
              srcSet={clientImage.image.srcSet.attribute}
              alt={''}
              loading={clientImage.loading}
              fetchPriority={clientImage.fetchPriority}
              sizes={clientImage.sizes || '324px'}
            />
          ) : null}
          <div className={styles.participants}>
            <svg xmlns="http://www.w3.org/2000/svg" width="17" height="16" viewBox="0 0 17 16" fill="none">
              <path
                d="M10.83 5a2.333 2.333 0 1 1-4.666 0 2.333 2.333 0 0 1 4.667 0ZM12.5 11c0 1.288-1.79 2.333-4 2.333s-4-1.045-4-2.334c0-1.288 1.79-2.333 4-2.333s4 1.045 4 2.333ZM5.25 3.334c.119 0 .234.012.346.034A3.318 3.318 0 0 0 5.169 5c0 .578.148 1.123.407 1.597-.105.02-.214.03-.325.03-.943 0-1.708-.737-1.708-1.647s.765-1.647 1.708-1.647ZM4.134 12.658c-.378-.453-.631-1.008-.631-1.657 0-.63.237-1.171.597-1.616-1.27.099-2.264.793-2.264 1.635 0 .85 1.011 1.55 2.298 1.638ZM11.833 5c0 .58-.148 1.124-.407 1.598.105.02.214.03.326.03.942 0 1.707-.737 1.707-1.647s-.764-1.647-1.707-1.647c-.119 0-.234.012-.346.034.272.482.427 1.04.427 1.633ZM12.868 12.658c1.287-.088 2.298-.788 2.298-1.638 0-.842-.994-1.536-2.264-1.635.36.445.598.986.598 1.616 0 .649-.253 1.204-.632 1.657Z"
                fill="#F67258"
              />
            </svg>
            <span>
              {participantsCount.min} - {participantsCount.max} osób
            </span>
          </div>
        </div>
        <div className={styles.heading}>
          <h3>{name}</h3>
          <span aria-hidden>{name}</span>
        </div>
        {description && <p>{description}</p>}
      </a>
    </article>
  )
}
