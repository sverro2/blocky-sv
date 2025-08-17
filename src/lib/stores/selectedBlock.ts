import { writable } from 'svelte/store';
import { browser } from '$app/environment';

const STORAGE_KEY = 'selectedBlockId';

// Get initial value from localStorage if available
function getInitialValue(): string | null {
	if (browser) {
		try {
			return localStorage.getItem(STORAGE_KEY);
		} catch {
			return null;
		}
	}
	return null;
}

// Create the writable store
function createSelectedBlockStore() {
	const { subscribe, set, update } = writable<string | null>(getInitialValue());

	return {
		subscribe,
		set: (value: string | null) => {
			if (browser) {
				try {
					if (value) {
						localStorage.setItem(STORAGE_KEY, value);
					} else {
						localStorage.removeItem(STORAGE_KEY);
					}
				} catch {
					// Ignore localStorage errors
				}
			}
			set(value);
		},
		update,
		reset: () => {
			if (browser) {
				try {
					localStorage.removeItem(STORAGE_KEY);
				} catch {
					// Ignore localStorage errors
				}
			}
			set(null);
		}
	};
}

export const selectedBlockStore = createSelectedBlockStore();

// Helper function to get or set the selected block ID with fallback logic
export function getSelectedBlockId(availableBlocks: { id: string }[]): string | null {
	if (availableBlocks.length === 0) return null;

	const stored = getInitialValue();

	// If we have a stored value and it exists in available blocks, use it
	if (stored && availableBlocks.some(block => block.id === stored)) {
		return stored;
	}

	// Otherwise, fall back to the first block
	const firstBlockId = availableBlocks[0].id;
	selectedBlockStore.set(firstBlockId);
	return firstBlockId;
}
