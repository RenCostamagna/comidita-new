-- Create photos table for multiple photos per review
CREATE TABLE IF NOT EXISTS review_photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id UUID NOT NULL REFERENCES detailed_reviews(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  photo_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_review_photos_review_id ON review_photos(review_id);
CREATE INDEX IF NOT EXISTS idx_review_photos_primary ON review_photos(review_id, is_primary);

-- Enable RLS
ALTER TABLE review_photos ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view all review photos" ON review_photos FOR SELECT USING (true);
CREATE POLICY "Users can insert their own review photos" ON review_photos FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own review photos" ON review_photos FOR UPDATE USING (true);
CREATE POLICY "Users can delete their own review photos" ON review_photos FOR DELETE USING (true);

-- Migrate existing photos from detailed_reviews to review_photos
INSERT INTO review_photos (review_id, photo_url, is_primary, photo_order)
SELECT 
  id as review_id,
  photo_1_url as photo_url,
  true as is_primary,
  1 as photo_order
FROM detailed_reviews 
WHERE photo_1_url IS NOT NULL;

INSERT INTO review_photos (review_id, photo_url, is_primary, photo_order)
SELECT 
  id as review_id,
  photo_2_url as photo_url,
  false as is_primary,
  2 as photo_order
FROM detailed_reviews 
WHERE photo_2_url IS NOT NULL AND photo_2_url != photo_1_url;

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION update_review_photos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_review_photos_updated_at
  BEFORE UPDATE ON review_photos
  FOR EACH ROW
  EXECUTE FUNCTION update_review_photos_updated_at();
