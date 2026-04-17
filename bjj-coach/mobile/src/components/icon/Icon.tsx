import React from 'react';
import Svg, { Path, Circle, Rect, Line, Polyline, Polygon, Ellipse, G } from 'react-native-svg';
import { resolveIcon, type IconName, type IconVariant } from './icon-registry';

interface IconProps {
  name: IconName;
  variant?: IconVariant;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

const TAG_MAP: Record<string, React.ComponentType<any>> = {
  path: Path,
  circle: Circle,
  rect: Rect,
  line: Line,
  polyline: Polyline,
  polygon: Polygon,
  ellipse: Ellipse,
  g: G,
};

function camelToKebab(str: string): string {
  return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

export function Icon({ name, variant = 'auto', size = 24, color = 'currentColor', strokeWidth }: IconProps) {
  const iconData = resolveIcon(name, variant);

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" color={color}>
      {iconData.map((element, index) => {
        const [tag, attrs] = element;
        const SvgComponent = TAG_MAP[tag];
        if (!SvgComponent) return null;

        // Convert camelCase attributes to kebab-case props that react-native-svg expects
        const props: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(attrs)) {
          if (key === 'strokeWidth' && strokeWidth !== undefined) {
            props.strokeWidth = strokeWidth;
          } else if (key === 'fill') {
            props.fill = value || 'none';
          } else {
            // react-native-svg accepts camelCase props directly
            props[key] = value;
          }
        }

        if (!props.fill) props.fill = 'none';
        if (strokeWidth !== undefined && !props.strokeWidth) {
          props.strokeWidth = strokeWidth;
        }

        return <SvgComponent key={index} {...props} />;
      })}
    </Svg>
  );
}
