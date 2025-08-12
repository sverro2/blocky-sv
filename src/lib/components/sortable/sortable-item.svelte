<script lang="ts">
	import { CSS, styleObjectToString } from '@dnd-kit-svelte/utilities';
	import { useSortable } from '@dnd-kit-svelte/sortable';
	import type { Block } from '$lib/client/idb';

	let { block }: { block: Block } = $props();

	const { attributes, listeners, node, transform, transition, isDragging, isSorting } = useSortable(
		{
			id: block.id
		}
	);

	const style = $derived(
		styleObjectToString({
			transform: CSS.Transform.toString(transform.current),
			transition: isSorting.current ? transition.current : undefined,
			zIndex: isDragging.current ? 1 : undefined
		})
	);
</script>

<div
	class="relative select-none"
	bind:this={node.current}
	{style}
	{...listeners.current}
	{...attributes.current}
>
	<!-- Original element - becomes invisible during drag but maintains dimensions -->
	<div class={['rounded-[18px] bg-white p-4', { invisible: isDragging.current }]}>
		T: {block.id}
	</div>

	<!-- Drag placeholder - set to match original dimensions -->
	{#if isDragging.current}
		<div class="absolute inset-0 flex items-center justify-center">
			<!-- You can put any content here for the dragging state -->
			<div
				class="flex h-full w-full items-center justify-center rounded-[18px] border-2 border-dashed border-orange-500 bg-orange-500/10"
			>
				<span class="text-orange-500">Moving: {block.id}</span>
			</div>
		</div>
	{/if}
</div>
