<script lang="ts">
	import { Plus } from 'lucide-svelte';
	let { data } = $props();
</script>

<div class="m-4 flex flex-col gap-6 text-white">
	<div class="flex items-center justify-between">
		<h1 class="text-2xl">Your projects</h1>
		<div class="flex items-center gap-4 text-sm">
			<span class="text-foreground/70">Welcome, {data.user.username}</span>
			<a href="/logout" class="text-passion hover:text-passion-light">Sign out</a>
		</div>
	</div>

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
