<script lang="ts">
	import { onMount } from 'svelte';
	import { mediaCleanupService } from '$lib/services/media-cleanup';
	import type { CleanupSummary } from '$lib/services/media-cleanup';
	import { TrashIcon, RefreshCwIcon, HardDriveIcon } from 'lucide-svelte';
	import { toast } from '$lib/utils/toast';

	interface Props {
		projectId: string;
		onCleanupComplete?: (summary: CleanupSummary) => void;
	}

	let { projectId, onCleanupComplete }: Props = $props();

	let storageStats = $state<{
		totalFiles: number;
		totalSizeBytes: number;
		files: Array<{ name: string; size: number }>;
	}>({
		totalFiles: 0,
		totalSizeBytes: 0,
		files: []
	});

	let orphanedFiles = $state<string[]>([]);
	let isLoadingStats = $state(false);
	let isCleaningUp = $state(false);
	let cleanupError = $state<string | null>(null);
	let lastCleanupResult = $state<CleanupSummary | null>(null);

	onMount(async () => {
		await loadStorageStats();
		await findOrphanedFiles();
	});

	async function loadStorageStats() {
		isLoadingStats = true;
		try {
			storageStats = await mediaCleanupService.getStorageStats();
		} catch (error) {
			console.error('Failed to load storage stats:', error);
		} finally {
			isLoadingStats = false;
		}
	}

	async function findOrphanedFiles() {
		try {
			orphanedFiles = await mediaCleanupService.findOrphanedMedia(projectId);
		} catch (error) {
			console.error('Failed to find orphaned files:', error);
			orphanedFiles = [];
		}
	}

	async function performCleanup() {
		isCleaningUp = true;
		cleanupError = null;

		try {
			const result = await mediaCleanupService.cleanupOrphanedMedia(projectId);
			lastCleanupResult = result;
			onCleanupComplete?.(result);

			// Show success notification
			if (result.totalSuccessful > 0) {
				toast.success(
					`Successfully cleaned up ${result.totalSuccessful} orphaned file${result.totalSuccessful === 1 ? '' : 's'}`,
					{ duration: 4000 }
				);
			}

			// Show warning if some files couldn't be cleaned up
			if (result.totalFailed > 0) {
				toast.warning(
					`${result.totalFailed} file${result.totalFailed === 1 ? '' : 's'} could not be cleaned up`,
					{ duration: 6000 }
				);
			}

			// Show info if no files were found to clean
			if (result.totalAttempted === 0) {
				toast.info('No orphaned files found to clean up', { duration: 3000 });
			}

			// Refresh stats after cleanup
			await loadStorageStats();
			await findOrphanedFiles();
		} catch (error) {
			cleanupError = error instanceof Error ? error.message : 'Cleanup failed';
			toast.error(`Cleanup failed: ${cleanupError}`, { duration: 8000 });
		} finally {
			isCleaningUp = false;
		}
	}

	async function refreshStats() {
		await loadStorageStats();
		await findOrphanedFiles();
		toast.info('Storage stats refreshed', { duration: 2000 });
	}

	function formatFileSize(bytes: number): string {
		return mediaCleanupService.formatBytes(bytes);
	}

	function getFileDisplayName(filename: string): string {
		return filename.length > 20 ? `${filename.slice(0, 8)}...${filename.slice(-8)}` : filename;
	}
</script>

<div class="storage-manager space-y-4">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<h3 class="text-lg font-semibold text-gray-900">Storage Management</h3>
		<button
			onclick={refreshStats}
			disabled={isLoadingStats}
			class="flex items-center gap-2 rounded-md bg-gray-100 px-3 py-1 text-sm text-gray-700 hover:bg-gray-200 disabled:opacity-50"
			title="Refresh storage stats"
		>
			<RefreshCwIcon size={16} class={isLoadingStats ? 'animate-spin' : ''} />
			Refresh
		</button>
	</div>

	<!-- Storage Stats -->
	<div class="rounded-lg border border-gray-200 bg-white p-4">
		<div class="mb-3 flex items-center gap-2">
			<HardDriveIcon size={20} class="text-gray-600" />
			<h4 class="font-medium text-gray-900">Storage Usage</h4>
		</div>

		{#if isLoadingStats}
			<div class="flex items-center gap-2 text-gray-500">
				<div
					class="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500"
				></div>
				<span class="text-sm">Loading storage information...</span>
			</div>
		{:else}
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
				<div class="text-center">
					<div class="text-2xl font-bold text-blue-600">{storageStats.totalFiles}</div>
					<div class="text-sm text-gray-500">Total Files</div>
				</div>
				<div class="text-center">
					<div class="text-2xl font-bold text-green-600">
						{formatFileSize(storageStats.totalSizeBytes)}
					</div>
					<div class="text-sm text-gray-500">Total Size</div>
				</div>
				<div class="text-center">
					<div class="text-2xl font-bold text-orange-600">{orphanedFiles.length}</div>
					<div class="text-sm text-gray-500">Orphaned Files</div>
				</div>
			</div>
		{/if}
	</div>

	<!-- Orphaned Files Section -->
	{#if orphanedFiles.length > 0}
		<div class="rounded-lg border border-orange-200 bg-orange-50 p-4">
			<div class="mb-3 flex items-center justify-between">
				<div class="flex items-center gap-2">
					<TrashIcon size={20} class="text-orange-600" />
					<h4 class="font-medium text-orange-900">Orphaned Files</h4>
				</div>
				<button
					onclick={performCleanup}
					disabled={isCleaningUp || orphanedFiles.length === 0}
					class="flex items-center gap-2 rounded-md bg-orange-600 px-3 py-1 text-sm text-white hover:bg-orange-700 disabled:opacity-50"
					title="Clean up orphaned files"
				>
					{#if isCleaningUp}
						<div
							class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
						></div>
						<span>Cleaning...</span>
					{:else}
						<TrashIcon size={16} />
						<span>Clean Up ({orphanedFiles.length})</span>
					{/if}
				</button>
			</div>

			<p class="mb-3 text-sm text-orange-800">
				These files are no longer referenced by any blocks and can be safely removed to free up
				storage space.
			</p>

			{#if orphanedFiles.length > 0}
				<div class="max-h-32 overflow-y-auto">
					<div class="grid grid-cols-1 gap-1 sm:grid-cols-2">
						{#each orphanedFiles as filename (filename)}
							<div class="flex items-center gap-2 rounded bg-orange-100 px-2 py-1 text-xs">
								<span class="font-mono text-orange-700">{getFileDisplayName(filename)}</span>
								{#if storageStats.files.find((f) => f.name === filename)}
									<span class="text-orange-600">
										({formatFileSize(
											storageStats.files.find((f) => f.name === filename)?.size || 0
										)})
									</span>
								{/if}
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	{:else if !isLoadingStats}
		<div class="rounded-lg border border-green-200 bg-green-50 p-4">
			<div class="flex items-center gap-2">
				<div class="flex h-5 w-5 items-center justify-center rounded-full bg-green-500">
					<div class="h-2 w-2 rounded-full bg-white"></div>
				</div>
				<span class="text-sm font-medium text-green-800">Storage is clean</span>
			</div>
			<p class="mt-1 text-sm text-green-700">
				All media files are properly referenced and no cleanup is needed.
			</p>
		</div>
	{/if}

	<!-- Cleanup Results -->
	{#if lastCleanupResult}
		<div class="rounded-lg border border-blue-200 bg-blue-50 p-4">
			<h4 class="mb-2 font-medium text-blue-900">Last Cleanup Result</h4>
			<div class="grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
				<div class="text-center">
					<div class="font-semibold text-blue-700">{lastCleanupResult.totalAttempted}</div>
					<div class="text-blue-600">Attempted</div>
				</div>
				<div class="text-center">
					<div class="font-semibold text-green-700">{lastCleanupResult.totalSuccessful}</div>
					<div class="text-green-600">Successful</div>
				</div>
				<div class="text-center">
					<div class="font-semibold text-red-700">{lastCleanupResult.totalFailed}</div>
					<div class="text-red-600">Failed</div>
				</div>
			</div>
		</div>
	{/if}

	<!-- Error Display -->
	{#if cleanupError}
		<div class="rounded-lg border border-red-200 bg-red-50 p-4">
			<div class="flex items-center gap-2">
				<svg class="h-5 w-5 text-red-600" viewBox="0 0 20 20" fill="currentColor">
					<path
						fill-rule="evenodd"
						d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
						clip-rule="evenodd"
					/>
				</svg>
				<h4 class="font-medium text-red-900">Cleanup Error</h4>
			</div>
			<p class="mt-1 text-sm text-red-700">{cleanupError}</p>
			<button
				onclick={() => (cleanupError = null)}
				class="mt-2 text-sm text-red-600 underline hover:no-underline"
			>
				Dismiss
			</button>
		</div>
	{/if}

	<!-- File List (for debugging) -->
	{#if import.meta.env.DEV && storageStats.files.length > 0}
		<details class="rounded-lg border border-gray-200 bg-gray-50 p-4">
			<summary class="cursor-pointer font-medium text-gray-700">
				All Files ({storageStats.files.length})
			</summary>
			<div class="mt-3 max-h-64 overflow-y-auto">
				<div class="space-y-1">
					{#each storageStats.files as file (file)}
						<div class="flex items-center justify-between rounded bg-white px-3 py-1 text-sm">
							<span class="font-mono text-gray-700">{getFileDisplayName(file.name)}</span>
							<span class="text-gray-500">{formatFileSize(file.size)}</span>
						</div>
					{/each}
				</div>
			</div>
		</details>
	{/if}
</div>
