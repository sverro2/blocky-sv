import { db } from '$lib/server/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const projects = await db.query.project.findMany();
	return {
		projects
	};
};
