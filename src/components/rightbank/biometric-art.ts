/**
 * Artwork for the biometric opt-in sheet (Figma `15726:76357`).
 *
 * Kept as markup rather than a `.svg` file because there is no Metro SVG
 * transformer in this project — the same reason `login-art.ts` and
 * `home/figma-assets.tsx` do it. `react-native-svg`'s `SvgXml` renders the
 * string natively on both platforms. `assets/biometric/face-id.svg` is the
 * exported file this was taken from, kept as the source of record.
 *
 * Do not edit: re-export the node from Figma if the design moves.
 */

/**
 * 65×65 — the Face ID scan glyph, `#F26800`, as exported. The design draws it
 * in an 80 box with the artwork inset 9.38 % on every side, which is where the
 * 65 comes from (80 × 0.8124).
 */
export const FACE_ID_MARK = `<svg preserveAspectRatio="none" overflow="visible" style="display: block;" width="65" height="65" viewBox="0 0 65 65" fill="none" xmlns="http://www.w3.org/2000/svg">
<g id="Group">
<path id="Path (Stroke)" fill-rule="evenodd" clip-rule="evenodd" d="M17.5 20.2667C18.8807 20.2667 20 21.386 20 22.7667V27.7667C20 29.1474 18.8807 30.2667 17.5 30.2667C16.1193 30.2667 15 29.1474 15 27.7667V22.7667C15 21.386 16.1193 20.2667 17.5 20.2667Z" fill="#F26800"/>
<path id="Path (Stroke)_2" fill-rule="evenodd" clip-rule="evenodd" d="M47.5 20.2667C48.8807 20.2667 50 21.386 50 22.7667V27.7667C50 29.1474 48.8807 30.2667 47.5 30.2667C46.1193 30.2667 45 29.1474 45 27.7667V22.7667C45 21.386 46.1193 20.2667 47.5 20.2667Z" fill="#F26800"/>
<path id="Path (Stroke)_3" fill-rule="evenodd" clip-rule="evenodd" d="M34.1667 20.3233C35.5474 20.3233 36.6667 21.4426 36.6667 22.8233V34.49C36.6667 37.7107 34.054 40.3233 30.8333 40.3233H29.1667C27.786 40.3233 26.6667 39.204 26.6667 37.8233C26.6667 36.4426 27.786 35.3233 29.1667 35.3233H30.8333C31.2926 35.3233 31.6667 34.9493 31.6667 34.49V22.8233C31.6667 21.4426 32.786 20.3233 34.1667 20.3233Z" fill="#F26800"/>
<path id="Path (Stroke)_4" fill-rule="evenodd" clip-rule="evenodd" d="M19.9289 44.5889C20.9052 43.6126 22.4881 43.6126 23.4644 44.5889C28.4548 49.5793 36.5485 49.5793 41.5389 44.5889C42.5152 43.6126 44.0981 43.6126 45.0744 44.5889C46.0507 45.5652 46.0507 47.1481 45.0744 48.1244C38.1315 55.0674 26.8719 55.0674 19.9289 48.1244C18.9526 47.1481 18.9526 45.5652 19.9289 44.5889Z" fill="#F26800"/>
<path id="Path (Stroke)_5" fill-rule="evenodd" clip-rule="evenodd" d="M0 9.16667C0 4.10262 4.10262 0 9.16667 0H17.7933C19.174 0 20.2933 1.11929 20.2933 2.5C20.2933 3.88071 19.174 5 17.7933 5H9.16667C6.86405 5 5 6.86405 5 9.16667V17.7933C5 19.174 3.88071 20.2933 2.5 20.2933C1.11929 20.2933 0 19.174 0 17.7933V9.16667Z" fill="#F26800"/>
<path id="Path (Stroke)_6" fill-rule="evenodd" clip-rule="evenodd" d="M62.5 44.7067C63.8807 44.7067 65 45.826 65 47.2067V55.8333C65 60.8974 60.8974 65 55.8333 65H47.2067C45.826 65 44.7067 63.8807 44.7067 62.5C44.7067 61.1193 45.826 60 47.2067 60H55.8333C58.136 60 60 58.136 60 55.8333V47.2067C60 45.826 61.1193 44.7067 62.5 44.7067Z" fill="#F26800"/>
<path id="Path (Stroke)_7" fill-rule="evenodd" clip-rule="evenodd" d="M2.5 44.7067C3.88071 44.7067 5 45.826 5 47.2067V55.8333C5 58.136 6.86404 60 9.16667 60H17.7933C19.174 60 20.2933 61.1193 20.2933 62.5C20.2933 63.8807 19.174 65 17.7933 65H9.16667C4.10262 65 0 60.8974 0 55.8333V47.2067C0 45.826 1.11929 44.7067 2.5 44.7067Z" fill="#F26800"/>
<path id="Path (Stroke)_8" fill-rule="evenodd" clip-rule="evenodd" d="M44.7067 2.5C44.7067 1.11929 45.826 0 47.2067 0H55.8333C60.8974 0 65 4.10262 65 9.16667V17.7933C65 19.174 63.8807 20.2933 62.5 20.2933C61.1193 20.2933 60 19.174 60 17.7933V9.16667C60 6.86404 58.136 5 55.8333 5H47.2067C45.826 5 44.7067 3.88071 44.7067 2.5Z" fill="#F26800"/>
</g>
</svg>`;
