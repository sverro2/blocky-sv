import { writable, derived, type Readable } from 'svelte/store';
import {
	getCurrentSnapshot,
	putSnapshot,
	addMedia,
	type Snapshot,
	type Block
} from '$lib/client/idb';

export interface ProjectState {
	projectId: string;
	currentSnapshot: Snapshot | null;
	isLoading: boolean;
	error: string | null;
}

export class ProjectStore {
	private static instances = new Map<string, ProjectStore>();
	private _state = writable<ProjectState>({
		projectId: '',
		currentSnapshot: null,
		isLoading: false,
		error: null
	});

	public readonly state: Readable<ProjectState> = this._state;
	public readonly blocks: Readable<Block[]> = derived(
		this._state,
		($state) => $state.currentSnapshot?.data.blocks || []
	);
	public readonly isLoaded: Readable<boolean> = derived(
		this._state,
		($state) => !$state.isLoading && $state.currentSnapshot !== null
	);

	private constructor(private projectId: string) {
		this._state.update((state) => ({
			...state,
			projectId
		}));
	}

	public static getInstance(projectId: string): ProjectStore {
		if (!ProjectStore.instances.has(projectId)) {
			ProjectStore.instances.set(projectId, new ProjectStore(projectId));
		}
		return ProjectStore.instances.get(projectId)!;
	}

	public async loadProject(): Promise<void> {
		this._state.update((state) => ({
			...state,
			isLoading: true,
			error: null
		}));

		try {
			const snapshot = await getCurrentSnapshot(this.projectId);

			// If no snapshot exists, create a default one
			const currentSnapshot = snapshot || {
				snapshotId: 'current',
				projectId: this.projectId,
				version: 1,
				data: { blocks: [] }
			};

			this._state.update((state) => ({
				...state,
				currentSnapshot,
				isLoading: false
			}));

			// Save the default snapshot if it didn't exist
			if (!snapshot) {
				await this.saveSnapshot();
			}
		} catch (error) {
			this._state.update((state) => ({
				...state,
				error: error instanceof Error ? error.message : 'Failed to load project',
				isLoading: false
			}));
		}
	}

	public async addMediaToProject(mediaId: string): Promise<void> {
		try {
			// Add media to IndexedDB
			await addMedia({ mediaId, projectId: this.projectId });

			// Create a new block for this media
			const newBlock: Block = {
				blockId: crypto.randomUUID(),
				media: [{ mediaId }],
				currentMediaId: mediaId
			};

			// Add block to current snapshot
			this._state.update((state) => {
				if (!state.currentSnapshot) {
					throw new Error('No current snapshot');
				}

				const updatedSnapshot = {
					...state.currentSnapshot,
					data: {
						blocks: [...state.currentSnapshot.data.blocks, newBlock]
					}
				};

				return {
					...state,
					currentSnapshot: updatedSnapshot
				};
			});

			await this.saveSnapshot();
		} catch (error) {
			this._state.update((state) => ({
				...state,
				error: error instanceof Error ? error.message : 'Failed to add media'
			}));
		}
	}

	public async reorderBlocks(newBlocks: Block[]): Promise<void> {
		try {
			this._state.update((state) => {
				if (!state.currentSnapshot) {
					throw new Error('No current snapshot');
				}

				const updatedSnapshot = {
					...state.currentSnapshot,
					data: { blocks: newBlocks }
				};

				return {
					...state,
					currentSnapshot: updatedSnapshot
				};
			});

			await this.saveSnapshot();
		} catch (error) {
			this._state.update((state) => ({
				...state,
				error: error instanceof Error ? error.message : 'Failed to reorder blocks'
			}));
		}
	}

	public async removeBlock(blockId: string): Promise<void> {
		try {
			this._state.update((state) => {
				if (!state.currentSnapshot) {
					throw new Error('No current snapshot');
				}

				const updatedBlocks = state.currentSnapshot.data.blocks.filter(
					(block) => block.blockId !== blockId
				);

				const updatedSnapshot = {
					...state.currentSnapshot,
					data: { blocks: updatedBlocks }
				};

				return {
					...state,
					currentSnapshot: updatedSnapshot
				};
			});

			await this.saveSnapshot();
		} catch (error) {
			this._state.update((state) => ({
				...state,
				error: error instanceof Error ? error.message : 'Failed to remove block'
			}));
		}
	}

	public getBlockById(blockId: string): Block | null {
		const state = this.getCurrentState();
		return state.currentSnapshot?.data.blocks.find((block) => block.blockId === blockId) || null;
	}

	public clearError(): void {
		this._state.update((state) => ({
			...state,
			error: null
		}));
	}

	private async saveSnapshot(): Promise<void> {
		const state = this.getCurrentState();

		if (!state.currentSnapshot) {
			throw new Error('No current snapshot to save');
		}

		// Create a plain object copy for IndexedDB
		const plainSnapshot = this.toPlainObject(state.currentSnapshot);
		await putSnapshot(plainSnapshot);
	}

	private getCurrentState(): ProjectState {
		let currentState: ProjectState;
		this._state.subscribe((state) => {
			currentState = state;
		})();
		return currentState!;
	}

	private toPlainObject<T>(value: T): T {
		if (Array.isArray(value)) {
			return value.map((item) => this.toPlainObject(item)) as T;
		} else if (value !== null && typeof value === 'object') {
			const plainObj = {} as Record<string, unknown>;
			for (const key in value) {
				if (Object.prototype.hasOwnProperty.call(value, key)) {
					plainObj[key] = this.toPlainObject((value as Record<string, unknown>)[key]);
				}
			}
			return plainObj as T;
		}
		return value;
	}
}

export function createProjectStore(projectId: string): ProjectStore {
	return ProjectStore.getInstance(projectId);
}
