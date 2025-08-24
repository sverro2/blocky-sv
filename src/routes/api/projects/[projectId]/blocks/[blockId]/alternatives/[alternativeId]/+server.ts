import type { AlternativeMetaUpdateDto } from '$lib/api/alternative-meta-update-dto';
import { alternativeMetaUpdateSchema } from '$lib/schemas/forms';
import { requireAuth } from '$lib/server/repo/auth';
import {
	getProjectDetails,
	updateAlternativeInfo,
	removeAlternativeFromBlock
} from '$lib/server/repo/project';
import { json, error } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';

export async function PUT(event: RequestEvent) {
	const user = requireAuth(event);
	const projectId = event.params.projectId;
	const blockId = event.params.blockId;
	const alternativeId = event.params.alternativeId;
	const requestBody = await event.request.json();

	const validation = alternativeMetaUpdateSchema.safeParse(requestBody);
	if (!validation.success) {
		throw error(400, `Invalid request data: ${validation.error.message}`);
	}

	const updatedInfo: AlternativeMetaUpdateDto = validation.data;

	if (!projectId || !blockId || !alternativeId) {
		throw error(400, 'Missing ids in request');
	}

	// Fetch the project and verify ownership for this user
	const project = await getProjectDetails(projectId, user.id);

	const alternativeList = await updateAlternativeInfo(
		project.id,
		blockId,
		alternativeId,
		updatedInfo
	);

	return json(alternativeList);
}

export async function DELETE(event: RequestEvent) {
	const user = requireAuth(event);
	const projectId = event.params.projectId;
	const blockId = event.params.blockId;
	const alternativeId = event.params.alternativeId;

	if (!projectId || !blockId || !alternativeId) {
		throw error(400, 'Missing ids in request');
	}

	// Fetch the project and verify ownership for this user
	const project = await getProjectDetails(projectId, user.id);

	const newCurrentAlternativeId = await removeAlternativeFromBlock(
		project.id,
		blockId,
		alternativeId
	);

	return json({
		success: true,
		newCurrentAlternativeId
	});
}
