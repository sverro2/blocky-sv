import { requireAuth } from '$lib/server/repo/auth';
import { getProjectDetails, getAlternativeList } from '$lib/server/repo/project';
import { json, error } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';

export async function POST(event: RequestEvent) {
	const user = requireAuth(event);

	const projectId = event.params.projectId;
	const blockId = event.params.blockId;
	const alternativeId = event.params.alternativeId;

	if (!projectId || !blockId) {
		throw error(400, 'Missing ids in request');
	}

	// Fetch the project and verify ownership
	const project = await getProjectDetails(projectId, user.id);

	const alternativeList = await getAlternativeList(project.id, blockId);

	return json(alternativeList);
}
