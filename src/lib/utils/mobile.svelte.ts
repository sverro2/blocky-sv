import { browser } from '$app/environment';
import { onMount } from 'svelte';

/**
 * Creates a reactive mobile detection rune
 * @param breakpoint - The width threshold for mobile detection (default: 1024)
 * @returns A reactive boolean that updates when window resizes
 */
export function useMobile(breakpoint: number = 1024) {
	let isMobile = $state(browser ? window.innerWidth < breakpoint : false);

	onMount(() => {
		if (!browser) return;

		const checkMobile = () => {
			isMobile = window.innerWidth < breakpoint;
		};

		// Initial check
		checkMobile();

		// Listen for resize events
		window.addEventListener('resize', checkMobile);

		// Cleanup
		return () => {
			window.removeEventListener('resize', checkMobile);
		};
	});

	return {
		get isMobile() {
			return isMobile;
		}
	};
}
