-- Add additional photo columns to detailed_reviews table to support up to 6 photos
ALTER TABLE detailed_reviews 
ADD COLUMN IF NOT EXISTS photo_3_url TEXT,
ADD COLUMN IF NOT EXISTS photo_4_url TEXT,
ADD COLUMN IF NOT EXISTS photo_5_url TEXT,
ADD COLUMN IF NOT EXISTS photo_6_url TEXT;

-- Add comments to document the new columns
COMMENT ON COLUMN detailed_reviews.photo_3_url IS 'URL for the third photo of the review';
COMMENT ON COLUMN detailed_reviews.photo_4_url IS 'URL for the fourth photo of the review';
COMMENT ON COLUMN detailed_reviews.photo_5_url IS 'URL for the fifth photo of the review';
COMMENT ON COLUMN detailed_reviews.photo_6_url IS 'URL for the sixth photo of the review';

-- Update RLS policies if they exist to include new photo columns
-- This ensures the new columns are accessible with the same permissions as existing ones
DO $$
BEGIN
    -- Check if RLS is enabled on detailed_reviews table
    IF EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relname = 'detailed_reviews' 
        AND n.nspname = 'public'
        AND c.relrowsecurity = true
    ) THEN
        -- RLS is enabled, policies should automatically cover new columns
        RAISE NOTICE 'RLS is enabled on detailed_reviews. New photo columns will inherit existing policies.';
    END IF;
END $$;
