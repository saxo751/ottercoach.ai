/**
 * Map a technique record to the most visually-relevant otter reference image.
 * Reference selection is one of the biggest levers for anatomical accuracy:
 * passing nano-banana an existing otter image that already shows a similar
 * pose anchors the generated output dramatically better than a generic stance.
 *
 * If we acquire more canonical reference illustrations (e.g. closed-guard,
 * mount, side-control, back), add entries here.
 */
const BY_SLUG = {
  armbar: 'public/otters/reference-armbar.png',
};

const BY_CATEGORY = {};

const DEFAULT_REFERENCE = 'public/otters/reference-stance.png';

export function pickReference({ slug, category }) {
  return BY_SLUG[slug] ?? BY_CATEGORY[category] ?? DEFAULT_REFERENCE;
}
