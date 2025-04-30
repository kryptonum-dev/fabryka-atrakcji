/**
 * Array of objects defining the types of documents that can be linked internally.
 * Each object contains a 'type' property specifying the document type.
 *
 * @type {{type: string}[]}
 */
export const InternalLinkableTypes: { type: string }[] = [
  { type: 'Index_Page' },
  { type: 'CaseStudy_Page' },
  { type: 'Activities_Page' },
  { type: 'Blog_Page' },
  { type: 'Pages_Collection' },
  { type: 'BlogPost_Collection' },
  { type: 'BlogCategory_Collection' },
  { type: 'Activities_Collection' },
  { type: 'ActivitiesCategory_Collection' },
  { type: 'Hotels_Page' },
  { type: 'Hotels_Collection' },
]
