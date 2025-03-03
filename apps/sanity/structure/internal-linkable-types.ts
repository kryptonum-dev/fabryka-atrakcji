/**
 * Array of objects defining the types of documents that can be linked internally.
 * Each object contains a 'type' property specifying the document type.
 *
 * @type {{type: string}[]}
 */
export const InternalLinkableTypes: { type: string }[] = [
  // Singleton document types
  { type: 'Index_Page' },

  // Collection document types
  { type: 'Pages_Collection' },
]
