---
name: mascot
description: Create SVG mascot illustrations of the BJJ Coach Bot otter character. Generates new poses, expressions, avatar sizes, and scene illustrations based on the established otter design spec. Use when building any visual that includes the otter mascot — new poses, icons, loading states, error states, empty states, promotional art, or UI illustrations.
---

# Otter Mascot Generator — BJJ Coach Bot

You are a specialist at creating SVG illustrations of the BJJ Coach Bot's otter mascot. Every illustration you produce MUST follow the established anatomy, color palette, and personality defined below. The otter is the face of the product — consistency matters.

---

## Character Identity

**Name:** The Otter (no proper name — just "the otter" or "coach")
**Species:** River otter — NOT a bear, NOT a cat, NOT generic "cute animal"
**Personality:** Confident, warm, slightly cheeky. A coach who knows their stuff but doesn't take themselves too seriously. The signature expression is a knowing smirk with one raised eyebrow.
**Attire:** White gi (jiu-jitsu uniform) with a purple belt. Finger tape on the paws. The gi is always slightly loose and natural-looking, never skin-tight.

---

## Anatomy Rules (CRITICAL)

These are the v2 anatomy corrections. Every illustration MUST follow them:

1. **Head:** Wide and flat — an otter skull shape, NOT a round bear head. Use a wide ellipse (rx significantly larger than ry).
2. **Ears:** Tiny circles, set LOW on the sides of the skull. Not on top of the head. Real otters have small rounded ears positioned laterally.
3. **Muzzle:** Prominent, rounded snout bump. Otters have a distinctive raised muzzle area. Use a layered approach: face patch ellipse + smaller muzzle bump ellipse on top.
4. **Whiskers:** Real whiskers radiating from the muzzle, 3 per side minimum. Semi-transparent lines fanning out from the cheek area.
5. **Nose:** Wide and rounded (not a small bear button nose). Horizontal ellipse, dark.
6. **Eyes:** Set wider apart on the flat head than you'd expect. Dark ellipses with a small white highlight circle for life.
7. **Tail:** Thick and tapered — the otter's rudder tail. NOT thin or bushy. Slightly flat-looking with subtle thickness lines.
8. **Feet:** Slightly webbed look — add subtle webbing lines between toes.
9. **Body:** Slightly elongated (otters are long creatures). The gi accommodates this.
10. **Paws:** Rounder and flatter than bear paws. Show finger tape as curved strokes across the knuckles.

---

## Color Palette

Use these EXACT colors. Do not improvise.

```
Otter Brown (main fur):   #5C4120
Otter Mid (lighter fur):  #7A5C2B
Otter Belly/Muzzle:       #B8A47C
Otter Face Patch:          #A89060
Otter Dark (outlines):    #33250F
Otter Nose:               #1E100A
Gi White:                 #F0EDE8
Gi Shadow/Seams:          #D8D2C8
Purple Belt:              #7B4BAA
Belt Shadow/Knot:         #5E3388
Tape White:               #E8E4DC
```

For backgrounds when needed:
```
Dark BG:                  #1A1714
Card BG:                  #252119
Accent Gold:              #C4A24E
Muted Text:               #9B8E7A
```

---

## SVG Construction Patterns

### Layer Order (back to front)
1. Shadow (ground ellipse, `rgba(0,0,0,0.2)`)
2. Tail
3. Feet (with webbing lines)
4. Gi pants (if full body)
5. Body / Gi top
6. Gi lapel V-lines
7. Belly patch (visible through gi opening, `opacity="0.5"`)
8. Belt + belt tails
9. Arms / Gi sleeves
10. Paws + tape
11. Head (wide ellipse)
12. Ears (tiny circles on sides)
13. Face patch ellipse
14. Muzzle bump ellipse
15. Eyes + highlights
16. Eyebrows (one raised for smirk)
17. Nose
18. Mouth
19. Whiskers

### Head Template
```svg
<!-- HEAD - wide flat otter -->
<ellipse cx="110" cy="68" rx="38" ry="26" fill="#5C4120"/>

<!-- Tiny ears - LOW on sides of skull -->
<circle cx="76" cy="58" r="6" fill="#5C4120" stroke="#33250F" stroke-width="1"/>
<circle cx="76" cy="58" r="3" fill="#A89060"/>
<circle cx="144" cy="58" r="6" fill="#5C4120" stroke="#33250F" stroke-width="1"/>
<circle cx="144" cy="58" r="3" fill="#A89060"/>

<!-- Face patch + muzzle bump -->
<ellipse cx="110" cy="76" rx="24" ry="16" fill="#A89060"/>
<ellipse cx="110" cy="80" rx="14" ry="9" fill="#B8A47C"/>

<!-- Eyes - set wide apart -->
<ellipse cx="95" cy="66" rx="4.5" ry="5" fill="#1E100A"/>
<ellipse cx="125" cy="66" rx="4.5" ry="5" fill="#1E100A"/>
<circle cx="97" cy="64" r="2" fill="white" opacity="0.8"/>
<circle cx="127" cy="64" r="2" fill="white" opacity="0.8"/>

<!-- Eyebrows - right one raised for smirk -->
<path d="M120 58 Q125 54 132 57" stroke="#33250F" stroke-width="2" fill="none" stroke-linecap="round"/>
<path d="M88 59 Q93 57 100 59" stroke="#33250F" stroke-width="2" fill="none" stroke-linecap="round"/>

<!-- Nose - wide, rounded -->
<ellipse cx="110" cy="75" rx="5" ry="3.5" fill="#1E100A"/>
<ellipse cx="111.5" cy="74" rx="2" ry="1.2" fill="white" opacity="0.25"/>

<!-- Smirk -->
<path d="M101 83 Q110 88 119 83" stroke="#33250F" stroke-width="1.8" fill="none" stroke-linecap="round"/>
<path d="M119 83 Q121 81 122 82" stroke="#33250F" stroke-width="1.5" fill="none" stroke-linecap="round"/>

<!-- Whiskers - 3 per side -->
<line x1="88" y1="78" x2="65" y2="72" stroke="#33250F" stroke-width="1" opacity="0.5"/>
<line x1="88" y1="81" x2="62" y2="79" stroke="#33250F" stroke-width="1" opacity="0.5"/>
<line x1="88" y1="84" x2="66" y2="87" stroke="#33250F" stroke-width="1" opacity="0.4"/>
<line x1="132" y1="78" x2="155" y2="72" stroke="#33250F" stroke-width="1" opacity="0.5"/>
<line x1="132" y1="81" x2="158" y2="79" stroke="#33250F" stroke-width="1" opacity="0.5"/>
<line x1="132" y1="84" x2="154" y2="87" stroke="#33250F" stroke-width="1" opacity="0.4"/>
```

### Belt Template
```svg
<rect x="80" y="142" width="60" height="8" rx="3" fill="#7B4BAA"/>
<!-- Optional shine -->
<rect x="80" y="142" width="60" height="8" rx="3" fill="url(#beltShine)" opacity="0.25"/>
<!-- Knot -->
<circle cx="118" cy="146" r="5" fill="#5E3388"/>
<!-- Belt tails hanging -->
<path d="M118 151 L111 168" stroke="#7B4BAA" stroke-width="4" stroke-linecap="round"/>
<path d="M118 151 L125 166" stroke="#7B4BAA" stroke-width="4" stroke-linecap="round"/>
```

### Paw with Tape Template
```svg
<ellipse cx="53" cy="134" rx="9" ry="7" fill="#5C4120" stroke="#33250F" stroke-width="1"/>
<path d="M47 131 Q53 127 59 131" stroke="#E8E4DC" stroke-width="2.5" fill="none" stroke-linecap="round"/>
```

---

## Expression Variations

Adapt the eyes and mouth for different moods. The HEAD SHAPE and ANATOMY stay the same — only the facial features change.

| Expression | Eyes | Mouth | Eyebrows | When to use |
|---|---|---|---|---|
| **Default smirk** | Open ellipses with highlights | Curved smile + corner uptick | One raised | General use, chat avatar |
| **Happy/OSS** | Squinted (curved lines, no fill) | Wide smile with teeth hint | Relaxed | Success states, celebrations |
| **Focused** | Open, slightly narrowed | Slight grin | Both slightly lowered | During training, briefings |
| **Thinking** | One looking up-right | Slight purse/flat | One raised high | Loading states, processing |
| **Encouraging** | Warm open eyes | Gentle smile, no smirk | Soft, even | Post-debrief, encouragement |
| **Sleeping/rest** | Closed (curved lines down) | Relaxed small smile | None | Rest day messages |

### Happy Eyes (squinted):
```svg
<path d="M87 67 Q91 62 95 67" stroke="#2C1810" stroke-width="2.5" fill="none" stroke-linecap="round"/>
<path d="M108 67 Q112 62 116 67" stroke="#2C1810" stroke-width="2.5" fill="none" stroke-linecap="round"/>
```

### Thinking Eyes:
```svg
<ellipse cx="95" cy="64" rx="4.5" ry="5" fill="#2C1810"/>
<ellipse cx="125" cy="63" rx="4.5" ry="5" fill="#2C1810"/>
<circle cx="97" cy="62" r="2" fill="white" opacity="0.8"/>
<circle cx="127" cy="61" r="2" fill="white" opacity="0.8"/>
```

---

## Established Poses

These poses already exist. Reference them but create NEW poses when asked — don't just copy these:

1. **Default Standing** — Upright, arms at sides in gi, confident smirk. viewBox `0 0 220 240`.
2. **Playing Guard** — On back, legs active (open guard), arms framing, focused grin. Includes green mat rectangle.
3. **Thumbs Up / OSS** — Standing, right paw up with thumb extended, happy squint, speech bubble saying "OSS!".

---

## Avatar Sizes

When creating avatar/profile versions, follow these simplification rules:

| Size | Detail Level |
|---|---|
| **120x120** | Full detail: ears, whiskers, eyebrows, gi collar hint |
| **64x64** | Simplified: ears, whiskers, eyes, nose, mouth. No eyebrows |
| **40x40** | Minimal: ears, face patch, eyes, nose, mouth. Single whisker per side |
| **24x24** | Icon: head shape, face patch, eyes, nose only. No whiskers |

All avatars use a circular frame:
```svg
<svg viewBox="0 0 120 120" width="SIZE" height="SIZE">
  <circle cx="60" cy="60" r="56" fill="#252119"/>
  <!-- Head and face elements centered -->
</svg>
```

---

## Creating New Poses

When the user asks for a new pose or illustration, follow this process:

1. **Start from the anatomy rules.** The head shape, ear placement, whisker count, tail thickness, and webbed feet are non-negotiable.
2. **Pick the right expression** from the expression table based on the context.
3. **Use the layer order** to build from back to front.
4. **Keep the viewBox consistent:** `0 0 220 240` for full-body poses. `0 0 120 120` for head-only/avatar.
5. **Add context elements** (mat, speech bubbles, props) BEHIND the character in the layer order.
6. **Use transforms** (`rotate`, `translate`) for dynamic poses rather than redrawing everything. The guard pose demonstrates this with `<g transform="rotate(...)">`.
7. **Always include the ground shadow** ellipse for full-body poses.
8. **Test at small sizes** — the design should read at 120px wide. If details are too fine, simplify.

### Pose Ideas to Suggest
- Drilling a technique (two otters?)
- Meditating / stretching pre-training
- Writing on a clipboard (coach mode)
- Waving hello (onboarding)
- Shrugging (error state / "I don't know")
- Celebrating with belt raised overhead
- Sitting cross-legged on the mat
- Pointing at a whiteboard

---

## Speech Bubbles

When the otter needs to "say" something:

```svg
<!-- Bubble -->
<rect x="128" y="28" width="72" height="34" rx="12" fill="rgba(196,162,78,0.12)"/>
<!-- Tail pointing to otter -->
<path d="M143 62 L138 72 L152 62" fill="rgba(196,162,78,0.12)"/>
<!-- Text -->
<text x="164" y="50" text-anchor="middle" font-family="DM Sans, sans-serif" font-size="14" fill="#C4A24E" font-weight="500">OSS!</text>
```

---

## Do's and Don'ts

**DO:**
- Keep the wide flat head shape in every pose
- Include whiskers (3 per side for full size, fewer for small)
- Show the purple belt whenever the gi is visible
- Use finger tape on the paws
- Add webbing hints on visible feet
- Use `stroke-linecap="round"` on all strokes for softness
- Include the ground shadow for standing poses
- Use the exact hex colors from the palette

**DON'T:**
- Make the head round (that's a bear, not an otter)
- Place ears on top of the head (they go LOW on the sides)
- Forget the muzzle bump (otters have a distinctive snout)
- Make the tail thin or bushy (it's thick and tapered, like a rudder)
- Use flat/modern icon style — this is an illustrated character with depth
- Add colors outside the established palette
- Make the otter look aggressive or scary — always approachable
- Skip the gi — the otter is always in training attire
