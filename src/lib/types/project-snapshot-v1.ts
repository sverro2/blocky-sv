import { generateSlug } from 'random-word-slugs';

export interface SnapshotDataV1 {
	blocks: Block[];
}

export interface Block {
	id: string;
	name: string;
	description?: string;
	disable: boolean;
	alternatives: Alternative[];
	currentAltId: string;
}

export interface Alternative {
	id: string;
	name: string;
	description?: string;
	modifiedAt: Date;
	recording?: Recording;
}

export interface Recording {
	exports: MediaFile[];
}

export interface MediaFile {
	filename: string;
	estimatedDurationMillis?: number;
	codecInfo: MediaCodecInfo;
}

export interface MediaCodecInfo {
	codec: Codec;
}

export enum Codec {
	DefaultOpusV1,
	DefaultWebpV1
}

// export const defaultProject: SnapshotDataV1 = {
// 	blocks: [{}]
// };

export function create(): SnapshotDataV1 {
	const completelyEmpty = {
		blocks: []
	};
	return addBlock(completelyEmpty, 0);
}

export function addBlock(snapshot: SnapshotDataV1, newBlockIndex: number): SnapshotDataV1 {
	snapshot.blocks.splice(newBlockIndex, 0, {
		id: crypto.randomUUID(),
		name: generateSlug(2, { format: 'title' }),
		description: '',
		disable: false,
		alternatives: [
			{
				id: crypto.randomUUID(),
				name: generateSlug(1, { format: 'title' }),
				description: '',
				modifiedAt: new Date(),
				recording: undefined
			}
		],
		currentAltId: ''
	});
	return snapshot;
