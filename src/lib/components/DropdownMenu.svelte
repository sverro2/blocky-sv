<script lang="ts">
	import type { Snippet } from 'svelte';

	import { onMount } from 'svelte';

	interface Props {
		trigger: Snippet;
		content: Snippet;
		align?: 'left' | 'right';
	}

	let { trigger, content, align = 'right' }: Props = $props();

	let isOpen = $state(false);
	let dropdownElement = $state<HTMLDivElement | null>(null);
	let triggerElement = $state<HTMLButtonElement | null>(null);

	function toggleDropdown() {
		isOpen = !isOpen;
	}

	function closeDropdown() {
		isOpen = false;
	}

	onMount(() => {
		function handleClickOutside(event: MouseEvent) {
			if (
				dropdownElement &&
				triggerElement &&
				!dropdownElement.contains(event.target as Node) &&
				!triggerElement.contains(event.target as Node)
			) {
				closeDropdown();
			}
		}

		function handleEscape(event: KeyboardEvent) {
			if (event.key === 'Escape') {
				closeDropdown();
			}
		}

		document.addEventListener('click', handleClickOutside);
		document.addEventListener('keydown', handleEscape);

		return () => {
			document.removeEventListener('click', handleClickOutside);
			document.removeEventListener('keydown', handleEscape);
		};
	});
</script>

<div class="relative">
	<button bind:this={triggerElement} onclick={toggleDropdown} class=" h-full">
		{@render trigger()}
	</button>

	<!-- Dropdown Content -->
	{#if isOpen}
		<div
			bind:this={dropdownElement}
			class="bg-popover text-popover-foreground absolute top-full z-50 mt-2 min-w-48 rounded-md border p-1 shadow-md"
			class:right-0={align === 'right'}
			class:left-0={align === 'left'}
			role="menu"
			tabindex="-1"
		>
			<div
				role="button"
				tabindex="0"
				onclick={closeDropdown}
				onkeydown={(e) => e.key === 'Enter' && closeDropdown()}
			>
				{@render content()}
			</div>
		</div>
	{/if}
</div>
