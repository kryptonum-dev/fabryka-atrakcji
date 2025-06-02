import sanityFetch from '@/src/utils/sanity.fetch'
import { ImageDataQuery } from '@/src/components/ui/image'
import { PortableTextQuery } from '@/src/components/ui/portable-text'
import type { APIRoute } from 'astro'
import { ButtonDataQuery } from '@/src/components/ui/Button'

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url)
  const id = url.searchParams.get('id')
  const lang = url.searchParams.get('lang') || 'pl'
  const addonIds = url.searchParams.get('addonIds') || ''

  const addonIdsArray = addonIds ? addonIds.split(',') : []

  if (!id) {
    return new Response(JSON.stringify({ error: 'Activity ID is required' }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }

  try {
    const activity = await sanityFetch({
      query: `
        *[_type == 'Activities_Collection' && _id == $id && language == $language][0] {
          _id,
          name,
          "slug": slug.current,
          ${PortableTextQuery('title')}
          description,
          ${ImageDataQuery('imageList[0]')}
          pricing,
          participantsCount,
          location{
            isNationwide,
            address{
              street,
              postalCode,
              city,
              voivodeship
            },
            googleMapsLink,
            isIndoor
          },
          addons{
            hasAddons,
            ${
              addonIdsArray.length > 0
                ? `
            "addonsList": addonsList[_key in $addonIds][] {
              _key,
              name,
              pricing,
              description,
              ${ImageDataQuery('image')}
            },`
                : `
            "addonsList": [],`
            }
            "fullAddonsList": addonsList[]{
              _key,
              name,
              pricing,
              description,
              ${ImageDataQuery('image')}
            },
            ${PortableTextQuery('heading')}
            addonsChoice,
             minOneAddon,
            addonsLayout,
            addonsHaveImage,
            additionalInfo,
          },
          alerts[]{
            ${PortableTextQuery('heading')}
            ${PortableTextQuery('paragraph')}
            cta{
              text,
              internalReference->{
                _id,
                name,
                "slug": slug.current,
              },
            },
          },
        }
      `,
      params: {
        id,
        language: lang,
        addonIds: addonIdsArray,
      },
    })

    if (!activity) {
      return new Response(JSON.stringify({ error: 'Activity not found' }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
        },
      })
    }

    return new Response(JSON.stringify(activity), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to fetch activity data' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }
}
