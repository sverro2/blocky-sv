import { requireAuth } from '$lib/server/repo/auth';
import { addAlternativeToBlock, getProjectDetails } from '$lib/server/repo/project';
import { error, json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';

export async function POST(event: RequestEvent) {
	const user = requireAuth(event);
	const projectId = event.params.projectId;
	const blockId = event.params.blockId;

	if (!projectId || !blockId) {
		throw error(400, 'Missing ids in request');
	}

	// Fetch the project and verify ownership for this user
	const project = await getProjectDetails(projectId, user.id);

	await addAlternativeToBlock(project.id, blockId);

	return json({});
}
