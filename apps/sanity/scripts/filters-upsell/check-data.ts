import { createMigrationClient, runScript } from './shared'

// Read-only checks for Phase 4 of filters-upsell-hotels-spaces. Prints every count and fails if one is not 0.
//
//   dotenv -- bun apps/sanity/scripts/filters-upsell/check-data.ts

const SCRIPT = 'check-data'

const CURATED_PL = `*[_type == "Hotels_Page" && language == "pl"][0].curatedAmenities[]._ref`

const CHECKS: Record<string, string> = {
  'objects with no point': `count(*[_type in ["Hotels_Collection", "EventSpaces_Collection"] && !defined(point)])`,
  'PL hotels with no surroundings': `count(*[_type == "Hotels_Collection" && language == "pl" && !(count(surroundings) > 0)])`,
  'EN hotels with no surroundings': `count(*[_type == "Hotels_Collection" && language == "en" && !(count(surroundings) > 0)])`,
  'spaces with no capacity': `count(*[_type == "EventSpaces_Collection" && !(count(capacities) > 0)])`,
  'EN hotels with a PL surroundings option': `count(*[_type == "Hotels_Collection" && language == "en" && count(surroundings[@->language == "pl"]) > 0])`,
  'EN spaces with a PL capacity type': `count(*[_type == "EventSpaces_Collection" && language == "en" && count(capacities[spaceType->language == "pl"]) > 0])`,
  'EN spaces with a PL event type': `count(*[_type == "EventSpaces_Collection" && language == "en" && count(eventTypes[@->language == "pl"]) > 0])`,
  'EN spaces with a PL character': `count(*[_type == "EventSpaces_Collection" && language == "en" && count(characters[@->language == "pl"]) > 0])`,
  'EN spaces with a PL facility': `count(*[_type == "EventSpaces_Collection" && language == "en" && count(facilities[@->language == "pl"]) > 0])`,
  'EN hotels with a PL curated amenity': `count(*[_type == "Hotels_Collection" && language == "en" && count(amenities[_ref in ${CURATED_PL}]) > 0])`,
  'EN hotels with a PL location': `count(*[_type == "Hotels_Collection" && language == "en" && location->language == "pl"])`,
  'EN spaces with a PL location': `count(*[_type == "EventSpaces_Collection" && language == "en" && location->language == "pl"])`,
  'dangling option references': `count(*[_type in ["Hotels_Collection", "EventSpaces_Collection"] && (count(surroundings[!defined(@->_id)]) > 0 || count(eventTypes[!defined(@->_id)]) > 0 || count(characters[!defined(@->_id)]) > 0 || count(facilities[!defined(@->_id)]) > 0 || count(capacities[!defined(spaceType->_id)]) > 0)])`,
  'PL/EN hotel pairs with different capacities': `count(*[_type == "translation.metadata" && "Hotels_Collection" in schemaTypes]{
    "pl": translations[_key == "pl"][0].value->maxPeople,
    "en": translations[_key == "en"][0].value->maxPeople
  }[pl.overnight != en.overnight || pl.conference != en.conference || pl.banquet != en.banquet])`,
}

runScript(SCRIPT, async () => {
  const client = createMigrationClient(SCRIPT)
  let failures = 0

  for (const [label, query] of Object.entries(CHECKS)) {
    const count = await client.fetch<number>(query)
    if (count !== 0) failures += 1
    console.log(`${count === 0 ? 'PASS' : 'FAIL'}  ${label}: ${count}`)
  }

  const expected = await client.fetch(`{
    "options": count(*[_type in ["HotelSurroundings_Collection", "EventSpaceTypes_Collection", "EventTypes_Collection", "EventSpaceCharacters_Collection", "EventSpaceFacilities_Collection", "FilterCities_Collection"]]),
    "spacesOnNewLocation": count(*[_type == "EventSpaces_Collection" && location._ref match "filters-location-warszawa-i-okolice-*"]),
    "referencesToMergedLocation": count(*[references("86b35d20-45d1-434a-acda-8e04d82b9f33")]),
    "mixedSpacesPl": count(*[_type == "EventSpaces_Collection" && language == "pl" && count(capacities) == 2])
  }`)
  console.log(expected)

  if (failures > 0) process.exitCode = 1
  return 0
})
