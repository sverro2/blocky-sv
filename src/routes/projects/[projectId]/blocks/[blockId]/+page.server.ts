import { requireAuth } from '$lib/server/repo/auth';
import type { PageServerLoad } from './$types';
import { getProjectDetails } from '$lib/server/repo/project';

export const load: PageServerLoad = async (event) => {
	const user = requireAuth(event);
	const projectId = event.params.projectId;
	const blockId = event.params.blockId;

	// Fetch the project and verify ownership
	const project = await getProjectDetails(projectId, user.id);

	return {
		project,
		blockId,
		user
	};
};
