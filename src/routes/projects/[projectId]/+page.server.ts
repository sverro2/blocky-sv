import { requireAuth } from '$lib/server/repo/auth';
import { db } from '$lib/server/db';
import { project } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { getBlockList, getProjectDetails } from '$lib/server/repo/project';

export const load: PageServerLoad = async (event) => {
	const user = requireAuth(event);
	const projectId = event.params.projectId;

	// Fetch the project and verify ownership
	const project = await getProjectDetails(projectId, user.id);

	// Then get snapshot data of project
	const blocksList = await getBlockList(project.id);

	return {
		project,
		blocksList
	};
};
