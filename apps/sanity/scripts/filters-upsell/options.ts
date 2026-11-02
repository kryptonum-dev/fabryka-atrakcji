import type { Language } from './shared'

export type LocalizedName = Record<Language, string>

type OptionKind = 'surroundings' | 'space-type' | 'event-type' | 'character' | 'facility' | 'city'

type Option = {
  slug: string
  enSlug: string
  name: LocalizedName
  point?: { lat: number; lng: number }
}

type OptionGroup = {
  kind: OptionKind
  schemaType: string
  options: Option[]
}

export const OPTION_GROUPS: OptionGroup[] = [
  {
    kind: 'surroundings',
    schemaType: 'HotelSurroundings_Collection',
    options: [
      { slug: 'gory', enSlug: 'mountains', name: { pl: 'Góry', en: 'Mountains' } },
      {
        slug: 'nad-jeziorem-woda',
        enSlug: 'by-a-lake-water',
        name: { pl: 'Nad jeziorem / wodą', en: 'By a lake / water' },
      },
      { slug: 'nad-morzem', enSlug: 'by-the-sea', name: { pl: 'Nad morzem', en: 'By the sea' } },
      { slug: 'las-puszcza', enSlug: 'forest-wilderness', name: { pl: 'Las / puszcza', en: 'Forest / wilderness' } },
      { slug: 'miasto', enSlug: 'city', name: { pl: 'Miasto', en: 'City' } },
      {
        slug: 'natura-na-uboczu',
        enSlug: 'nature-secluded',
        name: { pl: 'Natura / na uboczu', en: 'Nature / secluded' },
      },
    ],
  },
  {
    kind: 'space-type',
    schemaType: 'EventSpaceTypes_Collection',
    options: [
      { slug: 'wnetrze', enSlug: 'indoor', name: { pl: 'Wnętrze', en: 'Indoor' } },
      { slug: 'plener', enSlug: 'outdoor', name: { pl: 'Plener', en: 'Outdoor' } },
    ],
  },
  {
    kind: 'event-type',
    schemaType: 'EventTypes_Collection',
    options: [
      {
        slug: 'konferencja-szkolenie',
        enSlug: 'conference-training',
        name: { pl: 'Konferencja / szkolenie', en: 'Conference / training' },
      },
      {
        slug: 'gala-bankiet-wigilia',
        enSlug: 'gala-banquet-christmas-party',
        name: { pl: 'Gala / bankiet / wigilia', en: 'Gala / banquet / Christmas party' },
      },
      {
        slug: 'integracja-impreza-firmowa',
        enSlug: 'team-building-company-party',
        name: { pl: 'Integracja / impreza firmowa', en: 'Team building / company party' },
      },
      { slug: 'warsztaty', enSlug: 'workshops', name: { pl: 'Warsztaty', en: 'Workshops' } },
      {
        slug: 'premiera-pokaz-event-promocyjny',
        enSlug: 'premiere-show-promotional-event',
        name: { pl: 'Premiera / pokaz / event promocyjny', en: 'Premiere / show / promotional event' },
      },
    ],
  },
  {
    kind: 'character',
    schemaType: 'EventSpaceCharacters_Collection',
    options: [
      {
        slug: 'industrialna-loftowa',
        enSlug: 'industrial-loft',
        name: { pl: 'Industrialna / loftowa', en: 'Industrial / loft' },
      },
      {
        slug: 'elegancka-reprezentacyjna',
        enSlug: 'elegant-prestigious',
        name: { pl: 'Elegancka / reprezentacyjna', en: 'Elegant / prestigious' },
      },
      {
        slug: 'zabytkowa-historyczna',
        enSlug: 'heritage-historic',
        name: { pl: 'Zabytkowa / historyczna', en: 'Heritage / historic' },
      },
      {
        slug: 'nowoczesna-designerska',
        enSlug: 'modern-designer',
        name: { pl: 'Nowoczesna / designerska', en: 'Modern / designer' },
      },
      {
        slug: 'naturalna-rustykalna',
        enSlug: 'natural-rustic',
        name: { pl: 'Naturalna / rustykalna', en: 'Natural / rustic' },
      },
    ],
  },
  {
    kind: 'facility',
    schemaType: 'EventSpaceFacilities_Collection',
    options: [
      {
        slug: 'mozliwosc-wylacznosci',
        enSlug: 'exclusive-use',
        name: { pl: 'Możliwość wyłączności', en: 'Exclusive use' },
      },
      {
        slug: 'zaplecze-techniczne',
        enSlug: 'technical-facilities',
        name: { pl: 'Zaplecze techniczne', en: 'Technical facilities' },
      },
      {
        slug: 'zaplecze-kuchenne-kulinarne',
        enSlug: 'kitchen-culinary-facilities',
        name: { pl: 'Zaplecze kuchenne / kulinarne', en: 'Kitchen / culinary facilities' },
      },
    ],
  },
  {
    kind: 'city',
    schemaType: 'FilterCities_Collection',
    options: [
      {
        slug: 'warszawa',
        enSlug: 'warsaw',
        name: { pl: 'Warszawa', en: 'Warsaw' },
        point: { lat: 52.2297, lng: 21.0122 },
      },
      { slug: 'krakow', enSlug: 'krakow', name: { pl: 'Kraków', en: 'Krakow' }, point: { lat: 50.0614, lng: 19.9366 } },
      {
        slug: 'wroclaw',
        enSlug: 'wroclaw',
        name: { pl: 'Wrocław', en: 'Wroclaw' },
        point: { lat: 51.1097, lng: 17.0319 },
      },
      { slug: 'poznan', enSlug: 'poznan', name: { pl: 'Poznań', en: 'Poznan' }, point: { lat: 52.4083, lng: 16.9335 } },
      // Tricity is measured from Sopot, 9-11 km from both Gdańsk and Gdynia. Editors can move the point in Studio.
      {
        slug: 'trojmiasto',
        enSlug: 'tricity',
        name: { pl: 'Trójmiasto', en: 'Tricity' },
        point: { lat: 54.4418, lng: 18.5601 },
      },
      {
        slug: 'katowice',
        enSlug: 'katowice',
        name: { pl: 'Katowice', en: 'Katowice' },
        point: { lat: 50.2599, lng: 19.0216 },
      },
      { slug: 'lodz', enSlug: 'lodz', name: { pl: 'Łódź', en: 'Lodz' }, point: { lat: 51.7769, lng: 19.4547 } },
    ],
  },
]

export const optionId = (kind: OptionKind, slug: string, language: Language) => `filters-${kind}-${slug}-${language}`

export const optionMetadataId = (kind: OptionKind, slug: string) => `filters-${kind}-${slug}-meta`
