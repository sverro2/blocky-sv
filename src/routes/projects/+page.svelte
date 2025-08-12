<script lang="ts">
	import { Plus } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Separator } from '$lib/components/ui/separator';
	let { data } = $props();
</script>

<div class="bg-background min-h-screen">
	<div class="container mx-auto space-y-6 p-6">
		<!-- Header -->
		<div class="space-y-4">
			<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 class="text-3xl font-bold tracking-tight">Your Projects</h1>
					<p class="text-muted-foreground">Manage and organize your audio projects</p>
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
			{#each data.projects as project (project.id)}
				<Card class="cursor-pointer transition-shadow hover:shadow-md">
					<a href="/projects/{project.id}" class="block">
						<CardHeader>
							<div class="flex items-center justify-between">
								<CardTitle class="text-lg">{project.name}</CardTitle>
								<Badge variant="secondary">Active</Badge>
							</div>
							{#if project.description}
								<CardDescription>{project.description}</CardDescription>
							{:else}
								<CardDescription class="text-muted-foreground/50">No description</CardDescription>
							{/if}
						</CardHeader>
						<CardContent>
							<div class="text-muted-foreground text-sm">
								Created: {new Date(project.createdAt).toLocaleDateString()}
							</div>
						</CardContent>
					</a>
				</Card>
			{/each}

			<!-- Create Project Card -->
			<Card class="cursor-pointer border-dashed transition-shadow hover:shadow-md">
				<CardContent class="flex items-center justify-center p-6">
					<Button variant="ghost" class="h-full w-full flex-col gap-2">
						<Plus class="h-8 w-8" />
						<span>Create New Project</span>
					</Button>
				</CardContent>
			</Card>
		</div>
	</div>
</div>
