import type { APIRoute } from 'astro'
import { handleSearchRequest } from '../../server/search/api'

export const POST: APIRoute = ({ request }) => handleSearchRequest(request)
