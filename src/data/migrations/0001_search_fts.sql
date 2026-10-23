-- Recherche plein texte : index FTS5 alimenté par triggers à partir de records.data_json.
CREATE VIRTUAL TABLE `records_fts` USING fts5(record_id UNINDEXED, table_id UNINDEXED, content, tokenize = 'unicode61 remove_diacritics 2');
--> statement-breakpoint
CREATE TRIGGER `records_fts_ai` AFTER INSERT ON `records` BEGIN
  INSERT INTO records_fts(record_id, table_id, content)
  VALUES (NEW.id, NEW.table_id, (SELECT group_concat(value, ' ') FROM json_each(NEW.data_json)));
END;
--> statement-breakpoint
CREATE TRIGGER `records_fts_au` AFTER UPDATE OF `data_json` ON `records` BEGIN
  DELETE FROM records_fts WHERE record_id = OLD.id;
  INSERT INTO records_fts(record_id, table_id, content)
  VALUES (NEW.id, NEW.table_id, (SELECT group_concat(value, ' ') FROM json_each(NEW.data_json)));
END;
--> statement-breakpoint
CREATE TRIGGER `records_fts_ad` AFTER DELETE ON `records` BEGIN
  DELETE FROM records_fts WHERE record_id = OLD.id;
END;
