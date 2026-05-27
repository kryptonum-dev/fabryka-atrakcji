import { createClient } from '@sanity/client'
import { API_VERSION, DATASET, PROJECT_ID } from '../constants'

const args = new Set(process.argv.slice(2))
const isApply = args.has('--apply')
const isForce = args.has('--force')
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

type Category = {
  _id: string
  name: string
  language: string
  activities?: Array<{ activity?: { _ref?: string } }> | null
}

type Activity = {
  _id: string
  name: string
  popularityIndex: number
}

const run = async () => {
  console.log(`[populate-category-activities] mode=${isDryRun ? 'dry-run' : 'apply'} force=${isForce}`)
  console.log(`[populate-category-activities] project=${PROJECT_ID} dataset=${DATASET}`)

  const categories = await client.fetch<Category[]>(
    `*[_type == "ActivitiesCategory_Collection"]{ _id, name, language, activities }`
  )

  console.log(`[populate-category-activities] categories found: ${categories.length}`)

  let processed = 0
  let skipped = 0
  let totalAssigned = 0

  for (const category of categories) {
    const hasExisting = category.activities && category.activities.length > 0
    if (hasExisting && !isForce) {
      console.log(`- SKIP "${category.name}" (${category._id}) — already has ${category.activities!.length} activities`)
      skipped++
      continue
    }

    const activities = await client.fetch<Activity[]>(
      `*[_type == "Activities_Collection" && references($categoryId)] | order(popularityIndex desc) { _id, name, popularityIndex }`,
      { categoryId: category._id }
    )

    const entries = activities.map((a) => ({
      _type: 'activityEntry',
      _key: createKey(),
      activity: { _type: 'reference' as const, _ref: a._id },
    }))

    console.log(`- "${category.name}" (${category._id}): ${activities.length} activities`)
    for (const a of activities) {
      console.log(`    - ${a.name} (popularity: ${a.popularityIndex})`)
    }

    if (!isDryRun) {
      await client.patch(category._id).set({ activities: entries }).commit()
      console.log(`    → patched`)
    }

    processed++
    totalAssigned += activities.length
  }

  console.log(`\n[populate-category-activities] summary`)
  console.log(`  processed: ${processed}`)
  console.log(`  skipped: ${skipped}`)
  console.log(`  total activities assigned: ${totalAssigned}`)
}

run().catch((error) => {
  console.error('[populate-category-activities] failed')
  console.error(error)
  process.exit(1)
})
