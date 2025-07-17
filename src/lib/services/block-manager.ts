import { reorder } from '$lib/client/use-sortable.svelte';
import type { Block } from '$lib/client/idb';
import type Sortable from 'sortablejs';

export interface BlockManagerConfig {
	animation?: number;
	ghostClass?: string;
	delayOnTouchOnly?: boolean;
	delay?: number;
}

export class BlockManager {
	private static instance: BlockManager;
	private config: BlockManagerConfig;
	private onReorderCallback: ((blocks: Block[]) => void) | null = null;

	private constructor(config: BlockManagerConfig = {}) {
		this.config = {
			animation: 200,
			ghostClass: 'dragged-item',
			delayOnTouchOnly: true,
			delay: 200,
			...config
		};
	}

	public static getInstance(config?: BlockManagerConfig): BlockManager {
		if (!BlockManager.instance) {
			BlockManager.instance = new BlockManager(config);
		}
		return BlockManager.instance;
	}

	public setReorderCallback(callback: (blocks: Block[]) => void): void {
		this.onReorderCallback = callback;
	}

	public handleReorder(blocks: Block[], sortEvent: Sortable.SortableEvent): Block[] {
		const reorderedBlocks = reorder(blocks, sortEvent);

		if (this.onReorderCallback) {
			this.onReorderCallback(reorderedBlocks);
		}

		return reorderedBlocks;
	}

	public getSortableConfig() {
		return {
			animation: this.config.animation,
			ghostClass: this.config.ghostClass,
			delayOnTouchOnly: this.config.delayOnTouchOnly,
			delay: this.config.delay,
			onEnd: (_evt: Sortable.SortableEvent) => {
				// This will be handled by the component
				console.log('Block reordering completed');
			}
		};
	}

	public findBlockIndex(blocks: Block[], blockId: string): number {
		return blocks.findIndex((block) => block.blockId === blockId);
	}

	public findBlockByMediaId(blocks: Block[], mediaId: string): Block | null {
		return blocks.find((block) => block.currentMediaId === mediaId) || null;
	}

	public createBlock(mediaId: string): Block {
		return {
			blockId: crypto.randomUUID(),
			media: [{ mediaId }],
			currentMediaId: mediaId
		};
	}

	public updateBlockMedia(block: Block, mediaId: string): Block {
		return {
			...block,
			currentMediaId: mediaId,
			media: block.media.some((m) => m.mediaId === mediaId)
				? block.media
				: [...block.media, { mediaId }]
		};
	}

	public removeMediaFromBlock(block: Block, mediaId: string): Block {
		const updatedMedia = block.media.filter((m) => m.mediaId !== mediaId);

		return {
			...block,
			media: updatedMedia,
			currentMediaId:
				block.currentMediaId === mediaId ? updatedMedia[0]?.mediaId || '' : block.currentMediaId
		};
	}

	public validateBlocks(blocks: Block[]): { valid: boolean; errors: string[] } {
		const errors: string[] = [];

		blocks.forEach((block, index) => {
			if (!block.blockId) {
				errors.push(`Block at index ${index} is missing blockId`);
			}

			if (!block.media || block.media.length === 0) {
				errors.push(`Block ${block.blockId} has no media`);
			}

			if (!block.currentMediaId) {
				errors.push(`Block ${block.blockId} has no currentMediaId`);
			}

			if (block.currentMediaId && !block.media.some((m) => m.mediaId === block.currentMediaId)) {
				errors.push(`Block ${block.blockId} currentMediaId not found in media array`);
			}
		});

		return {
			valid: errors.length === 0,
			errors
		};
	}

	public getBlocksPlaylist(blocks: Block[], startFromBlockId?: string): Block[] {
		if (!startFromBlockId) {
			return blocks;
		}

		const startIndex = this.findBlockIndex(blocks, startFromBlockId);
		if (startIndex === -1) {
			console.warn(`Block ${startFromBlockId} not found, playing from beginning`);
			return blocks;
		}

		return blocks.slice(startIndex);
	}

	public getPlaylistDuration(blocks: Block[]): number {
		// This would need to be implemented based on actual media duration
		// For now, return estimated duration
		return blocks.length * 3; // Assuming 3 seconds per block
	}

	public updateConfig(newConfig: Partial<BlockManagerConfig>): void {
		this.config = { ...this.config, ...newConfig };
	}
}

export const blockManager = BlockManager.getInstance();
