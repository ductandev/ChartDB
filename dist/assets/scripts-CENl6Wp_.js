import{D as E}from"./theme-provider-Jqc5CFOj.js";import{aw as N,ax as a,ay as o}from"./editor-page-edtufqYh.js";import"./index-CjVg0o4A.js";const C=(_={})=>{const e=_.databaseEdition,n=`
                AND connamespace::regnamespace::text NOT IN ('auth', 'extensions', 'pgsodium', 'realtime', 'storage', 'vault')
    `,s=`
                AND cols.table_schema NOT IN ('auth', 'extensions', 'pgsodium', 'realtime', 'storage', 'vault')
    `,t=`
                AND tbls.table_schema NOT IN ('auth', 'extensions', 'pgsodium', 'realtime', 'storage', 'vault')
    `,A=`
                WHERE schema_name NOT IN ('auth', 'extensions', 'pgsodium', 'realtime', 'storage', 'vault')
    `,L=`
                AND views.schemaname NOT IN ('auth', 'extensions', 'pgsodium', 'realtime', 'storage', 'vault')
    `,c=`
                AND connamespace::regnamespace::text !~ '^(timescaledb_|_timescaledb_)'
    `,i=`${`/* ${e?N[e]:"PostgreSQL"} edition */`}
WITH fk_info${e?"_"+e:""} AS (
    SELECT array_to_string(array_agg(CONCAT('{"schema":"', replace(schema_name, '"', ''), '"',
                                            ',"table":"', replace(table_name::text, '"', ''), '"',
                                            ',"column":"', replace(fk_column::text, '"', ''), '"',
                                            ',"foreign_key_name":"', foreign_key_name, '"',
                                            ',"reference_schema":"', COALESCE(reference_schema, 'public'), '"',
                                            ',"reference_table":"', reference_table, '"',
                                            ',"reference_column":"', reference_column, '"',
                                            ',"fk_def":"', replace(fk_def, '"', ''),
                                            '"}')), ',') as fk_metadata
    FROM (
        SELECT  connamespace::regnamespace::text AS schema_name,
                conname AS foreign_key_name,
                CASE
                    WHEN strpos(conrelid::regclass::text, '.') > 0
                    THEN split_part(conrelid::regclass::text, '.', 2)
                    ELSE conrelid::regclass::text
                END AS table_name,
                (regexp_matches(pg_get_constraintdef(oid), '(?i)FOREIGN KEY \\("?(\\w+)"?\\) REFERENCES (?:"?(\\w+)"?\\.)?"?(\\w+)"?\\("?(\\w+)"?\\)', 'g'))[1] AS fk_column,
                (regexp_matches(pg_get_constraintdef(oid), '(?i)FOREIGN KEY \\("?(\\w+)"?\\) REFERENCES (?:"?(\\w+)"?\\.)?"?(\\w+)"?\\("?(\\w+)"?\\)', 'g'))[2] AS reference_schema,
                (regexp_matches(pg_get_constraintdef(oid), '(?i)FOREIGN KEY \\("?(\\w+)"?\\) REFERENCES (?:"?(\\w+)"?\\.)?"?(\\w+)"?\\("?(\\w+)"?\\)', 'g'))[3] AS reference_table,
                (regexp_matches(pg_get_constraintdef(oid), '(?i)FOREIGN KEY \\("?(\\w+)"?\\) REFERENCES (?:"?(\\w+)"?\\.)?"?(\\w+)"?\\("?(\\w+)"?\\)', 'g'))[4] AS reference_column,
                pg_get_constraintdef(oid) as fk_def
        FROM
            pg_constraint
        WHERE
            contype = 'f'
            AND connamespace::regnamespace::text NOT IN ('information_schema', 'pg_catalog')${e===a.POSTGRESQL_TIMESCALE?c:e===a.POSTGRESQL_SUPABASE?n:""}
    ) AS x
), pk_info AS (
    SELECT array_to_string(array_agg(CONCAT('{"schema":"', replace(schema_name, '"', ''), '"',
                                            ',"table":"', replace(pk_table, '"', ''), '"',
                                            ',"column":"', replace(pk_column, '"', ''), '"',
                                            ',"pk_def":"', replace(pk_def, '"', ''),
                                            '"}')), ',') AS pk_metadata
    FROM (
            SELECT connamespace::regnamespace::text AS schema_name,
                CASE
                    WHEN strpos(conrelid::regclass::text, '.') > 0
                    THEN split_part(conrelid::regclass::text, '.', 2)
                    ELSE conrelid::regclass::text
                END AS pk_table,
                unnest(string_to_array(substring(pg_get_constraintdef(oid) FROM '\\((.*?)\\)'), ',')) AS pk_column,
                pg_get_constraintdef(oid) as pk_def
            FROM
              pg_constraint
            WHERE
              contype = 'p'
              AND connamespace::regnamespace::text NOT IN ('information_schema', 'pg_catalog')${e===a.POSTGRESQL_TIMESCALE?c:e===a.POSTGRESQL_SUPABASE?n:""}
    ) AS y
),
indexes_cols AS (
    SELECT  tnsp.nspname                                                                AS schema_name,
        trel.relname                                                                    AS table_name,
            pg_relation_size('"' || tnsp.nspname || '".' || '"' || irel.relname || '"') AS index_size,
            irel.relname                                                                AS index_name,
            am.amname                                                                   AS index_type,
            a.attname                                                                   AS col_name,
            (CASE WHEN i.indisunique = TRUE THEN 'true' ELSE 'false' END)               AS is_unique,
            irel.reltuples                                                              AS cardinality,
            1 + Array_position(i.indkey, a.attnum)                                      AS column_position,
            CASE o.OPTION & 1 WHEN 1 THEN 'DESC' ELSE 'ASC' END                         AS direction,
            CASE WHEN indpred IS NOT NULL THEN 'true' ELSE 'false' END                  AS is_partial_index
    FROM pg_index AS i
        JOIN pg_class AS trel ON trel.oid = i.indrelid
        JOIN pg_namespace AS tnsp ON trel.relnamespace = tnsp.oid
        JOIN pg_class AS irel ON irel.oid = i.indexrelid
        JOIN pg_am AS am ON irel.relam = am.oid
        CROSS JOIN LATERAL unnest (i.indkey)
        WITH ORDINALITY AS c (colnum, ordinality) LEFT JOIN LATERAL unnest (i.indoption)
        WITH ORDINALITY AS o (option, ordinality)
        ON c.ordinality = o.ordinality JOIN pg_attribute AS a ON trel.oid = a.attrelid AND a.attnum = c.colnum
    WHERE tnsp.nspname NOT LIKE 'pg_%'
    GROUP BY tnsp.nspname, trel.relname, irel.relname, am.amname, i.indisunique, i.indexrelid, irel.reltuples, a.attname, Array_position(i.indkey, a.attnum), o.OPTION, i.indpred
),
cols AS (
    SELECT array_to_string(array_agg(CONCAT('{"schema":"', cols.table_schema,
                                            '","table":"', cols.table_name,
                                            '","name":"', cols.column_name,
                                            '","ordinal_position":"', cols.ordinal_position,
                                            '","type":"', LOWER(replace(cols.data_type, '"', '')),
                                            '","character_maximum_length":"', COALESCE(cols.character_maximum_length::text, 'null'),
                                            '","precision":',
                                                CASE
                                                    WHEN cols.data_type = 'numeric' OR cols.data_type = 'decimal'
                                                    THEN CONCAT('{"precision":', COALESCE(cols.numeric_precision::text, 'null'),
                                                                ',"scale":', COALESCE(cols.numeric_scale::text, 'null'), '}')
                                                    ELSE 'null'
                                                END,
                                            ',"nullable":', CASE WHEN (cols.IS_NULLABLE = 'YES') THEN 'true' ELSE 'false' END,
                                            ',"default":"', COALESCE(replace(replace(cols.column_default, '"', '\\"'), '\\x', '\\\\x'), ''),
                                            '","collation":"', COALESCE(cols.COLLATION_NAME, ''),
                                            '","comment":"', COALESCE(dsc.description, ''), '"}')), ',') AS cols_metadata
    FROM information_schema.columns cols
    LEFT JOIN pg_catalog.pg_class c
        ON c.relname = cols.table_name
    JOIN pg_catalog.pg_namespace n
        ON n.oid = c.relnamespace AND n.nspname = cols.table_schema
    LEFT JOIN pg_catalog.pg_description dsc ON dsc.objoid = c.oid
                                        AND dsc.objsubid = cols.ordinal_position
    WHERE cols.table_schema NOT IN ('information_schema', 'pg_catalog')${e===a.POSTGRESQL_TIMESCALE?`
                AND cols.table_schema !~ '^(timescaledb_|_timescaledb_)'
                AND cols.table_name !~ '^(pg_stat_)'
    `:e===a.POSTGRESQL_SUPABASE?s:""}
), indexes_metadata AS (
    SELECT array_to_string(array_agg(CONCAT('{"schema":"', schema_name,
                                            '","table":"', table_name,
                                            '","name":"', index_name,
                                            '","column":"', replace(col_name :: TEXT, '"', E'"'),
                                            '","index_type":"', index_type,
                                            '","cardinality":', cardinality,
                                            ',"size":', index_size,
                                            ',"unique":', is_unique,
                                            ',"is_partial_index":', is_partial_index,
                                            ',"column_position":', column_position,
                                            ',"direction":"', LOWER(direction),
                                            '"}')), ',') AS indexes_metadata
    FROM indexes_cols x ${e===a.POSTGRESQL_TIMESCALE?`
                WHERE schema_name !~ '^(timescaledb_|_timescaledb_)'
    `:e===a.POSTGRESQL_SUPABASE?A:""}
), tbls AS (
    SELECT array_to_string(array_agg(CONCAT('{',
                        '"schema":"', tbls.TABLE_SCHEMA, '",',
                        '"table":"', tbls.TABLE_NAME, '",',
                        '"rows":', COALESCE((SELECT s.n_live_tup
                                                FROM pg_stat_user_tables s
                                                WHERE tbls.TABLE_SCHEMA = s.schemaname AND tbls.TABLE_NAME = s.relname),
                                                0), ', "type":"', tbls.TABLE_TYPE, '",', '"engine":"",', '"collation":"",',
                        '"comment":"', COALESCE(dsc.description, ''), '"}'
                )),
                ',') AS tbls_metadata
        FROM information_schema.tables tbls
        LEFT JOIN pg_catalog.pg_class c ON c.relname = tbls.TABLE_NAME
        JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
                                            AND n.nspname = tbls.TABLE_SCHEMA
        LEFT JOIN pg_catalog.pg_description dsc ON dsc.objoid = c.oid
                                                AND dsc.objsubid = 0
        WHERE tbls.TABLE_SCHEMA NOT IN ('information_schema', 'pg_catalog') ${e===a.POSTGRESQL_TIMESCALE?`
                AND tbls.table_schema !~ '^(timescaledb_|_timescaledb_)'
                AND tbls.table_name !~ '^(pg_stat_)'
    `:e===a.POSTGRESQL_SUPABASE?t:""}
), config AS (
    SELECT array_to_string(
                      array_agg(CONCAT('{"name":"', conf.name, '","value":"', replace(conf.setting, '"', E'"'), '"}')),
                      ',') AS config_metadata
    FROM pg_settings conf
), views AS (
    SELECT array_to_string(array_agg(CONCAT('{"schema":"', views.schemaname,
                      '","view_name":"', viewname,
                      '","view_definition":"', encode(convert_to(REPLACE(definition, '"', '\\"'), 'UTF8'), 'base64'),
                    '"}')),
                      ',') AS views_metadata
    FROM pg_views views
    WHERE views.schemaname NOT IN ('information_schema', 'pg_catalog') ${e===a.POSTGRESQL_TIMESCALE?`
                AND views.schemaname !~ '^(timescaledb_|_timescaledb_)'
    `:e===a.POSTGRESQL_SUPABASE?L:""}
)
SELECT CONCAT('{    "fk_info": [', COALESCE(fk_metadata, ''),
                    '], "pk_info": [', COALESCE(pk_metadata, ''),
                    '], "columns": [', COALESCE(cols_metadata, ''),
                    '], "indexes": [', COALESCE(indexes_metadata, ''),
                    '], "tables":[', COALESCE(tbls_metadata, ''),
                    '], "views":[', COALESCE(views_metadata, ''),
                    '], "database_name": "', CURRENT_DATABASE(), '', '", "version": "', '',
              '"}') AS metadata_json_to_import
FROM fk_info${e?"_"+e:""}, pk_info, cols, indexes_metadata, tbls, config, views;
    `,l=`# *** Remember to change! (HOST_NAME, PORT, USER_NAME, DATABASE_NAME) *** 
`;return _.databaseClient===o.POSTGRESQL_PSQL?`${l}psql -h HOST_NAME -p PORT -U USER_NAME -d DATABASE_NAME -c "
${i.replace(/"/g,'\\"').replace(/\\\\/g,"\\\\\\").replace(/\\x/g,"\\\\x")}
" -t -A | pbcopy; LG='\\033[0;32m'; NC='\\033[0m'; echo "You got the resultset ($(pbpaste | wc -c | xargs) characters) in Copy/Paste. \${LG}Go back & paste in ChartDB :)\${NC}";`:i},S=(_={})=>_.databaseEdition===a.MYSQL_5_7?`SET SESSION group_concat_max_len = 1000000; -- large enough value to handle your expected result size
SELECT CAST(CONCAT(
    '{"fk_info": [',
    IFNULL((SELECT GROUP_CONCAT(
        CONCAT('{"schema":"', cast(fk.table_schema as CHAR),
               '","table":"', fk.table_name,
               '","column":"', IFNULL(fk.fk_column, ''),
               '","foreign_key_name":"', IFNULL(fk.foreign_key_name, ''),
               '","reference_table":"', IFNULL(fk.reference_table, ''),
               '","reference_schema":"', IFNULL(fk.reference_schema, ''),
               '","reference_column":"', IFNULL(fk.reference_column, ''),
               '","fk_def":"', IFNULL(fk.fk_def, ''), '"}')
    ) FROM (
        SELECT kcu.table_schema,
               kcu.table_name,
               kcu.column_name AS fk_column,
               kcu.constraint_name AS foreign_key_name,
               kcu.referenced_table_schema as reference_schema,
               kcu.referenced_table_name AS reference_table,
               kcu.referenced_column_name AS reference_column,
               CONCAT('FOREIGN KEY (', kcu.column_name, ') REFERENCES ',
                      kcu.referenced_table_name, '(', kcu.referenced_column_name, ') ',
                      'ON UPDATE ', rc.update_rule,
                      ' ON DELETE ', rc.delete_rule) AS fk_def
        FROM information_schema.key_column_usage kcu
        JOIN information_schema.referential_constraints rc
          ON kcu.constraint_name = rc.constraint_name
         AND kcu.table_schema = rc.constraint_schema
         AND kcu.table_name = rc.table_name
        WHERE kcu.referenced_table_name IS NOT NULL
          AND kcu.table_schema = DATABASE()
    ) AS fk), ''),
    '], "pk_info": [',
    IFNULL((SELECT GROUP_CONCAT(
        CONCAT('{"schema":"', cast(pk.TABLE_SCHEMA as CHAR),
               '","table":"', pk.pk_table,
               '","column":"', pk.pk_column,
               '","pk_def":"', IFNULL(pk.pk_def, ''), '"}')
    ) FROM (
        SELECT TABLE_SCHEMA,
               TABLE_NAME AS pk_table,
               COLUMN_NAME AS pk_column,
               (SELECT CONCAT('PRIMARY KEY (', GROUP_CONCAT(inc.COLUMN_NAME ORDER BY inc.ORDINAL_POSITION SEPARATOR ', '), ')')
                               FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE as inc
                               WHERE inc.CONSTRAINT_NAME = 'PRIMARY' and
                                     outc.TABLE_SCHEMA = inc.TABLE_SCHEMA and
                                     outc.TABLE_NAME = inc.TABLE_NAME) AS pk_def
        FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE as outc
        WHERE CONSTRAINT_NAME = 'PRIMARY'
              and table_schema LIKE IFNULL(NULL, '%')
              AND table_schema = DATABASE()
        GROUP BY TABLE_SCHEMA, TABLE_NAME, COLUMN_NAME
    ) AS pk), ''),
    '], "columns": [',
    IFNULL((SELECT GROUP_CONCAT(
        CONCAT('{"schema":"', cast(cols.table_schema as CHAR),
               '","table":"', cols.table_name,
               '","name":"', REPLACE(cols.column_name, '"', '\\"'),
               '","type":"', LOWER(cols.data_type),
               '","character_maximum_length":"', IFNULL(cols.character_maximum_length, 'null'),
               '","precision":',
               IF(cols.data_type IN ('decimal', 'numeric'),
                  CONCAT('{"precision":', IFNULL(cols.numeric_precision, 'null'),
                         ',"scale":', IFNULL(cols.numeric_scale, 'null'), '}'), 'null'),
               ',"ordinal_position":"', cols.ordinal_position,
               '","nullable":', IF(cols.is_nullable = 'YES', 'true', 'false'),
               ',"default":"', IFNULL(REPLACE(REPLACE(cols.column_default, '\\\\', ''), '"', '\\"'), ''),
               '","collation":"', IFNULL(cols.collation_name, ''), '"}')
    ) FROM (
        SELECT cols.table_schema,
               cols.table_name,
               cols.column_name,
               LOWER(cols.data_type) AS data_type,
               cols.character_maximum_length,
               cols.numeric_precision,
               cols.numeric_scale,
               cols.ordinal_position,
               cols.is_nullable,
               cols.column_default,
               cols.collation_name
        FROM information_schema.columns cols
        WHERE cols.table_schema = DATABASE()
    ) AS cols), ''),
    '], "indexes": [',
    IFNULL((SELECT GROUP_CONCAT(
        CONCAT('{"schema":"', cast(idx.table_schema as CHAR),
               '","table":"', idx.table_name,
               '","name":"', idx.index_name,
               '","size":"', IFNULL(
                    (SELECT SUM(stat_value * @@innodb_page_size)
                     FROM mysql.innodb_index_stats
                     WHERE stat_name = 'size'
                       AND index_name != 'PRIMARY'
                       AND index_name = idx.index_name
                       AND TABLE_NAME = idx.table_name
                       AND database_name = idx.table_schema), -1),
               '","column":"', idx.column_name,
               '","index_type":"', LOWER(idx.index_type),
               '","cardinality":', idx.cardinality,
               ',"direction":"', (CASE WHEN idx.collation = 'D' THEN 'desc' ELSE 'asc' END),
               '","column_position":', idx.seq_in_index,
               ',"unique":', IF(idx.non_unique = 1, 'false', 'true'), '}')
    ) FROM (
        SELECT indexes.table_schema,
               indexes.table_name,
               indexes.index_name,
               indexes.column_name,
               LOWER(indexes.index_type) AS index_type,
               indexes.cardinality,
               indexes.collation,
               indexes.non_unique,
               indexes.seq_in_index
        FROM information_schema.statistics indexes
        WHERE indexes.table_schema = DATABASE()
    ) AS idx), ''),
    '], "tables":[',
    IFNULL((SELECT GROUP_CONCAT(
        CONCAT('{"schema":"', cast(tbls.TABLE_SCHEMA as CHAR),
               '","table":"', tbls.TABLE_NAME,
               '","rows":', IFNULL(tbls.TABLE_ROWS, 0),
               ',"type":"', IFNULL(tbls.TABLE_TYPE, ''),
               '","engine":"', IFNULL(tbls.ENGINE, ''),
               '","collation":"', IFNULL(tbls.TABLE_COLLATION, ''), '"}')
    ) FROM (
        SELECT \`TABLE_SCHEMA\`,
               \`TABLE_NAME\`,
               \`TABLE_ROWS\`,
               \`TABLE_TYPE\`,
               \`ENGINE\`,
               \`TABLE_COLLATION\`
        FROM information_schema.tables tbls
        WHERE tbls.table_schema = DATABASE()
    ) AS tbls), ''),
    '], "views":[',
    IFNULL((SELECT GROUP_CONCAT(
        CONCAT('{"schema":"', cast(vws.TABLE_SCHEMA as CHAR),
               '","view_name":"', vws.view_name,
               '","view_definition":"', view_definition, '"}')
    ) FROM (
        SELECT \`TABLE_SCHEMA\`,
               \`TABLE_NAME\` AS view_name,
               REPLACE(REPLACE(TO_BASE64(\`VIEW_DEFINITION\`), ' ', ''), '
', '') AS view_definition
        FROM information_schema.views vws
        WHERE vws.table_schema = DATABASE()
    ) AS vws), ''),
    '], "database_name": "', DATABASE(),
    '", "version": "', VERSION(), '"}') AS CHAR) AS metadata_json_to_import
`:`WITH fk_info as (
(SELECT (@fk_info:=NULL),
    (SELECT (0)
    FROM (SELECT kcu.table_schema,
        kcu.table_name,
        kcu.column_name as fk_column,
        kcu.constraint_name as foreign_key_name,
        kcu.referenced_table_schema as reference_schema,
        kcu.referenced_table_name as reference_table,
        kcu.referenced_column_name as reference_column,
        CONCAT('FOREIGN KEY (', kcu.column_name, ') REFERENCES ',
            kcu.referenced_table_name, '(', kcu.referenced_column_name, ') ',
            'ON UPDATE ', rc.update_rule,
            ' ON DELETE ', rc.delete_rule) AS fk_def
    FROM
        information_schema.key_column_usage kcu
    JOIN
        information_schema.referential_constraints rc
        ON kcu.constraint_name = rc.constraint_name
            AND kcu.table_schema = rc.constraint_schema
        AND kcu.table_name = rc.table_name
    WHERE
        kcu.referenced_table_name IS NOT NULL) as fk
    WHERE table_schema LIKE IFNULL(NULL, '%')
        AND table_schema = DATABASE()
        AND (0x00) IN (@fk_info:=CONCAT_WS(',', @fk_info, CONCAT('{"schema":"',table_schema,
                                    '","table":"',table_name,
                                    '","column":"', IFNULL(fk_column, ''),
                                                '","foreign_key_name":"', IFNULL(foreign_key_name, ''),
                                                '","reference_schema":"', IFNULL(reference_schema, ''),
                                                '","reference_table":"', IFNULL(reference_table, ''),
                                                '","reference_column":"', IFNULL(reference_column, ''),
                                                '","fk_def":"', IFNULL(fk_def, ''),
                                    '"}')))))
), pk_info AS (
    (SELECT (@pk_info:=NULL),
              (SELECT (0)
               FROM (SELECT TABLE_SCHEMA,
                            TABLE_NAME AS pk_table,
                            COLUMN_NAME AS pk_column,
                            (SELECT CONCAT('PRIMARY KEY (', GROUP_CONCAT(inc.COLUMN_NAME ORDER BY inc.ORDINAL_POSITION SEPARATOR ', '), ')')
                               FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE as inc
                               WHERE inc.CONSTRAINT_NAME = 'PRIMARY' and
                                     outc.TABLE_SCHEMA = inc.TABLE_SCHEMA and
                             		 outc.TABLE_NAME = inc.TABLE_NAME) AS pk_def
                       FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE as outc
                       WHERE CONSTRAINT_NAME = 'PRIMARY'
                       GROUP BY TABLE_SCHEMA, TABLE_NAME, COLUMN_NAME
                       ORDER BY TABLE_SCHEMA, TABLE_NAME, MIN(ORDINAL_POSITION)) AS pk
               WHERE table_schema LIKE IFNULL(NULL, '%')
               AND table_schema = DATABASE()
               AND (0x00) IN (@pk_info:=CONCAT_WS(',', @pk_info, CONCAT('{"schema":"', table_schema,
                                                                        '","table":"', pk_table,
                                                                        '","column":"', pk_column,
                                                                        '","pk_def":"', IFNULL(pk_def, ''),
                                                                        '"}')))))
), cols as
(
  (SELECT (@cols := NULL),
        (SELECT (0)
         FROM information_schema.columns cols
         WHERE cols.table_schema LIKE IFNULL(NULL, '%')
           AND cols.table_schema = DATABASE()
           AND (0x00) IN (@cols := CONCAT_WS(',', @cols, CONCAT(
                '{"schema":"', cols.table_schema,
                '","table":"', cols.table_name,
                '","name":"', REPLACE(cols.column_name, '"', '\\"'),
                '","type":"', LOWER(cols.data_type),
                '","character_maximum_length":"', IFNULL(cols.character_maximum_length, 'null'),
                '","precision":',
                    CASE
                        WHEN cols.data_type IN ('decimal', 'numeric')
                        THEN CONCAT('{"precision":', IFNULL(cols.numeric_precision, 'null'),
                                    ',"scale":', IFNULL(cols.numeric_scale, 'null'), '}')
                        ELSE 'null'
                    END,
                ',"ordinal_position":"', cols.ordinal_position,
                '","nullable":', IF(cols.is_nullable = 'YES', 'true', 'false'),
                ',"default":"', IFNULL(REPLACE(REPLACE(cols.column_default, '\\\\', ''), '"', 'ֿֿֿ\\"'), ''),
                '","collation":"', IFNULL(cols.collation_name, ''), '"}'
            )))))
), indexes as (
  (SELECT (@indexes:=NULL),
                (SELECT (0)
                 FROM information_schema.statistics indexes
                 WHERE table_schema LIKE IFNULL(NULL, '%')
                     AND table_schema = DATABASE()
                     AND (0x00) IN  (@indexes:=CONCAT_WS(',', @indexes, CONCAT('{"schema":"',indexes.table_schema,
                                         '","table":"',indexes.table_name,
                                         '","name":"', indexes.index_name,
                                         '","size":"',
                                                                      (SELECT IFNULL(SUM(stat_value * @@innodb_page_size), -1) AS size_in_bytes
                                                                       FROM mysql.innodb_index_stats
                                                                       WHERE stat_name = 'size'
                                                                           AND index_name != 'PRIMARY'
                                                                           AND index_name = indexes.index_name
                                                                           AND TABLE_NAME = indexes.table_name
                                                                           AND database_name = indexes.table_schema),
                                                                  '","column":"', indexes.column_name,
                                                      '","index_type":"', LOWER(indexes.index_type),
                                                      '","cardinality":', indexes.cardinality,
                                                      ',"direction":"', (CASE WHEN indexes.collation = 'D' THEN 'desc' ELSE 'asc' END),
                                                      '","column_position":', indexes.seq_in_index,
                                                      ',"unique":', IF(indexes.non_unique = 1, 'false', 'true'), '}')))))
), tbls as
(
  (SELECT (@tbls:=NULL),
              (SELECT (0)
               FROM information_schema.tables tbls
               WHERE table_schema LIKE IFNULL(NULL, '%')
                   AND table_schema = DATABASE()
                   AND (0x00) IN (@tbls:=CONCAT_WS(',', @tbls, CONCAT('{', '"schema":"', \`TABLE_SCHEMA\`, '",',
                                               '"table":"', \`TABLE_NAME\`, '",',
                                             '"rows":', IFNULL(\`TABLE_ROWS\`, 0),
                                             ', "type":"', IFNULL(\`TABLE_TYPE\`, ''), '",',
                                             '"engine":"', IFNULL(\`ENGINE\`, ''), '",',
                                             '"collation":"', IFNULL(\`TABLE_COLLATION\`, ''), '"}')))))
), views as (
(SELECT (@views:=NULL),
              (SELECT (0)
               FROM information_schema.views views
               WHERE table_schema LIKE IFNULL(NULL, '%')
                   AND table_schema = DATABASE()
                   AND (0x00) IN (@views:=CONCAT_WS(',', @views, CONCAT('{', '"schema":"', \`TABLE_SCHEMA\`, '",',
                                                   '"view_name":"', \`TABLE_NAME\`, '",',
                                                   '"view_definition":"', REPLACE(REPLACE(TO_BASE64(VIEW_DEFINITION), ' ', ''), '
', ''), '"}'))) ) )
)
(SELECT CAST(CONCAT('{"fk_info": [',IFNULL(@fk_info,''),
                '], "pk_info": [', IFNULL(@pk_info, ''),
            '], "columns": [',IFNULL(@cols,''),
            '], "indexes": [',IFNULL(@indexes,''),
            '], "tables":[',IFNULL(@tbls,''),
            '], "views":[',IFNULL(@views,''),
            '], "database_name": "', DATABASE(),
            '", "version": "', VERSION(), '"}') AS CHAR) AS metadata_json_to_import
 FROM fk_info, pk_info, cols, indexes, tbls, views);
`,m=`WITH fk_info AS (
  SELECT
      json_group_array(
          json_object(
              'schema', '',  -- SQLite does not have schemas
              'table', m.name,
              'column', fk."from",
              'foreign_key_name',
                  'fk_' || m.name || '_' || fk."from" || '_' || fk."table" || '_' || fk."to",  -- Generated foreign key name
              'reference_schema', '', -- SQLite does not have schemas
              'reference_table', fk."table",
              'reference_column', fk."to",
              'fk_def',
                  'FOREIGN KEY (' || fk."from" || ') REFERENCES ' || fk."table" || '(' || fk."to" || ')' ||
                  ' ON UPDATE ' || fk.on_update || ' ON DELETE ' || fk.on_delete
          )
      ) AS fk_metadata
  FROM
      sqlite_master m
  JOIN
      pragma_foreign_key_list(m.name) fk
  ON
      m.type = 'table'
), pk_info AS (
  SELECT
      json_group_array(
          json_object(
              'schema', '',  -- SQLite does not have schemas
              'table', pk.table_name,
              'field_count', pk.field_count,
              'column', pk.pk_column,
              'pk_def', 'PRIMARY KEY (' || pk.pk_column || ')'
          )
      ) AS pk_metadata
  FROM
  (
      SELECT
          m.name AS table_name,
          COUNT(p.name) AS field_count,  -- Count of primary key columns
          GROUP_CONCAT(p.name) AS pk_column  -- Concatenated list of primary key columns
      FROM
          sqlite_master m
      JOIN
          pragma_table_info(m.name) p
      ON
          m.type = 'table' AND p.pk > 0
      GROUP BY
          m.name
  ) pk
), indexes_metadata AS (
  SELECT
      json_group_array(
          json_object(
              'schema', '',  -- SQLite does not have schemas
              'table', m.name,
              'name', idx.name,
              'column', ic.name,
              'index_type', 'B-TREE',  -- SQLite uses B-Trees for indexing
              'cardinality', '',  -- SQLite does not provide cardinality
              'size', '',  -- SQLite does not provide index size
              'unique', (CASE WHEN idx."unique" = 1 THEN 'true' ELSE 'false' END),
              'direction', '',  -- SQLite does not provide direction info
              'column_position', ic.seqno + 1  -- Adding 1 to convert from zero-based to one-based index
          )
      ) AS indexes_metadata
  FROM
      sqlite_master m
  JOIN
      pragma_index_list(m.name) idx
  ON
      m.type = 'table'
  JOIN
      pragma_index_info(idx.name) ic
), cols AS (
  SELECT
      json_group_array(
          json_object(
              'schema', '',  -- SQLite does not have schemas
              'table', m.name,
              'name', p.name,
              'type',
                  CASE
                      WHEN INSTR(LOWER(p.type), '(') > 0 THEN
                          SUBSTR(LOWER(p.type), 1, INSTR(LOWER(p.type), '(') - 1)
                      ELSE LOWER(p.type)
                  END,
              'ordinal_position', p.cid,
              'nullable', (CASE WHEN p."notnull" = 0 THEN 'true' ELSE 'false' END),
              'collation', '',
              'character_maximum_length',
                  CASE
                      WHEN LOWER(p.type) LIKE 'char%' OR LOWER(p.type) LIKE 'varchar%' THEN
                          CASE
                              WHEN INSTR(p.type, '(') > 0 THEN
                                  REPLACE(SUBSTR(p.type, INSTR(p.type, '(') + 1, LENGTH(p.type) - INSTR(p.type, '(') - 1), ')', '')
                              ELSE 'null'
                          END
                      ELSE 'null'
                  END,
              'precision',
              CASE
                  WHEN LOWER(p.type) LIKE 'decimal%' OR LOWER(p.type) LIKE 'numeric%' THEN
                      CASE
                          WHEN instr(p.type, '(') > 0 THEN
                              json_object(
                                  'precision', substr(p.type, instr(p.type, '(') + 1, instr(p.type, ',') - instr(p.type, '(') - 1),
                                  'scale', substr(p.type, instr(p.type, ',') + 1, instr(p.type, ')') - instr(p.type, ',') - 1)
                              )
                          ELSE 'null'
                      END
                  ELSE 'null'
              END,
              'default', COALESCE(REPLACE(p.dflt_value, '"', '\\"'), '')
          )
      ) AS cols_metadata
  FROM
      sqlite_master m
  JOIN
      pragma_table_info(m.name) p
  ON
      m.type in ('table', 'view')
), tbls AS (
  SELECT
      json_group_array(
          json_object(
              'schema', '',  -- SQLite does not have schemas
              'table', m.name,
              'rows', -1,
              'type', 'table',
              'engine', '',  -- SQLite does not use storage engines
              'collation', ''  -- Collation information is not available
          )
      ) AS tbls_metadata
  FROM
      sqlite_master m
  WHERE
      m.type in ('table', 'view')
), views AS (
  SELECT
      json_group_array(
          json_object(
              'schema', '',
              'view_name', m.name
          )
      ) AS views_metadata
  FROM
      sqlite_master m
  WHERE
      m.type = 'view'
)
SELECT
replace(replace(replace(
      json_object(
          'fk_info', (SELECT fk_metadata FROM fk_info),
          'pk_info', (SELECT pk_metadata FROM pk_info),
          'columns', (SELECT cols_metadata FROM cols),
          'indexes', (SELECT indexes_metadata FROM indexes_metadata),
          'tables', (SELECT tbls_metadata FROM tbls),
          'views', (SELECT views_metadata FROM views),
          'database_name', 'sqlite',
          'version', sqlite_version()
      ),
      '\\"', '"'),'"[', '['), ']"', ']'
) AS metadata_json_to_import;
`,r=`WITH fk_info AS (
    SELECT
        JSON_QUERY(
            '[' + STRING_AGG(
                CONVERT(nvarchar(max),
                JSON_QUERY(N'{"schema": "' + COALESCE(REPLACE(kcu.CONSTRAINT_SCHEMA, '"', ''), '') COLLATE SQL_Latin1_General_CP1_CI_AS +
                            '", "table": "' + COALESCE(REPLACE(kcu.TABLE_NAME, '"', ''), '') COLLATE SQL_Latin1_General_CP1_CI_AS +
                            '", "column": "' + COALESCE(REPLACE(kcu.COLUMN_NAME, '"', ''), '') COLLATE SQL_Latin1_General_CP1_CI_AS +
                            '", "foreign_key_name": "' + COALESCE(REPLACE(kcu.CONSTRAINT_NAME, '"', ''), '') COLLATE SQL_Latin1_General_CP1_CI_AS +
                            '", "reference_schema": "' + COALESCE(REPLACE(rcu.CONSTRAINT_SCHEMA, '"', ''), '') COLLATE SQL_Latin1_General_CP1_CI_AS +
                            '", "reference_table": "' + COALESCE(REPLACE(rcu.TABLE_NAME, '"', ''), '') COLLATE SQL_Latin1_General_CP1_CI_AS +
                            '", "reference_column": "' + COALESCE(REPLACE(rcu.COLUMN_NAME, '"', ''), '') COLLATE SQL_Latin1_General_CP1_CI_AS +
                            '", "fk_def": "FOREIGN KEY (' + COALESCE(REPLACE(kcu.COLUMN_NAME, '"', ''), '') COLLATE SQL_Latin1_General_CP1_CI_AS +
                            ') REFERENCES ' + COALESCE(REPLACE(rcu.TABLE_NAME, '"', ''), '') COLLATE SQL_Latin1_General_CP1_CI_AS +
                            '(' + COALESCE(REPLACE(rcu.COLUMN_NAME, '"', ''), '') COLLATE SQL_Latin1_General_CP1_CI_AS +
                            ') ON DELETE ' + rc.DELETE_RULE COLLATE SQL_Latin1_General_CP1_CI_AS +
                            ' ON UPDATE ' + rc.UPDATE_RULE COLLATE SQL_Latin1_General_CP1_CI_AS + '"}')
                ), ','
            ) + N']'
        ) AS all_fks_json
    FROM
        INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu
    JOIN
        INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS rc
        ON kcu.CONSTRAINT_NAME = rc.CONSTRAINT_NAME
        AND kcu.CONSTRAINT_SCHEMA = rc.CONSTRAINT_SCHEMA
    JOIN
        INFORMATION_SCHEMA.KEY_COLUMN_USAGE rcu
        ON rcu.CONSTRAINT_NAME = rc.UNIQUE_CONSTRAINT_NAME
        AND rcu.CONSTRAINT_SCHEMA = rc.UNIQUE_CONSTRAINT_SCHEMA
        AND rcu.ORDINAL_POSITION = kcu.ORDINAL_POSITION
), pk_info AS (
    SELECT
        JSON_QUERY(
            '[' + STRING_AGG(
                CONVERT(nvarchar(max),
                JSON_QUERY(N'{"schema": "' + COALESCE(REPLACE(pk.TABLE_SCHEMA, '"', ''), '') COLLATE SQL_Latin1_General_CP1_CI_AS +
                '", "table": "' + COALESCE(REPLACE(pk.TABLE_NAME, '"', ''), '') COLLATE SQL_Latin1_General_CP1_CI_AS +
                '", "column": "' + COALESCE(REPLACE(pk.COLUMN_NAME, '"', ''), '') COLLATE SQL_Latin1_General_CP1_CI_AS +
                '", "pk_def": "PRIMARY KEY (' + pk.COLUMN_NAME COLLATE SQL_Latin1_General_CP1_CI_AS + ')"}')
                ), ','
            ) + N']'
        ) AS all_pks_json
    FROM
        (
            SELECT
                kcu.TABLE_SCHEMA,
                kcu.TABLE_NAME,
                kcu.COLUMN_NAME
            FROM
                INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu
            JOIN
                INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
                ON kcu.CONSTRAINT_NAME = tc.CONSTRAINT_NAME
                AND kcu.CONSTRAINT_SCHEMA = tc.CONSTRAINT_SCHEMA
            WHERE
                tc.CONSTRAINT_TYPE = 'PRIMARY KEY'
        ) pk
),
cols AS (
    SELECT
        JSON_QUERY(
            '[' + STRING_AGG(
                CONVERT(nvarchar(max),
                JSON_QUERY('{"schema": "' + COALESCE(REPLACE(cols.TABLE_SCHEMA, '"', ''), '') +
                '", "table": "' + COALESCE(REPLACE(cols.TABLE_NAME, '"', ''), '') +
                '", "name": "' + COALESCE(REPLACE(cols.COLUMN_NAME, '"', ''), '') +
                '", "ordinal_position": "' + CAST(cols.ORDINAL_POSITION AS NVARCHAR(MAX)) +
                '", "type": "' + LOWER(cols.DATA_TYPE) +
                '", "character_maximum_length": "' +
                    COALESCE(CAST(cols.CHARACTER_MAXIMUM_LENGTH AS NVARCHAR(MAX)), 'null') +
                '", "precision": ' +
                    CASE
                        WHEN cols.DATA_TYPE IN ('numeric', 'decimal') THEN
                            CONCAT('{"precision":', COALESCE(CAST(cols.NUMERIC_PRECISION AS NVARCHAR(MAX)), 'null'),
                            ',"scale":', COALESCE(CAST(cols.NUMERIC_SCALE AS NVARCHAR(MAX)), 'null'), '}')
                        ELSE
                            'null'
                    END +
                ', "nullable": "' +
                    CASE WHEN cols.IS_NULLABLE = 'YES' THEN 'true' ELSE 'false' END +
                '", "default": "' +
                    COALESCE(REPLACE(CAST(cols.COLUMN_DEFAULT AS NVARCHAR(MAX)), '"', '\\"'), '') +
                '", "collation": "' +
                    COALESCE(cols.COLLATION_NAME, '') +
                '"}')
                ), ','
            ) + ']'
        ) AS all_columns_json
    FROM
        INFORMATION_SCHEMA.COLUMNS cols
    WHERE
        cols.TABLE_CATALOG = DB_NAME()
),
indexes AS (
    SELECT
        '[' + STRING_AGG(
            CONVERT(nvarchar(max),
            JSON_QUERY(
                N'{"schema": "' + COALESCE(REPLACE(s.name, '"', ''), '') COLLATE SQL_Latin1_General_CP1_CI_AS +
                '", "table": "' + COALESCE(REPLACE(t.name, '"', ''), '') COLLATE SQL_Latin1_General_CP1_CI_AS +
                '", "index_name": "' + COALESCE(REPLACE(i.name, '"', ''), '') COLLATE SQL_Latin1_General_CP1_CI_AS +
                '", "column_name": "' + COALESCE(REPLACE(c.name, '"', ''), '') COLLATE SQL_Latin1_General_CP1_CI_AS +
                '", "index_type": "' + LOWER(i.type_desc) COLLATE SQL_Latin1_General_CP1_CI_AS +
                '", "is_unique": ' + CASE WHEN i.is_unique = 1 THEN 'true' ELSE 'false' END +
                ', "direction": "' + CASE WHEN ic.is_descending_key = 1 THEN 'desc' ELSE 'asc' END COLLATE SQL_Latin1_General_CP1_CI_AS +
                '", "column_position": ' + CAST(ic.key_ordinal AS nvarchar(max)) + N'}'
            )
            ), ','
        ) + N']' AS all_indexes_json
    FROM
        sys.indexes i
    JOIN
        sys.tables t ON i.object_id = t.object_id
    JOIN
        sys.schemas s ON t.schema_id = s.schema_id
    JOIN
        sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
    JOIN
        sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
    WHERE
        s.name LIKE '%'
        AND i.name IS NOT NULL
),
tbls AS (
    SELECT
        '[' + STRING_AGG(
            CONVERT(nvarchar(max),
            JSON_QUERY(
                N'{"schema": "' + COALESCE(REPLACE(aggregated.schema_name, '"', ''), '') COLLATE SQL_Latin1_General_CP1_CI_AS +
                '", "table": "' + COALESCE(REPLACE(aggregated.table_name, '"', ''), '') COLLATE SQL_Latin1_General_CP1_CI_AS +
                '", "row_count": "' + CAST(aggregated.row_count AS NVARCHAR(MAX)) +
                '", "table_type": "' + aggregated.table_type COLLATE SQL_Latin1_General_CP1_CI_AS +
                '", "creation_date": "' + CONVERT(NVARCHAR(MAX), aggregated.creation_date, 120) + '"}'
            )
            ), ','
        ) + N']' AS all_tables_json
    FROM
        (
            -- Select from tables
            SELECT
                COALESCE(REPLACE(s.name, '"', ''), '') AS schema_name,
                COALESCE(REPLACE(t.name, '"', ''), '') AS table_name,
                SUM(p.rows) AS row_count,
                t.type_desc AS table_type,
                t.create_date AS creation_date
            FROM
                sys.tables t
            JOIN
                sys.schemas s ON t.schema_id = s.schema_id
            JOIN
                sys.partitions p ON t.object_id = p.object_id AND p.index_id IN (0, 1)
            WHERE
                s.name LIKE '%'
            GROUP BY
                s.name, t.name, t.type_desc, t.create_date

            UNION ALL

            -- Select from views
            SELECT
                COALESCE(REPLACE(s.name, '"', ''), '') AS table_name,
                COALESCE(REPLACE(v.name, '"', ''), '') AS object_name,
                0 AS row_count,  -- Views don't have row counts
                'VIEW' AS table_type,
                v.create_date AS creation_date
            FROM
                sys.views v
            JOIN
                sys.schemas s ON v.schema_id = s.schema_id
            WHERE
                s.name LIKE '%'
        ) AS aggregated
),
views AS (
    SELECT
        '[' + STRING_AGG(
            CONVERT(nvarchar(max),
            JSON_QUERY(
                N'{"schema": "' + STRING_ESCAPE(COALESCE(s.name, ''), 'json') +
                '", "view_name": "' + STRING_ESCAPE(COALESCE(v.name, ''), 'json') +
                '", "view_definition": "' +
                STRING_ESCAPE(
                    CAST(
                        '' AS XML
                    ).value(
                        'xs:base64Binary(sql:column("DefinitionBinary"))',
                        'VARCHAR(MAX)'
                    ), 'json') +
                '"}'
            )
            ), ','
        ) + N']' AS all_views_json
    FROM
        sys.views v
    JOIN
        sys.schemas s ON v.schema_id = s.schema_id
    JOIN
        sys.sql_modules m ON v.object_id = m.object_id
    CROSS APPLY
        (SELECT CONVERT(VARBINARY(MAX), m.definition) AS DefinitionBinary) AS bin
    WHERE
        s.name LIKE '%'
)
SELECT JSON_QUERY(
        N'{"fk_info": ' + ISNULL((SELECT cast(all_fks_json as nvarchar(max)) FROM fk_info), N'[]') +
        ', "pk_info": ' + ISNULL((SELECT cast(all_pks_json as nvarchar(max)) FROM pk_info), N'[]') +
        ', "columns": ' + ISNULL((SELECT cast(all_columns_json as nvarchar(max)) FROM cols), N'[]') +
        ', "indexes": ' + ISNULL((SELECT cast(all_indexes_json as nvarchar(max)) FROM indexes), N'[]') +
        ', "tables": ' + ISNULL((SELECT cast(all_tables_json as nvarchar(max)) FROM tbls), N'[]') +
        ', "views": ' + ISNULL((SELECT cast(all_views_json as nvarchar(max)) FROM views), N'[]') +
        ', "database_name": "' + DB_NAME() + '"' +
        ', "version": ""}'
) AS metadata_json_to_import;
`,O=`WITH fk_info AS (
    SELECT
        JSON_QUERY(
            '[' + ISNULL(
                STUFF((
                    SELECT ',' +
                        CONVERT(nvarchar(max),
                        JSON_QUERY(N'{"schema": "' + COALESCE(REPLACE(kcu.CONSTRAINT_SCHEMA, '"', ''), '') COLLATE SQL_Latin1_General_CP1_CI_AS +
                                    '", "table": "' + COALESCE(REPLACE(kcu.TABLE_NAME, '"', ''), '') COLLATE SQL_Latin1_General_CP1_CI_AS +
                                    '", "column": "' + COALESCE(REPLACE(kcu.COLUMN_NAME, '"', ''), '') COLLATE SQL_Latin1_General_CP1_CI_AS +
                                    '", "foreign_key_name": "' + COALESCE(REPLACE(kcu.CONSTRAINT_NAME, '"', ''), '') COLLATE SQL_Latin1_General_CP1_CI_AS +
                                    '", "reference_schema": "' + COALESCE(REPLACE(rcu.CONSTRAINT_SCHEMA, '"', ''), '') COLLATE SQL_Latin1_General_CP1_CI_AS +
                                    '", "reference_table": "' + COALESCE(REPLACE(rcu.TABLE_NAME, '"', ''), '') COLLATE SQL_Latin1_General_CP1_CI_AS +
                                    '", "reference_column": "' + COALESCE(REPLACE(rcu.COLUMN_NAME, '"', ''), '') COLLATE SQL_Latin1_General_CP1_CI_AS +
                                    '", "fk_def": "FOREIGN KEY (' + COALESCE(REPLACE(kcu.COLUMN_NAME, '"', ''), '') COLLATE SQL_Latin1_General_CP1_CI_AS +
                                    ') REFERENCES ' + COALESCE(REPLACE(rcu.TABLE_NAME, '"', ''), '') COLLATE SQL_Latin1_General_CP1_CI_AS +
                                    '(' + COALESCE(REPLACE(rcu.COLUMN_NAME, '"', ''), '') COLLATE SQL_Latin1_General_CP1_CI_AS +
                                    ') ON DELETE ' + rc.DELETE_RULE COLLATE SQL_Latin1_General_CP1_CI_AS +
                                    ' ON UPDATE ' + rc.UPDATE_RULE COLLATE SQL_Latin1_General_CP1_CI_AS + '"}')
                        )
                    FROM
                        INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu
                    JOIN
                        INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS rc
                        ON kcu.CONSTRAINT_NAME = rc.CONSTRAINT_NAME
                        AND kcu.CONSTRAINT_SCHEMA = rc.CONSTRAINT_SCHEMA
                    JOIN
                        INFORMATION_SCHEMA.KEY_COLUMN_USAGE rcu
                        ON rcu.CONSTRAINT_NAME = rc.UNIQUE_CONSTRAINT_NAME
                        AND rcu.CONSTRAINT_SCHEMA = rc.UNIQUE_CONSTRAINT_SCHEMA
                        AND rcu.ORDINAL_POSITION = kcu.ORDINAL_POSITION
                    FOR XML PATH('')
                ), 1, 1, ''), '')
            + N']'
        ) AS all_fks_json
),
pk_info AS (
    SELECT
        JSON_QUERY(
            '[' + ISNULL(
                STUFF((
                    SELECT ',' +
                        CONVERT(nvarchar(max),
                        JSON_QUERY(N'{"schema": "' + COALESCE(REPLACE(pk.TABLE_SCHEMA, '"', ''), '') COLLATE SQL_Latin1_General_CP1_CI_AS +
                                    '", "table": "' + COALESCE(REPLACE(pk.TABLE_NAME, '"', ''), '') COLLATE SQL_Latin1_General_CP1_CI_AS +
                                    '", "column": "' + COALESCE(REPLACE(pk.COLUMN_NAME, '"', ''), '') COLLATE SQL_Latin1_General_CP1_CI_AS +
                                    '", "pk_def": "PRIMARY KEY (' + pk.COLUMN_NAME COLLATE SQL_Latin1_General_CP1_CI_AS + ')"}')
                        )
                    FROM
                        (
                            SELECT
                                kcu.TABLE_SCHEMA,
                                kcu.TABLE_NAME,
                                kcu.COLUMN_NAME
                            FROM
                                INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu
                            JOIN
                                INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
                                ON kcu.CONSTRAINT_NAME = tc.CONSTRAINT_NAME
                                AND kcu.CONSTRAINT_SCHEMA = tc.CONSTRAINT_SCHEMA
                            WHERE
                                tc.CONSTRAINT_TYPE = 'PRIMARY KEY'
                        ) pk
                    FOR XML PATH('')
                ), 1, 1, ''), '')
            + N']'
        ) AS all_pks_json
),
cols AS (
    SELECT
        JSON_QUERY(
            '[' + ISNULL(
                STUFF((
                    SELECT ',' +
                        CONVERT(nvarchar(max),
                        JSON_QUERY('{"schema": "' + COALESCE(REPLACE(cols.TABLE_SCHEMA, '"', ''), '') +
                                    '", "table": "' + COALESCE(REPLACE(cols.TABLE_NAME, '"', ''), '') +
                                    '", "name": "' + COALESCE(REPLACE(cols.COLUMN_NAME, '"', ''), '') +
                                    '", "ordinal_position": "' + CAST(cols.ORDINAL_POSITION AS NVARCHAR(MAX)) +
                                    '", "type": "' + LOWER(cols.DATA_TYPE) +
                                    '", "character_maximum_length": "' +
                                        COALESCE(CAST(cols.CHARACTER_MAXIMUM_LENGTH AS NVARCHAR(MAX)), 'null') +
                                    '", "precision": ' +
                                        CASE
                                            WHEN cols.DATA_TYPE IN ('numeric', 'decimal') THEN
                                                CONCAT('{"precision":', COALESCE(CAST(cols.NUMERIC_PRECISION AS NVARCHAR(MAX)), 'null'),
                                                ',"scale":', COALESCE(CAST(cols.NUMERIC_SCALE AS NVARCHAR(MAX)), 'null'), '}')
                                            ELSE
                                                'null'
                                        END +
                                    ', "nullable": "' +
                                        CASE WHEN cols.IS_NULLABLE = 'YES' THEN 'true' ELSE 'false' END +
                                    '", "default": "' +
                                        COALESCE(REPLACE(CAST(cols.COLUMN_DEFAULT AS NVARCHAR(MAX)), '"', '"'), '') +
                                    '", "collation": "' +
                                        COALESCE(cols.COLLATION_NAME, '') +
                                    '"}')
                        )
                    FROM
                        INFORMATION_SCHEMA.COLUMNS cols
                    WHERE
                        cols.TABLE_CATALOG = DB_NAME()
                    FOR XML PATH('')
                ), 1, 1, ''), '')
            + ']'
        ) AS all_columns_json
),
indexes AS (
    SELECT
        '[' + ISNULL(
            STUFF((
                SELECT ',' +
                    CONVERT(nvarchar(max),
                    JSON_QUERY(
                        N'{"schema": "' + COALESCE(REPLACE(s.name, '"', ''), '') COLLATE SQL_Latin1_General_CP1_CI_AS +
                        '", "table": "' + COALESCE(REPLACE(t.name, '"', ''), '') COLLATE SQL_Latin1_General_CP1_CI_AS +
                        '", "index_name": "' + COALESCE(REPLACE(i.name, '"', ''), '') COLLATE SQL_Latin1_General_CP1_CI_AS +
                        '", "column_name": "' + COALESCE(REPLACE(c.name, '"', ''), '') COLLATE SQL_Latin1_General_CP1_CI_AS +
                        '", "index_type": "' + LOWER(i.type_desc) COLLATE SQL_Latin1_General_CP1_CI_AS +
                        '", "is_unique": ' + CASE WHEN i.is_unique = 1 THEN 'true' ELSE 'false' END +
                        ', "direction": "' + CASE WHEN ic.is_descending_key = 1 THEN 'desc' ELSE 'asc' END COLLATE SQL_Latin1_General_CP1_CI_AS +
                        '", "column_position": ' + CAST(ic.key_ordinal AS nvarchar(max)) + N'}'
                    )
                )
                FROM
                    sys.indexes i
                JOIN
                    sys.tables t ON i.object_id = t.object_id
                JOIN
                    sys.schemas s ON t.schema_id = s.schema_id
                JOIN
                    sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
                JOIN
                    sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
                WHERE
                    s.name LIKE '%'
                    AND i.name IS NOT NULL
                FOR XML PATH('')
            ), 1, 1, ''), '')
        + N']' AS all_indexes_json
),
tbls AS (
    SELECT
    '[' + ISNULL(
        STUFF((
            SELECT ',' +
                CONVERT(nvarchar(max),
                JSON_QUERY(
                    N'{"schema": "' + COALESCE(REPLACE(aggregated.schema_name, '"', ''), '') COLLATE SQL_Latin1_General_CP1_CI_AS +
                    '", "table": "' + COALESCE(REPLACE(aggregated.object_name, '"', ''), '') COLLATE SQL_Latin1_General_CP1_CI_AS +
                    '", "row_count": "' + CAST(aggregated.row_count AS NVARCHAR(MAX)) +
                    '", "object_type": "' + aggregated.object_type COLLATE SQL_Latin1_General_CP1_CI_AS +
                    '", "creation_date": "' + CONVERT(NVARCHAR(MAX), aggregated.creation_date, 120) + '"}'
                )
            )
            FROM
                (
                    -- Select from tables
                    SELECT
                        COALESCE(REPLACE(s.name, '"', ''), '') AS schema_name,
                        COALESCE(REPLACE(t.name, '"', ''), '') AS object_name,
                        SUM(p.rows) AS row_count,
                        t.type_desc AS object_type,
                        t.create_date AS creation_date
                    FROM
                        sys.tables t
                    JOIN
                        sys.schemas s ON t.schema_id = s.schema_id
                    JOIN
                        sys.partitions p ON t.object_id = p.object_id AND p.index_id IN (0, 1)
                    WHERE
                        s.name LIKE '%'
                    GROUP BY
                        s.name, t.name, t.type_desc, t.create_date

                    UNION ALL

                    -- Select from views
                    SELECT
                        COALESCE(REPLACE(s.name, '"', ''), '') AS schema_name,
                        COALESCE(REPLACE(v.name, '"', ''), '') AS object_name,
                        0 AS row_count,  -- Views don't have row counts
                        'VIEW' AS object_type,
                        v.create_date AS creation_date
                    FROM
                        sys.views v
                    JOIN
                        sys.schemas s ON v.schema_id = s.schema_id
                    WHERE
                        s.name LIKE '%'
                ) AS aggregated
            FOR XML PATH('')
        ), 1, 1, ''), '')
    + N']' AS all_objects_json
),
views AS (
    SELECT
        '[' +
        (
            SELECT
                STUFF((
                    SELECT ',' + CONVERT(nvarchar(max),
                        JSON_QUERY(
                            N'{"schema": "' + COALESCE(REPLACE(s.name, '"', ''), '') +
                            '", "view_name": "' + COALESCE(REPLACE(v.name, '"', ''), '') +
                            '", "view_definition": "' +
                            CAST(
                                (
                                    SELECT CAST(OBJECT_DEFINITION(v.object_id) AS VARBINARY(MAX)) FOR XML PATH('')
                                ) AS NVARCHAR(MAX)
                            ) + '"}'
                        )
                    )
                    FROM
                        sys.views v
                    JOIN
                        sys.schemas s ON v.schema_id = s.schema_id
                    WHERE
                        s.name LIKE '%'
                    FOR XML PATH(''), TYPE).value('.', 'NVARCHAR(MAX)'), 1, 1, '')
        ) + ']' AS all_views_json
)
SELECT JSON_QUERY(
        N'{"fk_info": ' + ISNULL((SELECT cast(all_fks_json as nvarchar(max)) FROM fk_info), N'[]') +
        ', "pk_info": ' + ISNULL((SELECT cast(all_pks_json as nvarchar(max)) FROM pk_info), N'[]') +
        ', "columns": ' + ISNULL((SELECT cast(all_columns_json as nvarchar(max)) FROM cols), N'[]') +
        ', "indexes": ' + ISNULL((SELECT cast(all_indexes_json as nvarchar(max)) FROM indexes), N'[]') +
        ', "tables": ' + ISNULL((SELECT cast(all_objects_json as nvarchar(max)) FROM tbls), N'[]') +
        ', "views": ' + ISNULL((SELECT cast(all_views_json as nvarchar(max)) FROM views), N'[]') +
        ', "database_name": "' + DB_NAME() + '"' +
        ', "version": ""}'
) AS metadata_json_to_import;`,T=(_={})=>_.databaseEdition===a.SQL_SERVER_2016_AND_BELOW?O:r,R=`WITH fk_info as (
  (SELECT (@fk_info:=NULL),
              (SELECT (0)
               FROM (SELECT kcu.table_schema,
                kcu.table_name,
                kcu.column_name as fk_column,
                kcu.constraint_name as foreign_key_name,
                kcu.referenced_table_schema as reference_schema,
                kcu.referenced_table_name as reference_table,
                kcu.referenced_column_name as reference_column,
                CONCAT('FOREIGN KEY (', kcu.column_name, ') REFERENCES ',
                       kcu.referenced_table_name, '(', kcu.referenced_column_name, ') ',
                       'ON UPDATE ', rc.update_rule,
                       ' ON DELETE ', rc.delete_rule) AS fk_def
            FROM
                information_schema.key_column_usage kcu
            JOIN
                information_schema.referential_constraints rc
                ON kcu.constraint_name = rc.constraint_name
                    AND kcu.table_schema = rc.constraint_schema
                  AND kcu.table_name = rc.table_name
            WHERE
                kcu.referenced_table_name IS NOT NULL) as fk
               WHERE table_schema LIKE IFNULL(NULL, '%')
                   AND table_schema = DATABASE()
                   AND (0x00) IN (@fk_info:=CONCAT_WS(',', @fk_info, CONCAT('{"schema":"',table_schema,
                                               '","table":"',table_name,
                                               '","column":"', IFNULL(fk_column, ''),
                                                          '","foreign_key_name":"', IFNULL(foreign_key_name, ''),
                                                          '","reference_schema":"', IFNULL(reference_schema, ''),
                                                          '","reference_table":"', IFNULL(reference_table, ''),
                                                          '","reference_column":"', IFNULL(reference_column, ''),
                                                          '","fk_def":"', IFNULL(fk_def, ''),
                                               '"}')))))
), pk_info AS (
    (SELECT (@pk_info:=NULL),
              (SELECT (0)
               FROM (SELECT TABLE_SCHEMA,
                            TABLE_NAME AS pk_table,
                            COLUMN_NAME AS pk_column,
                            (SELECT CONCAT('PRIMARY KEY (', GROUP_CONCAT(inc.COLUMN_NAME ORDER BY inc.ORDINAL_POSITION SEPARATOR ', '), ')')
                               FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE as inc
                               WHERE inc.CONSTRAINT_NAME = 'PRIMARY' and
                                     outc.TABLE_SCHEMA = inc.TABLE_SCHEMA and
                                     outc.TABLE_NAME = inc.TABLE_NAME) AS pk_def
                       FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE as outc
                       WHERE CONSTRAINT_NAME = 'PRIMARY'
                       GROUP BY TABLE_SCHEMA, TABLE_NAME, COLUMN_NAME
                       ORDER BY TABLE_SCHEMA, TABLE_NAME, ORDINAL_POSITION) AS pk
               WHERE table_schema LIKE IFNULL(NULL, '%')
               AND table_schema = DATABASE()
               AND (0x00) IN (@pk_info:=CONCAT_WS(',', @pk_info, CONCAT('{"schema":"', table_schema,
                                                                        '","table":"', pk_table,
                                                                        '","column":"', pk_column,
                                                                        '","pk_def":"', IFNULL(pk_def, ''),
                                                                        '"}')))))
), cols as
(
  (SELECT (@cols := NULL),
        (SELECT (0)
         FROM information_schema.columns cols
         WHERE cols.table_schema LIKE IFNULL(NULL, '%')
           AND cols.table_schema = DATABASE()
           AND (0x00) IN (@cols := CONCAT_WS(',', @cols, CONCAT(
                '{"schema":"', cols.table_schema,
                '","table":"', cols.table_name,
                '","name":"', REPLACE(cols.column_name, '"', '\\"'),
                '","type":"', LOWER(cols.data_type),
                '","character_maximum_length":"', IFNULL(cols.character_maximum_length, 'null'),
                '","precision":',
                    CASE
                        WHEN cols.data_type IN ('decimal', 'numeric')
                        THEN CONCAT('{"precision":', IFNULL(cols.numeric_precision, 'null'),
                                    ',"scale":', IFNULL(cols.numeric_scale, 'null'), '}')
                        ELSE 'null'
                    END,
                ',"ordinal_position":"', cols.ordinal_position,
                '","nullable":', IF(cols.is_nullable = 'YES', 'true', 'false'),
                ',"default":"', IFNULL(REPLACE(REPLACE(cols.column_default, '\\\\', ''), '"', '\\"'), ''),
                '","collation":"', IFNULL(cols.collation_name, ''), '"}'
            )))))
), indexes as (
  (SELECT (@indexes:=NULL),
                (SELECT (0)
                 FROM information_schema.statistics indexes
                 WHERE table_schema LIKE IFNULL(NULL, '%')
                     AND table_schema = DATABASE()
                     AND (0x00) IN  (@indexes:=CONCAT_WS(',', @indexes, CONCAT('{"schema":"',indexes.table_schema,
                                         '","table":"',indexes.table_name,
                                         '","name":"', indexes.index_name,
                                         '","size":"',
                                                                      (SELECT IFNULL(SUM(stat_value * @@innodb_page_size), -1) AS size_in_bytes
                                                                       FROM mysql.innodb_index_stats
                                                                       WHERE stat_name = 'size'
                                                                           AND index_name != 'PRIMARY'
                                                                           AND index_name = indexes.index_name
                                                                           AND TABLE_NAME = indexes.table_name
                                                                           AND database_name = indexes.table_schema),
                                                                  '","column":"', indexes.column_name,
                                                      '","index_type":"', LOWER(indexes.index_type),
                                                      '","cardinality":', indexes.cardinality,
                                                      ',"direction":"', (CASE WHEN indexes.collation = 'D' THEN 'desc' ELSE 'asc' END),
                                                      '","unique":', IF(indexes.non_unique = 1, 'false', 'true'), '}')))))
), tbls as
(
  (SELECT (@tbls:=NULL),
              (SELECT (0)
               FROM information_schema.tables tbls
               WHERE table_schema LIKE IFNULL(NULL, '%')
                   AND table_schema = DATABASE()
                   AND (0x00) IN (@tbls:=CONCAT_WS(',', @tbls, CONCAT('{', '"schema":"', \`TABLE_SCHEMA\`, '",',
                                               '"table":"', \`TABLE_NAME\`, '",',
                                             '"rows":', IFNULL(\`TABLE_ROWS\`, 0),
                                             ', "type":"', IFNULL(\`TABLE_TYPE\`, ''), '",',
                                             '"engine":"', IFNULL(\`ENGINE\`, ''), '",',
                                             '"collation":"', IFNULL(\`TABLE_COLLATION\`, ''), '"}')))))
), views as (
(SELECT (@views:=NULL),
              (SELECT (0)
               FROM information_schema.views views
               WHERE table_schema LIKE IFNULL(NULL, '%')
                   AND table_schema = DATABASE()
                   AND (0x00) IN (@views:=CONCAT_WS(',', @views, CONCAT('{', '"schema":"', \`TABLE_SCHEMA\`, '",',
                                                   '"view_name":"', \`TABLE_NAME\`, '",',
                                                   '"view_definition":"', REPLACE(REPLACE(TO_BASE64(VIEW_DEFINITION), ' ', ''), '
', ''), '"}'))) ) )
)
(SELECT CAST(CONCAT('{"fk_info": [',IFNULL(@fk_info,''),
                '], "pk_info": [', IFNULL(@pk_info, ''),
            '], "columns": [',IFNULL(@cols,''),
            '], "indexes": [',IFNULL(@indexes,''),
            '], "tables":[',IFNULL(@tbls,''),
            '], "views":[',IFNULL(@views,''),
            '], "database_name": "', DATABASE(),
            '", "version": "', VERSION(), '"}') AS CHAR) AS metadata_json_to_import
 FROM fk_info, pk_info, cols, indexes, tbls, views);
`,k={[E.GENERIC]:()=>"",[E.POSTGRESQL]:C,[E.MYSQL]:S,[E.SQLITE]:()=>m,[E.SQL_SERVER]:T,[E.MARIADB]:()=>R};export{k as importMetadataScripts};
