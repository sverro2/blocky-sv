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
