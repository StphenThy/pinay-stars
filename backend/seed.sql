-- Pinay Stars - seed roster
-- Pinay Stars - seed roster
-- Run this AFTER schema.sql, in phpMyAdmin.
-- Replace `pinay_actresses` if your table is named differently.
--
-- This repairs your 3 existing rows (their image_url pointed at example.com,
-- which never loaded) and then adds 12 more. Nothing is deleted.
--
-- Birth dates, birthplaces and biographies come from Wikipedia/Wikidata.
-- Every image_url is a freely-licensed Wikimedia Commons photo that was
-- confirmed to return HTTP 200. Multi-value fields are pipe-delimited.
--
-- Belle Mariano and Charlie Dizon are intentionally absent: neither has a
-- freely-licensed photo on Wikimedia, and showing someone else's face under
-- their name would be worse than leaving them out. Add them through the app's
-- own "Add New Actress" form with a photo you have the rights to.

-- ---------------------------------------------------------------------------
-- Repair the 3 records you already have
-- ---------------------------------------------------------------------------

UPDATE `pinay_actresses` SET
  `stage_name`    = 'Kathryn Bernardo',
  `name`          = 'Kathryn Chandria Manuel Bernardo',
  `age`           = 30,
  `birthday`      = '1996-03-26',
  `birthplace`    = 'Cabanatuan, Nueva Ecija',
  `occupation`    = 'Actress',
  `agency`        = 'Star Magic',
  `biography`     = 'Kathryn Chandria Manuel Bernardo is a Filipino actress known for her work in mainstream productions. She has starred in three of the highest-grossing Filipino films of all time: The Hows of Us (2018), Hello, Love, Goodbye (2019) and Hello, Love, Again (2024).',
  `image_url`     = 'https://upload.wikimedia.org/wikipedia/commons/4/42/Kathryn_Bernardo_in_2025_%28cropped%29.jpg',
  `genres`        = 'Drama|Romance',
  `films`         = 'Hello, Love, Goodbye|Hello, Love, Again|The Hows of Us|A Very Good Girl|Barcelona: A Love Untold',
  `tv_series`     = '2 Good 2 Be True|Pangako Sa ''Yo|Got to Believe',
  `awards`        = 'Seoul International Drama Award|Asian World Film Festival Award|2 FAMAS Awards|14 Box Office Entertainment Awards',
  `years_active`  = '2003-Present',
  `status`        = 'active',
  `rating`        = 4.98,
  `reviews_count` = 128000
WHERE `name` LIKE '%Kathryn%' OR `stage_name` = 'Kathryn Bernardo';

UPDATE `pinay_actresses` SET
  `stage_name`    = 'Nadine Lustre',
  `name`          = 'Nadine Alexis Paguia Lustre',
  `age`           = 32,
  `birthday`      = '1993-10-31',
  `birthplace`    = 'Quezon City, Metro Manila',
  `occupation`    = 'Actress, Singer',
  `agency`        = 'Viva Artists Agency',
  `biography`     = 'Nadine Alexis Paguia Lustre is a Filipino actress, singer and advocate, regarded as one of the finest Filipino actresses of the 21st century. Her work spans mainstream romance and acclaimed independent psychological drama.',
  `image_url`     = 'https://upload.wikimedia.org/wikipedia/commons/4/49/20240315_Nadine_Lustre_at_BVLGARI_05.jpg',
  `genres`        = 'Drama|Psychological Thriller|Indie',
  `films`         = 'Deleter|Greed|Never Not Love You|That Thing Called Tadhana',
  `tv_series`     = 'On the Wings of Love|Til I Met You',
  `awards`        = '6 FAMAS Awards|Gawad Urian Award|5 Box Office Entertainment Awards|4 Metro Manila Film Festival Awards',
  `years_active`  = '2010-Present',
  `status`        = 'active',
  `rating`        = 4.97,
  `reviews_count` = 110000
WHERE `name` LIKE '%Nadine%' OR `stage_name` = 'Nadine Lustre';

UPDATE `pinay_actresses` SET
  `stage_name`    = 'Liza Soberano',
  `name`          = 'Hope Elizabeth Soberano',
  `age`           = 28,
  `birthday`      = '1998-01-04',
  `birthplace`    = 'Santa Clara, California, USA',
  `occupation`    = 'Actress',
  `agency`        = 'Careless Music',
  `biography`     = 'Hope Elizabeth Soberano is a Filipino and American actress. Known for supporting roles in dramas and comedies as a teenager, she has since moved into leading roles in television and film, including her Hollywood debut.',
  `image_url`     = 'https://upload.wikimedia.org/wikipedia/commons/d/dc/Liza_Soberano_in_2026.jpg',
  `genres`        = 'Romance|Drama|Action',
  `films`         = 'Lisa Frankenstein|My Ex and Whys|Everyday I Love You|Alone/Together',
  `tv_series`     = 'Forevermore|Dolce Amore|Bagani',
  `awards`        = 'FAMAS Award|PMPC Star Award|6 Box Office Entertainment Awards',
  `years_active`  = '2011-Present',
  `status`        = 'overseas',
  `rating`        = 4.94,
  `reviews_count` = 96000
WHERE `name` LIKE '%Liza%' OR `stage_name` = 'Liza Soberano';

-- ---------------------------------------------------------------------------
-- Add the rest of the roster
-- ---------------------------------------------------------------------------

INSERT INTO `pinay_actresses`
  (`name`, `stage_name`, `age`, `birthday`, `birthplace`, `occupation`, `agency`,
   `biography`, `image_url`, `genres`, `films`, `tv_series`, `awards`,
   `years_active`, `status`, `rating`, `reviews_count`)
VALUES
('Anne Ojales Curtis-Smith', 'Anne Curtis', 41, '1985-02-17', 'Wangaratta, Victoria, Australia', 'Actress, Host', 'Viva Artists Agency',
 'Anne Curtis-Smith is a Filipino actress, television host, singer and businesswoman. Known for her versatile work across film and television, she is one of the most successful and highest-paid Filipino actresses of her generation.',
 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/Anne_Curtis_%282009%29.jpg/960px-Anne_Curtis_%282009%29.jpg',
 'Action|Drama|Comedy', 'BuyBust|No Other Woman|Sid & Aya|Blood Ransom', 'It''s Showtime|Dyosa',
 '2 FAMAS Awards|2 Metro Manila Film Festival Awards|Luna Award|4 Box Office Entertainment Awards',
 '1997-Present', 'active', 4.95, 94000),

('Phylbert Angelli Ranollo Fagestrom', 'Bea Alonzo', 38, '1987-10-17', 'Cainta, Rizal', 'Actress', 'GMA Network',
 'Phylbert Angelli Ranollo Fagestrom, known professionally as Bea Alonzo, is a Filipino actress best known for starring roles in romantic comedy and romance drama. Her films have grossed more than 3.15 billion pesos.',
 'https://upload.wikimedia.org/wikipedia/commons/2/27/Bea_Alonzo_by_Ronn_Tan%2C_April_2010.png',
 'Drama|Romance', 'One More Chance|The Mistress|Four Sisters and a Wedding|A Second Chance|The Love Affair', 'Kahit Kailan|Start-Up PH',
 'FAMAS Best Actress nominee|Box Office Queen|PMPC Star Awards',
 '2003-Present', 'active', 4.93, 88000),

('Sarah Asher Tua Geronimo', 'Sarah Geronimo', 38, '1988-07-25', 'Sampaloc, Quezon', 'Actress, Singer', 'Viva Artists Agency',
 'Sarah Asher Tua Geronimo is a Filipina singer, record producer and actress. Known for her vocal versatility and commanding stage presence, she is widely regarded as one of the defining voices in Philippine pop music.',
 'https://upload.wikimedia.org/wikipedia/commons/b/bc/Sarah_G_Dubai_2011.jpg',
 'Musical|Romance|Comedy', 'A Very Special Love|You Changed My Life|It Takes a Man and a Woman|Miss Granny|Unexpectedly Yours', 'ASAP|Tawag ng Tanghalan',
 'Box Office Entertainment Awards|Awit Awards|MYX Music Awards|Popstar Royalty',
 '2003-Present', 'active', 4.92, 102000),

('Dolly de Leon', 'Dolly de Leon', 57, '1969-04-12', 'Manila, Philippines', 'Actress', 'Independent',
 'Dolly de Leon is a Filipina actress known primarily for her work in independent films and theatre. British Vogue named her one of the 31 most famous stars in the world in 2023.',
 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Dolly_de_Leon_2024_Berlin_International_Film_Festival_%283x4_cropped%29.jpg/960px-Dolly_de_Leon_2024_Berlin_International_Film_Festival_%283x4_cropped%29.jpg',
 'Drama|Indie|Character', 'Triangle of Sadness|Historya ni Ha|Verdict|Between Land and Sea', 'Ghosts',
 'Golden Globe nominee|BAFTA nominee|FAMAS Award|Guldbagge Award|Los Angeles Film Critics Association Award',
 '1980s-Present', 'active', 4.96, 76000),

('Judy Anne Lumagui Santos', 'Judy Ann Santos', 48, '1978-05-11', 'Manila, Philippines', 'Actress, Producer', 'Independent',
 'Judy Anne Lumagui Santos is a Filipino actress and film producer, prolific in Philippine film and television. She is known for dramatic and comedic roles in both blockbusters and independent films.',
 'https://upload.wikimedia.org/wikipedia/commons/3/32/Judy_Ann_Santos_%282008%29.jpg',
 'Drama|Comedy|Indie', 'Ploning|Sakaling Hindi Makarating|Kusina|Mano Po', 'Esperanza|Krystala',
 'Cairo International Film Festival Award|Gawad Urian|2 Luna Awards|3 Metro Manila Film Festival Awards|3 FAMAS Awards',
 '1988-Present', 'active', 4.94, 71000),

('Angelica Locsin Colmenares', 'Angel Locsin', 41, '1985-04-23', 'Bulacan, Philippines', 'Actress', 'Independent',
 'Angelica Locsin Colmenares is a Filipino former actress, humanitarian and advocate, known for dramatic roles and portrayals of heroines and mythological characters in film and television.',
 'https://upload.wikimedia.org/wikipedia/commons/1/18/Angel_Locsin_at_the_premiere_of_Love_Me_Again_in_LA%2C_December_2008.jpg',
 'Action|Drama|Fantasy', 'One More Try|The Third Party|Everything About Her|In the Name of Love', 'Darna|Imortal|The Legal Wife',
 '5 Star Awards|3 FAMAS Awards|6 Box Office Entertainment Awards|Luna Award',
 '2001-2021', 'hiatus', 4.91, 64000),

('Marian Rivera Gracia-Dantes', 'Marian Rivera', 42, '1984-08-12', 'Madrid, Spain', 'Actress, Host', 'GMA Network',
 'Marian Rivera Gracia-Dantes is a Filipino actress, model, host and dancer, widely regarded in the industry as the Primetime Queen for her sustained commercial success and contributions to Philippine television.',
 'https://upload.wikimedia.org/wikipedia/commons/6/63/Marian_Rivera_-_2014_%28cropped%29.jpg',
 'Drama|Romance|Fantasy', 'You to Me Are Everything|Segunda Mano|Tumbang Preso', 'Marimar|Dyesebel|Amaya|Temptation of Wife',
 '3 FAMAS Awards|5 PMPC Star Awards for Television|10 Box Office Entertainment Awards|Cinemalaya Award',
 '2004-Present', 'active', 4.90, 69000),

('Kimberly Sue Yap Chiu', 'Kim Chiu', 36, '1990-04-19', 'Tacloban, Leyte', 'Actress, Host', 'Star Magic',
 'Kimberly Sue Yap Chiu is a Filipino actress, singer, host and businesswoman. She rose to fame after winning the first teen edition of Pinoy Big Brother in 2006, and her films have grossed almost 1.5 billion pesos.',
 'https://upload.wikimedia.org/wikipedia/commons/d/d4/Kim_Chiu_in_2025.png',
 'Drama|Comedy|Romance', 'Ang Babaeng Allergic sa Wifi|Bakit Lahat ng Gwapo May Boyfriend?|The Ghost Bride', 'Tayong Dalawa|Linlang|Ikaw Lang ang Iibigin',
 'Box Office Entertainment Awards|PMPC Star Awards|FAMAS nominee',
 '2006-Present', 'active', 4.89, 58000),

('Rosa Vilma Tuazon Santos-Recto', 'Vilma Santos', 72, '1953-11-03', 'Bamban, Tarlac', 'Actress, Public Servant', 'Independent',
 'Rosa Vilma Tuazon Santos-Recto is a Filipino actress and politician, known as the Star for All Seasons. She began as a child actress in the 1960s and became a major box-office draw, and currently serves as Governor of Batangas.',
 'https://upload.wikimedia.org/wikipedia/commons/6/69/Governor_Vilma_Santos%2C_Official_portrait_2025.jpg',
 'Drama|Romance|Film', 'Relasyon|Sister Stella L.|Dekada ''70|Anak|Ekstra', 'Mano Po 6|Wildflower',
 '13 FAMAS Awards|11 Gawad Urian|5 Luna Awards|Dhaka International Film Festival Award',
 '1963-Present', 'on_leave', 4.99, 84000),

('Nora Cabaltera Villamayor', 'Nora Aunor', 71, '1953-05-21', 'Iriga, Camarines Sur', 'Actress, Singer', 'Independent',
 'Nora Cabaltera Villamayor, known professionally as Nora Aunor, was a Filipino actress, producer and singer who appeared in more than 170 films across five decades. Regarded as the most awarded Filipino actress in history, she was conferred National Artist of the Philippines for Film and Broadcast Arts in 2022. She passed away in April 2025.',
 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/Nora_Aunor_at_the_69th_Venice_International_Film_Festival%2C_September_2012.jpg/960px-Nora_Aunor_at_the_69th_Venice_International_Film_Festival%2C_September_2012.jpg',
 'Drama|Indie|Film', 'Himala|Thy Womb|Bona|The Flor Contemplacion Story', 'Bakit Manipis ang Ulap?',
 'National Artist of the Philippines|Most awarded Filipino actress in history|Gawad Urian|FAMAS Hall of Fame',
 '1967-2025', 'memoriam', 5.00, 145000),

('Nicomaine Dei Capili Mendoza-Atayde', 'Maine Mendoza', 31, '1995-03-03', 'Santa Maria, Bulacan', 'Actress, Host', 'GMA Artist Center',
 'Nicomaine Dei Capili Mendoza-Atayde is a Filipino television host and actress, best known for her viral Dubsmash videos and her role as Yaya Dub in the noontime variety show Eat Bulaga!.',
 'https://upload.wikimedia.org/wikipedia/commons/5/58/Maine_Mendoza_-_Eat_Bulaga%21_%282019%29_02.jpg',
 'Comedy|Romance', 'My Bebe Love|Imagine You and Me|Jack Em Popoy', 'Eat Bulaga!|Destined to be Yours',
 'Box Office Entertainment Awards|PMPC Star Awards|Push Awards',
 '2015-Present', 'active', 4.87, 52000),

('Janella Maxine Desiderio Salvador', 'Janella Salvador', 28, '1998-03-30', 'Cebu City, Cebu', 'Actress, Singer', 'Star Magic',
 'Janella Maxine Desiderio Salvador is a Filipino actress and singer. She debuted in the morning drama Be Careful with My Heart and has since led several television series and films.',
 'https://upload.wikimedia.org/wikipedia/commons/e/e7/Janella_Salvador_in_2019.jpg',
 'Drama|Romance|Fantasy', 'So Connected|Under Parallel Skies|Born for You', 'Be Careful with My Heart|The Killer Bride|Darna|Oh My G!',
 'PMPC Star Awards|Awit Awards nominee|Box Office Entertainment Awards',
 '2012-Present', 'active', 4.88, 47000);
