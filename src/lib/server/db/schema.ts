import { pgTable, integer, text, timestamp, uuid, varchar, index } from 'drizzle-orm/pg-core';

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
		name: varchar('name', { length: 32 }),
		description: text('description'),
		userId: text('user_id')
			.notNull()
			.references(() => user.id)
	},
	(table) => [index('project_id_user_id_idx').on(table.id, table.userId)]
);

export type Session = typeof session.$inferSelect;

export type User = typeof user.$inferSelect;

export type Project = typeof project.$inferSelect;
