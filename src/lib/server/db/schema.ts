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
	boolean
} from 'drizzle-orm/pg-core';

export const mediaTypeEnum = pgEnum('media_type', ['audio', 'video']);
export const projectSnapshotVersionEnum = pgEnum('project_snapshot_version', ['V1']);

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

export type Session = typeof session.$inferSelect;

export type User = typeof user.$inferSelect;

export type Project = typeof project.$inferSelect;
