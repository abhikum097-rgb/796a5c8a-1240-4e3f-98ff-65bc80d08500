
-- Seed a baseline set of questions across all test types and subjects
-- Schema reference:
-- questions(test_type, subject, topic, sub_topic, difficulty_level, question_text,
--           option_a, option_b, option_c, option_d, correct_answer, explanation,
--           time_allocated, is_active)

INSERT INTO public.questions
(test_type, subject, topic, sub_topic, difficulty_level, question_text,
 option_a, option_b, option_c, option_d, correct_answer, explanation, time_allocated, is_active)
VALUES
-- SHSAT
('SHSAT','Math','Algebra',NULL,'Easy',
 'Solve for x: 2x + 3 = 11.',
 '3','4','5','6','B',
 'Subtract 3 from both sides: 2x = 8; divide by 2: x = 4.',60,true),
('SHSAT','Verbal','Vocabulary',NULL,'Easy',
 'Select the synonym for "abundant".',
 'Sparse','Plentiful','Rare','Meager','B',
 '"Abundant" means plentiful.',45,true),
('SHSAT','Reading','Reading Comprehension',NULL,'Medium',
 'A passage explains how photosynthesis converts light energy to chemical energy in plants. Which statement best expresses its main idea?',
 'Plants convert light energy to chemical energy to produce glucose.',
 'Photosynthesis only occurs at night.',
 'Chlorophyll is unrelated to photosynthesis.',
 'Photosynthesis does not involve sunlight.','A',
 'Main idea: photosynthesis converts light energy into chemical energy (glucose).',90,true),
('SHSAT','Writing','Grammar',NULL,'Medium',
 'Choose the grammatically correct sentence.',
 'Neither of the answers are correct.',
 'Neither of the answers is correct.',
 'Neither answers is correct.',
 'Neither answers are correct.','B',
 'With "neither," use singular verb: "is."',60,true),

-- SSAT
('SSAT','Math','Algebra',NULL,'Easy',
 'If 3x - 5 = 16, what is x?',
 '5','7','8','9','B',
 'Add 5: 3x = 21; divide by 3: x = 7.',60,true),
('SSAT','Verbal','Vocabulary',NULL,'Easy',
 'Select the synonym for "benevolent".',
 'Cruel','Kind','Greedy','Harsh','B',
 '"Benevolent" means kind or charitable.',45,true),
('SSAT','Reading','Reading Comprehension',NULL,'Medium',
 'A passage describes how the water cycle circulates water through evaporation, condensation, and precipitation. What is the central idea?',
 'Water is continuously recycled through the water cycle.',
 'Precipitation only occurs in winter.',
 'Evaporation does not require heat.',
 'Clouds are made of smoke.','A',
 'Core idea: water cycles through phases in a continuous process.',90,true),
('SSAT','Writing','Grammar',NULL,'Medium',
 'Choose the grammatically correct sentence.',
 'Each of the students were given a book.',
 'Each of the students was given a book.',
 'Each students were given a book.',
 'Each students was given a book.','B',
 '"Each" is singular, so use "was given."',60,true),

-- ISEE
('ISEE','Math','Algebra',NULL,'Easy',
 'What is the value of y if 4y + 8 = 24?',
 '2','3','4','5','B',
 'Subtract 8: 4y = 16; divide by 4: y = 4 → correct option is 3? No, y=4 so option C. Correction: correct answer is C.',60,true),
('ISEE','Verbal','Vocabulary',NULL,'Easy',
 'Select the synonym for "vigilant".',
 'Watchful','Careless','Sleepy','Distracted','A',
 '"Vigilant" means watchful.',45,true),
('ISEE','Reading','Reading Comprehension',NULL,'Medium',
 'A passage explains the role of the heart in circulating blood. What is the main idea?',
 'The heart pumps blood to deliver oxygen and nutrients.',
 'The heart stores oxygen for future use.',
 'Blood never returns to the heart.',
 'Circulation only occurs in the lungs.','A',
 'Main idea: heart pumps blood for circulation.',90,true),
('ISEE','Writing','Grammar',NULL,'Medium',
 'Choose the grammatically correct sentence.',
 'There is many reasons to study.',
 'There are many reasons to study.',
 'There were many reason to study.',
 'There is many reason to study.','B',
 'Use plural verb "are" with plural subject "reasons."',60,true),

-- HSPT
('HSPT','Math','Algebra',NULL,'Easy',
 'Simplify: If x = 3, what is 2x^2?',
 '9','12','18','6','C',
 '2x^2 = 2*(3^2) = 2*9 = 18.',60,true),
('HSPT','Verbal','Vocabulary',NULL,'Easy',
 'Select the synonym for "reluctant".',
 'Willing','Eager','Hesitant','Enthusiastic','C',
 '"Reluctant" means hesitant.',45,true),
('HSPT','Reading','Reading Comprehension',NULL,'Medium',
 'A passage outlines the causes of the American Revolution. Which best states its main idea?',
 'Tensions over taxation and governance led to revolution.',
 'The revolution began due to a single event.',
 'There were no economic causes.',
 'Colonists were universally loyal to Britain.','A',
 'Main idea: multiple causes, especially taxation and governance issues.',90,true),
('HSPT','Writing','Grammar',NULL,'Medium',
 'Choose the grammatically correct sentence.',
 'The team are winning the game.',
 'The team is winning the game.',
 'The team be winning the game.',
 'The team were winning the game.','B',
 'Collective noun "team" takes singular verb "is" (in AmE).',60,true),

-- TACHS
('TACHS','Math','Algebra',NULL,'Easy',
 'Evaluate: If a = 5, what is 3a - 7?',
 '7','8','10','15','A',
 '3*5 - 7 = 15 - 7 = 8 → correct option should be B. Correction: 8 is correct; choose option B.',60,true),
('TACHS','Verbal','Vocabulary',NULL,'Easy',
 'Select the synonym for "trivial".',
 'Unimportant','Crucial','Severe','Valuable','A',
 '"Trivial" means unimportant.',45,true),
('TACHS','Reading','Reading Comprehension',NULL,'Medium',
 'A passage describes how recycling reduces landfill waste. What is the main idea?',
 'Recycling helps reduce waste by reusing materials.',
 'Recycling increases landfill size.',
 'Only plastic can be recycled.',
 'Recycling is illegal in most places.','A',
 'Main idea: recycling reduces waste by reusing materials.',90,true),
('TACHS','Writing','Grammar',NULL,'Medium',
 'Choose the grammatically correct sentence.',
 'He don\'t have any homework.',
 'He doesn\'t have any homework.',
 'He didn\'t has any homework.',
 'He doesn\'t has any homework.','B',
 'Use "doesn\'t have" with third-person singular.',60,true);

-- Fix the two corrected-answer rows above by ensuring the correct option letters match the computation.
-- For the ISEE Math row (4y + 8 = 24): y = 4 corresponds to option 'C'
UPDATE public.questions
SET correct_answer = 'C'
WHERE test_type = 'ISEE' AND subject = 'Math' AND question_text LIKE 'What is the value of y if 4y + 8 = 24?';

-- For the TACHS Math row (3a - 7 with a=5): value is 8, which is option 'B'
UPDATE public.questions
SET correct_answer = 'B'
WHERE test_type = 'TACHS' AND subject = 'Math' AND question_text LIKE 'Evaluate: If a = 5, what is 3a - 7?';
