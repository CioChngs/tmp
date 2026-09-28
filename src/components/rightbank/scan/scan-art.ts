/**
 * The scan screen's art, exported verbatim from Figma `14656:64053` and kept as
 * raw SVG markup for the reason `tabbar-art.ts` gives: Metro has no SVG
 * transformer configured here, and `SvgXml` renders the same bytes natively on
 * iOS, Android and web. The originals are in `assets/scan/`.
 *
 * All three are drawn white by the designer, which is what they are on top of a
 * camera feed — nothing is recoloured at the call site.
 */

/** `Rectangle 288` — the scan window's four corner brackets. The 5-wide stroke
 *  carries the brand gradient itself, corner to corner. */
export const SCAN_BRACKETS = `<svg preserveAspectRatio="none" overflow="visible" style="display: block;" width="310" height="310" viewBox="0 0 310 310" fill="none" xmlns="http://www.w3.org/2000/svg">
<path id="Rectangle 288" d="M269.375 2.5H280.5C295.412 2.5 307.5 14.5883 307.5 29.5V40.625M40.625 2.5H29.5C14.5883 2.5 2.5 14.5883 2.5 29.5V40.625M2.5 269.375V280.5C2.5 295.412 14.5883 307.5 29.5 307.5H40.625M269.375 307.5H280.5C295.412 307.5 307.5 295.412 307.5 280.5V269.375" stroke="url(#paint0_linear_0_211)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
<defs>
<linearGradient id="paint0_linear_0_211" x1="31.6175" y1="278.383" x2="278.383" y2="31.6174" gradientUnits="userSpaceOnUse">
<stop stop-color="#ED1846"/>
<stop offset="1" stop-color="#FFCC32"/>
</linearGradient>
</defs>
</svg>`;

/** `Sun` — the torch toggle's glyph: a 19 art centred in a 24 box. */
export const SCAN_TORCH = `<svg preserveAspectRatio="none" overflow="visible" style="display: block;" width="19" height="19" viewBox="0 0 19 19" fill="none" xmlns="http://www.w3.org/2000/svg">
<g id="Group">
<path id="Path (Stroke)" fill-rule="evenodd" clip-rule="evenodd" d="M9.5 15C9.91421 15 10.25 15.3358 10.25 15.75V18.25C10.25 18.6642 9.91421 19 9.5 19C9.08579 19 8.75 18.6642 8.75 18.25V15.75C8.75 15.3358 9.08579 15 9.5 15Z" fill="white"/>
<path id="Path (Stroke)_2" fill-rule="evenodd" clip-rule="evenodd" d="M9.5 0C9.91421 0 10.25 0.335786 10.25 0.75V3.25C10.25 3.66421 9.91421 4 9.5 4C9.08579 4 8.75 3.66421 8.75 3.25V0.75C8.75 0.335786 9.08579 0 9.5 0Z" fill="white"/>
<path id="Oval (Stroke)" fill-rule="evenodd" clip-rule="evenodd" d="M5.75 9.5C5.75 7.42893 7.42893 5.75 9.5 5.75C11.5711 5.75 13.25 7.42893 13.25 9.5C13.25 11.5711 11.5711 13.25 9.5 13.25C7.42893 13.25 5.75 11.5711 5.75 9.5ZM9.5 7.25C8.25736 7.25 7.25 8.25736 7.25 9.5C7.25 10.7426 8.25736 11.75 9.5 11.75C10.7426 11.75 11.75 10.7426 11.75 9.5C11.75 8.25736 10.7426 7.25 9.5 7.25Z" fill="white"/>
<path id="Path (Stroke)_3" fill-rule="evenodd" clip-rule="evenodd" d="M5.61033 13.3897C5.90322 13.6826 5.90322 14.1574 5.61033 14.4503L3.84033 16.2203C3.54744 16.5132 3.07256 16.5132 2.77967 16.2203C2.48678 15.9274 2.48678 15.4526 2.77967 15.1597L4.54967 13.3897C4.84256 13.0968 5.31744 13.0968 5.61033 13.3897Z" fill="white"/>
<path id="Path (Stroke)_4" fill-rule="evenodd" clip-rule="evenodd" d="M16.2203 2.77967C16.5132 3.07256 16.5132 3.54744 16.2203 3.84033L14.4503 5.61033C14.1574 5.90322 13.6826 5.90322 13.3897 5.61033C13.0968 5.31744 13.0968 4.84256 13.3897 4.54967L15.1597 2.77967C15.4526 2.48678 15.9274 2.48678 16.2203 2.77967Z" fill="white"/>
<path id="Path (Stroke)_5" fill-rule="evenodd" clip-rule="evenodd" d="M0 9.5C0 9.08579 0.335786 8.75 0.75 8.75H3.25C3.66421 8.75 4 9.08579 4 9.5C4 9.91421 3.66421 10.25 3.25 10.25H0.75C0.335786 10.25 0 9.91421 0 9.5Z" fill="white"/>
<path id="Path (Stroke)_6" fill-rule="evenodd" clip-rule="evenodd" d="M15 9.5C15 9.08579 15.3358 8.75 15.75 8.75H18.25C18.6642 8.75 19 9.08579 19 9.5C19 9.91421 18.6642 10.25 18.25 10.25H15.75C15.3358 10.25 15 9.91421 15 9.5Z" fill="white"/>
<path id="Path (Stroke)_7" fill-rule="evenodd" clip-rule="evenodd" d="M2.77967 2.77967C3.07256 2.48678 3.54744 2.48678 3.84033 2.77967L5.61033 4.54967C5.90322 4.84256 5.90322 5.31744 5.61033 5.61033C5.31744 5.90322 4.84256 5.90322 4.54967 5.61033L2.77967 3.84033C2.48678 3.54744 2.48678 3.07256 2.77967 2.77967Z" fill="white"/>
<path id="Path (Stroke)_8" fill-rule="evenodd" clip-rule="evenodd" d="M13.3897 13.3897C13.6826 13.0968 14.1574 13.0968 14.4503 13.3897L16.2203 15.1597C16.5132 15.4526 16.5132 15.9274 16.2203 16.2203C15.9274 16.5132 15.4526 16.5132 15.1597 16.2203L13.3897 14.4503C13.0968 14.1574 13.0968 13.6826 13.3897 13.3897Z" fill="white"/>
</g>
</svg>`;

/** `Interface, Essential/pictures-square` — the gallery button's glyph: 19.5 in a 24 box. */
export const SCAN_GALLERY = `<svg preserveAspectRatio="none" overflow="visible" style="display: block;" width="19.5001" height="19.5" viewBox="0 0 19.5001 19.5" fill="none" xmlns="http://www.w3.org/2000/svg">
<g id="Group">
<path id="Path (Stroke)" fill-rule="evenodd" clip-rule="evenodd" d="M0.300044 13.15C5.90004 8.95 13.6 8.95 19.2 13.15C19.5314 13.3985 19.5986 13.8686 19.35 14.2C19.1015 14.5314 18.6314 14.5985 18.3 14.35C13.2334 10.55 6.26671 10.55 1.20004 14.35C0.868673 14.5985 0.398572 14.5314 0.150044 14.2C-0.098484 13.8686 -0.0313267 13.3985 0.300044 13.15Z" fill="white"/>
<path id="Path (Stroke)_2" fill-rule="evenodd" clip-rule="evenodd" d="M5.75004 1.5C3.40283 1.5 1.50004 3.40279 1.50004 5.75V13.75C1.50004 16.0972 3.40283 18 5.75004 18H13.75C16.0973 18 18 16.0972 18 13.75V5.75C18 3.40279 16.0973 1.5 13.75 1.5H5.75004ZM4.41079e-05 5.75C4.41079e-05 2.57436 2.57441 0 5.75004 0H13.75C16.9257 0 19.5 2.57436 19.5 5.75V13.75C19.5 16.9256 16.9257 19.5 13.75 19.5H5.75004C2.57441 19.5 4.41079e-05 16.9256 4.41079e-05 13.75V5.75Z" fill="white"/>
<path id="Path (Stroke)_3" fill-rule="evenodd" clip-rule="evenodd" d="M14.75 5.7488C14.7494 5.19675 14.3015 4.74967 13.7494 4.75C13.1974 4.75033 12.75 5.19795 12.75 5.75C12.75 6.30205 13.1974 6.74967 13.7494 6.75C14.3008 6.75033 14.7483 6.30432 14.75 5.75318M14.75 5.75028L14.75 5.7497ZM14.75 5.7503V5.75028Z" fill="white"/>
</g>
</svg>`;
