#!/usr/bin/env bash
#
# Live checks for filters-upsell-hotels-spaces. Later phases add their checks here.
#
#   context/changes/filters-upsell-hotels-spaces/verify.sh [base-url]
#
# Exits non-zero when any check fails. Base URL defaults to production.
#
# Keep a run under 40 requests. fetch_url caches by URL within a run, so a later check
# that needs a page already fetched costs nothing. Reuse URLs from the tables below
# where you can: the budget is enforced, and exceeding it fails the run.

set -u

BASE="${1:-https://www.fabryka-atrakcji.com}"
BASE="${BASE%/}"
MAX_REQUESTS=39

WORK="$(mktemp -d)" || exit 1
trap 'rm -rf "$WORK"' EXIT

passed=0
failed=0
requests=0

pass() {
  passed=$((passed + 1))
  printf 'PASS  %s\n' "$1"
}

fail() {
  failed=$((failed + 1))
  printf 'FAIL  %s\n' "$1"
}

# Sets BODY, STATUS, CACHE, CONTENT_TYPE and LOCATION for a path. Each URL is requested once per run.
fetch_url() {
  local url="$BASE$1"
  local key
  key="$(printf '%s' "$url" | shasum -a 256 | cut -c1-16)"
  BODY="$WORK/$key.body"
  local headers="$WORK/$key.headers"

  if [ ! -f "$headers" ]; then
    if [ "$requests" -ge "$MAX_REQUESTS" ]; then
      fail "request budget of $MAX_REQUESTS used up before $1"
      summary
    fi
    requests=$((requests + 1))
    curl -sS --compressed --max-time 30 -D "$headers" -o "$BODY" "$url" || true
    [ -f "$headers" ] || : >"$headers"
    [ -f "$BODY" ] || : >"$BODY"
  fi

  STATUS="$(awk 'toupper($1) ~ /^HTTP/ { code = $2 } END { print code }' "$headers")"
  CACHE="$(header_value x-vercel-cache "$headers")"
  CONTENT_TYPE="$(header_value content-type "$headers")"
  LOCATION="$(header_value location "$headers")"
}

header_value() {
  tr -d '\r' <"$2" | awk -F': *' -v name="$1" 'tolower($1) == name { value = $2 } END { print value }'
}

# Result cards in page order. Search changes the order of activities without changing the set.
result_ids() {
  grep -oE 'class="(HotelCard|EventSpaceCard)[^"]*"[^>]*data-id="[^"]*"|data-activity-id="[^"]*"' "$1" |
    grep -oE '(data-id|data-activity-id)="[^"]*"'
}

result_count() {
  result_ids "$1" | wc -l | tr -d ' '
}

is_cached() {
  case "$1" in
    HIT | STALE | PRERENDER | REVALIDATED) return 0 ;;
    *) return 1 ;;
  esac
}

# Same query in, same links out: the rewrite must not add parameters of its own.
check_no_injected_params() {
  if grep -qE '\?([^"]*&(amp;|#38;))?(path|page)=' "$2"; then
    fail "$1 links carry a parameter injected by the rewrite"
  fi
}

# A filter route with two query strings whose results differ.
check_route_pair() {
  local path="$1" first="$2" second="$3"

  fetch_url "$path?$first"
  local first_status="$STATUS" first_cache="$CACHE" first_body="$BODY"
  fetch_url "$path?$second"
  local second_status="$STATUS" second_cache="$CACHE" second_body="$BODY"

  if [ "$first_status" != 200 ] || [ "$second_status" != 200 ]; then
    fail "$path returned $first_status and $second_status"
    return
  fi
  if is_cached "$first_cache" || is_cached "$second_cache"; then
    fail "$path served from cache ($first_cache, $second_cache)"
    return
  fi

  local first_ids second_ids
  first_ids="$(result_ids "$first_body")"
  second_ids="$(result_ids "$second_body")"
  if [ -z "$first_ids$second_ids" ]; then
    fail "$path has no result cards for ?$first or ?$second"
  elif [ "$first_ids" = "$second_ids" ]; then
    fail "$path gives the same results for ?$first and ?$second"
  else
    pass "$path: ?$first gives $(result_count "$first_body"), ?$second gives $(result_count "$second_body"), cache $first_cache"
  fi

  check_no_injected_params "$path" "$first_body"
}

# A paginated filter route, where one uncached response with results is enough.
check_route() {
  local url="$1"

  fetch_url "$url"
  if [ "$STATUS" != 200 ]; then
    fail "$url returned $STATUS"
  elif is_cached "$CACHE"; then
    fail "$url served from cache ($CACHE)"
  elif [ "$(result_count "$BODY")" = 0 ]; then
    fail "$url has no result cards"
  else
    pass "$url: $(result_count "$BODY") results, cache $CACHE"
  fi

  check_no_injected_params "$url" "$BODY"
}

# Activities have no pagination, so their paginated filter routes redirect to page 1.
check_redirect() {
  local url="$1" expected="$2"

  fetch_url "$url"
  if [ "$STATUS" != 301 ]; then
    fail "$url returned $STATUS"
  elif is_cached "$CACHE"; then
    fail "$url served from cache ($CACHE)"
  elif [ "$LOCATION" != "$expected" ]; then
    fail "$url redirects to $LOCATION, expected $expected"
  else
    pass "$url redirects to $expected, cache $CACHE"
  fi
}

# The wildcard rewrites must leave build assets alone.
check_static_asset() {
  fetch_url '/pl/hotele/'
  local asset
  asset="$(grep -oE '/_astro/filter\.[^"'"'"' ]*\.css' "$BODY" | head -n 1)"
  if [ -z "$asset" ]; then
    fail "/pl/hotele/ references no /_astro/filter.*.css"
    return
  fi

  fetch_url "$asset"
  case "$STATUS:$CONTENT_TYPE" in
    200:text/css*) pass "$asset served as a static file" ;;
    *) fail "$asset returned $STATUS, $CONTENT_TYPE" ;;
  esac
}

# A filter route must point at its base listing on the production host, whatever host served it.
check_canonical() {
  local url="$1" expected="https://www.fabryka-atrakcji.com$2"
  local canonical

  fetch_url "$url"
  canonical="$(grep -oE '<link rel="canonical" href="[^"]*"' "$BODY" | sed -E 's/.*href="([^"]*)"/\1/')"
  if [ "$canonical" = "$expected" ]; then
    pass "$url canonical is $expected"
  else
    fail "$url canonical is '$canonical', expected $expected"
  fi
}

# Anchors into the filter URL space. A followed one is a crawl signal.
filter_anchors() {
  grep -oE '<a [^>]*>' "$1" | grep -E 'href="[^"]*/(filtr|filter)[/?"]' || true
}

check_no_followed_filter_links() {
  local url="$1" minimum="$2"
  local total followed

  fetch_url "$url"
  total="$(filter_anchors "$BODY" | wc -l | tr -d ' ')"
  followed="$(filter_anchors "$BODY" | grep -vc 'rel="nofollow"')"
  if [ "$total" -lt "$minimum" ]; then
    fail "$url has $total filter links, expected at least $minimum"
  elif [ "$followed" != 0 ]; then
    fail "$url has $followed followed filter links out of $total"
  else
    pass "$url: all $total filter links are nofollow"
  fi
}

check_pagination_followed() {
  local url="$1"
  local links

  fetch_url "$url"
  links="$(grep -oE '<a [^>]*(class="number"|data-prev|data-next)[^>]*>' "$BODY")"
  if [ -z "$links" ]; then
    fail "$url has no pagination links"
  elif printf '%s\n' "$links" | grep -q 'nofollow'; then
    fail "$url pagination carries nofollow"
  else
    pass "$url: $(printf '%s\n' "$links" | wc -l | tr -d ' ') pagination links stay followed"
  fi
}

# Astro.url has a localhost origin on Vercel, so anything built from it leaks into the markup.
check_no_localhost() {
  local url="$1"

  fetch_url "$url"
  if grep -q 'https://localhost' "$BODY"; then
    fail "$url contains https://localhost"
  else
    pass "$url has no localhost link"
  fi
}

summary() {
  printf '\n%s passed, %s failed, %s requests to %s\n' "$passed" "$failed" "$requests" "$BASE"
  [ "$failed" -eq 0 ]
  exit
}

# Phase 1: filter route caching
echo '== Filter routes =='
check_route_pair /pl/hotele/filtr/ stars=5 stars=3
check_route_pair /en/hotels/filter/ stars=5 stars=3
check_route_pair /pl/przestrzenie-eventowe/filtr/ search=Kwadrat search=Reduta
check_route_pair /en/event-spaces/filter/ search=Bez search=Waldorffa
check_route_pair /pl/integracje/filtr/ search=kajaki search=gotowanie
check_route_pair /en/activities/filter/ search=kayaking search=cooking
check_route_pair /pl/integracje/kategoria/team-building/filtr/ duration=2 duration=4
check_route_pair /en/activities/category/team-building-activities/filter/ duration=2 duration=4

check_route '/pl/hotele/strona/2/filtr/?stars=4'
check_route '/en/hotels/page/2/filter/?stars=4'
check_route '/pl/przestrzenie-eventowe/strona/1/filtr/?order=newest'
check_route '/en/event-spaces/page/1/filter/?order=newest'

check_redirect '/pl/integracje/strona/2/filtr/?search=kajaki' '/pl/integracje/filtr?search=kajaki'
check_redirect '/en/activities/page/2/filter/?search=kayaking' '/en/activities/filter?search=kayaking'
check_redirect '/pl/integracje/kategoria/team-building/strona/2/filtr/?order=newest' \
  '/pl/integracje/kategoria/team-building/filtr/?order=newest'
check_redirect '/en/activities/category/team-building-activities/page/2/filter/?order=newest' \
  '/en/activities/category/team-building-activities/filter/?order=newest'

echo '== Static assets =='
check_static_asset

# Phase 2: filter SEO fixes
echo '== Canonicals =='
check_canonical '/pl/hotele/filtr/?stars=5' /pl/hotele/
check_canonical '/en/hotels/filter/?stars=5' /en/hotels/
check_canonical '/pl/przestrzenie-eventowe/filtr/?search=Kwadrat' /pl/przestrzenie-eventowe/
check_canonical '/en/event-spaces/filter/?search=Bez' /en/event-spaces/
check_canonical '/pl/integracje/filtr/?search=kajaki' /pl/integracje/
check_canonical '/en/activities/filter/?search=kayaking' /en/activities/
check_canonical '/pl/integracje/kategoria/team-building/filtr/?duration=2' /pl/integracje/kategoria/team-building/
check_canonical '/en/activities/category/team-building-activities/filter/?duration=2' \
  /en/activities/category/team-building-activities/
check_canonical '/pl/hotele/strona/2/filtr/?stars=4' /pl/hotele/strona/2/
check_canonical '/en/hotels/page/2/filter/?stars=4' /en/hotels/page/2/
check_canonical '/pl/przestrzenie-eventowe/strona/1/filtr/?order=newest' /pl/przestrzenie-eventowe/strona/1/
check_canonical '/en/event-spaces/page/1/filter/?order=newest' /en/event-spaces/page/1/

echo '== Filter links =='
check_no_followed_filter_links /pl/hotele/ 4
check_no_followed_filter_links /pl/integracje/kategoria/team-building/ 20
check_no_followed_filter_links '/pl/hotele/strona/2/filtr/?stars=4' 4
check_no_followed_filter_links '/en/hotels/page/2/filter/?stars=4' 4
check_no_localhost '/pl/integracje/kategoria/team-building/filtr/?duration=2'
check_no_localhost '/en/activities/category/team-building-activities/filter/?duration=2'
check_pagination_followed /pl/blog/

summary
