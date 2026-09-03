-- Helper to strip HTML tags and decode common entities before building the tsvector
CREATE OR REPLACE FUNCTION "strip_html_tags"(input TEXT)
RETURNS TEXT
LANGUAGE SQL
IMMUTABLE
PARALLEL SAFE
AS $$
  SELECT regexp_replace(
           regexp_replace(
             COALESCE(input, ''),
             '<[^>]*>', ' ', 'g'
           ),
           '&(nbsp|amp|lt|gt|quot|apos);', ' ', 'g'
         )
$$;

-- Add generated tsvector column: title (A) > summary (B) > stripped body (C)
ALTER TABLE "Post"
  ADD COLUMN "searchVector" tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', COALESCE("title", '')), 'A') ||
    setweight(to_tsvector('english', COALESCE("summary", '')), 'B') ||
    setweight(to_tsvector('english', "strip_html_tags"("content")), 'C')
  ) STORED;

-- GIN index to make the tsvector queryable
CREATE INDEX "Post_searchVector_idx" ON "Post" USING GIN ("searchVector");
