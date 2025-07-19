-- Add additional photo columns to detailed_reviews table to support up to 6 photos
ALTER TABLE detailed_reviews 
ADD COLUMN IF NOT EXISTS photo_3_url TEXT,
ADD COLUMN IF NOT EXISTS photo_4_url TEXT,
ADD COLUMN IF NOT EXISTS photo_5_url TEXT,
ADD COLUMN IF NOT EXISTS photo_6_url TEXT;

-- Add comments to document the new columns
COMMENT ON COLUMN detailed_reviews.photo_3_url IS 'URL of the third photo for the review';
COMMENT ON COLUMN detailed_reviews.photo_4_url IS 'URL of the fourth photo for the review';
COMMENT ON COLUMN detailed_reviews.photo_5_url IS 'URL of the fifth photo for the review';
COMMENT ON COLUMN detailed_reviews.photo_6_url IS 'URL of the sixth photo for the review';
