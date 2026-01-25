-- Update questions with new skill tags and ELO difficulty

-- EASY QUESTIONS (ELO 1000-1300)
UPDATE questions SET 
  skills = ARRAY['metrics_definition', 'user_empathy']::text[],
  elo_difficulty = 1100
WHERE id = '821346d6-11e5-44ba-98c9-7e13565a2f4f'; -- Define north star for meditation app

UPDATE questions SET 
  skills = ARRAY['metrics_definition', 'problem_framing']::text[],
  elo_difficulty = 1150
WHERE id = '84646b02-92f6-46ae-ab50-630fb1dd71e6'; -- E-commerce 1M visitors, 20K purchases

UPDATE questions SET
  skills = ARRAY['metrics_definition']::text[],
  elo_difficulty = 1100
WHERE id = 'ea801e66-36d5-4cf6-8766-df2b9e7b786a'; -- Food delivery 60% never order twice

-- ... (I'll continue with all 150 questions)