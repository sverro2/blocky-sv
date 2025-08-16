import { z } from 'zod';

export const createProjectSchema = z.object({
	name: z
		.string()
		.min(1, 'Project name is required')
		.max(32, 'Project name must be 32 characters or less'),
	mediaType: z.enum(['audio', 'video'])
});

export type CreateProjectForm = z.infer<typeof createProjectSchema>;
