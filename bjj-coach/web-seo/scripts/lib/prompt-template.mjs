const STYLE_LINE = [
  'Cartoon kawaii mascot illustration.',
  'Cute brown otter character with cream-colored face and belly, round body, friendly big dark eyes.',
  'Wearing a traditional white Brazilian Jiu-Jitsu gi with a black belt.',
  'Clean black lineart, soft shading, warm muted colors.',
  'Warm cream (#faf9f5) background, flat and uncluttered.',
  'Style MUST match the reference image exactly — same otter design, same linework, same proportions, same color palette.',
  'No text, no letters, no logos, no watermarks, no branding, no English writing of any kind.',
].join(' ');

const categoryVisual = {
  submission: 'Two otters on a blue training mat — one applying a finishing submission, the other in the defensive position. Side view, clearly showing the grip and body position.',
  sweep: 'Two otters on a blue training mat — the bottom otter reversing the top otter to end up on top. Motion and weight distribution visible.',
  escape: 'Two otters on a blue training mat — the bottom otter in the process of escaping a bad position. The escape mechanic is the focus.',
  pass: 'Two otters on a blue training mat — the top otter in the process of moving around the bottom otter\'s guard. Shows the passing angle.',
  takedown: 'Two otters standing on a blue training mat, one taking the other down. Stance, grip, and momentum are the focus.',
  control: 'Two otters on a blue training mat with one otter in a dominant controlling position over the other. Pressure and pinning visible.',
};

const positionPhrases = {
  'closed-guard': 'The bottom otter has legs wrapped around the top otter\'s torso with ankles crossed behind the back.',
  'open-guard': 'The bottom otter on its back with knees up and feet/legs actively engaging the top otter.',
  'half-guard': 'The bottom otter trapping one of the top otter\'s legs between its own legs.',
  'mount': 'The top otter straddles the bottom otter\'s torso, knees on the mat beside ribs.',
  'side-control': 'The top otter chest-to-chest across the bottom otter, perpendicular alignment.',
  'back': 'The top otter behind the bottom otter, with hooks or body-triangle control.',
  'turtle': 'The bottom otter on hands and knees in a defensive turtle shape.',
  'knee-on-belly': 'The top otter with one knee pressed on the bottom otter\'s stomach, other leg posted out.',
};

/**
 * Build a fal.ai nano-banana prompt from a Technique frontmatter record.
 * The prompt intentionally describes the VISUAL, not the technique name.
 * Matches the otter mascot style via reference image + explicit style directives.
 */
export function buildTechniquePrompt(record) {
  const categoryLine = categoryVisual[record.category] ?? 'Two otters practicing jiu-jitsu on a blue training mat.';
  const positionLine = positionPhrases[record.parentPositionId] ?? '';

  const action = (record.steps ?? [])
    .slice(0, 3)
    .map((s) => s.detail.replace(/[\n\r]+/g, ' ').trim())
    .filter(Boolean)
    .join(' ');

  const altHint = record.heroImage?.alt ? `Subject: ${record.heroImage.alt}.` : '';

  const subject = [
    altHint,
    `Technique: ${record.name}.`,
    categoryLine,
    positionLine,
    action ? `Action shown: ${action}` : '',
  ]
    .filter(Boolean)
    .join(' ');

  return `${STYLE_LINE}\n\n${subject}\n\n1200x800 horizontal composition. Clear readable pose, side view, no motion blur.`;
}
