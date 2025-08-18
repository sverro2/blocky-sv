import { db } from '$lib/server/db';
import { project, projectSnapshot } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { error } from '@sveltejs/kit';
import type { BlockV1Dao, SnapshotDataV1Dao } from '$lib/types/project-snapshot-v1';
import { uuidValid } from '$lib/utils/uuid-checker';
import type { BlockListItemDto } from '$lib/api/block-list-item-dto';
import type { AlternativeListItemDto } from '$lib/api/alternative-list-item-dto';

export async function getProjectDetails(projectId: unknown, userId: string) {
	if (!uuidValid(projectId)) {
		throw error(404, 'Invalid project ID');
	}

	const projectRows = await db
		.select()
		.from(project)
		.where(and(eq(project.id, projectId), eq(project.userId, userId)))
		.limit(1);

	if (projectRows.length === 0) {
		throw error(404, 'Project not found');
	} else {
		return projectRows[0];
	}
}

export async function getBlockList(projectId: unknown): Promise<BlockListItemDto[]> {
	const snapshot = await getProjectSnapshot(projectId);
	const blocksList = snapshot.blocks.map((block) => {
		const currentAlternative = block.alternatives.find((i) => block.currentAltId === i.id);

		if (!currentAlternative) {
			throw error(500, 'Block missing current alternative!');
		}

		return {
			id: block.id,
			name: block.name,
			currentAlternativeId: currentAlternative!.id,
			currentAlternativeName: currentAlternative!.name
		};
	});

	return blocksList;
}

export async function getAlternativeList(
	projectId: unknown,
	blockId: unknown
): Promise<AlternativeListItemDto[]> {
	const snapshot = await getProjectSnapshot(projectId);

	if (!uuidValid(blockId)) {
		throw error(422, 'Blockid not valid');
	}

	const blockData = snapshot.blocks.find((block) => block.id === blockId);

	const alternativeList: AlternativeListItemDto[] =
		blockData?.alternatives.map((alt) => ({
			id: alt.id,
			name: alt.name
		})) ?? [];

	return alternativeList;
}

/**
 * Fetches just the project snapshot data without project info.
 * Useful when you only need the snapshot and have already verified project access.
 * Make sure the user actually has access to the project, before using this method!
 * @param projectId - The project ID to fetch snapshot for
 * @returns Snapshot data
 */
async function getProjectSnapshot(projectId: unknown): Promise<SnapshotDataV1Dao> {
	if (!uuidValid(projectId)) {
		throw error(404, 'Ivalid project ID');
	}

	const rawProjectSnapshot = await db
		.select()
		.from(projectSnapshot)
		.where(eq(projectSnapshot.projectId, projectId))
		.limit(1);

	if (rawProjectSnapshot.length === 0) {
		throw error(404, 'Project not found');
	} else {
		return rawProjectSnapshot[0].body_dao as SnapshotDataV1Dao;
	}
}
