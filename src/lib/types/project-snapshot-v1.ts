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
	return addBlock(completelyEmpty, 0);
}

export function addBlock(snapshot: SnapshotDataV1Dao, newBlockIndex: number): SnapshotDataV1Dao {
	const newBlockId = crypto.randomUUID();
	const newAlternativeId = crypto.randomUUID();
	snapshot.blocks.splice(newBlockIndex, 0, {
		id: newBlockId,
		name: generateSlug(2, { format: 'title' }),
		description: '',
		disable: false,
		alternatives: [
			{
				id: newAlternativeId,
				name: generateSlug(1, { format: 'title' }),
				description: '',
				modifiedAtIsoString: new Date().toISOString(),
				recording: undefined
			}
		],
		currentAltId: newAlternativeId
	});
	return snapshot;
}
