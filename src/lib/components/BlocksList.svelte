<script lang="ts">
	import type { Block } from '$lib/client/idb';

	interface Props {
		blocks: Block[];
		selectedMediaId?: string | null;
		onSelectItem?: (mediaId: string) => void;
	}

	let { blocks, selectedMediaId, onSelectItem }: Props = $props();

	function selectItem(mediaId: string) {
		if (onSelectItem) {
			onSelectItem(mediaId);
		}
	}
</script>

<ul class="my-5 flex w-min list-none flex-col gap-2 select-none">
	{#each blocks as item (item)}
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<li
			onclick={() => selectItem(item.currentMediaId)}
			class="flex cursor-pointer items-center justify-center gap-2 border p-3 transition duration-200 hover:bg-gray-100"
			class:bg-red-500={selectedMediaId == item.currentMediaId}
			class:text-white={selectedMediaId == item.currentMediaId}
		>
			<div class="w-max">{item.currentMediaId}</div>
			<button type="button" class="my-handle outline-none">
				<!-- <Handle /> -->...
			</button>
		</li>
	{/each}
</ul>
