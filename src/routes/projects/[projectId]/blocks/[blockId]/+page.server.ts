import { requireAuth } from '$lib/server/repo/auth';
import type { PageServerLoad } from './$types';
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
		blocksList,
		user
	};
};
