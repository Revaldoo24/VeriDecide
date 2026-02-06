alter table documents
  add column if not exists source_type text not null default 'internal';

update documents set source_type = 'internal' where source_type is null;

alter table output_citations
  add column if not exists evidence_origin text;

alter table outputs
  add column if not exists confidence_internal numeric,
  add column if not exists confidence_open_source numeric;

create index if not exists documents_source_type_idx on documents (source_type);
