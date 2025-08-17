import { writable } from 'svelte/store';

// Create the writable store with no initial value
function createSelectedBlockStore() {
	const { subscribe, set, update } = writable<string | null>(null);

	return {
		subscribe,
		set,
		update,
		reset: () => set(null)
	};
}

export const selectedBlockStore = createSelectedBlockStore();

// Helper function to get or set the selected block ID with fallback logic
export function getSelectedBlockId(availableBlocks: { id: string }[]): string | null {
	if (availableBlocks.length === 0) return null;

	let stored: string | null = null;
	selectedBlockStore.subscribe((value) => (stored = value))();

	// If we have a stored value and it exists in available blocks, use it
	if (stored && availableBlocks.some((block) => block.id === stored)) {
		return stored;
	}

	// Otherwise, fall back to the first block
	const firstBlockId = availableBlocks[0].id;
	selectedBlockStore.set(firstBlockId);
	return firstBlockId;
}
