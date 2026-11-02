import { orderRankField } from '@sanity/orderable-document-list'
import { defineField, type ReferenceFilterResolver } from 'sanity'
import { isUniqueSlugInLanguage } from './is-unique-slug'
import { slugify } from './slugify'

export const COPY_COORDINATES_HINT =
  'W Google Maps kliknij miejsce prawym przyciskiem myszy i wybierz pierwszą pozycję menu, czyli współrzędne. Skopiują się dwie liczby: pierwszą wpisz w Latitude, drugą w Longitude. Altitude zostaw puste.'

// `required` accepts a point with one coordinate, and geo::distance then drops the object from results with no error.
export const validateCoordinates = (value?: { lat?: number; lng?: number }) =>
  Number.isFinite(value?.lat) && Number.isFinite(value?.lng) ? true : 'Wpisz obie współrzędne: Latitude i Longitude'

export const filterByDocumentLanguage: ReferenceFilterResolver = ({ document }) => {
  const language = (document as { language?: string })?.language
  return {
    filter: 'language == $lang',
    params: { lang: language },
  }
}

type FilterOptionConfig = {
  type: string
  nameTitle: string
  reservedSlugs?: string[]
}

export const defineFilterOptionFields = ({ type, nameTitle, reservedSlugs = [] }: FilterOptionConfig) => [
  orderRankField({ type }),
  defineField({
    name: 'language',
    type: 'string',
    readOnly: true,
    hidden: true,
  }),
  defineField({
    name: 'name',
    type: 'string',
    title: nameTitle,
    description: 'Wersję angielską utwórz przyciskiem Translations w nagłówku dokumentu.',
    validation: (Rule) => Rule.required().error(`${nameTitle}: to pole jest wymagane`),
  }),
  defineField({
    name: 'slug',
    type: 'slug',
    title: 'Slug (używany do filtrowania)',
    description: 'Tworzy się z nazwy i trafia do adresu strony z filtrem. Wersja EN może mieć taki sam slug jak PL.',
    options: {
      source: 'name',
      slugify: slugify,
      isUnique: isUniqueSlugInLanguage,
    },
    validation: (Rule) =>
      Rule.required().custom((value) => {
        const current = (value as { current?: string } | undefined)?.current
        if (current && reservedSlugs.includes(current)) return `Slug „${current}” jest zarezerwowany. Wpisz inny.`
        return true
      }),
  }),
]
