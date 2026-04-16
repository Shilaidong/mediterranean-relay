-- Supabase Seed Data: Initialize albums and community data
-- Run this in SQL Editor after creating all tables

-- Insert sample albums (without owner_id for market items)
INSERT INTO albums (title, artist, year, rarity, price, cover, genre, is_listed, wear_grade, wear_notes, tracks) VALUES
('Kind of Blue', 'Miles Davis', 1959, 72, 45, 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=800', 'Jazz', true, 'Near Mint', '[{"x":30,"y":40,"label":"封套左上轻微折痕"},{"x":70,"y":65,"label":"B 面第 3 轨细微划痕"}]', '[{"name":"So What","duration":"9:22"},{"name":"Freddie Freeloader","duration":"9:46"},{"name":"Blue in Green","duration":"5:37"}]'),
('Aja', 'Steely Dan', 1977, 58, 32, 'https://images.unsplash.com/photo-1605672611471-782163515431?q=80&w=800', 'Rock', true, 'Very Good+', '[{"x":50,"y":50,"label":"中央标签轻微氧化"}]', '[{"name":"Black Cow","duration":"5:10"},{"name":"Aja","duration":"7:56"},{"name":"Deacon Blues","duration":"7:33"}]'),
('Rumours', 'Fleetwood Mac', 1977, 42, 28, 'https://images.unsplash.com/photo-1619983081563-430f63602796?q=80&w=800', 'Rock', true, 'Very Good', '[{"x":25,"y":30,"label":"封套边缘磨损"},{"x":65,"y":55,"label":"内页轻微泛黄"}]', '[{"name":"Dreams","duration":"4:17"},{"name":"Go Your Own Way","duration":"3:38"},{"name":"The Chain","duration":"4:28"}]'),
('Blue Train', 'John Coltrane', 1957, 84, 55, 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=800', 'Jazz', true, 'Mint', '[]', '[{"name":"Blue Train","duration":"10:42"},{"name":"Moment''s Notice","duration":"9:10"},{"name":"Locomotion","duration":"7:14"}]'),
('Pet Sounds', 'The Beach Boys', 1966, 66, 38, 'https://images.unsplash.com/photo-1598387181032-a3103a2db5b3?q=80&w=800', 'Soul', true, 'Near Mint', '[{"x":40,"y":60,"label":"轻微使用痕迹"}]', '[{"name":"Wouldn''t It Be Nice","duration":"2:25"},{"name":"God Only Knows","duration":"2:51"}]'),
('Revolver', 'The Beatles', 1966, 78, 62, 'https://images.unsplash.com/photo-1458560871784-56d23406c091?q=80&w=800', 'Rock', true, 'Very Good+', '[{"x":55,"y":45,"label":"封面右下角小折痕"}]', '[{"name":"Eleanor Rigby","duration":"2:07"},{"name":"Yellow Submarine","duration":"2:40"}]'),
('Horses', 'Patti Smith', 1975, 49, 30, 'https://images.unsplash.com/photo-1507838153414-b4b713384a76?q=80&w=800', 'Folk', true, 'Very Good', '[{"x":20,"y":70,"label":"脊背轻微磨白"}]', '[{"name":"Gloria","duration":"5:57"},{"name":"Land","duration":"9:25"}]'),
('The Dark Side of the Moon', 'Pink Floyd', 1973, 81, 68, 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=800', 'Classical', true, 'Mint', '[]', '[{"name":"Time","duration":"7:04"},{"name":"Money","duration":"6:23"},{"name":"Us and Them","duration":"7:49"}]');

-- Insert sample posts
INSERT INTO posts (title, content, cover_url) VALUES
('1967年首版Pet Sounds的保存心得分享', '今天想分享一下我收藏的这张1967年首版Pet Sounds的保存经验。首先要注意的是封套的完整性...', 'https://images.unsplash.com/photo-1598387181032-a3103a2db5b3?q=80&w=400'),
('请教：这种划痕会影响播放吗？', '刚收到一张二手唱片，发现B面有一道细小的划痕，请问会影响播放效果吗？有经验的朋友请指教！', NULL),
('1973年西德压片 vs 美国原版 音色对比', '最近入手了Dark Side of the Moon的两个版本，给大家分享一下音色的对比差异...', 'https://images.unsplash.com/photo-1458560871784-56d23406c091?q=80&w=400'),
('Kind of Blue Monaco版本鉴别指南', 'Monaco版本的Kind of Blue是很多收藏家追捧的对象，今天来教大家如何鉴别...', NULL);
