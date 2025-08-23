import { db } from '$lib/server/db';
import { project, projectSnapshot } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { error } from '@sveltejs/kit';
import {
	addAlternative,
	addAroundBlock,
	moveBlock,
	removeBlock as removeBlockFromSnapshot,
	updateAlternative,
	updateBlock,
	type SnapshotDataV1Dao
} from '$lib/types/project-snapshot-v1';
import { uuidValid } from '$lib/utils/uuid-checker';
import type { BlockListItemDto } from '$lib/api/block-list-item-dto';
import type { AlternativeListItemDto } from '$lib/api/alternative-list-item-dto';
import type { BlockMetaUpdateDto } from '$lib/api/block-meta-update-dto';
import type { AlternativeMetaUpdateDto } from '$lib/api/alternative-meta-update-dto';
import type { AddBlockDto } from '$lib/api/add-block-dto';
import type { BlockMovedDto } from '$lib/api/block-moved-dto';

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
		throw error(404, 'Project data not found');
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
			blockDescription: block.description,
			currentAlternativeId: currentAlternative!.id,
			currentAlternativeName: currentAlternative!.name,
			alternativeDescription: currentAlternative!.description,
			alternativeCount: block.alternatives.length
		};
	});

	return blocksList;
}

export async function moveBlockInList(projectId: unknown, move: BlockMovedDto): Promise<void> {
	const snapshot = await getProjectSnapshot(projectId);

	const updatedSnapshot = moveBlock(snapshot, move);

	await storeProjectSnapshot(projectId, updatedSnapshot);
}

export async function updateBlockInfo(
	projectId: string,
	blockId: string,
	blockMetaUpdate: BlockMetaUpdateDto
): Promise<void> {
	const snapshot = await getProjectSnapshot(projectId);
	const updatedSnapshot = updateBlock(snapshot, blockId, blockMetaUpdate);

	await storeProjectSnapshot(projectId, updatedSnapshot);
}

export async function addBlock(
	projectId: string,
	blockId: string,
	addBlockParameters: AddBlockDto
): Promise<string> {
	const snapshot = await getProjectSnapshot(projectId);
	const [updatedSnapshot, newBlockId] = addAroundBlock(snapshot, blockId, addBlockParameters);

	await storeProjectSnapshot(projectId, updatedSnapshot);

	return newBlockId;
}

export async function removeBlock(projectId: string, blockId: string): Promise<string> {
	const snapshot = await getProjectSnapshot(projectId);

	// Handle both possible return types from removeBlockFromSnapshot
	const [updatedSnapshot, selectableId] = removeBlockFromSnapshot(snapshot, blockId);

	await storeProjectSnapshot(projectId, updatedSnapshot);

	// Return the first block ID if there are blocks remaining, null if no blocks left
	return selectableId;
}

export async function getAlternativeList(
	projectId: unknown,
	blockId: unknown
): Promise<AlternativeListItemDto[]> {
	if (!uuidValid(blockId)) {
		throw error(422, 'Blockid not valid');
	}

	const snapshot = await getProjectSnapshot(projectId);
	const blockData = snapshot.blocks.find((block) => block.id === blockId);

	const alternativeList: AlternativeListItemDto[] =
		blockData?.alternatives.map((alt) => ({
			id: alt.id,
			name: alt.name
		})) ?? [];

	return alternativeList;
}

export async function updateAlternativeInfo(
	projectId: string,
	blockId: string,
	alternativeId: string,
	alternativeMetaUpdate: AlternativeMetaUpdateDto
): Promise<void> {
	const snapshot = await getProjectSnapshot(projectId);

	const updatedSnapshot = updateAlternative(
		snapshot,
		blockId,
		alternativeId,
		alternativeMetaUpdate
	);

	await storeProjectSnapshot(projectId, updatedSnapshot);
}

export async function addAlternativeToBlock(projectId: string, blockId: string) {
	const snapshot = await getProjectSnapshot(projectId);

	const updatedSnapshot = addAlternative(snapshot, blockId);

	await storeProjectSnapshot(projectId, updatedSnapshot);
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

/**
 * Save project snapshot.
 * @param projectId - The project ID to fetch snapshot for
 * @returns Snapshot data
 */
async function storeProjectSnapshot(
	projectId: unknown,
	snapshot: SnapshotDataV1Dao
): Promise<void> {
	if (!uuidValid(projectId)) {
		throw error(404, 'Ivalid project ID');
	}

	const now = new Date();
	await db
		.update(projectSnapshot)
		.set({ modifiedAt: now, body_dao: snapshot })
		.where(eq(projectSnapshot.projectId, projectId));
}
