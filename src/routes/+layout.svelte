<script lang="ts">
	import '../app.css';
	import { navigating, page } from '$app/stores';
	import { onMount } from 'svelte';

	let { children } = $props();

	let isNavigating = $state(false);
	let currentPath = $state('');
	let container: HTMLDivElement;

	onMount(() => {
		currentPath = $page.url.pathname;
	});

	$effect(() => {
		if ($navigating) {
			isNavigating = true;
			// Start slide out animation
			if (container) {
				container.style.transform = 'translateX(-100%)';
			}
		} else if (isNavigating) {
			// Navigation finished, slide in new content
			setTimeout(() => {
				currentPath = $page.url.pathname;
				if (container) {
					// container.style.transform = 'translateX(100%)';
					// Force reflow
					container.style.transform = 'translateX(0)';
				}
				isNavigating = false;
			}, 10);
		}
	});
</script>

<div
	bind:this={container}
	class="transition-transform duration-300 ease-out"
	style="transform: translateX(0)"
>
	{@render children()}
</div>

<style>
	div {
		will-change: transform;
	}
</style>
