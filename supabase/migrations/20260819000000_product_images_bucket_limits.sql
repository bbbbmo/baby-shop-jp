update storage.buckets
set
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  file_size_limit = 5242880 -- 5MB
where id = 'product-images';
