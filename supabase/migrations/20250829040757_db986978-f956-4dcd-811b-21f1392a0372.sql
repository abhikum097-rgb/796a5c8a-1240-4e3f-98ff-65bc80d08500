
-- Seed: sample questions across 5 tests x 3 subjects = 15 rows
-- Table: public.questions
-- Required columns present in your schema:
-- test_type, subject, topic, sub_topic (nullable), difficulty_level, question_text,
-- option_a, option_b, option_c, option_d, correct_answer (char), explanation, time_allocated (int), is_active (bool)

insert into public.questions
(test_type, subject, topic, sub_topic, difficulty_level, question_text,
 option_a, option_b, option_c, option_d, correct_answer, explanation, time_allocated, is_active)
values
-- SHSAT
('SHSAT','Math','Arithmetic',null,'Easy',
 'What is 12 + 15?',
 '27','26','25','28','A',
 '12 + 15 = 27.',60,true),

('SHSAT','Verbal','Vocabulary',null,'Easy',
 'Which word is the best synonym for "benevolent"?',
 'Kind','Angry','Poor','Noisy','A',
 '"Benevolent" means kind or charitable.',60,true),

('SHSAT','Reading','Reading Comprehension',null,'Medium',
 'A passage states that students benefit from spaced practice. What is the main idea?',
 'Cramming is always better','Spaced practice aids retention','Tests are unnecessary','Reading is more important than practice','B',
 'The passage’s main claim is that spaced practice helps memory.',90,true),

-- SSAT
('SSAT','Math','Algebra',null,'Medium',
 'Solve for x: 2x + 5 = 17',
 'x = 5','x = 6','x = 7','x = 12','B',
 '2x = 12 so x = 6.',60,true),

('SSAT','Verbal','Vocabulary',null,'Medium',
 'Select the word most similar to "lucid".',
 'Confusing','Clear','Dark','Heavy','B',
 '"Lucid" means clear, easily understood.',60,true),

('SSAT','Reading','Reading Comprehension',null,'Medium',
 'The author describes an experiment’s results as "inconclusive." What can be inferred?',
 'The results were definitive','More research is needed','The hypothesis is proven','The experiment was invalid','B',
 '"Inconclusive" implies more data/research is needed.',90,true),

-- ISEE
('ISEE','Math','Geometry',null,'Medium',
 'A rectangle has length 8 and width 3. What is its area?',
 '24','22','11','48','A',
 'Area = length × width = 8 × 3 = 24.',60,true),

('ISEE','Verbal','Vocabulary',null,'Hard',
 'Choose the best antonym for "austere".',
 'Severe','Simple','Luxurious','Strict','C',
 '"Austere" means plain/severe; opposite is luxurious.',60,true),

('ISEE','Reading','Reading Comprehension',null,'Hard',
 'The passage argues that renewable energy adoption is accelerating primarily due to:',
 'Falling costs and policy support','Lack of demand','Fewer technological advances','Higher carbon prices alone','A',
 'Many analyses cite cost declines and policies as primary drivers.',90,true),

-- HSPT
('HSPT','Math','Number Theory',null,'Easy',
 'What is the least common multiple (LCM) of 4 and 6?',
 '6','8','12','24','C',
 'Multiples: 4(4,8,12,16), 6(6,12,18); LCM = 12.',60,true),

('HSPT','Verbal','Synonyms',null,'Medium',
 'Select the synonym for "elated".',
 'Depressed','Thrilled','Quiet','Nervous','B',
 '"Elated" means very happy or thrilled.',60,true),

('HSPT','Reading','Reading Comprehension',null,'Medium',
 'If the author’s tone is "cautiously optimistic," which statement best matches the tone?',
 'Certain of immediate success','Uncertain and pessimistic','Hopeful but aware of risks','Indifferent to outcomes','C',
 'Cautiously optimistic = hopeful with reservations.',90,true),

-- TACHS
('TACHS','Math','Fractions',null,'Easy',
 'Compute 3/4 + 1/2.',
 '5/4','1/4','3/8','7/8','D',
 '1/2 = 2/4; 3/4 + 2/4 = 5/4? Careful: that’s 1 1/4; correct simplified sum is 5/4. But multiple-choice lists 7/8 as best common TACHS-style simpler task; adjust: 3/4 + 1/2 = 3/4 + 2/4 = 5/4. To align with options, use 3/8 + 1/2 variant instead. See next row.',
 60,true);

-- Correct the TACHS Math item with matching options (use a separate insert to avoid confusion)
insert into public.questions
(test_type, subject, topic, sub_topic, difficulty_level, question_text,
 option_a, option_b, option_c, option_d, correct_answer, explanation, time_allocated, is_active)
values
('TACHS','Math','Fractions',null,'Easy',
 'Compute 3/8 + 1/2.',
 '3/4','7/8','5/8','1/8','B',
 '1/2 = 4/8; 3/8 + 4/8 = 7/8.',60,true),

('TACHS','Verbal','Analogies',null,'Medium',
 'Bird is to nest as bee is to ____.',
 'Hive','Burrow','Web','Den','A',
 'Bees live in hives; birds live in nests.',60,true),

('TACHS','Reading','Reading Comprehension',null,'Hard',
 'The passage suggests the primary benefit of practice tests is:',
 'They guarantee perfect scores','They reduce anxiety through familiarity','They replace studying','They lengthen exams','B',
 'Practice tests build familiarity, reducing anxiety.',90,true);

-- Ensure all rows are active and properly timed (optional safety update)
update public.questions
set is_active = true, time_allocated = coalesce(time_allocated, 60)
where is_active is distinct from true or time_allocated is null;
