import { sql } from 'drizzle-orm';
import {
	pgTable,
	integer,
	text,
	timestamp,
	uuid,
	index,
	pgEnum,
	jsonb,
	boolean,
	numeric,
	check
} from 'drizzle-orm/pg-core';

export const mediaTypeEnum = pgEnum('media_type', ['audio', 'video']);
export const projectSnapshotVersionEnum = pgEnum('project_snapshot_version', ['V1']);
export const recordingTypeEnum = pgEnum('recording_type', ['audio', 'video', 'photo', 'text']);
export const codecEnum = pgEnum('codec', ['default_opus_v1', 'default_webp_v1']);
export const recordingUsecaseEnum = pgEnum('recording_usecase', ['original', 'proxy', 'render']);

export const user = pgTable(
	'user',
	{
		id: text('id').primaryKey(),
		username: text('username').notNull().unique(),
		passwordHash: text('password_hash').notNull(),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull(),
		email: text('email').notNull()
	},
	(table) => [
		check('username_length', sql`length(${table.email}) <= 64`),
		check('email_length', sql`length(${table.email}) <= 254`)
	]
);

export const session = pgTable('session', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id),
	expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull()
});

export const project = pgTable(
	'project',
	{
		id: uuid('id').primaryKey(),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull(),
		name: text('name').notNull(),
		description: text('description'),
		mediaType: mediaTypeEnum('media_type').notNull().default('audio'),
		userId: text('user_id')
			.notNull()
			.references(() => user.id)
	},
	(table) => [
		check('project_name_length', sql`length(${table.name}) <= 32`),
		index('project_id_user_id_idx').on(table.id, table.userId)
	]
);

export const projectSnapshot = pgTable(
	'project_snapshot',
	{
		id: uuid('id').primaryKey(),
		projectId: uuid('project_id')
			.notNull()
			.references(() => project.id),
		modifiedAt: timestamp('modified_at', { withTimezone: true, mode: 'date' }).notNull(),
		name: text('name'),
		isAutosafe: boolean('is_autosafe').notNull(),
		body_dao: jsonb('body').notNull(),
		body_dao_version: projectSnapshotVersionEnum('version').notNull()
	},
	(table) => [
		check('project_snapshot_name_length', sql`length(${table.name}) <= 32`),
		index('project_snapshot_id_project_id_modified_at_idx').on(
			table.id,
			table.projectId,
			table.modifiedAt
		)
	]
);

export const block = pgTable(
	'block',
	{
		id: uuid('id').primaryKey(),
		projectSnapshotId: uuid('project_snapshot_id')
			.notNull()
			.references(() => projectSnapshot.id, { onDelete: 'cascade' }),
		version: timestamp('version', { withTimezone: true, mode: 'date' }).notNull(),
		versionName: text('version_name'),
		name: text('name').notNull(),
		description: text('description'),
		disabled: boolean('disabled').notNull().default(false),
		currentAlternativeId: uuid('current_alternative_id'),
		orderIndex: integer('order_index').notNull()
	},
	(table) => [
		check('block_version_name_length', sql`length(${table.versionName}) <= 64`),
		check('block_name_length', sql`length(${table.name}) <= 128`),
		index('block_project_snapshot_id_idx').on(table.projectSnapshotId),
		index('block_order_idx').on(table.projectSnapshotId, table.orderIndex)
	]
);

export const alternative = pgTable(
	'alternative',
	{
		id: uuid('id').primaryKey(),
		blockId: uuid('block_id')
			.notNull()
			.references(() => block.id, { onDelete: 'cascade' }),
		name: text('name').notNull(),
		modifiedAt: timestamp('modified_at', { withTimezone: true, mode: 'date' }).notNull(),
		description: text('description'),
		durationSeconds: text('duration_seconds'),
		clipOffsetStartSeconds: numeric('clip_offset_start_seconds'),
		clipOffsetEndSeconds: numeric('clip_offset_end_seconds'),
		recordingType: recordingTypeEnum('recording_type').notNull(),
		recordingId: uuid('recording_id')
	},
	(table) => [
		check('alternative_name_length', sql`length(${table.name}) <= 128`),
		check('alternative_duration_seconds_length', sql`length(${table.durationSeconds}) <= 32`),
		index('alternative_block_id_idx').on(table.blockId)
	]
);

export const recording = pgTable(
	'recording',
	{
		id: uuid('id').primaryKey(),
		alternativeId: uuid('alternative_id')
			.notNull()
			.references(() => alternative.id, { onDelete: 'cascade' }),
		filename: text('filename').notNull(),
		estimatedDurationMillis: integer('estimated_duration_millis'),
		codec: codecEnum('codec').notNull(),
		resolution: text('resolution'),
		usecase: recordingUsecaseEnum('usecase').notNull(),
		extras: jsonb('extras')
	},
	(table) => [
		check('recording_filename_length', sql`length(${table.filename}) <= 256`),
		check('recording_resolution_length', sql`length(${table.resolution}) <= 32`),
		index('recording_alternative_id_idx').on(table.alternativeId)
	]
);

export type Session = typeof session.$inferSelect;

export type User = typeof user.$inferSelect;

export type Project = typeof project.$inferSelect;

export type ProjectSnapshot = typeof projectSnapshot.$inferSelect;

export type Block = typeof block.$inferSelect;

export type Alternative = typeof alternative.$inferSelect;

export type Recording = typeof recording.$inferSelect;
