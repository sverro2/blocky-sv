import { requireAuth } from '$lib/server/repo/auth';
import { db } from '$lib/server/db';
import { project } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const user = requireAuth(event);
	const projectId = event.params.projectId;

	try {
		// Fetch the project and verify ownership
		const projectData = await db
			.select()
			.from(project)
			.where(and(eq(project.id, projectId), eq(project.userId, user.id)))
			.limit(1);

		if (projectData.length === 0) {
			throw error(404, 'Project not found');
		}

		return {
			project: projectData[0],
			user
		};
	} catch (err) {
		// If it's already an error we threw, re-throw it
		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}
		// Database error (including invalid UUID format)
		throw error(404, 'Project not found');
	}
};
