import {
  commitInBatches,
  createMigrationClient,
  fetchEnTwins,
  readData,
  runScript,
  toPublishedId,
  withDraft,
} from './shared'

// Writes `point` from data/coordinates.json to PL objects and their EN twins. Rows cover every PL object and
// the EN objects that have no PL twin. Existing drafts get the same point.
//
//   dotenv -- bun apps/sanity/scripts/filters-upsell/apply-coordinates.ts [--apply]

const SCRIPT = 'apply-coordinates'

type CoordinateRow = { id: string; lat: number; lng: number }
type ObjectRow = { _id: string; _rev: string; _type: string; name: string; point?: { lat: number; lng: number } }

runScript(SCRIPT, async () => {
  const client = createMigrationClient(SCRIPT)
  const rows = readData<CoordinateRow[]>('coordinates.json')

  const objects = await client.fetch<ObjectRow[]>(
    `*[_type in ["Hotels_Collection", "EventSpaces_Collection"]]{ _id, _rev, _type, name, point }`
  )
  const byId = new Map(objects.map((object) => [object._id, object]))
  const knownIds = new Set(byId.keys())
  const twins = new Map([
    ...(await fetchEnTwins(client, 'Hotels_Collection', knownIds)),
    ...(await fetchEnTwins(client, 'EventSpaces_Collection', knownIds)),
  ])

  const targets = rows.flatMap((row) => {
    const twin = twins.get(row.id)
    return twin ? [row, { ...row, id: twin }] : [row]
  })

  const changes = targets.flatMap(({ id, lat, lng }) => {
    const ids = withDraft(id, byId)
    if (ids.length === 0) throw new Error(`No object with id ${id}`)

    return ids.flatMap((targetId) => {
      const object = byId.get(targetId)
      if (!object || (object.point?.lat === lat && object.point?.lng === lng)) return []
      return [{ object, point: { _type: 'geopoint', lat, lng } }]
    })
  })

  for (const { object, point } of changes) {
    console.log(`- ${object._type}:${object._id} ${object.name.trim()} -> ${point.lat},${point.lng}`)
  }

  await commitInBatches(
    client,
    changes.map(
      ({ object, point }) =>
        (transaction) =>
          transaction.patch(object._id, (patch) => patch.ifRevisionId(object._rev).set({ point }))
    )
  )

  const missing = objects.filter((object) => !targets.some((target) => target.id === toPublishedId(object._id)))
  if (missing.length > 0) {
    throw new Error(`Objects with no coordinates row: ${missing.map((object) => object._id).join(', ')}`)
  }

  return changes.length
})
