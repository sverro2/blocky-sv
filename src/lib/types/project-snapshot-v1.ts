import { AddBlockLocationDto, type AddBlockDto } from '$lib/api/add-block-dto';
import type { AlternativeMetaUpdateDto } from '$lib/api/alternative-meta-update-dto';
import type { BlockMetaUpdateDto } from '$lib/api/block-meta-update-dto';
import { error } from '@sveltejs/kit';
import { generateSlug } from 'random-word-slugs';

export interface SnapshotDataV1Dao {
	blocks: BlockV1Dao[];
}

export interface BlockV1Dao {
	id: string;
	name: string;
	description?: string;
	disable: boolean;
	alternatives: AlternativeV1Dao[];
	currentAltId: string;
}

export interface AlternativeV1Dao {
	id: string;
	name: string;
	description?: string;
	modifiedAtIsoString: string;
	recording?: RecordingV1Dao;
}

export interface RecordingV1Dao {
	exports: MediaFileV1Dao[];
}

export interface MediaFileV1Dao {
	filename: string;
	estimatedDurationMillis?: number;
	codecInfo: MediaCodecInfoV1Dao;
}

export interface MediaCodecInfoV1Dao {
	codec: CodecV1Dao;
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
		modifiedAtIsoString: new Date().toISOString(),
		recording: undefined
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

export function deleteBlock(snapshot: SnapshotDataV1Dao, blockId: string) {
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
		return snapshot;
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

// TODO: make sure we can not remove last alternative/block!!!!
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

	const updatedBlocks = snapshot.blocks.map((block, index) => {
		if (index === blockIndex) {
			return {
				...block,
				alternatives: block.alternatives.filter((_, i) => i !== alternativeIndex)
			};
		}
		return block;
	});

	const deletedAlternativeSnapshot = {
		...snapshot,
		blocks: updatedBlocks
	};

	if (snapshot.blocks[blockIndex].alternatives.length === 0) {
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
