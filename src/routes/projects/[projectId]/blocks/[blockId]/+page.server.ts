// import { requireAuth } from '$lib/server/repo/auth';
import type { PageServerLoad } from './$types';
import { getProjectDetails } from '$lib/server/repo/project';
import type { BlockListItemDto } from '$lib/api/block-list-item-dto';
import { error, redirect } from '@sveltejs/kit';
import type { ComboboxOption } from '$lib/components/ui/combobox';
import type { AlternativeListItemDto } from '$lib/api/alternative-list-item-dto';
import { requireAuth } from '$lib/server/repo/auth';

export const load: PageServerLoad = async (event) => {
	const user = requireAuth(event);
	// Fetch the project and verify ownership
	const project = await getProjectDetails(event.params.projectId, user.id);

	const projectId = project.id;
	const currentBlockId = event.params.blockId;
	let blocksList: BlockListItem[] = [];

	let currentBlockName: string = '';
	let currentBlockDescription: string | undefined = '';
	let currentAlternativeId = '';
	let currentAlternativeName: string = '';
	let currentAlternativeDescription: string | undefined = '';

	let alternativeList: ComboboxOption[] = [];

	// Reload blocks
	try {
		const res = await event.fetch(`/api/projects/${projectId}/blocks`, {
			method: 'GET'
		});
		if (!res.ok) {
			throw new Error(`HTTP error! status: ${res.status}`);
		}
		const blocks = (await res.json()) as BlockListItemDto[];

		const parsedBlocks: BlockListItem[] = blocks.map((block: BlockListItemDto) => ({
			id: block.id,
			blockName: block.name,
			currentAlternativeName: block.currentAlternativeName,
			alternativeCount: block.alternativeCount
		}));

		// Make sure the currently selected alternative is updated with the new data
		const currentBlock = blocks.find((block) => block.id === currentBlockId)!;
		currentAlternativeId = currentBlock.currentAlternativeId;

		// Also figure out the name of the current block
		currentBlockName = currentBlock.name;
		currentBlockDescription = currentBlock.blockDescription;

		// And the name of current alternative
		currentAlternativeName = currentBlock.currentAlternativeName;
		currentAlternativeDescription = currentBlock.alternativeDescription;

		// Then update the whole list
		blocksList = parsedBlocks;
	} catch (errorMessage) {
		throw error(500, `For some reason the page failed to load: ${errorMessage}`);
	}

	// If block requested in url can not be found in current block list, return!
	if (!blocksList.find((block) => block.id === currentBlockId)) {
		throw redirect(302, `/projects/${projectId}`);
	}

	// Reload alternatives
	try {
		const res = await event.fetch(`/api/projects/${projectId}/blocks/${currentBlockId}`, {
			method: 'GET'
		});
		if (!res.ok) {
			throw new Error(`HTTP error! status: ${res.status}`);
		}
		const alternatives = await res.json();
		alternativeList = alternatives.map((alternative: AlternativeListItemDto) => ({
			value: alternative.id,
			label: alternative.name
		}));
	} catch (error) {
		console.error('Error fetching alternatives:', error);
	}

	return {
		projectId,
		currentBlockId,
		blocksList,
		alternativeList,
		currentAlternativeId,
		currentBlockName,
		currentBlockDescription,
		currentAlternativeName,
		currentAlternativeDescription
	};
};
