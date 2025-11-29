import { AddBlockLocationDto, type AddBlockDto } from '$lib/api/add-block-dto';
import type { AlternativeMetaUpdateDto } from '$lib/api/alternative-meta-update-dto';
import type { BlockMetaUpdateDto } from '$lib/api/block-meta-update-dto';
import type { BlockMovedDto } from '$lib/api/block-moved-dto';
import { error } from '@sveltejs/kit';
import { generateSlug } from 'random-word-slugs';
import { arrayMove } from '@dnd-kit-svelte/sortable';

export interface SnapshotDataV1Dao {
	blockOrder: VersionedIdentifier[]; // block id's
	versionName?: string; // DateTime iso string
	version?: string; // DateTime iso string
}

export interface VersionedIdentifier {
	id: string;
	version: string; // DateTime iso string
}

export interface BlockV1Dao {
	id: VersionedIdentifier;
	name: string;
	description?: string;
	disable: boolean;
	alternatives: AlternativeV1Dao[];
	currentAltId: string;
}

export interface AlternativeV1Dao {
	id: string;
	name: string;
	modifiedAt: string; // DateTime iso string
	description?: string;
	durationSeconds?: string;
	clipped?: Clip;
	recordingType: RecordingTypeV1Dao;
	recordingId?: string;
}

export interface Clip {
	offsetStartSeconds: number;
	offsetEndSeconds: number;
}

export enum RecordingTypeV1Dao {
	Audio,
	Video,
	Photo,
	Text
}

export interface RecordingV1Dao {
	id: string;
	alternativeId: string;
	filename: string;
	estimatedDurationMillis?: number;
	codecInfo: MediaCodecInfoV1Dao;
	usecase: RecordingUsecase;
	extras?: object;
}

export enum RecordingUsecase {
	Origional,
	Proxy,
	Render
}

export interface MediaCodecInfoV1Dao {
	codec: CodecV1Dao;
	resolution?: string;
}

export enum CodecV1Dao {
	DefaultOpusV1,
	DefaultWebpV1
}

export function createNewSnapshot(): SnapshotDataV1Dao {
	const completelyEmpty = {
		blocks: []
	};
	return addBlock(completelyEmpty, 0)[0];
}

function newAlternative(): AlternativeV1Dao {
	const newAlternativeId = crypto.randomUUID();
	return {
		id: newAlternativeId,
		name: generateSlug(1, { format: 'title' }),
		description: '',
		modifiedAt: new Date().toISOString(),
		recordingType: RecordingTypeV1Dao.Text,
		recordingId: undefined
	};
}

export function addBlock(
	snapshot: SnapshotDataV1Dao,
	newBlockIndex: number
): [SnapshotDataV1Dao, string] {
	const newBlockId = crypto.randomUUID();
	const alternative = newAlternative();
	snapshot.blocks.splice(newBlockIndex, 0, {
		id: newBlockId,
		name: generateSlug(2, { format: 'title' }),
		description: '',
		disable: false,
		alternatives: [alternative],
		currentAltId: alternative.id
	});
	return [snapshot, newBlockId];
}

export function addAroundBlock(
	snapshot: SnapshotDataV1Dao,
	relativeToBlockId: string,
	addBlockDto: AddBlockDto
): [SnapshotDataV1Dao, string] {
	const blockIndex = snapshot.blocks.findIndex((block) => block.id === relativeToBlockId);

	if (blockIndex === -1) {
		throw error(
			500,
			`Block with id ${relativeToBlockId} not found. Can't add new block around non-existing block.`
		);
	}

	const newBlockIndex =
		addBlockDto.location === AddBlockLocationDto.Before ? blockIndex : blockIndex + 1;

	return addBlock(snapshot, newBlockIndex);
}

export function removeBlock(
	snapshot: SnapshotDataV1Dao,
	blockId: string
): [SnapshotDataV1Dao, string] {
	const blockIndex = snapshot.blocks.findIndex((block) => block.id === blockId);

	if (blockIndex === -1) {
		throw error(500, `Block with id ${blockId} not found. Can not delete this block.`);
	}

	// actual removal of block
	snapshot.blocks.splice(blockIndex, 1);

	// Blocks should never be empty. If that is the case, add a new block
	if (snapshot.blocks.length === 0) {
		return addBlock(snapshot, 0);
	} else {
		const nextSelectableBlock = snapshot.blocks[Math.max(0, blockIndex - 1)].id;
		return [snapshot, nextSelectableBlock];
	}
}

export function updateBlock(
	snapshot: SnapshotDataV1Dao,
	blockId: string,
	updatedBlock: BlockMetaUpdateDto
): SnapshotDataV1Dao {
	const blockIndex = snapshot.blocks.findIndex((block) => block.id === blockId);

	if (blockIndex === -1) {
		throw error(500, `Block with id ${blockId} not found. Can not update this block.`);
	}

	const updatedBlocks = snapshot.blocks.map((block, index) => {
		if (index === blockIndex) {
			return {
				...block,
				name: updatedBlock.name,
				description: updatedBlock.description,
				currentAltId: updatedBlock.alternativeId
			};
		}
		return block;
	});

	return {
		...snapshot,
		blocks: updatedBlocks
	};
}

export function moveBlock(snapshot: SnapshotDataV1Dao, move: BlockMovedDto): SnapshotDataV1Dao {
	// find target index of new block
	const targetIndex = snapshot.blocks.findIndex((block) => block.id === move.blockId);

	const newOrderingBlocks = arrayMove(snapshot.blocks, targetIndex, move.newIndex);

	return {
		...snapshot,
		blocks: newOrderingBlocks
	};
}

export function addAlternative(snapshot: SnapshotDataV1Dao, blockId: string): SnapshotDataV1Dao {
	const blockIndex = snapshot.blocks.findIndex((block) => block.id === blockId);

	if (blockIndex === -1) {
		throw error(500, `Block with id ${blockId} not found. Can not add alternative to it.`);
	}

	const alternative = newAlternative();

	// Add new alternative to end of block's alternative list.
	const updatedBlocks = snapshot.blocks.map((block, index) => {
		if (index === blockIndex) {
			return {
				...block,
				currentAltId: alternative.id,
				alternatives: [...block.alternatives, alternative]
			};
		}
		return block;
	});

	return {
		...snapshot,
		blocks: updatedBlocks
	};
}

export function removeAlternative(
	snapshot: SnapshotDataV1Dao,
	blockId: string,
	alternativeId: string
): SnapshotDataV1Dao {
	const blockIndex = snapshot.blocks.findIndex((block) => block.id === blockId);

	if (blockIndex === -1) {
		throw error(500, `Block with id ${blockId} not found. Can not remove alternative from it.`);
	}

	const targetBlock = snapshot.blocks[blockIndex];
	const alternativeIndex = targetBlock.alternatives.findIndex(
		(alternative) => alternative.id === alternativeId
	);

	if (alternativeIndex === -1) {
		throw error(
			500,
			`Alternative with id ${alternativeId} not found in ${blockId}. Can not remove this alternative.`
		);
	}

	// Determine new current alternative ID if we're removing the current one
	const isRemovingCurrent = targetBlock.currentAltId === alternativeId;
	let newCurrentAltId = targetBlock.currentAltId;

	if (isRemovingCurrent && targetBlock.alternatives.length > 1) {
		// Use max(indexOfRemovedAlternative - 1, 0) logic
		const newIndex = Math.max(alternativeIndex - 1, 0);
		// If we're removing index 0, use index 1 (the next alternative)
		const targetIndex = alternativeIndex === 0 ? 1 : newIndex;
		newCurrentAltId = targetBlock.alternatives[targetIndex].id;
	}

	const updatedBlocks = snapshot.blocks.map((block, index) => {
		if (index === blockIndex) {
			return {
				...block,
				alternatives: block.alternatives.filter((_, i) => i !== alternativeIndex),
				currentAltId: newCurrentAltId
			};
		}
		return block;
	});

	const deletedAlternativeSnapshot = {
		...snapshot,
		blocks: updatedBlocks
	};

	// If no alternatives left, add a new one (this will also set it as current)
	if (updatedBlocks[blockIndex].alternatives.length === 0) {
		return addAlternative(deletedAlternativeSnapshot, blockId);
	} else {
		return deletedAlternativeSnapshot;
	}
}

export function updateAlternative(
	snapshot: SnapshotDataV1Dao,
	blockId: string,
	alternativeId: string,
	updatedAlternative: AlternativeMetaUpdateDto
): SnapshotDataV1Dao {
	const blockIndex = snapshot.blocks.findIndex((block) => block.id === blockId);

	if (blockIndex === -1) {
		throw error(500, `Block with id ${blockId} not found. Can not update alternative in it.`);
	}

	const targetBlock = snapshot.blocks[blockIndex];
	const alternativeIndex = targetBlock.alternatives.findIndex(
		(alternative) => alternative.id === alternativeId
	);

	if (alternativeIndex === -1) {
		throw error(
			500,
			`Alternative with id ${alternativeId} not found. Can not update this alternative.`
		);
	}

	const updatedBlocks = snapshot.blocks.map((block, index) => {
		if (index === blockIndex) {
			return {
				...block,
				alternatives: updateAlternativeInBlock(
					block.alternatives,
					alternativeIndex,
					updatedAlternative
				)
			};
		}
		return block;
	});

	return {
		...snapshot,
		blocks: updatedBlocks
	};
}

function updateAlternativeInBlock(
	alternatives: AlternativeV1Dao[],
	alternativeIndex: number,
	updatedAlternative: AlternativeMetaUpdateDto
) {
	return alternatives.map((alternative, index) => {
		if (index === alternativeIndex) {
			return {
				...alternative,
				name: updatedAlternative.name,
				description: updatedAlternative.description
			};
		}
		return alternative;
	});
}
