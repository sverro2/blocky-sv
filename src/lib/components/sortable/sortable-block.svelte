<script lang="ts">
	import { CSS, styleObjectToString } from '@dnd-kit-svelte/utilities';
	import { useSortable } from '@dnd-kit-svelte/sortable';
	import type { Block } from '$lib/client/idb';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { GripVertical, Play, Pause } from 'lucide-svelte';
	import { cn } from '$lib/utils';

	interface Props {
		block: Block;
		selectedMediaId?: string | null;
		onSelectItem?: (mediaId: string) => void;
	}

	let { block, selectedMediaId, onSelectItem }: Props = $props();

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

	const isSelected = $derived(selectedMediaId === block.currentMediaId);

	function handlePlay(event: MouseEvent) {
		event.stopPropagation();
		if (onSelectItem) {
			onSelectItem(block.currentMediaId);
		}
	}
</script>

<div class="relative select-none" bind:this={node.current} {style} {...attributes.current}>
	<!-- Original element -->
	<Card.Root
		class={cn('transition-all duration-200 hover:shadow-md', {
			'ring-primary ring-2 ring-offset-2': isSelected,
			'opacity-50': isDragging.current
		})}
	>
		<Card.Content class="flex items-center justify-between gap-3">
			<div
				{...listeners.current}
				class="-my-5 flex grow cursor-grab items-center gap-3 py-5 active:cursor-grabbing"
			>
				<!-- Drag handle -->
				<button class="text-muted-foreground hover:text-foreground -m-4 p-4">
					<GripVertical class="h-4 w-4" />
				</button>

				<!-- Block info -->
				<div class="flex-1">
					<p class="font-medium">{block.id}</p>
				</div>
			</div>

			<!-- Play button -->
			<Button variant="outline" size="sm" onclick={handlePlay} class="-m-2 shrink-0">
				{#if isSelected}
					<Pause class="h-4 w-4" />
				{:else}
					<Play class="h-4 w-4" />
				{/if}
			</Button>
		</Card.Content>
	</Card.Root>
</div>
