import { commitInBatches, createMigrationClient, runScript, type Language } from './shared'

// Adds the address provider to the privacy policy, as the last point of § 4 in each language and in any draft. A
// document that already has the paragraph is left alone, so an editor's correction survives another run.
//
//   dotenv -- bun apps/sanity/scripts/filters-upsell/update-privacy-policy.ts [--apply]

const SCRIPT = 'update-privacy-policy'
const PARAGRAPH_KEY = 'geoapify-address-search'
const NEXT_SECTION = '§ 5'

const PARAGRAPH: Record<Language, string> = {
  pl: 'Jeśli korzystają Państwo z wyszukiwania przestrzeni eventowych według odległości od adresu, wpisany adres trafia przez nasz serwer do Geoapify, dostawcy podpowiedzi adresów. Używamy go wyłącznie po to, żeby pokazać podpowiedzi, i sami go nie zapisujemy. Geoapify przetwarza dane na serwerach w Unii Europejskiej i zgodnie ze swoją polityką prywatności (https://www.geoapify.com/privacy-policy/) przechowuje dane zapytania zwykle nie dłużej niż 24 godziny. Współrzędne wybranego adresu, zaokrąglone do około 100 metrów, widać w adresie strony z wynikami, ale nie przekazujemy ich do narzędzi analitycznych ani marketingowych.',
  en: 'If you search event spaces by distance from an address, the address you type is sent through our server to Geoapify, the provider of address suggestions. We use it only to show suggestions and do not store it ourselves. Geoapify processes data on servers in the European Union and, under its privacy policy (https://www.geoapify.com/privacy-policy/), generally keeps request data for no longer than 24 hours. The coordinates of the selected address, rounded to about 100 metres, appear in the address of the results page, but we do not pass them to analytics or marketing tools.',
}

type Block = {
  _key: string
  _type: string
  style?: string
  listItem?: string
  level?: number
  children?: { text?: string }[]
}

type PolicyRow = { _id: string; language: Language; content: Block[] }

const blockText = (block: Block) => block.children?.map((child) => child.text ?? '').join('') ?? ''

runScript(SCRIPT, async () => {
  const client = createMigrationClient(SCRIPT)

  const documents = await client.fetch<PolicyRow[]>(`*[_type == "PrivacyPolicy_Page"]{ _id, language, content }`)
  if (documents.length === 0) throw new Error('No PrivacyPolicy_Page documents found')

  const changes = documents.flatMap((document) => {
    if (document.content.some((block) => block._key === PARAGRAPH_KEY)) return []

    const nextSection = document.content.findIndex(
      (block) => block.style === 'h2' && blockText(block).startsWith(NEXT_SECTION)
    )
    if (nextSection < 1) throw new Error(`${document._id}: no heading starting with ${NEXT_SECTION}`)

    // Same list as the point before it, so the numbering carries on
    const { style, listItem, level } = document.content[nextSection - 1]
    const paragraph = {
      _key: PARAGRAPH_KEY,
      _type: 'block',
      style,
      listItem,
      level,
      markDefs: [],
      children: [{ _key: `${PARAGRAPH_KEY}-text`, _type: 'span', marks: [], text: PARAGRAPH[document.language] }],
    }

    return [{ document, headingKey: document.content[nextSection]._key, paragraph }]
  })

  for (const { document, paragraph } of changes) {
    console.log(`- ${document._id} [${document.language}]: ${paragraph.children[0].text.slice(0, 80)}...`)
  }

  await commitInBatches(
    client,
    changes.map(
      ({ document, headingKey, paragraph }) =>
        (transaction) =>
          transaction.patch(document._id, (patch) =>
            patch.insert('before', `content[_key=="${headingKey}"]`, [paragraph])
          )
    )
  )

  return changes.length
})
