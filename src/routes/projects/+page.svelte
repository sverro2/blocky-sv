<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import HoverCard from '$lib/components/HoverCard.svelte';
	import CreateProjectDialog from '$lib/components/CreateProjectDialog.svelte';
	import PageLayout from '$lib/components/PageLayout.svelte';
	import ResponsiveHeader from '$lib/components/ResponsiveHeader.svelte';
	import { AudioWaveform, Video, Settings, User, LogOutIcon, TvIcon } from 'lucide-svelte';
	let { data } = $props();

	const backButton = {
		icon: TvIcon,
		href: 'http://www.google.com'
	};
</script>

{#snippet mobileMenuItems()}
	<Button variant="ghost" href="/settings" class="w-full justify-start" disabled>
		<Settings class="mr-2 h-4 w-4" />
		Settings
	</Button>
	<Button variant="ghost" href="/logout" class="w-full justify-start">
		<LogOutIcon class="mr-2 h-4 w-4" />
		Sign out
	</Button>
{/snippet}

{#snippet desktopMenuItems()}
	<Button variant="ghost" href="/settings" class="w-full justify-start">
		<Settings class="mr-2 h-4 w-4" />
		Settings
	</Button>
	<Button variant="ghost" href="/logout" class="w-full justify-start">Sign out</Button>
{/snippet}

{#snippet desktopActions()}
	<!-- Space for additional desktop dropdown menus or buttons -->
	<div class="text-muted-foreground flex items-center gap-1">
		<User size={16}></User>
		{data.user.username}
	</div>
{/snippet}

<PageLayout>
	<ResponsiveHeader
		title="Your Projects"
		{backButton}
		{mobileMenuItems}
		{desktopMenuItems}
		{desktopActions}
	/>

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
						<CardTitle class="line-clamp-1 text-lg">{project.name}</CardTitle>
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
</PageLayout>
