import { AddBlockLocationDto } from '$lib/api/add-block-dto';
import { z } from 'zod';

export const createProjectSchema = z.object({
	name: z
		.string()
		.min(1, 'Project name is required')
		.max(32, 'Project name must be 32 characters or less'),
	mediaType: z.enum(['audio', 'video'])
});

export const blockMetaUpdateSchema = z.object({
	name: z
		.string()
		.min(1, 'Block name is required')
		.max(100, 'Block name must be 100 characters or less'),
	description: z.string().max(1000, 'Description must be 500 characters or less').optional(),
	alternativeId: z.string().uuid('Invalid alternative ID format')
}) satisfies z.ZodType<import('$lib/api/block-meta-update-dto').BlockMetaUpdateDto>;

export const blockAddSchema = z.object({
	location: z.nativeEnum(AddBlockLocationDto)
}) satisfies z.ZodType<import('$lib/api/add-block-dto').AddBlockDto>;

export const blockMoveSchema = z.object({
	blockId: z.string(),
	newIndex: z.number().min(0)
}) satisfies z.ZodType<import('$lib/api/block-moved-dto').BlockMovedDto>;

export const alternativeMetaUpdateSchema = z.object({
	name: z
		.string()
		.min(1, 'Block name is required')
		.max(100, 'Block name must be 100 characters or less'),
	description: z.string().max(1000, 'Description must be 500 characters or less').optional()
}) satisfies z.ZodType<import('$lib/api/alternative-meta-update-dto').AlternativeMetaUpdateDto>;

export type CreateProjectForm = z.infer<typeof createProjectSchema>;
