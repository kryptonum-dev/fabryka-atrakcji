/**
 * Global declaration of theme color in HEX format.
 * This color is used for theming purposes across the application.
 * @constant
 * @type {string}
 */
export const THEME_COLOR: string = '#db664e'

/**
 * Global declaration of background color in HEX format.
 * This color is used for the background across the application.
 * @constant
 * @type {string}
 */
export const BACKGROUND_COLOR: string = '#f5f1ec'

/**
 * Global declaration of the locale (language) for the application.
 * This constant is used to set the language attribute in the HTML tag.
 * @constant
 * @type {string}
 */
export const LOCALE: string = 'pl'

/**
 * Global declaration of the domain for the application.
 * This constant is used for constructing full URLs and determining external links.
 * @constant
 * @type {string}
 */
export const DOMAIN: string = 'https://www.fabryka-atrakcji.com/'

/**
 * Global declaration of the default title for the application.
 * This constant is used as a fallback title when a specific page title is not provided.
 * @constant
 * @type {string}
 */
export const DEFAULT_TITLE: string = 'Fabryka Atrakcji'

/**
 * Global declaration of the default description for the application.
 * This constant is used as a fallback description when a specific page description is not provided.
 * It's typically used in meta tags for SEO purposes.
 * @constant
 * @type {string}
 */
export const DEFAULT_DESCRIPTION: string =
  'Organizujemy niezapomniane eventy i integracje firmowe. Sprawdź, jak Fabryka Atrakcji może ożywić Twoje wydarzenie – kreatywnie, kompleksowo, z pasją.'

/**
 * Object containing regular expressions for validation purposes.
 * @constant
 * @type {Object}
 * @property {RegExp} email - Regular expression for validating email addresses.
 * @property {RegExp} phone - Regular expression for validating phone numbers.
 * @property {RegExp} string - Regular expression for trimming and validating strings.
 */
export const REGEX: { email: RegExp; phone: RegExp; string: RegExp } = {
  email: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
  phone: /^(?:\+(?:\d{1,3}))?(?:[ -]?\(?\d{1,4}\)?[ -]?\d{1,5}[ -]?\d{1,5}[ -]?\d{1,6})$/,
  string: /^(?!\s+$)(.*?)\s*$/,
}

/**
 * Global declaration of the Sanity dataset.
 * This constant is used for fetching data from Sanity.
 * @constant
 * @type {string}
 */
export const DATASET: string = 'production'

/**
 * Global declaration of the Sanity API version.
 * This constant is used for fetching data from Sanity.
 * @constant
 * @type {string}
 */
export const API_VERSION: string = '2024-10-15'

/**
 * Global declaration of the activities index name for Sanity Embeddings.
 * This constant is used for searching activities using embeddings.
 * @constant
 * @type {string}
 */
export const ACTIVITIES_INDEX_NAME: string = 'activities-index'

/**
 * Global declaration of the hotels index name for Sanity Embeddings.
 * This constant is used for searching hotels using embeddings.
 * @constant
 * @type {string}
 */
export const HOTELS_INDEX_NAME: string = 'hotels-index'
