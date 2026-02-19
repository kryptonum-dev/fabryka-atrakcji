import { useState, useEffect, useRef } from 'preact/hooks'
import { useForm, type FieldValues } from 'react-hook-form'
import Button from '@/src/components/ui/Button'
import Checkbox from '@/src/components/ui/checkbox'
import Input from '@/src/components/ui/input'
import { REGEX } from '@/src/global/constants'
import { translations, type Language } from '@/src/global/languages'
import type { ClientFormStateTypes, FormStatusTypes } from '@/src/global/types'
import FormState from '../../ui/FormState'
import Loader from '../../ui/Loader'
import { trackEvent } from '@/utils/track-event'
import { getUtmString, getUtmForSheet } from '@/utils/analytics-user-storage'
import { dispatchToast } from '@/src/utils/events'
import styles from './InquiryForm.module.scss'

import { getInquiryItems, removeFromInquiry, type InquiryItem } from '@/src/utils/inquiry-store'

export type { InquiryItem }

export type ContextItem = {
  type: string
  id: string
  name: string
}

export type InquiryVariant =
  | 'general'
  | 'activity_listing'
  | 'hotel_listing'
  | 'activity_detail'
  | 'hotel_detail'

export type FormSelectOption = {
  value: string
  label: string
}

type Props = {
  lang?: Language
  formState: ClientFormStateTypes
  variant?: InquiryVariant
  showInquiries?: boolean
  contextItem?: ContextItem
  children?: any
  teamSizeOptions?: FormSelectOption[]
  regionOptions?: FormSelectOption[]
}

export default function InquiryForm({
  lang = 'pl',
  formState,
  variant = 'general',
  showInquiries = false,
  contextItem,
  children,
  teamSizeOptions,
  regionOptions,
}: Props) {
  const [status, setStatus] = useState<FormStatusTypes>({ sending: false, success: undefined })
  const [inquiryItems, setInquiryItems] = useState<InquiryItem[]>([])
  const [isInquiryReady, setIsInquiryReady] = useState(!showInquiries)
  const formRef = useRef<HTMLFormElement>(null)

  const t = translations[lang]
  const activityCount = inquiryItems.filter((item) => item.type === 'integracja').length
  const hotelCount = inquiryItems.filter((item) => item.type === 'hotel').length
  const countLetters = (value: string) => (value.match(/\p{L}/gu) || []).length

  useEffect(() => {
    if (showInquiries) {
      setInquiryItems(getInquiryItems())
      setIsInquiryReady(true)

      const handleUpdate = () => setInquiryItems(getInquiryItems())
      window.addEventListener('storage', handleUpdate)
      document.addEventListener('inquiry-updated', handleUpdate)
      return () => {
        window.removeEventListener('storage', handleUpdate)
        document.removeEventListener('inquiry-updated', handleUpdate)
      }
    } else {
      setIsInquiryReady(true)
    }
  }, [showInquiries])

  useEffect(() => {
    const contactSection = formRef.current?.closest('.ContactForm')
    if (!contactSection || !showInquiries) return
    if (isInquiryReady) {
      contactSection.classList.remove('has-inquiry-pending')
    }
  }, [showInquiries, isInquiryReady])

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm({ mode: 'onTouched' })

  const showRegionRadio = variant === 'hotel_listing'
  const showIntegrationCheckbox = variant === 'hotel_listing' || variant === 'hotel_detail'

  const onSubmit = async (data: FieldValues) => {
    setStatus({ sending: true, success: undefined })

    try {
    const payload: Record<string, unknown> = {
      ...data,
      lang,
      sourceUrl: window.location.href,
    }

    if (contextItem) {
      payload.contextItem = contextItem
    }

    if (showInquiries && inquiryItems.length > 0) {
      payload.selectedItems = inquiryItems
    }

    const utmString = getUtmString()
    if (utmString) payload.utm = utmString

    navigator.sendBeacon(
      '/api/s3d',
      JSON.stringify({
        formType: 'inquiry_form',
        email: data.email,
        phone: data.phone && data.phone !== '+48' ? data.phone : undefined,
        name: data.name,
        teamSize: data.teamSize,
        timeline: data.timeline,
        region: data.region || undefined,
        needsIntegration: data.needsIntegration || undefined,
        additionalInfo: data.additionalInfo,
        contextItemName: contextItem?.name,
        contextItemType: contextItem?.type,
        selectedItems: inquiryItems.length > 0
          ? inquiryItems.map((i) => ({ name: i.name, type: i.type }))
          : undefined,
        sourceUrl: window.location.href,
        utm: getUtmForSheet(),
      })
    )

      console.log('[InquiryForm] Submitting payload:', JSON.stringify(payload, null, 2))
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      console.log('[InquiryForm] Response status:', response.status)
      const responseData = await response.json()
      console.log('[InquiryForm] Response data:', responseData)

      if (response.ok && responseData.success) {
        setStatus({ sending: false, success: true })
        reset()

        if (showInquiries) {
          const { clearInquiry } = await import('@/src/utils/inquiry-store')
          clearInquiry()
          setInquiryItems([])
        }

        trackEvent({
          user: {
            email: data.email,
            phone: data.phone && data.phone !== '+48' ? data.phone : undefined,
          },
          ga4: {
            eventName: 'lead',
            params: {
              form_name: 'inquiry_form',
            },
          },
          meta: {
            eventName: 'Lead',
            contentName: 'inquiry_form',
            params: {
              form_name: 'inquiry_form',
            },
          },
        })
      } else {
        console.error('[InquiryForm] API returned error:', responseData)
        setStatus({ sending: false, success: false })
      }
    } catch (err) {
      console.error('[InquiryForm] Submission failed:', err)
      setStatus({ sending: false, success: false })
    }
  }

  const handleRestart = (e: React.MouseEvent) => {
    e.stopPropagation()
    setStatus({ sending: false, success: undefined })
  }

  const handleRemoveItem = (item: InquiryItem) => {
    const updated = removeFromInquiry(item.id)
    setInquiryItems(updated)
    dispatchToast(t.form.inquiry.items.removedAlert, 'success')
  }

  const isFilled = status.sending || status.success !== undefined

  return (
    <form ref={formRef} onSubmit={handleSubmit(onSubmit)} className={styles.InquiryForm}>
      {/* Inquiry items display */}
      {showInquiries && isInquiryReady && inquiryItems.length > 0 && (
        <div className={styles.inquiryItems} aria-hidden={isFilled}>
          <div className={styles.inquiryHeader}>
            <p className={styles.inquiryHeading}>{t.form.inquiry.items.heading}</p>
            <div className={styles.inquiryStats}>
              <span className={`${styles.inquiryStat} ${styles.activityStat}`}>
                {lang === 'pl' ? 'Integracje' : 'Activities'}: {activityCount}
              </span>
              <span className={`${styles.inquiryStat} ${styles.hotelStat}`}>
                {lang === 'pl' ? 'Hotele' : 'Hotels'}: {hotelCount}
              </span>
            </div>
          </div>
          <ul className={styles.inquiryList}>
            {inquiryItems.map((item) => (
              <li key={item.id} className={styles.inquiryItem} data-type={item.type}>
                <a href={item.url} className={styles.inquiryContent}>
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.name}
                      className={styles.inquiryImage}
                      width={48}
                      height={48}
                      loading="lazy"
                    />
                  )}
                  <div className={styles.inquiryMeta}>
                    <span className={styles.inquiryName}>{item.name}</span>
                    <span
                      className={`${styles.inquiryType} ${
                        item.type === 'hotel' ? styles.hotelType : styles.activityType
                      }`}
                    >
                      <span>{item.type === 'hotel' ? (lang === 'pl' ? 'Hotel' : 'Hotel') : (lang === 'pl' ? 'Integracja' : 'Activity')}</span>
                    </span>
                  </div>
                </a>
                <button
                  type="button"
                  className={styles.inquiryRemove}
                  onClick={() => handleRemoveItem(item)}
                  aria-label={`${t.form.inquiry.items.remove} ${item.name}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16">
                    <path
                      d="M12 4L4 12M4 4l8 8"
                      stroke="currentColor"
                      stroke-width="1.5"
                      stroke-linecap="round"
                    />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Row 1: Name + Email */}
      <div className={styles.fieldPair}>
        <Input
          aria-hidden={isFilled}
          disabled={isFilled}
          label={t.form.inquiry.name.label}
          register={register('name', {
            required: { value: true, message: t.form.inquiry.name.required },
          })}
          errors={errors}
          type="text"
          placeholder={t.form.inquiry.name.placeholder}
        />
        <Input
          aria-hidden={isFilled}
          disabled={isFilled}
          label={t.form.email.label}
          register={register('email', {
            required: { value: true, message: t.form.email.required },
            pattern: { value: REGEX.email, message: t.form.email.pattern },
          })}
          errors={errors}
          type="email"
        />
      </div>

      {/* Row 2: Phone + Timeline */}
      <div className={styles.fieldPair}>
        <Input
          aria-hidden={isFilled}
          disabled={isFilled}
          register={{ name: 'phone' }}
          errors={errors}
          label={t.form.inquiry.phone.label}
          phone={{ isPhone: true, control }}
        />
        <Input
          aria-hidden={isFilled}
          disabled={isFilled}
          label={t.form.inquiry.timeline.label}
          register={register('timeline')}
          errors={errors}
          type="text"
          placeholder={t.form.inquiry.timeline.placeholder}
        />
      </div>

      {/* Row 3: Team Size as radio buttons */}
      <fieldset className={styles.radioGroup} aria-hidden={isFilled}>
        <legend className={styles.radioLegend}>{t.form.inquiry.teamSize.label}</legend>
        <div className={styles.radioOptions}>
          {teamSizeOptions && teamSizeOptions.length > 0
            ? teamSizeOptions.map((opt) => (
                <label key={opt.value} className={styles.radioOption}>
                  <input type="radio" value={opt.value} disabled={isFilled} {...register('teamSize')} />
                  <span className={styles.radioMark} />
                  <span>{opt.label}</span>
                </label>
              ))
            : Object.entries(t.form.inquiry.teamSize.options).map(([key, label]) => (
                <label key={key} className={styles.radioOption}>
                  <input type="radio" value={key} disabled={isFilled} {...register('teamSize')} />
                  <span className={styles.radioMark} />
                  <span>{label}</span>
                </label>
              ))
          }
        </div>
      </fieldset>

      {/* Region Radio (hotel_listing) */}
      {showRegionRadio && (
        <fieldset className={styles.radioGroup} aria-hidden={isFilled}>
          <legend className={styles.radioLegend}>{t.form.inquiry.region.label}</legend>
          <div className={styles.radioOptions}>
            {regionOptions && regionOptions.length > 0
              ? regionOptions.map((opt) => (
                  <label key={opt.value} className={styles.radioOption}>
                    <input type="radio" value={opt.value} disabled={isFilled} {...register('region')} />
                    <span className={styles.radioMark} />
                    <span>{opt.label}</span>
                  </label>
                ))
              : Object.entries(t.form.inquiry.region.options).filter(([key]) => key !== 'none').map(([key, label]) => (
                  <label key={key} className={styles.radioOption}>
                    <input type="radio" value={key} disabled={isFilled} {...register('region')} />
                    <span className={styles.radioMark} />
                    <span>{label}</span>
                  </label>
                ))
            }
            {/* Always append "No preference" as the last option */}
            <label key="none" className={styles.radioOption}>
              <input type="radio" value="none" disabled={isFilled} {...register('region')} />
              <span className={styles.radioMark} />
              <span>{t.form.inquiry.region.options.none}</span>
            </label>
          </div>
        </fieldset>
      )}

      {/* Integration Checkbox (hotel_listing, hotel_detail) */}
      {showIntegrationCheckbox && (
        <Checkbox aria-hidden={isFilled} disabled={isFilled} register={register('needsIntegration')} errors={errors}>
          {t.form.inquiry.needsIntegration}
        </Checkbox>
      )}

      {/* Additional Info */}
      <Input
        aria-hidden={isFilled}
        disabled={isFilled}
        label={t.form.inquiry.additionalInfo.label}
        register={register('additionalInfo', {
          required: { value: true, message: t.form.inquiry.additionalInfo.required },
          validate: {
            hasContent: (value: string) => value?.trim().length > 0 || t.form.inquiry.additionalInfo.required,
            minLetters: (value: string) =>
              countLetters(value || '') >= 16 || t.form.inquiry.additionalInfo.minLength,
          },
        })}
        errors={errors}
        isTextarea
        placeholder={t.form.inquiry.additionalInfo.placeholder}
      />

      {/* Legal Checkbox */}
      <Checkbox
        aria-hidden={isFilled}
        disabled={isFilled}
        register={register('legal', {
          required: { value: true, message: t.form.combined.required },
        })}
        errors={errors}
      >
        {t.form.combined.labelFirst}{' '}
        <a
          href={t.form.combined.termsLink}
          target="_blank"
          rel="noopener noreferrer"
          className="link"
          data-shade="light"
          tabIndex={isFilled ? -1 : 0}
        >
          {t.form.combined.labelSecond}
        </a>{' '}
        {t.form.combined.labelMiddle}{' '}
        <a
          href={t.form.combined.privacyLink}
          target="_blank"
          rel="noopener noreferrer"
          className="link"
          data-shade="light"
          tabIndex={isFilled ? -1 : 0}
        >
          {t.form.combined.labelThird}
        </a>
      </Checkbox>

      {/* Hidden context item fields */}
      {contextItem && (
        <>
          <input type="hidden" value={contextItem.type} {...register('contextItemType')} />
          <input type="hidden" value={contextItem.id} {...register('contextItemId')} />
          <input type="hidden" value={contextItem.name} {...register('contextItemName')} />
        </>
      )}

      {/* Submit */}
      <Button type="submit" disabled={isFilled}>
        {t.form.inquiry.submit}
      </Button>

      {children}

      <div className={styles.stateOverlay}>
        <Loader
          isLoading={isFilled}
          hasFinishedLoading={status.sending === false && status.success !== undefined}
          lang={lang}
        />
        <FormState
          success={formState.success}
          error={formState.error}
          isSuccess={status.success}
          handleRestart={handleRestart}
          lang={lang}
        />
      </div>
    </form>
  )
}
