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

// Plain object serialization functions for JSONB storage

/**
 * Converts a SnapshotDataV1 object to a plain object for JSONB storage.
 * Handles Date serialization by converting Date objects to ISO strings.
 * @param snapshot - The snapshot data to serialize
 * @returns Plain object suitable for JSONB storage
 */
export function toPlainObject(snapshot: SnapshotDataV1): SerializedSnapshotDataV1 {
	return {
		...snapshot,
		blocks: snapshot.blocks.map((block) => ({
			...block,
			alternatives: block.alternatives.map((alt) => ({
				...alt,
				modifiedAt: alt.modifiedAt.toISOString()
			}))
		}))
	};
}

export interface SerializedAlternative {
	id: string;
	name: string;
	description?: string;
	modifiedAt: string;
	recording?: Recording;
}

export interface SerializedBlock {
	id: string;
	name: string;
	description?: string;
	disable: boolean;
	alternatives: SerializedAlternative[];
	currentAltId: string;
}

export interface SerializedSnapshotDataV1 {
	blocks: SerializedBlock[];
}

/**
 * Converts a plain object from JSONB storage back to a SnapshotDataV1 object.
 * Handles Date deserialization by converting ISO strings back to Date objects.
 * @param plainObject - The plain object from JSONB storage
 * @returns SnapshotDataV1 object with proper Date instances
 */
export function fromPlainObject(plainObject: SerializedSnapshotDataV1): SnapshotDataV1 {
	return {
		...plainObject,
		blocks: plainObject.blocks.map((block) => ({
			...block,
			alternatives: block.alternatives.map((alt) => ({
				...alt,
				modifiedAt: new Date(alt.modifiedAt)
			}))
		}))
	};
}

/**
 * Example usage with Drizzle JSONB:
 *
 * // Storing to database
 * const snapshot = create();
 * const plainObject = toPlainObject(snapshot);
 * await db.insert(projects).values({ data: plainObject });
 *
 * // Reading from database
 * const row = await db.select().from(projects).where(...);
 * const restored = fromPlainObject(row.data);
 *
 * // All Date objects are properly preserved
 * console.log(restored.blocks[0].alternatives[0].modifiedAt instanceof Date); // true
 */

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
}
