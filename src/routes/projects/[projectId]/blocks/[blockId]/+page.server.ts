import { requireAuth } from '$lib/server/repo/auth';
import { getProjectWithSnapshot } from '$lib/server/project-snapshot';
import { uuidValid } from '$lib/utils/uuid-checker';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';

export const load: PageServerLoad = async (event) => {
	const user = requireAuth(event);

	const projectId = event.params.projectId;

	if (!uuidValid(projectId)) {
		throw error(400, 'Bad request, projectId not valid');
	}

	// Fetch the project and verify ownership
	const projectInfo = await db
		.select()
		.from(project)
		.where(and(eq(project.id, projectId), eq(project.userId, user.id)))
		.limit(1);

	const blocksList = snapshot.blocks.map((block) => ({
		id: block.id,
		name: block.name
	}));

	return {
		project,
		blocksList,
		user
	};
};
