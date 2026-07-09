-- EIM NC II Learning Hub Sample Data
-- Run after schema.sql.

insert into public.sections (name, grade_level, school_year)
values
  ('Grade 11 - Apollo', 11, '2026-2027'),
  ('Grade 12 - EIM', 12, '2026-2027')
on conflict do nothing;

insert into public.competencies (code, title, description, grade_level, order_index)
values
  ('EIM11-OHS', 'Observe Occupational Health and Safety', 'Safety rules, hazards, PPE, and basic workplace protocols in EIM.', 11, 1),
  ('EIM11-TM', 'Prepare Electrical Tools and Materials', 'Identification, proper use, and maintenance of electrical tools and materials.', 11, 2),
  ('EIM11-MC', 'Perform Mensuration and Calculation', 'Basic electrical quantities, units, and computations needed in installation work.', 11, 3),
  ('EIM12-BC', 'Perform Branch Circuit Calculation', 'Continuous and non-continuous loads, circuit protection, and main breaker sizing.', 12, 4)
;

insert into public.lessons (competency_id, title, slug, summary, content_md, estimated_minutes, order_index, published)
select id,
  'Introduction to Electrical Safety and PPE',
  'introduction-to-electrical-safety-and-ppe',
  'Learn the basic safety mindset, common electrical hazards, and proper PPE before performing EIM tasks.',
  '## Lesson Focus
Electrical work is useful but dangerous when handled carelessly. Before touching conductors, tools, panels, or wiring devices, the learner must understand safety first.

## Why Safety Comes First
Electric shock, burns, fire, falling objects, and tool injuries can happen when learners rush the task or ignore instructions.

## Common EIM Hazards
- Exposed live conductor
- Damaged insulation
- Wet working area
- Overloaded circuit
- Improper use of tools
- Lack of PPE

## Basic PPE
- Safety shoes
- Gloves appropriate for the task
- Safety goggles
- Hard hat when required
- Proper working clothes

## Key Reminder
Do not energize a circuit unless the teacher has inspected the setup. In EIM, safety is not optional. It is the first requirement.',
  45,
  1,
  true
from public.competencies where code = 'EIM11-OHS';

insert into public.lessons (competency_id, title, slug, summary, content_md, estimated_minutes, order_index, published)
select id,
  'Identifying Electrical Tools and Materials',
  'identifying-electrical-tools-and-materials',
  'Identify common EIM tools and materials and explain their proper uses.',
  '## Lesson Focus
Learners must be able to identify tools and materials before using them in actual wiring activities.

## Hand Tools
- Screwdriver: used for tightening and loosening screws
- Pliers: used for gripping, bending, cutting, and twisting wires
- Wire stripper: used to remove insulation without damaging the conductor
- Utility knife: used for controlled cutting tasks

## Measuring Tools
- Steel tape: used for measuring installation distances
- Multimeter: used for measuring voltage, resistance, and continuity

## Electrical Materials
- Conductors and cables
- Conduits and fittings
- Junction boxes
- Switches and convenience outlets
- Circuit breakers

## Skill Check
A good EIM learner does not only name the tool. The learner must know when, why, and how it should be used safely.',
  45,
  2,
  true
from public.competencies where code = 'EIM11-TM';

insert into public.question_bank (competency_id, question_type, question_text, choices, correct_answer, explanation, points, difficulty)
select id, 'multiple_choice', 'Which PPE protects the eyes from flying particles during electrical work?',
  '[{"label":"A. Safety goggles","value":"A"},{"label":"B. Rubber shoes","value":"B"},{"label":"C. Utility knife","value":"C"},{"label":"D. Junction box","value":"D"}]'::jsonb,
  'A', 'Safety goggles protect the eyes from dust, chips, and flying particles.', 1, 'easy'
from public.competencies where code = 'EIM11-OHS';

insert into public.question_bank (competency_id, question_type, question_text, choices, correct_answer, explanation, points, difficulty)
select id, 'multiple_choice', 'What should a learner do before energizing a practice circuit?',
  '[{"label":"A. Turn it on immediately","value":"A"},{"label":"B. Ask a classmate to test it","value":"B"},{"label":"C. Let the teacher inspect the setup first","value":"C"},{"label":"D. Hold the wire to check if it is live","value":"D"}]'::jsonb,
  'C', 'The teacher must inspect the setup before energizing the circuit.', 1, 'average'
from public.competencies where code = 'EIM11-OHS';

insert into public.question_bank (competency_id, question_type, question_text, choices, correct_answer, explanation, points, difficulty)
select id, 'true_false', 'A wet working area increases the risk of electric shock.',
  '[{"label":"True","value":"true"},{"label":"False","value":"false"}]'::jsonb,
  'true', 'Water lowers resistance and increases shock risk.', 1, 'easy'
from public.competencies where code = 'EIM11-OHS';

insert into public.question_bank (competency_id, question_type, question_text, choices, correct_answer, explanation, points, difficulty)
select id, 'identification', 'This tool is used to remove insulation from a wire without damaging the conductor.',
  null,
  'wire stripper', 'A wire stripper is designed to remove insulation properly.', 1, 'easy'
from public.competencies where code = 'EIM11-TM';

insert into public.question_bank (competency_id, question_type, question_text, choices, correct_answer, explanation, points, difficulty)
select id, 'multiple_choice', 'A learner sees a damaged extension cord during practice. What is the best action?',
  '[{"label":"A. Continue using it carefully","value":"A"},{"label":"B. Report and remove it from use","value":"B"},{"label":"C. Cover it with paper","value":"C"},{"label":"D. Ignore it because it still works","value":"D"}]'::jsonb,
  'B', 'Damaged electrical equipment must be reported and removed from use.', 1, 'hots'
from public.competencies where code = 'EIM11-OHS';

with exam_insert as (
  insert into public.exams (competency_id, title, description, duration_minutes, attempts_allowed, status)
  select id,
    'Safety and Tools Diagnostic Quiz',
    'A short diagnostic quiz covering EIM safety, PPE, and basic tools.',
    20,
    1,
    'published'
  from public.competencies where code = 'EIM11-OHS'
  returning id
)
insert into public.exam_questions (exam_id, question_id, order_index)
select exam_insert.id, qb.id, row_number() over (order by qb.created_at)
from exam_insert, public.question_bank qb
where qb.question_text in (
  'Which PPE protects the eyes from flying particles during electrical work?',
  'What should a learner do before energizing a practice circuit?',
  'A wet working area increases the risk of electric shock.',
  'A learner sees a damaged extension cord during practice. What is the best action?'
);

insert into public.assignments (lesson_id, title, instructions, max_score, rubric, submission_type)
select id,
  'Tool Identification Photo Output',
  'Take a photo of at least five safe household/electrical tools or materials. Label each item and explain its use. Submit a Google Drive link or image link plus a short explanation.',
  100,
  '{"criteria":[{"name":"Accuracy","points":40},{"name":"Completeness","points":30},{"name":"Safety awareness","points":20},{"name":"Clarity","points":10}]}'::jsonb,
  'link_or_text'
from public.lessons where slug = 'identifying-electrical-tools-and-materials';
