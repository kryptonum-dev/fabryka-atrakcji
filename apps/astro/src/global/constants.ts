/**
 * Global declaration of theme color in HEX format.
 * This color is used for theming purposes across the application.
 * @constant
 * @type {string}
 */
export const THEME_COLOR: string = '#011310'

/**
 * Global declaration of background color in HEX format.
 * This color is used for the background across the application.
 * @constant
 * @type {string}
 */
export const BACKGROUND_COLOR: string = '#000103'

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
export const DOMAIN: string = 'https://zakup-mieszkanie-astro-git-dev-kryptonum.vercel.app/'

/**
 * Global declaration of the default title for the application.
 * This constant is used as a fallback title when a specific page title is not provided.
 * @constant
 * @type {string}
 */
export const DEFAULT_TITLE: string = 'Kryptonum'

/**
 * Global declaration of the default description for the application.
 * This constant is used as a fallback description when a specific page description is not provided.
 * It's typically used in meta tags for SEO purposes.
 * @constant
 * @type {string}
 */
export const DEFAULT_DESCRIPTION: string =
  'Kryptonum tworzy nieszablonowe projekty tym, którym zależy na: 👨🏻‍💻 profesjonalnej stronie, 🎨 unikatowym brandingu, 💰 dochodowym biznesie online.'

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
 * Global declaration of the Resend API key.
 * This constant is used for sending emails via the Resend API.
 * @constant
 * @type {string}
 */
export const RESEND_API_KEY: string = process.env.RESEND_API_KEY || import.meta.env.RESEND_API_KEY

/**
 * Global declaration of the Sanity project ID.
 * This constant is used for fetching data from Sanity.
 * @constant
 * @type {string}
 */
export const PROJECT_ID: string = process.env.SANITY_PROJECT_ID || import.meta.env.SANITY_PROJECT_ID

/**
 * Global declaration of the Sanity API token.
 * This constant is used for fetching data from Sanity.
 * @constant
 * @type {string}
 */
export const SANITY_API_TOKEN: string = process.env.SANITY_API_TOKEN || import.meta.env.SANITY_API_TOKEN

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
