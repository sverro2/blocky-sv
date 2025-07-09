import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

// Filecache store

interface MyDB extends DBSchema {
	fileCacheStore: {
		key: string;
		value: CachedMedia;
		indexes: {
			byProjectId: string;
		};
	};
	snapshotStore: {
		key: [string, string];
		value: Snapshot;
		indexes: {
			byProjectId: string;
		};
	};
}

export interface CachedMedia {
	mediaId: string;
	projectId: string;
}

export interface Snapshot {
	snapshotId: string;
	projectId: string;
	version: number;
	data: SnapshotData;
}

export interface SnapshotData {
	blocks: Block[];
}

export interface Block {
	blockId: string;
	media: BlockMedia[];
	currentMediaId: string;
}

export interface BlockMedia {
	mediaId: string;
}

let db_connection: IDBPDatabase<MyDB> | null = null;

async function db(): Promise<IDBPDatabase<MyDB>> {
	if (db_connection === null) {
		console.log('creating indexedDB connection');
		db_connection = await openDB<MyDB>('audiospire', 1.0, {
			upgrade(db, _oldVersion, _newVersion, _transaction, _event) {
				const fileCacheStore = db.createObjectStore('fileCacheStore', {
					keyPath: 'mediaId'
				});
				fileCacheStore.createIndex('byProjectId', 'projectId');

				const snapshotStore = db.createObjectStore('snapshotStore', {
					keyPath: ['snapshotId', 'projectId']
				});
				snapshotStore.createIndex('byProjectId', 'projectId');
			},
			blocked(_currentVersion, _blockedVersion, _event) {
				// …
			},
			blocking(_currentVersion, _blockedVersion, _event) {
				// …
			},
			terminated() {
				// …
			}
		});
	}

	if (db_connection === null) {
		throw 'Could not connect to indexedDB!';
	}

	return db_connection;
}

export async function getAllMediaForProject(projectId: string): Promise<CachedMedia[]> {
	const result = (await db()).getAllFromIndex('fileCacheStore', 'byProjectId', projectId);
	// TODO: make sure media is actually available in OPFS

	return result;
}

export async function getCurrentSnapshot(projectId: string): Promise<Snapshot | undefined> {
	const connection = await db();

	return connection.get('snapshotStore', ['current', projectId]);
}

export async function putSnapshot(snapshot: Snapshot): Promise<void> {
	const connection = await db();

	console.log('putting snapshot!', snapshot);

	await connection.put('snapshotStore', snapshot);
}

export async function addMedia(media: CachedMedia): Promise<void> {
	const database = await db();
	database.put('fileCacheStore', media);
}
