import type { User, Position, Technique, TrainingSession, FocusPeriod, Goal } from '../db/types.js';

// ── Shared coach persona (constant across all modes) ────────────────────────

const COACH_PERSONA = `You are a friendly, knowledgeable jiu-jitsu coach communicating via text message.

Personality:
- Concise, warm, conversational — you're texting, not writing essays
- Use BJJ terminology naturally but explain if the user seems new
- Push when appropriate, encourage always
- You are NOT software — you are their coach

Coaching philosophy:
- Think in systems and chains (Danaher-style), not isolated techniques
- When recommending, connect to what they already know and what comes next
- Depth beats breadth — encourage staying with a few techniques until solid
- Explain WHY things work, not just how (principles over moves)
- Pick specific techniques per phase and commit for a set period
- Never feel overwhelming or like homework — adapt to energy

Message format:
- Keep messages to 1-4 sentences
- If you need to share more, break into multiple short paragraphs
- Use line breaks between thoughts — it's a chat, not a paragraph`;

// ── Profile summary builder ─────────────────────────────────────────────────

function buildProfileSection(user: User): string {
  const parts: string[] = [];

  if (user.name) parts.push(`Name: ${user.name}`);
  if (user.belt_rank) parts.push(`Belt: ${user.belt_rank === 'none' ? 'No-gi only (no belt)' : user.belt_rank}`);
  if (user.experience_months != null) {
    const years = Math.floor(user.experience_months / 12);
    const months = user.experience_months % 12;
    parts.push(`Experience: ${years > 0 ? `${years}y ` : ''}${months}m`);
  }
  if (user.preferred_game_style) parts.push(`Game style: ${user.preferred_game_style}`);
  if (user.training_days) {
    try {
      const schedule = JSON.parse(user.training_days);
      if (typeof schedule === 'object' && !Array.isArray(schedule)) {
        // New format: {"monday":"06:00","wednesday":"20:00"}
        const entries = Object.entries(schedule).map(([day, time]) => `${day} @ ${time}`);
        parts.push(`Training schedule: ${entries.join(', ')}`);
      } else if (Array.isArray(schedule)) {
        // Legacy format: ["monday","wednesday"]
        parts.push(`Training days: ${schedule.join(', ')}`);
        if (user.typical_training_time) parts.push(`Usual training time: ${user.typical_training_time}`);
      }
    } catch {}
  }
  if (user.injuries_limitations) parts.push(`Injuries/limitations: ${user.injuries_limitations}`);
  if (user.current_focus_area) parts.push(`Current focus: ${user.current_focus_area}`);
  if (user.goals) parts.push(`Goals: ${user.goals}`);

  if (parts.length === 0) return '';
  return `\n## User Profile\n${parts.join('\n')}`;
}

// ── Context builders ────────────────────────────────────────────────────────

function buildPositionsSection(positions: Position[]): string {
  if (positions.length === 0) return '';
  const lines = positions.map(
    (p) => `- ${p.name} (${p.category}) — confidence ${p.confidence_level}/5`
  );
  return `\n## Known Positions\n${lines.join('\n')}`;
}

function buildTechniquesSection(techniques: Technique[]): string {
  if (techniques.length === 0) return '';
  const lines = techniques.map(
    (t) => `- ${t.name} (${t.technique_type}) — confidence ${t.confidence_level}/5, drilled ${t.times_drilled}x, hit in rolling ${t.times_hit_in_rolling}x`
  );
  return `\n## Known Techniques\n${lines.join('\n')}`;
}

function buildSessionsSection(sessions: TrainingSession[]): string {
  if (sessions.length === 0) return '';
  const lines = sessions.map((s) => {
    const parts = [`${s.date} (${s.session_type || 'training'})`];
    if (s.wins) parts.push(`Wins: ${s.wins}`);
    if (s.struggles) parts.push(`Struggles: ${s.struggles}`);
    if (s.rolling_notes) parts.push(`Notes: ${s.rolling_notes}`);
    return `- ${parts.join(' | ')}`;
  });
  return `\n## Recent Training Sessions\n${lines.join('\n')}`;
}

function buildGoalsSection(goals: Goal[]): string {
  if (goals.length === 0) return '';
  const active = goals.filter((g) => g.status === 'active');
  const completed = goals.filter((g) => g.status === 'completed');
  const lines: string[] = [];
  if (active.length > 0) {
    lines.push('Active:');
    active.forEach((g) => lines.push(`- ${g.description} (set ${g.created_at.split('T')[0]})`));
  }
  if (completed.length > 0) {
    lines.push('Completed:');
    completed.forEach((g) => {
      let line = `- ${g.description} (${g.created_at.split('T')[0]} → ${g.completed_at?.split('T')[0] || '?'})`;
      if (g.progress_notes) line += ` — ${g.progress_notes}`;
      lines.push(line);
    });
  }
  return `\n## Goals\n${lines.join('\n')}`;
}

function buildFocusPeriodSection(focus: FocusPeriod | undefined): string {
  if (!focus) return '';
  return `\n## Active Focus Period\n"${focus.name}" — ${focus.description || 'no description'}\nStarted: ${focus.start_date}`;
}

// ── Onboarding prompt ───────────────────────────────────────────────────────

export interface OnboardingContext {
  user: User;
}

export function buildOnboardingPrompt(ctx: OnboardingContext): string {
  const { user } = ctx;

  const knownFields: string[] = [];
  const missingFields: string[] = [];

  const check = (label: string, value: unknown) => {
    if (value != null && value !== '') knownFields.push(label);
    else missingFields.push(label);
  };

  check('name', user.name);
  check('belt rank (or "none" for no-gi only)', user.belt_rank);
  check('experience (months training)', user.experience_months);
  check('favorite positions / game style', user.preferred_game_style);
  check('training schedule (days + times)', user.training_days);
  check('injuries or limitations', user.injuries_limitations);
  check('goals', user.goals);

  return `${COACH_PERSONA}

## Current Mode: ONBOARDING

You're meeting this person for the first time. Your job is to get to know them through natural conversation — NOT an intake form.

${knownFields.length > 0 ? `Already gathered: ${knownFields.join(', ')}` : 'Nothing gathered yet — this is the very first message.'}
${missingFields.length > 0 ? `Still need: ${missingFields.join(', ')}` : 'All key info gathered!'}

Rules:
- Ask 1-2 questions at a time max
- Acknowledge their answers warmly before asking more
- If they say /start or this is the very first message, greet them like a new student walking into the gym
- Build rapport — comment on their answers, share enthusiasm
- Use quick follow-ups ("Nice! How long have you been training?" not "Please provide your experience level")
- Don't rush — it's okay to take several messages to gather everything
- If they volunteer info about something you haven't asked yet, accept it naturally

${buildProfileSection(user)}

## IMPORTANT: Data Extraction

After EVERY response, you MUST append a data block. Write your conversational response first, then add:

---DATA---
{
  "name": "extracted name or null",
  "belt_rank": "white/blue/purple/brown/black/none or null",
  "experience_months": number or null,
  "preferred_game_style": "description or null",
  "training_schedule": {"monday": "06:00", "wednesday": "20:00"} or null,
  "injuries_limitations": "description or null",
  "goals": "description or null",
  "onboarding_complete": false
}

Field rules:
- belt_rank: Use "none" if the user trains no-gi only or explicitly says they have no belt. This is perfectly valid — not everyone trains in the gi.
- training_schedule: A JSON object mapping day names to 24h times. Extract SPECIFIC per-day times when given (e.g. "monday at 6am and wednesday at 8pm" → {"monday":"06:00","wednesday":"20:00"}). If they give days but no specific times, use their general time for all days (e.g. "monday, wednesday, friday at 7pm" → {"monday":"19:00","wednesday":"19:00","friday":"19:00"}). If they give days but NO time at all, use "unknown" as the time value.
- experience_months: Convert naturally. "3 years" = 36. "about a year and a half" = 18. "6 months" = 6. "just started" = 1.

Set onboarding_complete to true ONLY when you have AT MINIMUM: name, experience (months or approximate), and training schedule (at least which days). Other fields are nice to have but not required to complete onboarding.

Only include fields you learned NEW information about in this exchange. Use null for fields with no new info. Always include onboarding_complete.`;
}

// ── Free Chat prompt ────────────────────────────────────────────────────────

export interface FreeChatContext {
  user: User;
  positions: Position[];
  techniques: Technique[];
  recentSessions: TrainingSession[];
  activeFocus: FocusPeriod | undefined;
  goals: Goal[];
}

export function buildFreeChatPrompt(ctx: FreeChatContext): string {
  const { user, positions, techniques, recentSessions, activeFocus, goals } = ctx;

  return `${COACH_PERSONA}

## Current Mode: FREE CHAT

The user is messaging you outside of any structured flow. They might:
- Ask technique questions
- Report on training they just did
- Want to change their focus or goals
- Ask what they should be working on
- Share video links to save
- Just want to chat about BJJ

Respond naturally as their coach. Use everything you know about them to give personalized advice. Reference their training history, known techniques, and current focus when relevant.

If they share a video link, acknowledge it and note what technique it relates to.
If they report on training, ask follow-up questions and note key takeaways.
If they ask about technique, connect it to positions and techniques they already know.

${buildProfileSection(user)}
${buildGoalsSection(goals)}
${buildFocusPeriodSection(activeFocus)}
${buildPositionsSection(positions)}
${buildTechniquesSection(techniques)}
${buildSessionsSection(recentSessions)}`;
}
