import { requireAuth } from '$lib/server/repo/auth';
import {
	getProjectDetails,
	getAlternativeList,
	updateBlockInfo,
	addBlock
} from '$lib/server/repo/project';
import { json, error } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { blockMetaUpdateSchema, blockAddSchema } from '$lib/schemas/forms';
import type { BlockMetaUpdateDto } from '$lib/api/block-meta-update-dto';
import type { AddBlockDto } from '$lib/api/add-block-dto';

export async function GET(event: RequestEvent) {
	const user = requireAuth(event);

	const projectId = event.params.projectId;
	const blockId = event.params.blockId;

	if (!projectId || !blockId) {
		throw error(400, 'Missing ids in request');
	}

	// Fetch the project and verify ownership
	const project = await getProjectDetails(projectId, user.id);

	const alternativeList = await getAlternativeList(project.id, blockId);

	return json(alternativeList);
}

export async function PUT(event: RequestEvent) {
	const user = requireAuth(event);
	const projectId = event.params.projectId;
	const blockId = event.params.blockId;
	const requestBody = await event.request.json();

	const validation = blockMetaUpdateSchema.safeParse(requestBody);
	if (!validation.success) {
		throw error(400, `Invalid request data: ${validation.error.message}`);
	}

	const updatedInfo: BlockMetaUpdateDto = validation.data;

	if (!projectId || !blockId) {
		throw error(400, 'Missing ids in request');
	}

	// Fetch the project and verify ownership for this user
	const project = await getProjectDetails(projectId, user.id);

	const alternativeList = await updateBlockInfo(project.id, blockId, updatedInfo);

	return json(alternativeList);
}

export async function POST(event: RequestEvent) {
	const user = requireAuth(event);
	const projectId = event.params.projectId;
	const blockId = event.params.blockId;
	const requestBody = await event.request.json();

	const validation = blockAddSchema.safeParse(requestBody);
	if (!validation.success) {
		throw error(400, `Invalid request data: ${validation.error.message}`);
	}

	const newBlockParameters: AddBlockDto = validation.data;

	if (!projectId || !blockId) {
		throw error(400, 'Missing ids in request');
	}

	// Fetch the project and verify ownership for this user
	const project = await getProjectDetails(projectId, user.id);

	const newId = await addBlock(project.id, blockId, newBlockParameters);
	const response: NewBlockIdDto = {
		newBlockId: newId
	};

	return json(response);
}
