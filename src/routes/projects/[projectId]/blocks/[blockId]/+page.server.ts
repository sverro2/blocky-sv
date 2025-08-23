import type { PageServerLoad } from './$types';
import { getProjectDetails } from '$lib/server/repo/project';
import type { BlockListItemDto } from '$lib/api/block-list-item-dto';
import { error, redirect } from '@sveltejs/kit';
import type { ComboboxOption } from '$lib/components/ui/combobox';
import type { AlternativeListItemDto } from '$lib/api/alternative-list-item-dto';
import { requireAuth } from '$lib/server/repo/auth';
import type { RequestEvent } from '@sveltejs/kit';

interface BlockListItem {
	id: string;
	blockName: string;
	currentAlternativeName: string;
	alternativeCount: number;
}

async function fetchBlocks(event: RequestEvent, projectId: string) {
	const res = await event.fetch(`/api/projects/${projectId}/blocks`, {
		method: 'GET'
	});

	if (!res.ok) {
		throw new Error(`HTTP error! status: ${res.status}`);
	}

	return (await res.json()) as BlockListItemDto[];
}

async function fetchAlternatives(
	event: RequestEvent,
	projectId: string,
	blockId: string
): Promise<ComboboxOption[]> {
	try {
		const res = await event.fetch(`/api/projects/${projectId}/blocks/${blockId}`, {
			method: 'GET'
		});

		if (!res.ok) {
			throw new Error(`HTTP error! status: ${res.status}`);
		}

		const alternatives = await res.json();
		return alternatives.map((alternative: AlternativeListItemDto) => ({
			value: alternative.id,
			label: alternative.name
		}));
	} catch (error) {
		console.error('Error fetching alternatives:', error);
		return [];
	}
}

function parseBlocksData(blocks: BlockListItemDto[], currentBlockId: string) {
	const parsedBlocks: BlockListItem[] = blocks.map((block: BlockListItemDto) => ({
		id: block.id,
		blockName: block.name,
		currentAlternativeName: block.currentAlternativeName,
		alternativeCount: block.alternativeCount
	}));

	const currentBlock = blocks.find((block) => block.id === currentBlockId);
	if (!currentBlock) {
		throw new Error(`Block ${currentBlockId} not found`);
	}

	return {
		blocksList: parsedBlocks,
		currentBlock: {
			id: currentBlock.currentAlternativeId,
			name: currentBlock.name,
			description: currentBlock.blockDescription,
			alternativeName: currentBlock.currentAlternativeName,
			alternativeDescription: currentBlock.alternativeDescription
		}
	};
}

export const load: PageServerLoad = async (event) => {
	const user = requireAuth(event);
	const project = await getProjectDetails(event.params.projectId, user.id);
	const { id: projectId } = project;
	const currentBlockId = event.params.blockId;

	try {
		const blocks = await fetchBlocks(event, projectId);
		const { blocksList, currentBlock } = parseBlocksData(blocks, currentBlockId);

		// Verify block exists
		if (!blocksList.find((block) => block.id === currentBlockId)) {
			throw redirect(302, `/projects/${projectId}`);
		}

		const alternativeList = await fetchAlternatives(event, projectId, currentBlockId);

		return {
			projectId,
			currentBlockId,
			blocksList,
			alternativeList,
			currentAlternativeId: currentBlock.id,
			currentBlockName: currentBlock.name,
			currentBlockDescription: currentBlock.description,
			currentAlternativeName: currentBlock.alternativeName,
			currentAlternativeDescription: currentBlock.alternativeDescription
		};
	} catch (errorMessage) {
		throw error(500, `For some reason the page failed to load: ${errorMessage}`);
	}
};
