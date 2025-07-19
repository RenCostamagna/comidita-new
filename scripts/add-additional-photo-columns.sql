-- Add additional photo columns to detailed_reviews table to support up to 6 photos
ALTER TABLE detailed_reviews 
ADD COLUMN IF NOT EXISTS photo_3_url TEXT,
ADD COLUMN IF NOT EXISTS photo_4_url TEXT,
ADD COLUMN IF NOT EXISTS photo_5_url TEXT,
ADD COLUMN IF NOT EXISTS photo_6_url TEXT;

-- Add comments to document the photo columns
COMMENT ON COLUMN detailed_reviews.photo_1_url IS 'URL of the first photo uploaded with the review';
COMMENT ON COLUMN detailed_reviews.photo_2_url IS 'URL of the second photo uploaded with the review';
COMMENT ON COLUMN detailed_reviews.photo_3_url IS 'URL of the third photo uploaded with the review';
COMMENT ON COLUMN detailed_reviews.photo_4_url IS 'URL of the fourth photo uploaded with the review';
COMMENT ON COLUMN detailed_reviews.photo_5_url IS 'URL of the fifth photo uploaded with the review';
COMMENT ON COLUMN detailed_reviews.photo_6_url IS 'URL of the sixth photo uploaded with the review';
