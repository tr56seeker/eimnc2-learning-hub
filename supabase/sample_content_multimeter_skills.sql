-- One-off sample content: "Multimeter Skills" lesson, blog-style, adapted from
-- a DepEd Self-Learning Module into the app's lesson/activity/quiz format.
-- NOT a numbered migration — teacher-authored demo content, safe to run once.
-- Re-running this script will create duplicates; only run it once.

do $$
declare
  v_competency_id uuid;
  v_lesson_id uuid;
  v_activity_id uuid;
  v_pretest_ids uuid[];
  v_pretest_exam_id uuid;
  v_assessment_ids uuid[];
  v_assessment_exam_id uuid;
  i int;
begin
  -- Competency (reuses the actual DepEd learning competency code from the source module)
  select id into v_competency_id from public.competencies where code = 'TLE_IAEIM9-12PT-IIf-j-9' limit 1;
  if v_competency_id is null then
    insert into public.competencies (code, title, description, grade_level, order_index)
    values (
      'TLE_IAEIM9-12PT-IIf-j-9',
      'Test and Measure Electrical Quantities Using a Multimeter',
      'Demonstrates knowledge and skills in testing and measuring electrical and electronic quantities using a multimeter.',
      11,
      21
    )
    returning id into v_competency_id;
  end if;

  -- Lesson
  insert into public.lessons (competency_id, title, slug, summary, estimated_minutes, order_index, published)
  values (
    v_competency_id,
    'Multimeter Skills: Voltage, Resistance, and Continuity',
    'multimeter-skills-' || substr(gen_random_uuid()::text, 1, 8),
    'Everything you need to confidently pick up a multimeter and start diagnosing real electrical problems, from reading voltage to chasing down a broken wire.',
    60,
    11,
    true
  )
  returning id into v_lesson_id;

  -- Lesson content blocks. Note: the reader groups blocks by TYPE into fixed
  -- sections (Learning Goals -> Preparation -> Core Lesson -> Guided Practice
  -- -> Knowledge Check -> Reflection), not by display_order across the whole
  -- lesson -- display_order only controls ordering *within* each section.
  insert into public.lesson_blocks (lesson_id, block_type, title, body, display_order) values
  (v_lesson_id, 'objectives', 'What You Will Walk Away With',
    'Identify the parts and functions of a multimeter.' || chr(10) ||
    'Measure voltage, resistance, and continuity using a digital multimeter, step by step.' || chr(10) ||
    'Explain why safety precautions matter every time you pick up a multimeter.',
    10),

  (v_lesson_id, 'tools_materials', 'What You Will Need',
    'A digital multimeter' || chr(10) ||
    'A couple of household dry-cell batteries' || chr(10) ||
    'A resistor or two, if available' || chr(10) ||
    'A length of wire or an old extension cord to test',
    20),
  (v_lesson_id, 'safety', 'Rules Every Technician Lives By',
    'Always select the correct function and range before connecting the probes to a circuit.' || chr(10) ||
    'De-energize (turn off and unplug) circuits when required, especially before measuring resistance or continuity.' || chr(10) ||
    'Keep your hands and the probes dry at all times.' || chr(10) ||
    'Never test resistance or continuity on a live, energized circuit.' || chr(10) ||
    'Inspect probes and wires for damage before each use.' || chr(10) ||
    'Store the multimeter with the dial set to OFF or the highest voltage range when done.',
    30),
  (v_lesson_id, 'checklist', 'Before You Test, Check Yourself',
    'I selected the correct dial setting for what I am measuring' || chr(10) ||
    'I connected the probes the correct way for this type of measurement' || chr(10) ||
    'I considered safety - is this circuit actually safe to touch right now?',
    40),

  (v_lesson_id, 'heading', 'Why Every Technician Carries a Multimeter',
    'Ask any electrician what tool they reach for first when something stops working, and most will say the same thing: a multimeter. It measures voltage, current, and resistance, the three numbers that reveal almost everything happening inside a circuit, without ever having to guess.',
    10),
  (v_lesson_id, 'heading', 'A Broken Lamp, A Real Mystery',
    'Jenny plugs in her study lamp and nothing happens. She checks the outlet, and other appliances plugged into it work fine, so the outlet itself is fine. Is it the bulb? The wire? The switch? The plug? She really does not want to buy a new lamp if only one small part is broken.' || chr(10) ||
    'How could Jenny figure out exactly which part is causing the problem, without taking the whole lamp apart or guessing randomly? Keep this in mind as you read on, because by the end of this lesson you will know exactly what tool she needs and how to use it.',
    20),
  (v_lesson_id, 'definition', 'The Big Three: Voltage, Current, Resistance',
    'Voltage (V) is the electrical push or pressure that moves electrons through a circuit, measured in volts.' || chr(10) ||
    'Current (I) is the rate of flow of electricity through a circuit, measured in amperes.' || chr(10) ||
    'Resistance (R) is the opposition to the flow of current in a circuit, measured in ohms.',
    30),
  (v_lesson_id, 'definition', 'Analog or Digital?',
    'An analog multimeter uses a needle that sweeps across a printed scale, useful for watching a signal fluctuate, and usually cheaper.' || chr(10) ||
    'A digital multimeter shows the reading as plain numbers on a screen. It is more accurate, easier to read at a glance, and the one most beginners should start with.',
    40),
  (v_lesson_id, 'definition', 'Anatomy of a Multimeter',
    'Display - shows the measurement reading, whether a digital screen or an analog needle and scale.' || chr(10) ||
    'Selector (Range) Dial - chooses what you are measuring (voltage, resistance, continuity) and the range.' || chr(10) ||
    'Ports - where the probes plug in: COM (common, usually black), VOmA for voltage/resistance/small current, and 10A for larger current.' || chr(10) ||
    'Test Probes - the red (positive) and black (negative/common) leads you touch to the circuit or component being tested.',
    50),
  (v_lesson_id, 'procedure', 'Reading Voltage Like a Pro',
    'Set the selector dial to the correct voltage type: AC for alternating current, or DC for direct current.' || chr(10) ||
    'Insert the black probe into the COM port and the red probe into the VOmA port.' || chr(10) ||
    'Connect the probes in parallel - touch them to the two points you want to measure, such as both terminals of a battery.' || chr(10) ||
    'Read and record the value shown on the display.',
    60),
  (v_lesson_id, 'heading', 'Worked Example: Checking a AA Battery',
    'You want to know if a AA battery rated 1.5V still has life in it. Set the dial to DC voltage, touch red to the plus terminal and black to the minus terminal.' || chr(10) ||
    'Reading 1.48V? Still in good shape. Reading 0.9V? That battery is weak and should be replaced.',
    70),
  (v_lesson_id, 'procedure', 'Checking Resistance the Right Way',
    'Make sure the component or circuit is powered off and disconnected from any power source - never measure resistance on a live circuit.' || chr(10) ||
    'Set the selector dial to ohms.' || chr(10) ||
    'Touch the probes to each end of the component. Polarity does not matter for resistance.' || chr(10) ||
    'Read and record the value shown on the display.',
    80),
  (v_lesson_id, 'heading', 'Worked Example: Testing a 220-Ohm Resistor',
    'A resistor color code says it should be 220 ohms. After powering off the circuit and touching both probes to its leads, the multimeter reads 218 ohms, close enough to 220 (small differences like this are normal tolerance), so the resistor is working correctly.',
    90),
  (v_lesson_id, 'procedure', 'The Continuity Test: Beep or No Beep?',
    'Set the selector dial to the continuity symbol, often shown as a sound wave or diode symbol.' || chr(10) ||
    'Touch the probes to each end of the wire or component being tested.' || chr(10) ||
    'Listen and watch: a beep and a reading near 0 ohms means the path is complete. No beep and an OL or infinite reading means the path is broken.',
    100),
  (v_lesson_id, 'heading', 'Worked Example: Diagnosing an Extension Cord',
    'An extension cord has stopped working. Touching the probes to each end of one of its internal wires gives a beep and a 0-ohm reading, so that wire is intact. Trying the next wire gives no beep and an OL reading, so that wire is broken - and that is exactly why the cord stopped working.',
    110),

  (v_lesson_id, 'activity', 'Put It Into Practice',
    'Head over to Submissions to complete the "Multimeter Practice Report" activity. If a real multimeter is available, take actual measurements - if not, work through the same scenarios on paper. Either way, you will also revisit Jenny''s lamp and explain how she could solve her mystery.',
    10),

  (v_lesson_id, 'quick_question', 'Quick Check',
    'Which terminal color should the black probe connect to, and why does getting this wrong matter?',
    10),

  (v_lesson_id, 'reflection', 'Back to Jenny''s Lamp',
    'Now that you understand voltage, resistance, and continuity testing - how would you actually help Jenny figure out what is wrong with her lamp? Which test would you try first, and what would each possible result tell you?',
    10);

  -- Activity: combines the hands-on/paper-simulation practice with the Jenny
  -- reflection into one real, submittable task.
  insert into public.assignments (lesson_id, title, instructions, max_score, submission_type, expected_filename_pattern, is_active)
  values (
    v_lesson_id,
    'Multimeter Practice Report',
    'Complete ONE of the following, then write up your results.' || chr(10) ||
    'Option A (hands-on): Measure the voltage of two different household batteries and test the continuity of a wire or old extension cord. Record your dial setting, reading, and what it tells you for each.' || chr(10) ||
    'Option B (no multimeter available): Answer these three scenarios instead. (1) You want to check if a wall outlet is live: what dial setting would you use, and what result would confirm it works? (2) You suspect a fuse wire is broken: what dial setting, and what result would confirm it? (3) You want to check a 100-ohm resistor: what dial setting, and what reading would you expect?' || chr(10) ||
    'Then answer: how could Jenny use a multimeter to find out exactly what is wrong with her lamp?',
    100,
    'link_or_text',
    '{LRN}_{LASTNAME}_MultimeterReport',
    true
  )
  returning id into v_activity_id;

  -- Practice quiz ("Warm-Up Check") -- the pretest questions, low-stakes, more attempts.
  with inserted as (
    insert into public.question_bank (competency_id, question_type, question_text, choices, correct_answer, points, difficulty)
    values
    (v_competency_id, 'multiple_choice', 'What tool is used to measure voltage, current, and resistance?',
      '[{"label":"A","value":"Screwdriver"},{"label":"B","value":"Multimeter"},{"label":"C","value":"Pliers"},{"label":"D","value":"Wire stripper"}]'::jsonb,
      'Multimeter', 1, 'easy'),
    (v_competency_id, 'multiple_choice', 'Which type of multimeter displays readings as numbers on a screen?',
      '[{"label":"A","value":"Analog multimeter"},{"label":"B","value":"Digital multimeter"},{"label":"C","value":"Mechanical multimeter"},{"label":"D","value":"Manual multimeter"}]'::jsonb,
      'Digital multimeter', 1, 'easy'),
    (v_competency_id, 'multiple_choice', 'What unit is used to measure resistance?',
      '[{"label":"A","value":"Volts"},{"label":"B","value":"Amperes"},{"label":"C","value":"Ohms"},{"label":"D","value":"Watts"}]'::jsonb,
      'Ohms', 1, 'easy'),
    (v_competency_id, 'multiple_choice', 'Which probe color is typically connected to the COM port?',
      '[{"label":"A","value":"Red"},{"label":"B","value":"Black"},{"label":"C","value":"Yellow"},{"label":"D","value":"Green"}]'::jsonb,
      'Black', 1, 'easy'),
    (v_competency_id, 'multiple_choice', 'What should you do BEFORE measuring resistance on a circuit?',
      '[{"label":"A","value":"Increase the voltage"},{"label":"B","value":"Turn off/de-energize the circuit"},{"label":"C","value":"Connect both probes to the same point"},{"label":"D","value":"Set the dial to AC voltage"}]'::jsonb,
      'Turn off/de-energize the circuit', 1, 'easy'),
    (v_competency_id, 'multiple_choice', 'What does a continuity test tell you?',
      '[{"label":"A","value":"The exact voltage of a battery"},{"label":"B","value":"Whether a wire has a complete, unbroken path"},{"label":"C","value":"The temperature of a component"},{"label":"D","value":"The brand of the multimeter"}]'::jsonb,
      'Whether a wire has a complete, unbroken path', 1, 'easy'),
    (v_competency_id, 'multiple_choice', 'To measure the voltage of a battery, how should the probes be connected?',
      '[{"label":"A","value":"In series with the battery"},{"label":"B","value":"In parallel across the battery terminals"},{"label":"C","value":"Both probes on the same terminal"},{"label":"D","value":"It does not matter how they are connected"}]'::jsonb,
      'In parallel across the battery terminals', 1, 'easy'),
    (v_competency_id, 'multiple_choice', 'Which of the following is a proper safety precaution when using a multimeter?',
      '[{"label":"A","value":"Use wet hands for a better grip"},{"label":"B","value":"Always select the correct function and range before testing"},{"label":"C","value":"Test resistance on a live circuit"},{"label":"D","value":"Ignore the range setting"}]'::jsonb,
      'Always select the correct function and range before testing', 1, 'easy'),
    (v_competency_id, 'multiple_choice', 'What might a "no beep" result mean during a continuity test?',
      '[{"label":"A","value":"The wire is in good condition"},{"label":"B","value":"The wire is broken (open circuit)"},{"label":"C","value":"The battery is fully charged"},{"label":"D","value":"The multimeter is broken"}]'::jsonb,
      'The wire is broken (open circuit)', 1, 'easy'),
    (v_competency_id, 'multiple_choice', 'Why is it important to select the correct range before measuring?',
      '[{"label":"A","value":"It makes the multimeter look nicer"},{"label":"B","value":"It prevents inaccurate readings and possible damage to the meter"},{"label":"C","value":"It is not important at all"},{"label":"D","value":"It only matters for digital multimeters"}]'::jsonb,
      'It prevents inaccurate readings and possible damage to the meter', 1, 'easy')
    returning id
  )
  select array_agg(id) into v_pretest_ids from inserted;

  insert into public.exams (competency_id, title, description, duration_minutes, attempts_allowed, randomize_questions, show_score_after_submit, status)
  values (
    v_competency_id,
    'Multimeter Warm-Up Check',
    'A quick, low-stakes practice quiz to check your starting point before the lesson. Retake it as many times as you like.',
    10, 5, true, true, 'published'
  )
  returning id into v_pretest_exam_id;

  for i in 1 .. array_length(v_pretest_ids, 1) loop
    insert into public.exam_questions (exam_id, question_id, order_index) values (v_pretest_exam_id, v_pretest_ids[i], i);
  end loop;

  -- Graded assessment -- the 15-item quiz.
  with inserted as (
    insert into public.question_bank (competency_id, question_type, question_text, choices, correct_answer, points, difficulty)
    values
    (v_competency_id, 'multiple_choice', 'What is the primary purpose of a multimeter?',
      '[{"label":"A","value":"To cut and strip wires"},{"label":"B","value":"To measure electrical quantities such as voltage, current, and resistance"},{"label":"C","value":"To generate electricity"},{"label":"D","value":"To store electrical charge"}]'::jsonb,
      'To measure electrical quantities such as voltage, current, and resistance', 1, 'average'),
    (v_competency_id, 'multiple_choice', 'Which type of multimeter is generally recommended for beginners due to its ease of reading?',
      '[{"label":"A","value":"Analog multimeter"},{"label":"B","value":"Digital multimeter"},{"label":"C","value":"Mechanical multimeter"},{"label":"D","value":"Vintage multimeter"}]'::jsonb,
      'Digital multimeter', 1, 'average'),
    (v_competency_id, 'multiple_choice', 'Which part of the multimeter is used to select the quantity and range to be measured?',
      '[{"label":"A","value":"Display"},{"label":"B","value":"Test probes"},{"label":"C","value":"Selector (range) dial"},{"label":"D","value":"Battery compartment"}]'::jsonb,
      'Selector (range) dial', 1, 'average'),
    (v_competency_id, 'multiple_choice', 'The black test probe is normally connected to which port?',
      '[{"label":"A","value":"VOmA"},{"label":"B","value":"10A"},{"label":"C","value":"COM"},{"label":"D","value":"AC"}]'::jsonb,
      'COM', 1, 'average'),
    (v_competency_id, 'multiple_choice', 'What is the correct probe connection when measuring voltage?',
      '[{"label":"A","value":"Probes in series with the circuit"},{"label":"B","value":"Probes in parallel across the two points being measured"},{"label":"C","value":"Only the red probe is used"},{"label":"D","value":"Probes must be crossed"}]'::jsonb,
      'Probes in parallel across the two points being measured', 1, 'average'),
    (v_competency_id, 'multiple_choice', 'Which unit is used to express resistance?',
      '[{"label":"A","value":"Volts"},{"label":"B","value":"Amperes"},{"label":"C","value":"Watts"},{"label":"D","value":"Ohms"}]'::jsonb,
      'Ohms', 1, 'average'),
    (v_competency_id, 'multiple_choice', 'Before measuring resistance, what must you do first?',
      '[{"label":"A","value":"Increase the circuit voltage"},{"label":"B","value":"Turn off/de-energize the circuit"},{"label":"C","value":"Set the dial to AC voltage"},{"label":"D","value":"Connect both probes to the same terminal"}]'::jsonb,
      'Turn off/de-energize the circuit', 1, 'average'),
    (v_competency_id, 'multiple_choice', 'A continuity test that produces a beep and a near-0-ohm reading indicates:',
      '[{"label":"A","value":"A broken wire"},{"label":"B","value":"A complete, unbroken path"},{"label":"C","value":"A dead battery"},{"label":"D","value":"An incorrect dial setting"}]'::jsonb,
      'A complete, unbroken path', 1, 'average'),
    (v_competency_id, 'multiple_choice', 'An OL or infinite reading during a continuity test most likely means:',
      '[{"label":"A","value":"The wire is in excellent condition"},{"label":"B","value":"The wire or path is broken (open circuit)"},{"label":"C","value":"The multimeter needs a new battery"},{"label":"D","value":"The voltage is too high"}]'::jsonb,
      'The wire or path is broken (open circuit)', 1, 'average'),
    (v_competency_id, 'multiple_choice', 'Why should you always check the range setting before measuring?',
      '[{"label":"A","value":"It has no real effect on the reading"},{"label":"B","value":"To prevent inaccurate readings or possible damage to the meter"},{"label":"C","value":"It only matters when using an analog multimeter"},{"label":"D","value":"It is only needed for continuity tests"}]'::jsonb,
      'To prevent inaccurate readings or possible damage to the meter', 1, 'average'),
    (v_competency_id, 'multiple_choice', 'Which of the following is an example of proper OSH practice when using a multimeter?',
      '[{"label":"A","value":"Testing resistance on a live circuit for convenience"},{"label":"B","value":"Keeping hands and probes dry at all times"},{"label":"C","value":"Ignoring the correct range setting"},{"label":"D","value":"Using damaged probes if they still work somewhat"}]'::jsonb,
      'Keeping hands and probes dry at all times', 1, 'average'),
    (v_competency_id, 'multiple_choice', 'You measure a battery rated 1.5V and get a reading of 0.9V. What does this most likely indicate?',
      '[{"label":"A","value":"The battery is fully charged"},{"label":"B","value":"The battery is weak and should be replaced"},{"label":"C","value":"The multimeter is broken"},{"label":"D","value":"The reading is completely normal for a new battery"}]'::jsonb,
      'The battery is weak and should be replaced', 1, 'average'),
    (v_competency_id, 'multiple_choice', 'What should be done with the multimeter after use?',
      '[{"label":"A","value":"Leave the probes connected to a circuit"},{"label":"B","value":"Store it properly with the dial set to OFF or the highest voltage range"},{"label":"C","value":"Leave it exposed to moisture"},{"label":"D","value":"Leave the range dial set to resistance"}]'::jsonb,
      'Store it properly with the dial set to OFF or the highest voltage range', 1, 'average'),
    (v_competency_id, 'multiple_choice', 'Which quantity represents the push or pressure that moves electrons through a circuit?',
      '[{"label":"A","value":"Resistance"},{"label":"B","value":"Current"},{"label":"C","value":"Voltage"},{"label":"D","value":"Continuity"}]'::jsonb,
      'Voltage', 1, 'average'),
    (v_competency_id, 'multiple_choice', 'Ana wants to check if a length of wire is broken without powering on any circuit. What function should she use?',
      '[{"label":"A","value":"AC Voltage"},{"label":"B","value":"DC Voltage"},{"label":"C","value":"Continuity"},{"label":"D","value":"10A Current"}]'::jsonb,
      'Continuity', 1, 'average')
    returning id
  )
  select array_agg(id) into v_assessment_ids from inserted;

  insert into public.exams (competency_id, title, description, duration_minutes, attempts_allowed, randomize_questions, show_score_after_submit, status)
  values (
    v_competency_id,
    'Multimeter Skills Assessment',
    'The graded assessment for this lesson - 15 items covering multimeter parts, procedures, and safety.',
    20, 2, false, true, 'published'
  )
  returning id into v_assessment_exam_id;

  for i in 1 .. array_length(v_assessment_ids, 1) loop
    insert into public.exam_questions (exam_id, question_id, order_index) values (v_assessment_exam_id, v_assessment_ids[i], i);
  end loop;

  raise notice 'Lesson: %, Activity: %, Warm-Up Quiz: %, Assessment: %', v_lesson_id, v_activity_id, v_pretest_exam_id, v_assessment_exam_id;
end $$;
