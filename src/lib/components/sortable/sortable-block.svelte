<script lang="ts">
	import { CSS, styleObjectToString } from '@dnd-kit-svelte/utilities';
	import { useSortable } from '@dnd-kit-svelte/sortable';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { GripVertical, CrosshairIcon, ArrowDownUpIcon } from 'lucide-svelte';
	import { cn } from '$lib/utils';
	import Badge from '../ui/badge/badge.svelte';

	interface Props {
		block: BlockListItem;
		selectedBlockId?: string | null;
		onSelectItem?: (mediaId: string) => void;
	}

	let { block, selectedBlockId, onSelectItem }: Props = $props();

	const { attributes, listeners, node, transform, transition, isDragging, isSorting } = useSortable(
		{
			id: block.id
		}
	);

	let isSelected = $derived(block.id === selectedBlockId);

	const style = $derived(
		styleObjectToString({
			transform: CSS.Transform.toString(transform.current),
			transition: isSorting.current ? transition.current : undefined,
			zIndex: isDragging.current ? 1 : undefined
		})
	);

	function onSelect(event: MouseEvent) {
		event.stopPropagation();
		if (onSelectItem) {
			onSelectItem(block.id);
			// onSelectItem(block.currentMediaId);
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
				<div class="flex gap-2">
					<p class="font-medium">{block.blockName}</p>
					{#if block.alternativeCount > 1}
						<Badge variant="outline">
							{block.alternativeCount}
							<ArrowDownUpIcon />
						</Badge>
					{/if}
				</div>
			</div>

			<!-- Play button -->
			<Button variant="outline" size="sm" onclick={onSelect} class="-m-2 shrink-0">
				<CrosshairIcon class="h-4 w-4" />
			</Button>
		</Card.Content>
	</Card.Root>
</div>
