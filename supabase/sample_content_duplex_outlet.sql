-- One-off sample content for end-to-end testing (lesson + activity + quiz).
-- NOT a numbered migration — this is teacher-authored demo content, safe to
-- run once in the Supabase SQL Editor. Re-running it will create duplicates
-- (it doesn't check "already exists" the way schema migrations do), so only
-- run it once, or delete the created rows first if you want to re-seed.

do $$
declare
  v_competency_id uuid;
  v_lesson_id uuid;
  v_assignment_id uuid;
  v_exam_id uuid;
  v_q1 uuid;
  v_q2 uuid;
  v_q3 uuid;
  v_q4 uuid;
  v_q5 uuid;
begin
  -- Competency (reuses one with this code if it already exists)
  select id into v_competency_id from public.competencies where code = 'LO2.1' limit 1;
  if v_competency_id is null then
    insert into public.competencies (code, title, description, grade_level, order_index)
    values (
      'LO2.1',
      'Install Wiring Devices',
      'Install switches, convenience outlets, and other wiring devices following safe practice.',
      11,
      20
    )
    returning id into v_competency_id;
  end if;

  -- Lesson (published so it shows up immediately for learners)
  insert into public.lessons (competency_id, title, slug, summary, estimated_minutes, order_index, published)
  values (
    v_competency_id,
    'Wiring a Duplex Convenience Outlet',
    'wiring-a-duplex-convenience-outlet-' || substr(gen_random_uuid()::text, 1, 8),
    'Learn how to safely wire and install a duplex convenience outlet, from stripping wire to testing the finished connection.',
    45,
    10,
    true
  )
  returning id into v_lesson_id;

  -- Lesson content blocks
  insert into public.lesson_blocks (lesson_id, block_type, title, body, display_order) values
  (v_lesson_id, 'objectives', 'What You Will Learn',
    'Identify the parts of a duplex convenience outlet.' || chr(10) ||
    'Wire a duplex outlet using proper stripping and termination technique.' || chr(10) ||
    'Test a finished outlet installation for correct polarity and grounding.',
    10),
  (v_lesson_id, 'safety', 'Before You Begin',
    'Always de-energize the circuit at the breaker before working.' || chr(10) ||
    'Verify the circuit is dead using a non-contact voltage tester.' || chr(10) ||
    'Wear insulated gloves and safety glasses when stripping wire.',
    20),
  (v_lesson_id, 'tools_materials', 'Tools and Materials',
    'Duplex convenience outlet (grounding type)' || chr(10) ||
    'Wire stripper/cutter' || chr(10) ||
    'Insulated screwdriver (flathead and Phillips)' || chr(10) ||
    'Non-contact voltage tester' || chr(10) ||
    '12 AWG or 14 AWG THHN wire',
    30),
  (v_lesson_id, 'heading', 'Explore the Lesson',
    'A duplex convenience outlet lets you plug in two appliances from a single wiring device. Correct wiring keeps hot, neutral, and ground conductors in their proper terminals so the outlet is safe to use.',
    40),
  (v_lesson_id, 'procedure', 'Wiring Steps',
    'De-energize the circuit and confirm it is dead with a voltage tester.' || chr(10) ||
    'Strip about 3/4 inch of insulation from each conductor.' || chr(10) ||
    'Connect the black (hot) wire to a brass-colored terminal screw.' || chr(10) ||
    'Connect the white (neutral) wire to a silver-colored terminal screw.' || chr(10) ||
    'Connect the bare or green (ground) wire to the green grounding screw.' || chr(10) ||
    'Carefully fold the wires into the box and secure the outlet with mounting screws.' || chr(10) ||
    'Restore power and test the outlet with a voltage tester or outlet tester.',
    50),
  (v_lesson_id, 'checklist', 'Before You Test',
    'Circuit breaker is off and verified dead' || chr(10) ||
    'All terminal screws are tight with no exposed copper' || chr(10) ||
    'Ground wire is connected to the green screw' || chr(10) ||
    'Outlet is securely mounted in the box',
    60),
  (v_lesson_id, 'quick_question', 'Check Your Understanding',
    'Which terminal color should the black (hot) wire connect to on a standard duplex outlet?',
    70),
  (v_lesson_id, 'reflection', 'Reflect',
    'Think of a situation at home where a poorly wired outlet could create a hazard. What would you check first?',
    80);

  -- Activity tied to this lesson
  insert into public.assignments (lesson_id, title, instructions, max_score, submission_type, expected_filename_pattern, is_active)
  values (
    v_lesson_id,
    'Duplex Outlet Wiring Documentation',
    'Wire a duplex convenience outlet following the steps in this lesson. Take a clear photo or short video of your finished, tested outlet and upload it as a Google Drive/photo link, along with a short written explanation of how you verified it was safe.',
    100,
    'link_or_text',
    '{LRN}_{LASTNAME}_DuplexOutlet',
    true
  )
  returning id into v_assignment_id;

  -- Question bank (5 questions covering every question type the app supports)
  insert into public.question_bank (competency_id, question_type, question_text, choices, correct_answer, explanation, points, difficulty)
  values (
    v_competency_id, 'multiple_choice',
    'On a standard duplex convenience outlet, which terminal should the black (hot) wire connect to?',
    '[{"label":"A","value":"Brass-colored terminal"},{"label":"B","value":"Silver-colored terminal"},{"label":"C","value":"Green grounding terminal"},{"label":"D","value":"Any terminal, it does not matter"}]'::jsonb,
    'Brass-colored terminal',
    'The black (hot) conductor always connects to the brass-colored terminal; white (neutral) goes to silver, and ground goes to the green screw.',
    2, 'easy'
  ) returning id into v_q1;

  insert into public.question_bank (competency_id, question_type, question_text, choices, correct_answer, explanation, points, difficulty)
  values (
    v_competency_id, 'multiple_choice',
    'What is the first step before working on any wiring device?',
    '[{"label":"A","value":"Strip the wires"},{"label":"B","value":"De-energize the circuit and verify it is dead"},{"label":"C","value":"Mount the outlet in the box"},{"label":"D","value":"Connect the ground wire"}]'::jsonb,
    'De-energize the circuit and verify it is dead',
    'Safety always comes first: shut off the breaker and confirm with a voltage tester before touching any conductor.',
    2, 'easy'
  ) returning id into v_q2;

  insert into public.question_bank (competency_id, question_type, question_text, choices, correct_answer, explanation, points, difficulty)
  values (
    v_competency_id, 'true_false',
    'The ground wire should be connected to a brass-colored terminal.',
    null, 'false',
    'The ground wire connects to the green grounding screw, not a brass terminal.',
    1, 'easy'
  ) returning id into v_q3;

  insert into public.question_bank (competency_id, question_type, question_text, choices, correct_answer, explanation, points, difficulty)
  values (
    v_competency_id, 'identification',
    'What tool is used to confirm a circuit is de-energized before working on it?',
    null, 'non-contact voltage tester',
    'A non-contact voltage tester (or voltage tester) confirms a circuit is dead without touching live conductors.',
    2, 'average'
  ) returning id into v_q4;

  insert into public.question_bank (competency_id, question_type, question_text, choices, correct_answer, explanation, points, difficulty)
  values (
    v_competency_id, 'essay',
    'Explain, in your own words, why proper polarity (correct hot/neutral/ground wiring) matters in a duplex convenience outlet.',
    null, null,
    'Graded manually — look for mention of shock/fire hazard prevention and safe appliance operation.',
    5, 'hots'
  ) returning id into v_q5;

  -- Exam (published, 2 attempts allowed)
  insert into public.exams (competency_id, title, description, duration_minutes, attempts_allowed, randomize_questions, show_score_after_submit, status)
  values (
    v_competency_id,
    'Duplex Outlet Wiring Quiz',
    'A short quiz covering safe wiring practice for duplex convenience outlets.',
    15, 2, false, true, 'published'
  )
  returning id into v_exam_id;

  insert into public.exam_questions (exam_id, question_id, order_index) values
  (v_exam_id, v_q1, 1),
  (v_exam_id, v_q2, 2),
  (v_exam_id, v_q3, 3),
  (v_exam_id, v_q4, 4),
  (v_exam_id, v_q5, 5);

  raise notice 'Sample content created — lesson: %, assignment: %, exam: %', v_lesson_id, v_assignment_id, v_exam_id;
end $$;
