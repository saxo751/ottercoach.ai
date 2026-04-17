import {
  Search01StrokeRounded,
  HelpCircleStrokeRounded,
  ArrowLeft01StrokeRounded,
  ArrowRight01StrokeRounded,
  ArrowDown01StrokeRounded,
  ArrowUp01StrokeRounded,
  Cancel01StrokeRounded,
  CancelCircleStrokeRounded,
  Tick01StrokeRounded,
  Tick02StrokeRounded,
  Menu01StrokeRounded,
  Calendar01StrokeRounded,
  Clock01StrokeRounded,
  Setting07StrokeRounded,
  UserStrokeRounded,
  User02StrokeRounded,
  UserCircleStrokeRounded,
  PlusSignStrokeRounded,
  PlusSignCircleStrokeRounded,
  MinusSignCircleStrokeRounded,
  Edit01StrokeRounded,
  PencilEdit01StrokeRounded,
  Delete03StrokeRounded,
  MoreHorizontalStrokeRounded,
  FilterHorizontalStrokeRounded,
  StarStrokeRounded,
  Award01StrokeRounded,
  ChampionStrokeRounded,
  Medal01StrokeRounded,
  FireStrokeRounded,
  ZapStrokeRounded,
  Flag01StrokeRounded,
  ThumbsUpStrokeRounded,
  Message02StrokeRounded,
  ChatDoneStrokeRounded,
  Notification02StrokeRounded,
  SentStrokeRounded,
  InformationCircleStrokeRounded,
  AlertCircleStrokeRounded,
  CheckmarkCircle02StrokeRounded,
  CheckmarkBadge01StrokeRounded,
  ViewStrokeRounded,
  ViewOffStrokeRounded,
  GridStrokeRounded,
  DashboardSpeed01StrokeRounded,
  RepeatStrokeRounded,
  Refresh01StrokeRounded,
  Home01StrokeRounded,
  Logout03StrokeRounded,
  Idea01StrokeRounded,
  RecordStrokeRounded,
} from '@hugeicons-pro/core-stroke-rounded';

import {
  Search01StrokeSharp,
  ArrowLeft01StrokeSharp,
  ArrowRight01StrokeSharp,
  ArrowDown01StrokeSharp,
  ArrowUp01StrokeSharp,
  Cancel01StrokeSharp,
  Tick01StrokeSharp,
  Menu01StrokeSharp,
  Calendar01StrokeSharp,
  Clock01StrokeSharp,
  Setting07StrokeSharp,
  Edit01StrokeSharp,
  StarStrokeSharp,
  Award01StrokeSharp,
  FilterHorizontalStrokeSharp,
} from '@hugeicons-pro/core-stroke-sharp';

import {
  Tick01SolidRounded,
  StarSolidRounded,
  Award01SolidRounded,
  InformationCircleSolidRounded,
  CheckmarkBadge01SolidRounded,
  Clock01SolidRounded,
  Setting07SolidRounded,
  User02SolidRounded,
  RecordSolidRounded,
  PlusSignCircleSolidRounded,
  MinusSignCircleSolidRounded,
  ArrowDown01SolidRounded,
} from '@hugeicons-pro/core-solid-rounded';

import {
  StarSolidSharp,
  StarHalfSolidSharp,
  Award01SolidSharp,
  InformationCircleSolidSharp,
  CheckmarkBadge01SolidSharp,
  Clock01SolidSharp,
  Setting07SolidSharp,
  ArrowDown01SolidSharp,
  PlusSignCircleSolidSharp,
  MinusSignCircleSolidSharp,
  User02SolidSharp,
} from '@hugeicons-pro/core-solid-sharp';

import type { IconSvgObject } from './hugeicons-icon.component';

export type IconVariant =
  | 'stroke'
  | 'stroke-sharp'
  | 'solid'
  | 'solid-sharp'
  | 'auto';

type IconVariants = Partial<Record<IconVariant, IconSvgObject>>;

const icons = {
  // --- Navigation ---
  'search-01': { stroke: Search01StrokeRounded, 'stroke-sharp': Search01StrokeSharp },
  'help-circle': { stroke: HelpCircleStrokeRounded },
  'arrow-left-01': { stroke: ArrowLeft01StrokeRounded, 'stroke-sharp': ArrowLeft01StrokeSharp },
  'arrow-right-01': { stroke: ArrowRight01StrokeRounded, 'stroke-sharp': ArrowRight01StrokeSharp },
  'arrow-down-01': { stroke: ArrowDown01StrokeRounded, 'stroke-sharp': ArrowDown01StrokeSharp, solid: ArrowDown01SolidRounded, 'solid-sharp': ArrowDown01SolidSharp },
  'arrow-up-01': { stroke: ArrowUp01StrokeRounded, 'stroke-sharp': ArrowUp01StrokeSharp },
  'cancel-01': { stroke: Cancel01StrokeRounded, 'stroke-sharp': Cancel01StrokeSharp },
  'cancel-circle': { stroke: CancelCircleStrokeRounded },
  'menu-01': { stroke: Menu01StrokeRounded, 'stroke-sharp': Menu01StrokeSharp },
  'home-01': { stroke: Home01StrokeRounded },
  'grid': { stroke: GridStrokeRounded },
  'logout-03': { stroke: Logout03StrokeRounded },

  // --- Actions ---
  'tick-01': { stroke: Tick01StrokeRounded, 'stroke-sharp': Tick01StrokeSharp, solid: Tick01SolidRounded },
  'tick-02': { stroke: Tick02StrokeRounded },
  'plus-sign': { stroke: PlusSignStrokeRounded },
  'plus-sign-circle': { stroke: PlusSignCircleStrokeRounded, solid: PlusSignCircleSolidRounded, 'solid-sharp': PlusSignCircleSolidSharp },
  'minus-sign-circle': { stroke: MinusSignCircleStrokeRounded, solid: MinusSignCircleSolidRounded, 'solid-sharp': MinusSignCircleSolidSharp },
  'edit-01': { stroke: Edit01StrokeRounded, 'stroke-sharp': Edit01StrokeSharp },
  'pencil-edit-01': { stroke: PencilEdit01StrokeRounded },
  'delete-03': { stroke: Delete03StrokeRounded },
  'more-horizontal': { stroke: MoreHorizontalStrokeRounded },
  'filter-horizontal': { stroke: FilterHorizontalStrokeRounded, 'stroke-sharp': FilterHorizontalStrokeSharp },
  'refresh-01': { stroke: Refresh01StrokeRounded },
  'view': { stroke: ViewStrokeRounded },
  'view-off': { stroke: ViewOffStrokeRounded },

  // --- Time ---
  'calendar-01': { stroke: Calendar01StrokeRounded, 'stroke-sharp': Calendar01StrokeSharp },
  'clock-01': { stroke: Clock01StrokeRounded, 'stroke-sharp': Clock01StrokeSharp, solid: Clock01SolidRounded, 'solid-sharp': Clock01SolidSharp },

  // --- Communication ---
  'message-02': { stroke: Message02StrokeRounded },
  'chat-done': { stroke: ChatDoneStrokeRounded },
  'notification-02': { stroke: Notification02StrokeRounded },
  'sent': { stroke: SentStrokeRounded },
  'information-circle': { stroke: InformationCircleStrokeRounded, solid: InformationCircleSolidRounded, 'solid-sharp': InformationCircleSolidSharp },
  'alert-circle': { stroke: AlertCircleStrokeRounded },
  'checkmark-circle-02': { stroke: CheckmarkCircle02StrokeRounded },
  'checkmark-badge-01': { stroke: CheckmarkBadge01StrokeRounded, solid: CheckmarkBadge01SolidRounded, 'solid-sharp': CheckmarkBadge01SolidSharp },

  // --- Users ---
  'user-01': { stroke: UserStrokeRounded },
  'user-02': { stroke: User02StrokeRounded, solid: User02SolidRounded, 'solid-sharp': User02SolidSharp },
  'user-circle': { stroke: UserCircleStrokeRounded },

  // --- BJJ / Training ---
  'star': { stroke: StarStrokeRounded, 'stroke-sharp': StarStrokeSharp, solid: StarSolidRounded, 'solid-sharp': StarSolidSharp },
  'star-half': { 'solid-sharp': StarHalfSolidSharp },
  'award-01': { stroke: Award01StrokeRounded, 'stroke-sharp': Award01StrokeSharp, solid: Award01SolidRounded, 'solid-sharp': Award01SolidSharp },
  'champion': { stroke: ChampionStrokeRounded },
  'medal-01': { stroke: Medal01StrokeRounded },
  'fire': { stroke: FireStrokeRounded },
  'zap-01': { stroke: ZapStrokeRounded },
  'flag-01': { stroke: Flag01StrokeRounded },
  'thumbs-up': { stroke: ThumbsUpStrokeRounded },
  'repeat': { stroke: RepeatStrokeRounded },
  'dashboard-speed-01': { stroke: DashboardSpeed01StrokeRounded },
  'record': { stroke: RecordStrokeRounded, solid: RecordSolidRounded },
  'idea-01': { stroke: Idea01StrokeRounded },

  // --- Settings ---
  'setting-07': { stroke: Setting07StrokeRounded, 'stroke-sharp': Setting07StrokeSharp, solid: Setting07SolidRounded, 'solid-sharp': Setting07SolidSharp },
} as const satisfies Record<string, IconVariants>;

export type IconName = keyof typeof icons;

export function resolveIcon(
  name: IconName,
  variant: IconVariant,
): IconSvgObject {
  const fallback = icons['help-circle'].stroke;

  const icon = icons[name];
  const resolvedVariant = variant !== 'auto' ? variant : 'stroke';

  if (!icon) {
    return fallback;
  }

  return (icon as IconVariants)[resolvedVariant] ?? fallback;
}
