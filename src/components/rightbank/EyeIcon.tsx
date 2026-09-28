import Svg, { Circle, G, Path } from 'react-native-svg';

/**
 * Show / hide password toggle icon (reference `fl` component).
 * `off` = password is hidden → render the crossed-out eye.
 */
export function EyeIcon({
  off,
  size = 16,
  color = '#69738A',
}: {
  off: boolean;
  size?: number;
  color?: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <G stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        {off ? (
          <>
            <Path d="M3 3l18 18" />
            <Path d="M10.6 5.3A9.9 9.9 0 0 1 12 5c6 0 10 7 10 7a17 17 0 0 1-3.4 4.1M6.4 6.8A17.4 17.4 0 0 0 2 12s4 7 10 7a9.7 9.7 0 0 0 4.2-.9" />
            <Path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
          </>
        ) : (
          <>
            <Path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" />
            <Circle cx="12" cy="12" r="3" />
          </>
        )}
      </G>
    </Svg>
  );
}
