import type Database from 'better-sqlite3';

/**
 * Compact seed format: category → subcategory → [starting positions]
 * Each (subcategory, position) pair becomes one row in technique_library.
 */

type Category = 'submission' | 'back_take' | 'guard_pass' | 'sweep' | 'takedown' | 'escape';

const LIBRARY: Record<Category, Record<string, string[]>> = {
  submission: {
    'Americana': ['Half Guard (Top)', 'Mount', 'North South', 'Scarf Hold', 'Side Control'],
    'Anaconda Choke': ['Front Headlock', 'Sprawl', 'Turtle Position'],
    'Ankle Lock': ['Reap/Leg Knot', 'Single X Guard', 'Leg Drag (Cross Body)', '411/Saddle (Far Side Outside)', '411/Saddle (Inside)', 'Outside Leg Control', 'Inside Leg Control (Tripod)'],
    'Arm Triangle Choke': ['Knee on Belly', 'Mount', 'North South', 'Side Control'],
    'Aoki Lock': ['411 Position', '50/50 Guard', 'Butterfly Ashi', 'Butterfly Hook Setup', 'Standard Ashi Garami', 'Two Feet on Belly', 'Z Lock Position'],
    'Armbar': ['Knee on Belly (180°)', 'Side Control (180°)', 'Knee on Belly (360°)', '50/50 Guard', 'Back Control', 'Closed Guard', 'Crucifix', 'Half Guard (Top)', 'Mount', 'Open Guard', 'Side Control', 'Standing (Flying)', 'Turtle Position', 'Closed Guard (Far Side Pressing)', 'Omoplata Setup (Forward)', 'Half Guard Bottom (Kimura Roll)', 'Knee on Belly (Near Side)', 'Side Control (Near Side)'],
    'Baratoplata': ['Closed Guard', 'Knee on Belly', 'Mount', 'Side Control'],
    'Baseball Choke': ['Closed Guard', 'Knee on Belly'],
    'Bicep Slicer': ['North South', 'Side Control'],
    'Boston Crab': ['Side Control', 'Turtle Position'],
    'Bow and Arrow': ['Back Control', 'Turtle (Modified)'],
    'Brabo Choke': ['Failed Guard Pass', 'Half Guard (Top)', 'Side Control', 'Turtle Position'],
    'Buggy Choke': ['Half Guard (Bottom)', 'Side Control (Bottom)'],
    'Calf Slicer': ['Truck Position'],
    'Can Opener': ['Closed Guard'],
    'Clock Choke': ['Kesa Gatame', 'Side Control', 'Turtle Position'],
    'Cross Choke': ['Closed Guard', 'Half Guard (Bottom)', 'Half Guard (Top)', 'Mount', 'Side Control'],
    "D'arce Choke": ['Front Headlock', 'Half Guard', 'Side Control', 'Turtle Position'],
    'Electric Chair': ['Half Guard (Bottom)', 'Lockdown'],
    'Estima Lock': ['50/50 Guard', 'Half Guard (Knee Shield)', 'Half Guard (Top)', 'Open Guard Passing', 'Reverse De La Riva Guard', 'Single Leg X Guard', 'Standing vs Open Guard', 'X Guard'],
    'Ezekiel Choke': ['Closed Guard (Bottom)', 'Closed Guard (Top)', 'Mount (Bottom)', 'Mount (Top)', 'Side Control'],
    'Gogoplata': ['Closed Guard', 'Mount', 'Rubber Guard'],
    'Groin Stretch': ['Truck Position'],
    'Guillotine Choke': ['Half Guard (10 Finger)', 'Turtle Position (Arm-In)', 'Butterfly Guard (With Sweep)', 'Closed Guard', 'Front Headlock', 'Guard Pull', 'Half Guard', 'Standing', 'Half Guard (High Elbow)', 'Half Guard (Power)'],
    'Heel Hook': ['Inside Leg Control', 'Outside Leg Control', 'Reap/Leg Knot', '411/Saddle (Inverted)', '50/50 Guard (Inverted)', 'Backside 50/50 Guard (Inverted)'],
    'Hip Lock': ['Truck Position'],
    'Kimura': ['Closed Guard', 'Half Guard (Bottom)', 'Half Guard (Top)', 'Mount', 'North South', 'Side Control', 'Turtle Position', 'Back Control (Triangle + Kimura Finish)'],
    'Kneebar': ['411/Saddle (Figure 8)', 'Truck Position (Figure 8)', '411/Saddle', '50/50 Guard', 'Single Leg X Guard', 'Top Half Guard', '50/50 Guard (Stand Up)'],
    'Lins Lock': ['411/Saddle (Far Side)', '50/50 Guard'],
    'Loop Choke': ['Butterfly Guard', 'Half Guard (Top)', 'Knee on Belly', 'Turtle Position (Rolling)'],
    'Mir Lock': ['Closed Guard (High Guard Chain)', 'Mount', 'Side Control'],
    'North South Choke': ['North South Position', 'Side Control Transition'],
    'Omoplata': ['Closed Guard', 'De La Riva Guard', 'Half Guard', 'Lasso Guard', 'Mount', 'Open Guard', 'Spider Guard'],
    'Paper-Cutter Choke': ['Crucifix', 'Knee on Belly', 'North South', 'Side Control'],
    'Rear-Naked Choke': ['Back Control', 'Crucifix', 'Turtle Position'],
    'Spine Lock': ['Back Control', 'Turtle Position'],
    'Straight Ankle Lock': ['50/50 Guard', 'Ashi Garami', 'Single Leg X Guard'],
    'Suloev Stretch': ['Back Mount (Opponent Tripods)', 'Wrestling Ride (One Hook In)'],
    'Tarikoplata': ['Closed Guard', 'Mount (Failed Kimura)', 'Half Guard'],
    'Toe Hold': ['411/Saddle (Figure 8 Transition)', 'Ashi Garami', 'Half Guard', 'Reap/Leg Knot', 'Side Control'],
    'Triangle Choke': ['Closed Guard', 'De La Riva Guard', 'Deep Half Guard', 'Lasso Guard', 'Mount', 'Open Guard', 'Side Control', 'Spider Guard', 'Standing (Flying)'],
    'Twister': ['Half Guard', 'Turtle Position'],
    'Von Flue Choke': ['Side Control (Top)'],
    'Wrist Lock': ['Closed Guard', 'Half Guard (Top)', 'Mount', 'Side Control'],
  },
  back_take: {
    'Back Take from 411/Saddle': ['411/Saddle'],
    '2 on 1 Grip Back Take': ['Butterfly Guard'],
    'Arm Drag Back Take': ['Closed Guard (Bottom)', 'Knee on Belly'],
    'Berimbolo': ['De La Riva Guard'],
    'Kiss of the Dragon': ['De La Riva Guard'],
    'Back Take from Deep Half': ['Half Guard (Bottom)'],
    'Kimura Back Take': ['Half Guard (Bottom)'],
    'Rolling Back Take': ['Half Guard (Top)'],
    'Back Take from Leg Drag': ['Leg Drag Position'],
    'Circle to Back': ['Reverse DLR Passing'],
    'Twister Roll Back Take': ['Reverse Side Control'],
    'Back Take from Truck': ['Truck Position'],
    'Back Take from X Guard': ['X Guard'],
  },
  guard_pass: {
    'Body-Lock Pass': ['Butterfly Guard'],
    'Cage Hips 2 on 1': ['Butterfly Guard'],
    'Toreador Pass (Cuff Grip)': ['Butterfly Guard'],
    'High Pass (Stand Up)': ['Closed Guard'],
    'Low Pass (Sao Paulo)': ['Closed Guard'],
    'Med Pass (Knee in Tailbone)': ['Closed Guard'],
    'Back Step Pass': ['De La Riva Guard', 'Open Guard'],
    'Cross Knee Slide': ['De La Riva Guard'],
    'Leg Drag': ['De La Riva Guard', 'Open Guard'],
    'Leg Pin': ['De La Riva Guard'],
    'Re-Square Up': ['De La Riva Guard'],
    'Turn Knee Out': ['De La Riva Guard'],
    'Leg Lace and Smash': ['Half Butterfly Guard'],
    'Trap the Hook': ['Half Butterfly Guard'],
    'Kimura Pass': ['Half Guard (Single Leg Deep Half)'],
    'Underhook and Helicopter': ['Half Guard', 'X Guard'],
    'Knee Slide (With Underhook)': ['Half Guard'],
    'Cross Body Pass (Without Underhook)': ['Half Guard'],
    'Double Under Pass': ['Open Guard'],
    'Force Quarter with Guillotine': ['Open Guard'],
    'Matador Pass': ['Open Guard'],
    'Over Under Pass': ['Open Guard'],
    'Snap Down Leg Drag': ['Open Guard'],
    'Toreando Pass': ['Open Guard'],
    'Chubby Checker': ['Reverse DLR'],
    'Leg Weave': ['Reverse DLR'],
    'Backstep (Shin on Shin)': ['Shin on Shin Guard'],
    'Lift Foot Drop Knee': ['Shin on Shin Guard'],
    'Rolling Kimura (Shin on Shin)': ['Shin on Shin Guard'],
    'Remove Foot Clear Knee Mount': ['Single Leg X Guard'],
    'Circle Out Trapped Hand': ['Spider/Lasso Guard'],
    'Hands Under Foot on Bicep': ['Spider/Lasso Guard'],
    'Pin Lasso Leg and Sprawl': ['Spider/Lasso Guard'],
    'Use Knee to Break Grip': ['Spider/Lasso Guard'],
    'Run Out Pass': ['X Guard'],
    'Trap Foot and Sprawl': ['X Guard'],
  },
  sweep: {
    'Elevator/Butterfly Sweep': ['Butterfly Guard'],
    '100% Sweep': ['Closed Guard'],
    'Armpit/Knee Roll Over': ['Closed Guard'],
    'Balloon Sweep (Helicopter Armbar)': ['Closed Guard'],
    'Double Ankle Sweep': ['Closed Guard'],
    'Flower Sweep': ['Closed Guard'],
    'Hip Bump Sweep': ['Closed Guard'],
    'Lumberjack Sweep': ['Closed Guard'],
    'Omoplata Sweep': ['Closed Guard'],
    'Reverse Scissor Sweep': ['Closed Guard'],
    'Scissor Sweep': ['Closed Guard'],
    'Single Ankle Sweep': ['Closed Guard'],
    'Waiter/Muscle Sweep': ['Closed Guard'],
    'Forward Sweep (DLR)': ['De La Riva Guard'],
    'Tripod Sweep (DLR)': ['De La Riva Guard'],
    'Double Under Sweep': ['Deep Half Guard'],
    'Technical Stand Up Sweep': ['Deep Half Guard'],
    'Waiter Sweep': ['Deep Half Guard'],
    'Actor Sweep': ['Half Butterfly Guard'],
    'Kimura/Fishing Pole Sweep': ['Half Butterfly Guard'],
    'Foot Grab Sweep': ['Half Guard'],
    'John Wayne Sweep': ['Half Guard'],
    'Leg Hug Gator Roll': ['Half Guard'],
    'Old School Sweep': ['Half Guard'],
    'Pendulum Sweep': ['Half Guard'],
    'Reverse Old School Sweep': ['Half Guard'],
    'Leg Hook Sweep': ['Lasso Guard'],
    'Slicer Sweep': ['Lasso Guard'],
    'Balloon Sweep (Open Guard)': ['Open Guard'],
    'Butterfly Hook Sweep': ['Open Guard'],
    'De La Riva Sweep': ['Open Guard'],
    'Heel Grab Sweep': ['Open Guard'],
    'Tomahawk Sweep': ['Open Guard'],
    'Tripod Sweep': ['Open Guard'],
    'Reverse Butterfly Sweep': ['Reverse De La Riva Guard'],
    'Tripod Sweep (RDLR)': ['Reverse De La Riva Guard'],
    'Sleeve Pass Sweep': ['Shin on Shin Guard'],
    'Straight Back Sweep': ['Shin on Shin Guard'],
    'Single X Sweep': ['Single Leg X Guard'],
    'Arm Wrap Sweep': ['Spider Guard'],
    'Open Book Sweep': ['Spider Guard'],
    'Sickle Sweep': ['Spider Guard'],
    'Tall Scissor Sweep': ['Spider Guard'],
    'Peterson Roll': ['Turtle'],
    'Straight Leg Sweep (Turtle)': ['Turtle'],
    'Backward Sweep (X Guard)': ['X Guard'],
    'Forward Sweep (X Guard)': ['X Guard'],
  },
  takedown: {
    'Deashi Harai (Advanced Foot Sweep)': ['Standing (Judo)'],
    'Harai Goshi (Sweeping Hip Throw)': ['Standing (Judo)'],
    'Hiza Guruma (Knee Wheel)': ['Standing (Judo)'],
    'Ippon Seoi Nage (Shoulder Throw)': ['Standing (Judo)'],
    'Kouchi Gari (Minor Inner Reap)': ['Standing (Judo)'],
    'Kosoto Gari (Minor Outer Reap)': ['Standing (Judo)'],
    'Koshi Guruma (Hip Wheel)': ['Standing (Judo)'],
    'O Goshi (Major Hip Throw)': ['Standing (Judo)'],
    'Ouchi Gari (Major Inner Reap)': ['Standing (Judo)'],
    'Osoto Gari (Major Outer Reap)': ['Standing (Judo)'],
    'Sasae Tsurikomi Ashi (Propping Ankle Throw)': ['Standing (Judo)'],
    'Tai Otoshi (Body Drop)': ['Standing (Judo)'],
    'Tomoe Nage (Circle Throw)': ['Standing (Judo)'],
    'Uchi Mata (Inner Thigh Throw)': ['Standing (Judo)'],
    'Ankle Pick': ['Standing (Wrestling)'],
    'Arm Drag to Takedown': ['Standing (Wrestling)'],
    'Body Lock Takedown (Bear Hug)': ['Standing (Wrestling)'],
    'Double Leg Takedown': ['Standing (Wrestling)'],
    'Duck Under': ['Standing (Wrestling)'],
    "Fireman's Carry": ['Standing (Wrestling)'],
    'Go-Behind': ['Standing (Wrestling)'],
    'High Crotch': ['Standing (Wrestling)'],
    'Inside Trip': ['Standing (Wrestling)'],
    'Knee Tap': ['Standing (Wrestling)'],
    'Outside Trip': ['Standing (Wrestling)'],
    'Single Leg Takedown': ['Standing (Wrestling)'],
    'Snap Down': ['Standing (Wrestling)'],
  },
  escape: {
    'Americana Escape (Elbow Pull)': ['Side Control/Mount'],
    'Americana Escape (Elbow Push)': ['Side Control/Mount'],
    'Americana Escape (Turn to Side)': ['Side Control/Mount'],
    'Ankle Lock Escape (Put on the Boot)': ['Ashi Garami'],
    'Armbar Escape (Elbow to Mat)': ['Mount'],
    'Armbar Escape (Head Inside)': ['Mount'],
    'Armbar Escape (Hitchhiker)': ['Mount'],
    'Armbar Escape (Stack and Bulldog)': ['Guard'],
    'Back Control Escape (Hook Removal)': ['Back Control'],
    'Back Control Escape (Straight Arm)': ['Back Control'],
    'Body Triangle Escape (Knee Pummel)': ['Back Control (Body Triangle)'],
    'Body Triangle Escape (Kneeling to Standing)': ['Back Control (Body Triangle)'],
    'Body Triangle Escape (Leg Trap)': ['Back Control (Body Triangle)'],
    'Collar Choke Escape (Grip Break)': ['Guard/Mount'],
    'Collar Choke Escape (Rechoke)': ['Guard/Mount'],
    'Heel Hook Escape (Sprinter)': ['Leg Entanglement'],
    'Heel Hook Escape (Stand and Smash)': ['Leg Entanglement'],
    'Kimura Escape (Defend Hand, Pass to Back)': ['Various'],
    'Knee on Belly Escape (Belt Grab Ankle Pick)': ['Knee on Belly'],
    'Knee on Belly Escape (Force Half Guard)': ['Knee on Belly'],
    'Mount Escape (Arm/Leg Trap)': ['Mount'],
    'Mount Escape (Bridge, Hold, Shrimp)': ['Mount'],
    'Mount Escape (Elbow-Knee)': ['Mount'],
    'Mount Escape (Kipping)': ['Mount'],
    'North South Escape (Re-Guard)': ['North South'],
    'North South Escape (Two on One, Turn)': ['North South'],
    'Omoplata Escape (Dive Under)': ['Omoplata'],
    'Omoplata Escape (Jump Across)': ['Omoplata'],
    'Omoplata Escape (Rolling)': ['Omoplata'],
    'Scarf Hold Escape (Legs Up to Armbar)': ['Scarf Hold'],
    'Side Control Escape (Bridge and Roll)': ['Side Control'],
    'Side Control Escape (Double Leg)': ['Side Control'],
    'Side Control Escape (Reguard)': ['Side Control'],
    'Side Control Escape (Scarf Hold Back Take)': ['Side Control'],
    'Side Control Escape (Spin Under)': ['Side Control'],
    'Triangle Escape (Feet on Top, Ankle Lock)': ['Triangle'],
    'Triangle Escape (Pull Knee to Ground)': ['Triangle'],
    'Triangle Escape (Stack, Rechoke, Rotate)': ['Triangle'],
    'Turtle Escape (Invert and Re-Guard)': ['Turtle'],
    'Turtle Escape (Peterson Roll)': ['Turtle'],
    'Turtle Escape (Straight Leg Sweep)': ['Turtle'],
  },
};

// Curated YouTube video IDs for popular techniques (technique name → video ID)
const CURATED_VIDEOS: Record<string, string> = {
  // Submissions
  'Armbar|Closed Guard': 'yHSVFz0QKRY',
  'Armbar|Mount': 'S5UU4HW2Drc',
  'Rear-Naked Choke|Back Control': 'rEMHYkMJGSw',
  'Triangle Choke|Closed Guard': 'V-sRFbkFiPo',
  'Guillotine Choke|Standing': 'qjf-h4GFEII',
  'Kimura|Closed Guard': 'I5FVxqFbKfY',
  'Americana|Mount': 'LHetDQFtWNk',
  "D'arce Choke|Half Guard": 'dX0rh_qFdOA',
  'Ezekiel Choke|Mount (Top)': 'mCAuCzXnck4',
  'Omoplata|Closed Guard': 'bDVO9kXu5Lc',
  'Bow and Arrow|Back Control': 'onaEdi3u0q0',
  'Cross Choke|Mount': 'FNiY4fWFMBQ',
  'Heel Hook|Inside Leg Control': '5v7-_GEdQkQ',
  'Anaconda Choke|Front Headlock': 'l1hZNUShlP0',
  'Straight Ankle Lock|Ashi Garami': '7y-LhXkX2y0',

  // Sweeps
  'Scissor Sweep|Closed Guard': '37cesfJGDCk',
  'Hip Bump Sweep|Closed Guard': 'xwGvuUMJcRY',
  'Flower Sweep|Closed Guard': 'xyBHPtjfvRY',
  'Elevator/Butterfly Sweep|Butterfly Guard': '2SjRHiQBFfQ',
  'Old School Sweep|Half Guard': 'TTm-GOmy_m4',
  'Pendulum Sweep|Half Guard': 'mSHlq_AELLs',
  'Tripod Sweep|Open Guard': 'FVQrqSUMkME',
  'Single X Sweep|Single Leg X Guard': 'F7cFKNhQXfA',

  // Guard Passes
  'Toreando Pass|Open Guard': '_XzYQ8XRXXY',
  'Knee Slide (With Underhook)|Half Guard': 'sNBq5J4xoHY',
  'Double Under Pass|Open Guard': 'tKP5ZRJUOKY',
  'Over Under Pass|Open Guard': 'Q3ioXBkDDIw',
  'Leg Drag|De La Riva Guard': 'Lk-_k-G7npo',
  'Body-Lock Pass|Butterfly Guard': 'o3jGnlPMl7c',

  // Takedowns
  'Double Leg Takedown|Standing (Wrestling)': 'JH7UfaN9bOw',
  'Single Leg Takedown|Standing (Wrestling)': 'L6S_5E89bj8',
  'Osoto Gari (Major Outer Reap)|Standing (Judo)': 'hJm2MNqyDiI',
  'Ippon Seoi Nage (Shoulder Throw)|Standing (Judo)': 'qCi21FnPw_g',
  'Ankle Pick|Standing (Wrestling)': 'QrVbjxIR7N8',
  'Arm Drag to Takedown|Standing (Wrestling)': 'Q3PfMG6kAB8',

  // Escapes
  'Mount Escape (Elbow-Knee)|Mount': 'EMEueexp9zY',
  'Mount Escape (Bridge, Hold, Shrimp)|Mount': 'fO3bQ7a8KDY',
  'Side Control Escape (Reguard)|Side Control': 'POsFZX0M6jg',
  'Back Control Escape (Hook Removal)|Back Control': 'INi_-3U1jBc',

  // Back Takes
  'Arm Drag Back Take|Closed Guard (Bottom)': 'SdR8tQHXEj0',
  'Berimbolo|De La Riva Guard': 'HhbVY_bM-mw',
};

export interface LibraryEntry {
  name: string;
  category: Category;
  subcategory: string;
  starting_position: string;
  youtube_url: string | null;
}

function buildYouTubeSearchUrl(subcategory: string, position: string): string {
  const query = `bjj ${subcategory} from ${position} tutorial`.replace(/[()]/g, '').replace(/\s+/g, '+');
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}

function generateEntries(): LibraryEntry[] {
  const entries: LibraryEntry[] = [];

  for (const [category, techniques] of Object.entries(LIBRARY)) {
    for (const [subcategory, positions] of Object.entries(techniques)) {
      for (const position of positions) {
        const key = `${subcategory}|${position}`;
        const videoId = CURATED_VIDEOS[key];
        const youtubeUrl = videoId
          ? `https://www.youtube.com/watch?v=${videoId}`
          : null;

        entries.push({
          name: `${subcategory} from ${position}`,
          category: category as Category,
          subcategory,
          starting_position: position,
          youtube_url: youtubeUrl,
        });
      }
    }
  }

  return entries;
}

export function seedTechniqueLibrary(db: Database.Database): void {
  const count = (db.prepare('SELECT COUNT(*) as c FROM technique_library').get() as any).c;
  if (count > 0) {
    console.log(`[db] Technique library already seeded (${count} entries)`);
    return;
  }

  const entries = generateEntries();

  const insert = db.prepare(`
    INSERT INTO technique_library (name, category, subcategory, starting_position, youtube_url, youtube_search_url, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const now = new Date().toISOString();
  const batch = db.transaction(() => {
    for (const e of entries) {
      insert.run(
        e.name,
        e.category,
        e.subcategory,
        e.starting_position,
        e.youtube_url,
        buildYouTubeSearchUrl(e.subcategory, e.starting_position),
        now,
      );
    }
  });

  batch();
  console.log(`[db] Seeded technique library with ${entries.length} techniques`);
}
