
-- Seed sample SHSAT questions across subjects and topics
-- Includes Reading questions with passages so the UI can render them

INSERT INTO public.questions
(test_type, subject, topic, sub_topic, difficulty_level, question_text, passage, option_a, option_b, option_c, option_d, correct_answer, explanation, time_allocated, is_active)
VALUES
-- Reading: Comprehension (Medium)
('SHSAT','Reading','Comprehension',NULL,'Medium',
 'Which statement best expresses the main idea of the passage?',
 $$In the heart of a busy city, a small community garden began as a single raised bed tucked between two brick buildings. Over time, volunteers transformed the lot into a vibrant space where neighbors shared tools, recipes, and stories. Beyond the vegetables they harvested, the garden yielded something less tangible but equally nourishing: a sense of belonging that helped the neighborhood feel a little more like home.$$,
 'It shows how urban gardening reduces grocery costs for all residents.',
 'It explains how a community garden can foster connection and belonging.',
 'It argues that cities should replace parking lots with gardens.',
 'It demonstrates how gardening improves building safety.',
 'B',
 'The passage emphasizes the garden’s role in building community and a sense of belonging, which is the central idea.',
 150, true),

-- Reading: Inference (Hard)
('SHSAT','Reading','Inference',NULL,'Hard',
 'Which inference is best supported by the information in the passage?',
 $$Marisol’s notebook was filled with sketches—each page a variation on a simple device that could filter rainwater into clean drinking water. The earliest drawings were clumsy: crooked lines, notes scrawled in the margins, and question marks everywhere. As the pages turned, the shapes sharpened, the notes became measurements, and the question marks thinned to a single, confident checkmark.$$,
 'Marisol copied an existing design from a manual.',
 'Marisol abandoned her project before testing it.',
 'Marisol’s design likely became more refined through trial and iteration.',
 'Marisol’s final design was identical to her first sketch.',
 'C',
 'The progression from clumsy sketches and questions to precise measurements and a final checkmark suggests iterative improvement.',
 150, true),

-- Reading: Analysis (Medium)
('SHSAT','Reading','Analysis',NULL,'Medium',
 'Which word best describes the author’s tone in the passage?',
 $$When the monarchs did not return in their usual numbers, the town noticed the silence first. The milkweed by the bus stop waved in the same gentle wind, but the bright wings that once stitched color through the afternoon air were fewer now. Children pressed their faces to classroom windows, looking for orange flashes that rarely came.$$,
 'Dismissive',
 'Reverent',
 'Concerned',
 'Amused',
 'C',
 'The focus on absence and subtle details (fewer butterflies, children searching) suggests a concerned, somber tone.',
 150, true),

-- Reading: Main Ideas (Easy)
('SHSAT','Reading','Main Ideas',NULL,'Easy',
 'What is the primary purpose of the passage?',
 $$In the last decade, the cost of home solar panels has fallen dramatically, making renewable energy more accessible to families. While some challenges remain—like upfront costs and local regulations—households are increasingly able to reduce their electricity bills and their environmental impact.$$,
 'To argue that solar panels are too expensive for most families.',
 'To explain the science behind how solar panels work.',
 'To inform readers that solar is becoming more affordable and beneficial for households.',
 'To persuade cities to ban local regulations on solar panels.',
 'C',
 'The passage informs readers that solar power has become more affordable and beneficial, while acknowledging remaining challenges.',
 140, true),

-- Math: Algebra (Easy)
('SHSAT','Math','Algebra',NULL,'Easy',
 'Solve for x: 3x + 7 = 22',
 NULL,
 '3',
 '5',
 '7',
 '9',
 'B',
 'Subtract 7 from both sides to get 3x = 15, then divide by 3 to get x = 5.',
 90, true),

-- Math: Geometry (Easy)
('SHSAT','Math','Geometry',NULL,'Easy',
 'What is the area of a rectangle with length 8 units and width 5 units?',
 NULL,
 '13 square units',
 '26 square units',
 '40 square units',
 '80 square units',
 'C',
 'Area = length × width = 8 × 5 = 40 square units.',
 75, true),

-- Math: Word Problems (Medium)
('SHSAT','Math','Word Problems',NULL,'Medium',
 'A train travels 180 miles in 3 hours. What is its average speed in miles per hour?',
 NULL,
 '45 mph',
 '50 mph',
 '55 mph',
 '60 mph',
 'D',
 'Average speed = distance ÷ time = 180 ÷ 3 = 60 mph.',
 90, true),

-- Verbal: Vocabulary (Medium)
('SHSAT','Verbal','Vocabulary',NULL,'Medium',
 'TENACIOUS most nearly means:',
 NULL,
 'Flexible',
 'Persistent',
 'Careless',
 'Temporary',
 'B',
 'Tenacious means holding firmly or being persistent.',
 60, true),

-- Verbal: Analogies (Easy)
('SHSAT','Verbal','Analogies',NULL,'Easy',
 'CAT is to KITTEN as DOG is to ______.',
 NULL,
 'Cub',
 'Puppy',
 'Calf',
 'Foal',
 'B',
 'A young dog is a puppy; the relationship mirrors cat:kitten.',
 45, true),

-- Verbal: Grammar (Hard)
('SHSAT','Verbal','Grammar',NULL,'Hard',
 'Which sentence is written correctly?',
 NULL,
 'Neither the coach nor the players was ready for the game.',
 'Neither the coach nor the players were ready for the game.',
 'Neither the coach or the players was ready for the game.',
 'Neither the coach or the players were ready for the game.',
 'B',
 'With “neither…nor,” the verb agrees with the nearer subject: players (plural) → were.',
 70, true);
