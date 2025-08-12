import { db } from '$lib/server/db';
import { requireAuth } from '$lib/server/auth';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const user = requireAuth(event);

	const projects = await db.query.project.findMany();
	return {
		projects,
		user
	};
};
