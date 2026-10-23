import { sql } from 'drizzle-orm';
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

// Voir docs/tabilao-architecture-design.md §4.
// Toute modification passe par `npm run db:generate` : une migration publiée
// n'est jamais modifiée.

const now = sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`;

export const appMeta = sqliteTable('app_meta', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});

export const dataTables = sqliteTable('data_tables', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  category: text('category'),
  position: integer('position').notNull().default(0),
  archivedAt: text('archived_at'),
  createdAt: text('created_at').notNull().default(now),
  updatedAt: text('updated_at').notNull().default(now),
});

export const FIELD_TYPES = ['text', 'number', 'money', 'date', 'boolean', 'choice', 'formula', 'reference', 'photo'] as const;
export type FieldType = (typeof FIELD_TYPES)[number];

export const fields = sqliteTable(
  'fields',
  {
    id: text('id').primaryKey(),
    tableId: text('table_id')
      .notNull()
      .references(() => dataTables.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    type: text('type', { enum: FIELD_TYPES }).notNull(),
    required: integer('required', { mode: 'boolean' }).notNull().default(false),
    defaultValue: text('default_value'),
    position: integer('position').notNull().default(0),
    optionsJson: text('options_json'),
    validationJson: text('validation_json'),
    formula: text('formula'),
    refTableId: text('ref_table_id'),
  },
  (t) => [index('idx_fields_table').on(t.tableId, t.position)],
);

export const records = sqliteTable(
  'records',
  {
    id: text('id').primaryKey(),
    tableId: text('table_id')
      .notNull()
      .references(() => dataTables.id, { onDelete: 'cascade' }),
    dataJson: text('data_json').notNull().default('{}'),
    createdAt: text('created_at').notNull().default(now),
    updatedAt: text('updated_at').notNull().default(now),
    deletedAt: text('deleted_at'),
  },
  (t) => [index('idx_records_table').on(t.tableId, t.deletedAt, t.createdAt)],
);

export const attachments = sqliteTable('attachments', {
  id: text('id').primaryKey(),
  recordId: text('record_id')
    .notNull()
    .references(() => records.id, { onDelete: 'cascade' }),
  fieldId: text('field_id').notNull(),
  fileUri: text('file_uri').notNull(),
  createdAt: text('created_at').notNull().default(now),
});

export const rules = sqliteTable('rules', {
  id: text('id').primaryKey(),
  sourceTableId: text('source_table_id')
    .notNull()
    .references(() => dataTables.id, { onDelete: 'cascade' }),
  targetTableId: text('target_table_id').notNull(),
  actionJson: text('action_json').notNull(),
  enabled: integer('enabled', { mode: 'boolean' }).notNull().default(true),
});

export const actionLog = sqliteTable('action_log', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  action: text('action').notNull(),
  entity: text('entity').notNull(),
  entityId: text('entity_id'),
  payloadJson: text('payload_json'),
  createdAt: text('created_at').notNull().default(now),
});

export type DataTable = typeof dataTables.$inferSelect;
export type NewDataTable = typeof dataTables.$inferInsert;
export type Field = typeof fields.$inferSelect;
export type NewField = typeof fields.$inferInsert;
export type RecordRow = typeof records.$inferSelect;
export type Rule = typeof rules.$inferSelect;
export type ActionLogEntry = typeof actionLog.$inferSelect;
