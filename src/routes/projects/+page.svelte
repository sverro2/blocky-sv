<script lang="ts">
	import { Plus } from 'lucide-svelte';
	import type { PageProps } from './$types';
	let { data }: PageProps = $props();
</script>

<div class="m-4 flex flex-col gap-6 text-white">
	<h1 class="text-2xl">Your projects</h1>

	<!-- Project list -->
	<div class="flex flex-wrap gap-4">
		<!-- Project list item -->
		{#each data.projects as project (project.id)}
			<div class="hover:text-passion border px-3 py-1">
				<a href="/projects/{project.id}">
					<!-- Render project name if available, else fallback -->
					{project.name}
				</a>
			</div>
		{/each}
		<!-- End repeat -->
	</div>

	<div>
		<button class="hover:text-passion flex cursor-pointer items-center gap-2">
			Create project
			<Plus />
		</button>
	</div>
</div>
