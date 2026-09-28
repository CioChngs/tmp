/**
 * QR scan — Figma `14656:64053` ("iPhone 13 mini - 40").
 *
 * A live camera behind a 50 % black scrim with a rounded window cut out of it,
 * the brand-gradient corner brackets around that window, a segmented control at
 * the top and a torch / gallery pair above the tab bar.
 *
 * It is a *tab*, not a screen pushed over the tabs, because the design keeps the
 * floating bar on screen and in reach while scanning — `Component 604`, the
 * bar's over-camera variant. Making it a fifth route under `(tabs)` is what lets
 * the real bar render itself that way over this screen with its live state
 * intact; a pushed route would cover it, and a second copy of the bar drawn by
 * this screen would be a copy to keep in sync. It carries no item of its own in
 * the bar — the raised scan button is its only entry point.
 *
 * The camera is mounted only while the tab is focused. A tab stays mounted once
 * visited, which is the whole point of the navigator, so without that the
 * preview would hold the camera open behind Home.
 */
import { CameraView, scanFromURLAsync, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useIsFocused } from 'expo-router/react-navigation';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    Alert,
    Linking,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    useWindowDimensions,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Path, Svg, SvgXml } from 'react-native-svg';

import { SegmentedTabs } from '@/components/rightbank/scan/SegmentedTabs';
import { SCAN_BRACKETS, SCAN_GALLERY, SCAN_TORCH } from '@/components/rightbank/scan/scan-art';
import {
    figmaTabBar as b,
    Font,
    figmaScan as s,
} from '@/constants/rightbank-theme';
import { ScreenNavigationBar } from '@/theme/system-navigation-bar';

export default function ScanScreen() {
  const focused = useIsFocused();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [permission, requestPermission] = useCameraPermissions();
  const [torch, setTorch] = useState(false);

  /**
   * The root's own size, measured rather than read off the window: it is the
   * box the camera has to cover, and the one the crop below is computed from.
   */
  const [box, setBox] = useState({ width, height });

  /**
   * A ref, not state: `onBarcodeScanned` fires on every frame that still holds
   * the code in view, and a state flag would let a dozen of them through before
   * the first re-render lands.
   */
  const handled = useRef(false);

  // Asking on mount would put the system dialog in front of Home, since the tab
  // mounts on first visit. Asking on focus puts it in front of this screen.
  useEffect(() => {
    if (focused && permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [focused, permission, requestPermission]);

  // Leaving the tab arms the next visit. The torch needs no reset: it is a prop
  // on a camera that unmounts with the focus, so it goes out with the preview
  // and comes back in whatever state the user left it.
  useEffect(() => {
    if (!focused) handled.current = false;
  }, [focused]);

  /**
   * The seam. A decoded code is where this screen ends and the payment flow
   * begins; until that route exists the value is shown as-is rather than
   * silently dropped, so the scanner can be verified end to end.
   */
  const onCode = useCallback((data: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    Alert.alert('QR код', data, [
      { text: 'Дахин унших', onPress: () => (handled.current = false) },
    ]);
  }, []);

  const onScanned = useCallback(
    ({ data }: { data: string }) => {
      if (handled.current) return;
      handled.current = true;
      onCode(data);
    },
    [onCode]
  );

  /** `pictures-square`: read a code out of a screenshot instead of the camera. */
  const pickFromGallery = useCallback(async () => {
    const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'] });
    if (picked.canceled || !picked.assets?.[0]) return;

    const found = await scanFromURLAsync(picked.assets[0].uri, ['qr']);
    if (found.length > 0) {
      handled.current = true;
      onCode(found[0].data);
    } else {
      Alert.alert('QR код олдсонгүй', 'Сонгосон зурагнаас QR код уншиж чадсангүй.');
    }
  }, [onCode]);

  /**
   * Android letterboxes. CameraX fits the preview inside the view and leaves
   * the remainder black, so a full-screen camera on a 20:9 phone draws the feed
   * as a band between two black bars. Its scale type is not reachable from JS —
   * the one prop that touches it, `ratio`, only ever switches it to FIT.
   *
   * So the fix is the box rather than the camera. A view as tall as the screen
   * and 4:3 of that height wide is wider than a portrait screen, and any
   * preview fitted into it comes out at least as tall as the screen; `cameraBox`
   * clips the overflow, which is what "cover" means. 4:3 because it is the
   * squarest aspect a camera reports — a 16:9 preview fits the same box by its
   * height and simply loses more of its width to the crop.
   *
   * iOS fills of its own accord, and this box would over-zoom it.
   */
  const preview =
    Platform.OS === 'android'
      ? { width: (box.height * 3) / 4, height: box.height }
      : StyleSheet.absoluteFill;

  // Both are centred on the screen, 11 below its middle; see `figmaScan`.
  const cx = width / 2;
  const cy = height / 2 + s.windowOffsetY;

  return (
    <View style={styles.root} onLayout={({ nativeEvent }) => setBox(nativeEvent.layout)}>
      {/* The screen is a camera feed in every state, whatever the theme says —
          white status text and white navigation buttons always. */}
      <StatusBar style="light" animated />
      {/* A dark camera feed whatever the theme says, so the bar is pinned dark. */}
      <ScreenNavigationBar buttons="white" />

      {focused && permission?.granted && (
        <View style={styles.cameraBox} pointerEvents="none">
          <CameraView
            style={preview}
            facing="back"
            enableTorch={torch}
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={onScanned}
          />
        </View>
      )}

      {permission && !permission.granted && (
        <View style={styles.denied}>
          <Text style={styles.deniedText}>QR код унших камерын зөвшөөрөл өгнө үү.</Text>
          <Pressable
            onPress={() => (permission.canAskAgain ? requestPermission() : Linking.openSettings())}
            accessibilityRole="button"
            testID="scan_camera_permission_button"
            style={({ pressed }) => [styles.deniedCta, pressed && styles.pressed]}>
            <Text style={styles.deniedCtaLabel}>
              {permission.canAskAgain ? 'Зөвшөөрөх' : 'Тохиргоо нээх'}
            </Text>
          </Pressable>
        </View>
      )}

      <ScanScrim width={width} height={height} cx={cx} cy={cy} />

      <View
        pointerEvents="none"
        style={[styles.brackets, { left: cx - s.brackets / 2, top: cy - s.brackets / 2 }]}>
        <SvgXml xml={SCAN_BRACKETS} width={s.brackets} height={s.brackets} />
      </View>

      <SegmentedTabs
        active="scan"
        variant="dark"
        top={insets.top + s.segment.top}
        onSelect={() => router.navigate('/my-qr')}
      />

      <View
        style={[
          styles.controls,
          {
            bottom:
              Math.max(insets.bottom, 12) +
              b.bottomGap +
              b.height +
              b.fabOverhang +
              s.controls.gapAboveFab,
          },
        ]}>
        <ControlButton
          xml={SCAN_TORCH}
          art={19}
          label="Гэрэл"
          actionId="torch"
          on={torch}
          onPress={() => setTorch((v) => !v)}
          disabled={Platform.OS === 'web'}
        />
        <ControlButton
          xml={SCAN_GALLERY}
          art={19.5}
          label="Зургаас унших"
          actionId="gallery"
          onPress={pickFromGallery}
        />
      </View>
    </View>
  );
}

/**
 * `Subtract` — the scrim, drawn exactly as Figma builds it: one path covering
 * the screen with the window as a second subpath, filled even-odd so the window
 * is a hole rather than a lighter square. Four rectangles around the window
 * would leave hairlines at the corners of the 20 radius.
 */
function ScanScrim({
  width,
  height,
  cx,
  cy,
}: {
  width: number;
  height: number;
  cx: number;
  cy: number;
}) {
  const { width: w, height: h, radius: r } = s.window;
  const x = cx - w / 2;
  const y = cy - h / 2;

  const hole =
    `M${x + r} ${y}H${x + w - r}A${r} ${r} 0 0 1 ${x + w} ${y + r}` +
    `V${y + h - r}A${r} ${r} 0 0 1 ${x + w - r} ${y + h}` +
    `H${x + r}A${r} ${r} 0 0 1 ${x} ${y + h - r}` +
    `V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`;

  return (
    <Svg pointerEvents="none" style={StyleSheet.absoluteFill} width={width} height={height}>
      <Path d={`M0 0H${width}V${height}H0Z${hole}`} fillRule="evenodd" fill={s.scrim} />
    </Svg>
  );
}

/** One of the two 48 buttons under the window: a 24 icon box in a 20-radius square. */
function ControlButton({
  xml,
  art,
  label,
  actionId,
  on,
  onPress,
  disabled,
}: {
  xml: string;
  art: number;
  label: string;
  actionId: 'torch' | 'gallery';
  on?: boolean;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: on, disabled }}
      testID={`scan_${actionId}_button`}
      style={({ pressed }) => [
        styles.control,
        on && styles.controlOn,
        disabled && styles.controlDisabled,
        pressed && styles.pressed,
      ]}>
      <View style={styles.controlIcon}>
        <SvgXml xml={xml} width={art} height={art} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // Black rather than the page colour: it is what shows in the moment between
  // the tab mounting and the camera's first frame.
  root: { flex: 1, backgroundColor: '#000' },

  /** Holds the oversized preview and crops it to the screen. See `preview`. */
  cameraBox: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },

  brackets: { position: 'absolute' },


  controls: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: s.controls.gap,
  },
  control: {
    width: s.controls.size,
    height: s.controls.size,
    borderRadius: s.controls.radius,
    borderWidth: 1,
    borderColor: s.controls.border,
    backgroundColor: s.controls.fill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  /**
   * The torch has no on-state in the design. Rather than invent a second
   * colour, the fill it already has is raised from 0.1 to 0.35 — the smallest
   * mark that still reads as "this is on".
   */
  controlOn: { backgroundColor: 'rgba(255,255,255,0.35)' },
  controlDisabled: { opacity: 0.4 },
  // Figma insets each glyph inside a 24 box; centring the art in that box puts
  // it where the inset does, without carrying two different inset numbers.
  controlIcon: {
    width: s.controls.iconBox,
    height: s.controls.iconBox,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.6 },

  denied: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 16,
  },
  deniedText: {
    fontFamily: Font.semibold,
    fontSize: 14,
    lineHeight: 20,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  deniedCta: {
    height: s.segment.height,
    paddingHorizontal: 24,
    borderRadius: s.segment.radius,
    borderWidth: 1,
    borderColor: s.controls.border,
    backgroundColor: s.controls.fill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deniedCtaLabel: {
    fontFamily: Font.bold,
    fontSize: s.segment.labelSize,
    lineHeight: s.segment.labelLine,
    color: '#FFFFFF',
  },
});
