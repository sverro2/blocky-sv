import { requireAuth } from '$lib/server/repo/auth';
import { getProjectDetails, addBlock, moveBlockInList } from '$lib/server/repo/project';
import { json, error } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { blockMoveSchema } from '$lib/schemas/forms';
import type { BlockMovedDto } from '$lib/api/block-moved-dto';

export async function POST(event: RequestEvent) {
	const user = requireAuth(event);
	const projectId = event.params.projectId;
	const requestBody = await event.request.json();

	console.log(`If everything is alright, we are now moving blocks!`);
	const validation = blockMoveSchema.safeParse(requestBody);
	if (!validation.success) {
		throw error(400, `Invalid request data: ${validation.error.message}`);
	}

	const movedParameters: BlockMovedDto = validation.data;

	if (!projectId) {
		throw error(400, 'Missing ids in request');
	}

	// Fetch the project and verify ownership
	const project = await getProjectDetails(projectId, user.id);

	// Move specified block...
	await moveBlockInList(project.id, movedParameters);

	return json({});
}
