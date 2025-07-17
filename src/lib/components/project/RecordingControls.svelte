<script lang="ts">
	import { MicIcon, SaveIcon } from 'lucide-svelte';
	import { mediaRecordingService } from '$lib/services/media-recording';
	import type { ProjectStore } from '$lib/services/project-store';

	interface Props {
		projectStore: ProjectStore;
		onRecordingComplete?: (mediaId: string) => void;
	}

	let { projectStore, onRecordingComplete }: Props = $props();

	let isRecording = $derived(mediaRecordingService.isRecording);
	let recordingError = $state<string | null>(null);

	async function startRecording() {
		try {
			recordingError = null;
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

			// Add the media to the project
			await projectStore.addMediaToProject(mediaId);

			// Notify parent component
			onRecordingComplete?.(mediaId);
		} catch (error) {
			recordingError = error instanceof Error ? error.message : 'Failed to stop recording';
			console.error('Stop recording error:', error);
		}
	}

	// Sync with service state
</script>

<div class="flex gap-2">
	<button
		onclick={startRecording}
		disabled={isRecording}
		class="flex gap-2 rounded-xl bg-red-500 px-5 py-2 text-white transition duration-300 ease-in-out hover:bg-red-400 disabled:cursor-not-allowed disabled:bg-gray-300"
		title={isRecording ? 'Recording in progress...' : 'Start recording'}
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
