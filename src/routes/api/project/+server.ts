import { requireAuth } from '$lib/server/repo/auth';
import { getProjectDetails, getBlockList } from '$lib/server/repo/project';
import { json, error } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';

export async function POST(event: RequestEvent) {
	// Check if user is logged in
	const user = requireAuth(event);

	// Get projectId from request body
	const { projectId } = await event.request.json();

	if (!projectId) {
		throw error(400, 'Project ID is required');
	}

	// Fetch the project and verify ownership
	const project = await getProjectDetails(projectId, user.id);

	// Get the blocks list
	const blocksList = await getBlockList(project.id);

	// Return just the blocks list
	return json(blocksList);
}
