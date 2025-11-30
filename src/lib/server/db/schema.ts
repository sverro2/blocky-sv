import {
	pgTable,
	integer,
	text,
	timestamp,
	uuid,
	varchar,
	index,
	pgEnum,
	jsonb,
	boolean,
	numeric
} from 'drizzle-orm/pg-core';

export const mediaTypeEnum = pgEnum('media_type', ['audio', 'video']);
export const projectSnapshotVersionEnum = pgEnum('project_snapshot_version', ['V1']);
export const recordingTypeEnum = pgEnum('recording_type', ['audio', 'video', 'photo', 'text']);
export const codecEnum = pgEnum('codec', ['default_opus_v1', 'default_webp_v1']);
export const recordingUsecaseEnum = pgEnum('recording_usecase', ['original', 'proxy', 'render']);

export const user = pgTable('user', {
	id: text('id').primaryKey(),
	age: integer('age'),
	username: text('username').notNull().unique(),
	passwordHash: text('password_hash').notNull()
});

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
		name: varchar('name', { length: 32 }).notNull(),
		description: text('description'),
		mediaType: mediaTypeEnum('media_type').notNull().default('audio'),
		userId: text('user_id')
			.notNull()
			.references(() => user.id)
	},
	(table) => [index('project_id_user_id_idx').on(table.id, table.userId)]
);

export const projectSnapshot = pgTable(
	'project_snapshot',
	{
		id: uuid('id').primaryKey(),
		projectId: uuid('project_id')
			.notNull()
			.references(() => project.id),
		modifiedAt: timestamp('modified_at', { withTimezone: true, mode: 'date' }).notNull(),
		name: varchar('name', { length: 32 }),
		isAutosafe: boolean('is_autosafe').notNull(),
		body_dao: jsonb('body').notNull(),
		body_dao_version: projectSnapshotVersionEnum('version').notNull()
	},
	(table) => [
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
		versionName: varchar('version_name', { length: 64 }),
		name: varchar('name', { length: 128 }).notNull(),
		description: text('description'),
		disabled: boolean('disabled').notNull().default(false),
		currentAlternativeId: uuid('current_alternative_id'),
		orderIndex: integer('order_index').notNull()
	},
	(table) => [
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
		name: varchar('name', { length: 128 }).notNull(),
		modifiedAt: timestamp('modified_at', { withTimezone: true, mode: 'date' }).notNull(),
		description: text('description'),
		durationSeconds: varchar('duration_seconds', { length: 32 }),
		clipOffsetStartSeconds: numeric('clip_offset_start_seconds'),
		clipOffsetEndSeconds: numeric('clip_offset_end_seconds'),
		recordingType: recordingTypeEnum('recording_type').notNull(),
		recordingId: uuid('recording_id')
	},
	(table) => [index('alternative_block_id_idx').on(table.blockId)]
);

export const recording = pgTable(
	'recording',
	{
		id: uuid('id').primaryKey(),
		alternativeId: uuid('alternative_id')
			.notNull()
			.references(() => alternative.id, { onDelete: 'cascade' }),
		filename: varchar('filename', { length: 256 }).notNull(),
		estimatedDurationMillis: integer('estimated_duration_millis'),
		codec: codecEnum('codec').notNull(),
		resolution: varchar('resolution', { length: 32 }),
		usecase: recordingUsecaseEnum('usecase').notNull(),
		extras: jsonb('extras')
	},
	(table) => [index('recording_alternative_id_idx').on(table.alternativeId)]
);

export type Session = typeof session.$inferSelect;

export type User = typeof user.$inferSelect;

export type Project = typeof project.$inferSelect;

export type ProjectSnapshot = typeof projectSnapshot.$inferSelect;

export type Block = typeof block.$inferSelect;

export type Alternative = typeof alternative.$inferSelect;

export type Recording = typeof recording.$inferSelect;
