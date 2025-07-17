<script lang="ts">
	import { MicIcon, SaveIcon } from 'lucide-svelte';
	import { mediaRecordingService } from '$lib/services/media-recording';
	import type { ProjectStore } from '$lib/services/project-store';
	import type { Block } from '$lib/client/idb';

	interface Props {
		projectStore: ProjectStore;
		onRecordingComplete?: (mediaId: string) => void;
		blocks?: Block[];
	}

	let { projectStore, onRecordingComplete, blocks = [] }: Props = $props();

	let isRecording = $derived(mediaRecordingService.isRecording);
	let recordingError = $state<string | null>(null);
	let selectedBlockId = $state<string | null>(null);
	let recordingMode = $state<'new' | 'existing'>('new');

	async function startRecording() {
		try {
			recordingError = null;

			// Analytics tracking
			console.log('Analytics: Recording started', {
				mode: recordingMode,
				targetBlockId: selectedBlockId,
				timestamp: new Date().toISOString(),
				action: 'start_recording'
			});

			await mediaRecordingService.startRecording();
			isRecording = true;
		} catch (error) {
			recordingError = error instanceof Error ? error.message : 'Failed to start recording';
			console.error('Recording error:', error);
		}
	}

	async function stopRecording() {
		try {
			const mediaId = await mediaRecordingService.stopRecording();
			isRecording = false;

			if (recordingMode === 'existing' && selectedBlockId) {
				// Analytics tracking
				console.log('Analytics: Recording added to existing block', {
					blockId: selectedBlockId,
					mediaId,
					timestamp: new Date().toISOString(),
					action: 'add_recording_to_block'
				});

				// Add recording to existing block
				await projectStore.addRecordingToBlock(selectedBlockId, mediaId);
			} else {
				// Analytics tracking
				console.log('Analytics: New block created with recording', {
					mediaId,
					timestamp: new Date().toISOString(),
					action: 'create_new_block'
				});

				// Create new block with the recording
				await projectStore.addMediaToProject(mediaId);
			}

			// Reset selection
			selectedBlockId = null;
			recordingMode = 'new';

			// Notify parent component
			onRecordingComplete?.(mediaId);
		} catch (error) {
			recordingError = error instanceof Error ? error.message : 'Failed to stop recording';
			console.error('Stop recording error:', error);
		}
	}

	function handleModeChange(mode: 'new' | 'existing') {
		recordingMode = mode;
		if (mode === 'new') {
			selectedBlockId = null;
		}
	}
</script>

<div class="space-y-4">
	<!-- Recording Mode Selection -->
	<div class="flex items-center gap-4">
		<label class="flex items-center gap-2">
			<input
				type="radio"
				bind:group={recordingMode}
				value="new"
				onchange={() => handleModeChange('new')}
				class="text-blue-600"
			/>
			<span class="text-sm font-medium">New Block</span>
		</label>
		<label class="flex items-center gap-2">
			<input
				type="radio"
				bind:group={recordingMode}
				value="existing"
				onchange={() => handleModeChange('existing')}
				disabled={blocks.length === 0}
				class="text-blue-600"
			/>
			<span class="text-sm font-medium">Add to Existing Block</span>
		</label>
	</div>

	<!-- Block Selection (when recording mode is existing) -->
	{#if recordingMode === 'existing' && blocks.length > 0}
		<div>
			<label for="block-select" class="mb-2 block text-sm font-medium text-gray-700"
				>Select Block:</label
			>
			<select
				id="block-select"
				bind:value={selectedBlockId}
				class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
			>
				<option value={null}>Choose a block...</option>
				{#each blocks as block, index (block.blockId)}
					<option value={block.blockId}>
						Block {index + 1} - {block.media.length} recording{block.media.length === 1 ? '' : 's'} -
						Current: {block.currentMediaId.slice(0, 8)}...
					</option>
				{/each}
			</select>
		</div>
	{/if}

	<!-- Recording Controls -->
	<div class="flex gap-2">
		<button
			onclick={startRecording}
			disabled={isRecording || (recordingMode === 'existing' && !selectedBlockId)}
			class="flex gap-2 rounded-xl bg-red-500 px-5 py-2 text-white transition duration-300 ease-in-out hover:bg-red-400 disabled:cursor-not-allowed disabled:bg-gray-300"
			title={isRecording
				? 'Recording in progress...'
				: recordingMode === 'existing' && !selectedBlockId
					? 'Please select a block first'
					: 'Start recording'}
		>
			<MicIcon />
			{isRecording ? 'Recording...' : 'Record'}
		</button>

		<button
			onclick={stopRecording}
			disabled={!isRecording}
			class="flex gap-2 rounded-xl bg-green-500 px-5 py-2 text-white transition duration-300 ease-in-out hover:bg-green-400 disabled:cursor-not-allowed disabled:bg-gray-300"
			title={!isRecording ? 'No recording to save' : 'Save recording'}
		>
			<SaveIcon />
			Save
		</button>
	</div>

	<!-- Recording Info -->
	{#if recordingMode === 'existing' && selectedBlockId}
		{@const selectedBlock = blocks.find((b) => b.blockId === selectedBlockId)}
		<div class="rounded-md bg-blue-50 p-3">
			<p class="text-sm text-blue-700">
				Recording will be added to the selected block as an additional recording option.
			</p>
			{#if selectedBlock}
				<div class="mt-2 text-xs text-blue-600">
					Selected block currently has {selectedBlock.media.length} recording{selectedBlock.media
						.length === 1
						? ''
						: 's'}. This will be recording #{selectedBlock.media.length + 1}.
				</div>
			{/if}
		</div>
	{/if}
</div>

{#if recordingError}
	<div class="mt-2 rounded-md border border-red-400 bg-red-100 px-4 py-3 text-red-700">
		<p class="text-sm">
			<strong>Recording Error:</strong>
			{recordingError}
		</p>
		<button
			onclick={() => (recordingError = null)}
			class="mt-2 text-sm underline hover:no-underline"
		>
			Dismiss
		</button>
	</div>
{/if}
