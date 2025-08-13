<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Separator } from '$lib/components/ui/separator';
	import HoverCard from '$lib/components/HoverCard.svelte';
	import CreateProjectDialog from '$lib/components/CreateProjectDialog.svelte';
	import { AudioWaveform, Video } from 'lucide-svelte';
	let { data } = $props();
</script>

<div class="min-h-screen">
	<div class="container mx-auto space-y-6 p-6">
		<!-- Header -->
		<div class="space-y-4">
			<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 class="mb-2 text-3xl font-bold tracking-tight">Your Projects</h1>
					<p class="text-muted-foreground">Manage and organize your ideas</p>
				</div>
				<div class="flex items-center gap-4">
					<span class="text-muted-foreground text-sm">Welcome, {data.user.username}</span>
					<Button variant="outline" href="/logout">Sign out</Button>
				</div>
			</div>
			<Separator />
		</div>

		<!-- Projects Grid -->
		<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
			<!-- Create Project Card -->
			<HoverCard class="border-dashed">
				<CardContent class="flex h-full flex-col items-center justify-center gap-2 p-0">
					<CreateProjectDialog form={data.form} />
				</CardContent>
			</HoverCard>
			{#each data.projects as project (project.id)}
				<HoverCard href="/projects/{project.id}">
					<CardHeader class="h-20">
						<div class="flex items-center justify-between">
							<CardTitle class="text-lg">{project.name}</CardTitle>
							<Badge variant="secondary">
								{#if project.mediaType === 'audio'}
									<AudioWaveform></AudioWaveform>Audio
								{:else}
									<Video></Video>Video
								{/if}
							</Badge>
						</div>
						{#if project.description}
							<CardDescription>
								<span class="line-clamp-2 max-w-4/5">{project.description}</span>
							</CardDescription>
						{:else}
							<CardDescription class="text-muted-foreground/50">No description</CardDescription>
						{/if}
					</CardHeader>
					<CardContent>
						<div class="text-muted-foreground text-sm">
							Created: {new Date(project.createdAt).toLocaleDateString()}
						</div>
					</CardContent>
				</HoverCard>
			{/each}
		</div>
	</div>
</div>
