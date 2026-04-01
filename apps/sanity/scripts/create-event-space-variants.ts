import { createClient } from '@sanity/client'
import { API_VERSION, DATASET, PROJECT_ID } from '../constants'

type PortableTextBlock = {
  _key: string
  _type: 'block'
  children: Array<{
    _key: string
    _type: 'span'
    marks: string[]
    text: string
  }>
  markDefs: unknown[]
  style: 'normal' | 'h2'
}

type ImageField = {
  _type: 'image'
  asset: {
    _type: 'reference'
    _ref: string
  }
  _key?: string
}

type MediaItem = {
  _key: string
  image: ImageField
  youtubeId?: string
}

type SourceEventSpace = {
  _id: string
  name: string
  slug: {
    current: string
  }
  language: string
  description: string
  address: {
    city: string
    street: string
    postalCode: string
    voivodeship: string
  }
  googleMaps: {
    googleMapsLink: string
    googleMapsEmbed?: string
  }
  location: {
    _type: 'reference'
    _ref: string
  }
  areaM2: number
  maxPeople: number
  popularityIndex: number
  pricing?: {
    pricingVisible?: boolean
    fromPrice?: number
    priceLabel?: string
  }
  mediaList?: MediaItem[] | null
  imageList?: ImageField[] | null
}

type VariantDefinition = {
  sourceId: string
  id: string
  slug: string
  name: string
  title: string
  description: string
  seoTitle: string
  seoDescription: string
  sectionOneHeading: string
  sectionOneBody: string
  sectionTwoHeading: string
  sectionTwoBody: string
  areaM2: number
  maxPeople: number
  popularityIndex: number
  fromPrice?: number
  priceSuffix?: string
}

const VARIANTS: VariantDefinition[] = [
  {
    sourceId: 'event-space-fabryka-spotkan-wroclaw',
    id: 'event-space-wroclaw-forum-riverside',
    slug: 'wroclaw-forum-riverside',
    name: 'Wrocław Forum Riverside',
    title: 'Wrocław Forum Riverside - duża przestrzeń eventowa na konferencje i gale',
    description:
      'Duża przestrzeń eventowa we Wrocławiu zaprojektowana z myślą o konferencjach, galach i premierach marek. Sprawdza się przy większych scenariuszach firmowych wymagających efektu i elastyczności.',
    seoTitle: 'Wrocław Forum Riverside | Eventy Firmowe Wrocław | Fabryka Atrakcji',
    seoDescription:
      'Wrocław Forum Riverside to duża przestrzeń eventowa na konferencje, gale i premiery marek. Poznaj obiekt dopasowany do większych realizacji firmowych we Wrocławiu.',
    sectionOneHeading: 'Skala wydarzenia',
    sectionOneBody:
      'Układ sali pozwala pracować na dużej scenie, rozbudowanej scenografii oraz kilku równoległych strefach dla gości. To dobre miejsce, gdy wydarzenie ma być widoczne i zapamiętywalne.',
    sectionTwoHeading: 'Najczęstsze realizacje',
    sectionTwoBody:
      'Przestrzeń dobrze wypada przy konferencjach, galach sprzedażowych, premierach produktów, spotkaniach całej firmy oraz dużych eventach dla klientów i partnerów.',
    areaM2: 540,
    maxPeople: 360,
    popularityIndex: 88,
    fromPrice: 19500,
    priceSuffix: 'event',
  },
  {
    sourceId: 'event-space-kamienica-spotkan-bialowieza',
    id: 'event-space-rezydencja-team-retreat-bialowieza',
    slug: 'rezydencja-team-retreat-bialowieza',
    name: 'Rezydencja Team Retreat Białowieża',
    title: 'Rezydencja Team Retreat Białowieża - butikowa przestrzeń na spotkania strategiczne',
    description:
      'Butikowa przestrzeń eventowa w Białowieży przygotowana dla zespołów, które potrzebują skupienia, prywatności i spokojnego otoczenia. Dobrze wspiera kameralne spotkania o wysokiej wadze biznesowej.',
    seoTitle: 'Rezydencja Team Retreat Białowieża | Spotkania Firmowe | Fabryka Atrakcji',
    seoDescription:
      'Rezydencja Team Retreat Białowieża to kameralna przestrzeń na warsztaty strategiczne, spotkania managerskie i wyjazdy firmowe wymagające skupienia i komfortu.',
    sectionOneHeading: 'Kameralna atmosfera',
    sectionOneBody:
      'Miejsce sprzyja rozmowie, planowaniu i pracy w mniejszym gronie. Zespół może skupić się na celu spotkania, bez rozpraszającego tła i nadmiaru bodźców.',
    sectionTwoHeading: 'Dla jakich zespołów?',
    sectionTwoBody:
      'Najlepiej sprawdza się przy warsztatach zarządu, spotkaniach projektowych, sesjach planowania, masterclassach oraz wyjazdach firmowych z częścią roboczą.',
    areaM2: 185,
    maxPeople: 90,
    popularityIndex: 61,
  },
  {
    sourceId: 'event-space-loft-powisle-62',
    id: 'event-space-studio-powisle-riverside',
    slug: 'studio-powisle-riverside',
    name: 'Studio Powiśle Riverside',
    title: 'Studio Powiśle Riverside - loftowa przestrzeń eventowa blisko centrum Warszawy',
    description:
      'Loftowa przestrzeń eventowa na warszawskim Powiślu, idealna na prezentacje marek, kolacje firmowe i warsztaty kreatywne. Łączy centralną lokalizację z mocnym, nowoczesnym klimatem.',
    seoTitle: 'Studio Powiśle Riverside | Eventy w Warszawie | Fabryka Atrakcji',
    seoDescription:
      'Studio Powiśle Riverside to loftowa przestrzeń eventowa w Warszawie na prezentacje marek, warsztaty i kolacje firmowe. Zobacz obiekt o nowoczesnym klimacie.',
    sectionOneHeading: 'Mocny efekt wizualny',
    sectionOneBody:
      'Industrialne wnętrze oraz elastyczny układ sali pomagają budować wydarzenia, które robią dobre pierwsze wrażenie i dobrze wyglądają w materiałach foto oraz video.',
    sectionTwoHeading: 'Najlepsze formaty',
    sectionTwoBody:
      'Obiekt dobrze pracuje przy premierach produktów, eventach networkingowych, warsztatach kreatywnych, kolacjach firmowych i spotkaniach zarządu w bardziej nowoczesnej oprawie.',
    areaM2: 265,
    maxPeople: 200,
    popularityIndex: 79,
  },
  {
    sourceId: 'event-space-manufaktura-event-poznan',
    id: 'event-space-hala-inspiracji-poznan',
    slug: 'hala-inspiracji-poznan',
    name: 'Hala Inspiracji Poznań',
    title: 'Hala Inspiracji Poznań - elastyczna przestrzeń na konferencje i premiery',
    description:
      'Elastyczna przestrzeń eventowa w Poznaniu, przygotowana pod konferencje, premiery marek i firmowe spotkania o większej skali. Daje swobodę pracy na scenie, ekspozycji i strefach dodatkowych.',
    seoTitle: 'Hala Inspiracji Poznań | Eventy Firmowe Poznań | Fabryka Atrakcji',
    seoDescription:
      'Hala Inspiracji Poznań to przestrzeń eventowa na konferencje, premiery i spotkania firmowe. Poznaj obiekt, który dobrze obsługuje większe realizacje w Poznaniu.',
    sectionOneHeading: 'Elastyczny układ',
    sectionOneBody:
      'Przestrzeń daje dużą swobodę w ustawieniu sceny, widowni, stołów, ekspozycji oraz stref partnerów. Dzięki temu łatwo dopasować ją do konkretnego scenariusza wydarzenia.',
    sectionTwoHeading: 'Jakie wydarzenia?',
    sectionTwoBody:
      'Najczęściej realizujemy tu konferencje, dni klienta, spotkania sprzedażowe, premiery produktów oraz firmowe wydarzenia wymagające spójnego flow i zaplecza technicznego.',
    areaM2: 430,
    maxPeople: 300,
    popularityIndex: 76,
    fromPrice: 14900,
    priceSuffix: 'event',
  },
  {
    sourceId: 'event-space-marina-22-sopot',
    id: 'event-space-przystan-eventowa-sopot',
    slug: 'przystan-eventowa-sopot',
    name: 'Przystań Eventowa Sopot',
    title: 'Przystań Eventowa Sopot - nadmorska przestrzeń na spotkania firmowe premium',
    description:
      'Nadmorska przestrzeń eventowa w Sopocie na spotkania firmowe premium, kolacje dla klientów i prezentacje marek. Łączy reprezentacyjny charakter z atrakcyjnym położeniem blisko morza.',
    seoTitle: 'Przystań Eventowa Sopot | Eventy Premium | Fabryka Atrakcji',
    seoDescription:
      'Przystań Eventowa Sopot to nadmorska przestrzeń na kolacje firmowe, spotkania premium i prezentacje marek. Sprawdź miejsce dla realizacji z efektem wow.',
    sectionOneHeading: 'Położenie robi różnicę',
    sectionOneBody:
      'Lokalizacja w Sopocie buduje wyjątkowy klimat wydarzenia i pomaga podnieść jego odbiór. To przestrzeń, którą łatwo sprzedać zarówno klientom, jak i zespołom wewnętrznym.',
    sectionTwoHeading: 'Kiedy warto ją wybrać?',
    sectionTwoBody:
      'Najlepiej sprawdza się przy kolacjach dla klientów, spotkaniach zarządów, premierach marek, galach wewnętrznych oraz wydarzeniach firmowych z elementem premium.',
    areaM2: 310,
    maxPeople: 190,
    popularityIndex: 74,
    fromPrice: 15900,
    priceSuffix: 'event',
  },
  {
    sourceId: 'event-space-oranzeria-praga',
    id: 'event-space-oranzeria-spotkan-praga',
    slug: 'oranzeria-spotkan-praga',
    name: 'Oranżeria Spotkań Praga',
    title: 'Oranżeria Spotkań Praga - jasna przestrzeń na warsztaty i spotkania biznesowe',
    description:
      'Jasna przestrzeń eventowa na warszawskiej Pradze stworzona z myślą o warsztatach, spotkaniach biznesowych i wydarzeniach dziennych. Dobrze sprawdza się przy formatach wymagających lekkiej, otwartej atmosfery.',
    seoTitle: 'Oranżeria Spotkań Praga | Przestrzeń Eventowa Warszawa | Fabryka Atrakcji',
    seoDescription:
      'Oranżeria Spotkań Praga to jasna przestrzeń eventowa na warsztaty, spotkania biznesowe i wydarzenia dzienne w Warszawie. Zobacz obiekt o lekkim charakterze.',
    sectionOneHeading: 'Dzienne formaty biznesowe',
    sectionOneBody:
      'Naturalne światło i swobodny układ wnętrza pomagają prowadzić spotkania, podczas których ważna jest energia zespołu, komfort uczestników i dobra dynamika pracy.',
    sectionTwoHeading: 'Najczęstsze realizacje',
    sectionTwoBody:
      'To dobre miejsce na warsztaty, sesje szkoleniowe, spotkania projektowe, prezentacje produktowe, śniadania biznesowe i kameralne konferencje jednodniowe.',
    areaM2: 230,
    maxPeople: 140,
    popularityIndex: 69,
    fromPrice: 10400,
    priceSuffix: 'dzien',
  },
  {
    sourceId: 'event-space-panorama-forum-krakow',
    id: 'event-space-panorama-loft-krakow',
    slug: 'panorama-loft-krakow',
    name: 'Panorama Loft Kraków',
    title: 'Panorama Loft Kraków - przestrzeń firmowa z widokiem na wydarzenia dzienne',
    description:
      'Przestrzeń eventowa w Krakowie przygotowana pod konferencje dzienne, warsztaty i spotkania zarządu. Łączy dobrą lokalizację, wygodny układ i reprezentacyjny charakter dla wydarzeń biznesowych.',
    seoTitle: 'Panorama Loft Kraków | Spotkania Firmowe Kraków | Fabryka Atrakcji',
    seoDescription:
      'Panorama Loft Kraków to przestrzeń eventowa na konferencje dzienne, warsztaty i spotkania firmowe. Poznaj obiekt do realizacji biznesowych w Krakowie.',
    sectionOneHeading: 'Reprezentacyjna oprawa',
    sectionOneBody:
      'Przestrzeń dobrze wspiera wydarzenia, które mają być profesjonalne, ale nie przesadnie formalne. Łatwo zbudować tu czytelny układ sceny, stołów i stref networkingowych.',
    sectionTwoHeading: 'Do jakich formatow?',
    sectionTwoBody:
      'Sprawdza się przy warsztatach dla liderów, konferencjach jednodniowych, dniach klienta, spotkaniach zarządu oraz prezentacjach z częścią networkingową.',
    areaM2: 260,
    maxPeople: 170,
    popularityIndex: 71,
    fromPrice: 9400,
    priceSuffix: 'dzien',
  },
  {
    sourceId: 'event-space-port-89-gizycko',
    id: 'event-space-marina-forum-gizycko',
    slug: 'marina-forum-gizycko',
    name: 'Marina Forum Giżycko',
    title: 'Marina Forum Giżycko - przestrzeń na firmowe spotkania z klimatem Mazur',
    description:
      'Przestrzeń eventowa w Giżycku dla zespołów szukających połączenia pracy, relaksu i atrakcyjnego otoczenia. Dobrze sprawdza się przy wyjazdach firmowych z częścią warsztatową i integracyjną.',
    seoTitle: 'Marina Forum Giżycko | Eventy na Mazurach | Fabryka Atrakcji',
    seoDescription:
      'Marina Forum Giżycko to przestrzeń eventowa na Mazurach dla warsztatów, wyjazdów firmowych i spotkań zespołowych. Zobacz miejsce z wyjątkowym klimatem regionu.',
    sectionOneHeading: 'Mazurski kontekst',
    sectionOneBody:
      'Otoczenie wspiera wydarzenia, w których liczy się oddech od miasta i możliwość połączenia części roboczej z mniej formalnym programem dla uczestników.',
    sectionTwoHeading: 'Dla jakich projektow?',
    sectionTwoBody:
      'Obiekt dobrze działa przy wyjazdach managerskich, warsztatach strategicznych, spotkaniach projektowych oraz programach firmowych z dodatkową integracją w regionie.',
    areaM2: 280,
    maxPeople: 160,
    popularityIndex: 66,
  },
  {
    sourceId: 'event-space-stocznia-event-hall-gdansk',
    id: 'event-space-nabrzeze-event-hall-gdansk',
    slug: 'nabrzeze-event-hall-gdansk',
    name: 'Nabrzeże Event Hall Gdańsk',
    title: 'Nabrzeże Event Hall Gdańsk - hala na duże eventy firmowe i premiery',
    description:
      'Duża hala eventowa w Gdańsku na premiery, targi firmowe i wydarzenia o wysokiej frekwencji. Daje zaplecze do budowania rozbudowanych scenariuszy z kilkoma strefami aktywności.',
    seoTitle: 'Nabrzeże Event Hall Gdańsk | Duze Eventy Firmowe | Fabryka Atrakcji',
    seoDescription:
      'Nabrzeże Event Hall Gdańsk to duża hala na premiery, targi firmowe i konferencje o wysokiej frekwencji. Poznaj przestrzeń na mocne realizacje w Gdańsku.',
    sectionOneHeading: 'Wysoka pojemnosc',
    sectionOneBody:
      'To miejsce dla wydarzeń, które wymagają skali, odpowiedniej logistyki oraz wyraźnego podziału na scenę główną, część ekspozycyjną i strefy dla partnerów.',
    sectionTwoHeading: 'Najlepsze zastosowania',
    sectionTwoBody:
      'Najczęściej realizujemy tu premiery marek, targi firmowe, duże konferencje, spotkania całej organizacji i eventy z udziałem klientów oraz partnerów biznesowych.',
    areaM2: 760,
    maxPeople: 580,
    popularityIndex: 83,
    fromPrice: 25500,
    priceSuffix: 'event',
  },
  {
    sourceId: 'event-space-szczyt-event-space-szczyrk',
    id: 'event-space-panorama-szczyrk-summit',
    slug: 'panorama-szczyrk-summit',
    name: 'Panorama Szczyrk Summit',
    title: 'Panorama Szczyrk Summit - gorska przestrzen na spotkania i wyjazdy firmowe',
    description:
      'Gorska przestrzeń eventowa w Szczyrku przygotowana pod wyjazdy firmowe, warsztaty i spotkania liderów. Sprawdza się tam, gdzie ważne jest połączenie pracy z atrakcyjnym otoczeniem.',
    seoTitle: 'Panorama Szczyrk Summit | Eventy Firmowe w Gorach | Fabryka Atrakcji',
    seoDescription:
      'Panorama Szczyrk Summit to gorska przestrzen eventowa na warsztaty, wyjazdy firmowe i spotkania liderow. Poznaj miejsce do realizacji biznesowych w Szczyrku.',
    sectionOneHeading: 'Gorski klimat pracy',
    sectionOneBody:
      'Widokowe położenie i bardziej wyjazdowy charakter obiektu pomagają prowadzić spotkania, które potrzebują oddechu, mocniejszego focusu i dobrej atmosfery zespołowej.',
    sectionTwoHeading: 'Jakie wydarzenia?',
    sectionTwoBody:
      'Miejsce dobrze wypada przy wyjazdach firmowych, warsztatach strategicznych, spotkaniach liderów, kickoffach projektowych oraz kameralnych eventach premium.',
    areaM2: 190,
    maxPeople: 120,
    popularityIndex: 68,
    fromPrice: 8200,
    priceSuffix: 'dzien',
  },
]

const args = new Set(process.argv.slice(2))
const isApply = args.has('--apply')
const isReplace = args.has('--replace')
const isDryRun = !isApply

const token = process.env.SANITY_API_TOKEN || process.env.SANITY_AUTH_TOKEN

if (!token) {
  throw new Error('Missing SANITY_API_TOKEN or SANITY_AUTH_TOKEN environment variable')
}

const client = createClient({
  projectId: PROJECT_ID,
  dataset: DATASET,
  apiVersion: API_VERSION,
  useCdn: false,
  token,
})

const createKey = () => crypto.randomUUID().replace(/-/g, '').slice(0, 12)

const createTextBlock = (text: string, style: 'normal' | 'h2'): PortableTextBlock => ({
  _key: createKey(),
  _type: 'block',
  children: [
    {
      _key: createKey(),
      _type: 'span',
      marks: [],
      text,
    },
  ],
  markDefs: [],
  style,
})

const buildHeading = (text: string): PortableTextBlock[] => [createTextBlock(text, 'normal')]

const buildContent = (variant: VariantDefinition): PortableTextBlock[] => [
  createTextBlock(variant.sectionOneHeading, 'h2'),
  createTextBlock(variant.sectionOneBody, 'normal'),
  createTextBlock(variant.sectionTwoHeading, 'h2'),
  createTextBlock(variant.sectionTwoBody, 'normal'),
]

const normalizePriceSuffix = (value?: string, fallback?: string) => {
  const normalizedValue = value?.trim()
  if (!normalizedValue) return fallback
  if (normalizedValue.includes('/')) {
    return normalizedValue.split('/').slice(-1).join('/').trim() || fallback
  }
  return normalizedValue
}

const cloneMediaList = (mediaList?: MediaItem[] | null) =>
  mediaList?.map((item) => ({
    _key: createKey(),
    image: {
      _type: 'image' as const,
      asset: {
        _type: 'reference' as const,
        _ref: item.image.asset._ref,
      },
    },
    ...(item.youtubeId ? { youtubeId: item.youtubeId } : {}),
  })) || null

const cloneImageList = (imageList?: ImageField[] | null) =>
  imageList?.map((item) => ({
    _key: createKey(),
    _type: 'image' as const,
    asset: {
      _type: 'reference' as const,
      _ref: item.asset._ref,
    },
  })) || null

const pickSeoImage = (source: SourceEventSpace): ImageField | undefined => {
  const mediaImage = source.mediaList?.[0]?.image
  if (mediaImage?.asset?._ref) {
    return {
      _type: 'image',
      asset: {
        _type: 'reference',
        _ref: mediaImage.asset._ref,
      },
    }
  }

  const image = source.imageList?.[0]
  if (image?.asset?._ref) {
    return {
      _type: 'image',
      asset: {
        _type: 'reference',
        _ref: image.asset._ref,
      },
    }
  }

  return undefined
}

const buildPricing = (source: SourceEventSpace, variant: VariantDefinition) => {
  if (!source.pricing?.pricingVisible) {
    return {
      pricingVisible: false,
    }
  }

  return {
    pricingVisible: true,
    fromPrice: variant.fromPrice ?? source.pricing.fromPrice,
    priceLabel: normalizePriceSuffix(source.pricing.priceLabel, variant.priceSuffix),
  }
}

const buildDocument = (source: SourceEventSpace, variant: VariantDefinition) => ({
  _id: variant.id,
  _type: 'EventSpaces_Collection',
  language: 'pl',
  name: variant.name,
  slug: {
    _type: 'slug',
    current: `/pl/przestrzenie-eventowe/${variant.slug}/`,
  },
  title: buildHeading(variant.title),
  description: variant.description,
  mediaList: cloneMediaList(source.mediaList),
  imageList: cloneImageList(source.imageList),
  location: {
    _type: 'reference' as const,
    _ref: source.location._ref,
  },
  areaM2: variant.areaM2,
  maxPeople: variant.maxPeople,
  address: structuredClone(source.address),
  googleMaps: structuredClone(source.googleMaps),
  popularityIndex: variant.popularityIndex,
  pricing: buildPricing(source, variant),
  content: buildContent(variant),
  components: null,
  seo: {
    _type: 'seo',
    title: variant.seoTitle,
    description: variant.seoDescription,
    doNotIndex: false,
    ...(pickSeoImage(source) ? { img: pickSeoImage(source) } : {}),
  },
})

const run = async () => {
  const sourceIds = VARIANTS.map((variant) => variant.sourceId)
  const targetIds = VARIANTS.map((variant) => variant.id)

  const sourceDocuments = await client.fetch<SourceEventSpace[]>(
    `*[_id in $ids]{
      _id,
      name,
      slug,
      language,
      description,
      address,
      googleMaps,
      location,
      areaM2,
      maxPeople,
      popularityIndex,
      pricing,
      mediaList,
      imageList
    }`,
    { ids: sourceIds }
  )

  const existingTargets = await client.fetch<Array<{ _id: string }>>(`*[_id in $ids]{_id}`, { ids: targetIds })
  const sourceMap = new Map(sourceDocuments.map((doc) => [doc._id, doc]))
  const existingTargetIds = new Set(existingTargets.map((doc) => doc._id))

  console.log(`[create-event-space-variants] mode=${isDryRun ? 'dry-run' : 'apply'} replace=${isReplace}`)
  console.log(`[create-event-space-variants] project=${PROJECT_ID} dataset=${DATASET}`)
  console.log(`[create-event-space-variants] variants=${VARIANTS.length}`)

  let prepared = 0
  let created = 0
  let replaced = 0
  let skipped = 0

  for (const variant of VARIANTS) {
    const source = sourceMap.get(variant.sourceId)
    if (!source) {
      throw new Error(`Missing source document: ${variant.sourceId}`)
    }

    const document = buildDocument(source, variant)
    prepared += 1

    console.log(`- ${variant.name} <- ${source.name}`)
    console.log(`  slug: ${document.slug.current}`)
    console.log(`  pricing: ${document.pricing.pricingVisible ? `${document.pricing.fromPrice} / ${document.pricing.priceLabel || ''}` : 'quote-only'}`)

    const exists = existingTargetIds.has(variant.id)
    if (exists && !isReplace) {
      skipped += 1
      console.log('  skip: target already exists')
      continue
    }

    if (isDryRun) {
      continue
    }

    if (exists && isReplace) {
      await client.createOrReplace(document)
      replaced += 1
      console.log('  replaced')
      continue
    }

    await client.create(document)
    created += 1
    console.log('  created')
  }

  console.log('\n[create-event-space-variants] summary')
  console.log(`prepared=${prepared}`)
  console.log(`created=${created}`)
  console.log(`replaced=${replaced}`)
  console.log(`skipped=${skipped}`)
}

run().catch((error) => {
  console.error('[create-event-space-variants] failed')
  console.error(error)
  process.exit(1)
})
