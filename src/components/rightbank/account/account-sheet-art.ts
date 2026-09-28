/**
 * The two account sheets' artwork — Figma `15338:61406` and `16058:37255`.
 *
 * Verbatim bytes of the Figma exports, inlined as strings because Metro has
 * no SVG transformer configured; same arrangement as `account-art.ts`. The
 * originals are in `assets/account-sheets/`.
 *
 * Each glyph is exported at the size Figma draws the *art* at, not at the size
 * of the box it sits in — a 24 icon box holds a 9.5 close cross, and the
 * difference is padding. The box sizes live in the theme.
 */

/** `Use icon / Close` — 9.5 × 9.5 of art, centred in a 24 box. */
export const SHEET_CLOSE = `<svg preserveAspectRatio="none" overflow="visible" style="display: block;" width="9.5" height="9.5" viewBox="0 0 9.5 9.5" fill="none" xmlns="http://www.w3.org/2000/svg">
<g id="Group">
<path id="Path (Stroke)" fill-rule="evenodd" clip-rule="evenodd" d="M0.21967 0.21967C0.512563 -0.0732233 0.987437 -0.0732233 1.28033 0.21967L9.28033 8.21967C9.57322 8.51256 9.57322 8.98744 9.28033 9.28033C8.98744 9.57322 8.51256 9.57322 8.21967 9.28033L0.21967 1.28033C-0.0732233 0.987437 -0.0732233 0.512563 0.21967 0.21967Z" fill="#5C5C5C"/>
<path id="Path (Stroke)_2" fill-rule="evenodd" clip-rule="evenodd" d="M9.28033 0.21967C9.57322 0.512563 9.57322 0.987437 9.28033 1.28033L1.28033 9.28033C0.987437 9.57322 0.512563 9.57322 0.21967 9.28033C-0.0732233 8.98744 -0.0732233 8.51256 0.21967 8.21967L8.21967 0.21967C8.51256 -0.0732233 8.98744 -0.0732233 9.28033 0.21967Z" fill="#5C5C5C"/>
</g>
</svg>`;

/** `Use icon / Right` — 5.5 × 9.5 of art, centred in a 24 box. */
export const SHEET_CHEVRON = `<svg preserveAspectRatio="none" overflow="visible" style="display: block;" width="5.5" height="9.5" viewBox="0 0 5.5 9.5" fill="none" xmlns="http://www.w3.org/2000/svg">
<g id="Group">
<path id="Path (Stroke)" fill-rule="evenodd" clip-rule="evenodd" d="M0.21967 0.21967C0.512563 -0.0732233 0.987437 -0.0732233 1.28033 0.21967L5.28033 4.21967C5.57322 4.51256 5.57322 4.98744 5.28033 5.28033L1.28033 9.28033C0.987437 9.57322 0.512563 9.57322 0.21967 9.28033C-0.0732233 8.98744 -0.0732233 8.51256 0.21967 8.21967L3.68934 4.75L0.21967 1.28033C-0.0732233 0.987437 -0.0732233 0.512563 0.21967 0.21967Z" fill="black"/>
</g>
</svg>`;

/** `Use icon / Pen` — 10.33 of art scaled into an 11.33 box, centred in 16. */
export const SHEET_PEN = `<svg preserveAspectRatio="none" overflow="visible" style="display: block;" width="10.3337" height="10.333" viewBox="0 0 10.3337 10.333" fill="none" xmlns="http://www.w3.org/2000/svg">
<g id="Group">
<path id="Path (Stroke)" fill-rule="evenodd" clip-rule="evenodd" d="M8.16778 1.04855C8.10304 0.983816 7.99762 0.983816 7.93289 1.04855L1.04889 7.93255L1.04794 7.93349C1.01748 7.9638 1 8.00533 1 8.04967V9.333H2.28333C2.32767 9.333 2.3692 9.31553 2.39951 9.28506L2.40048 9.28408L9.28511 2.40078C9.28513 2.40077 9.28514 2.40076 9.28515 2.40075C9.34985 2.33601 9.34984 2.23061 9.28511 2.16589L8.16778 1.04855ZM7.22578 0.341447C7.68104 -0.113816 8.41962 -0.113816 8.87489 0.341447L9.99222 1.45878C10.4475 1.91404 10.4475 2.65262 9.99222 3.10789L9.99219 3.10792L3.1085 9.99028C3.10834 9.99043 3.10819 9.99058 3.10804 9.99073C2.88906 10.2106 2.59212 10.333 2.28333 10.333H0.5C0.223858 10.333 0 10.1091 0 9.833V8.04967C0 7.74091 0.122332 7.444 0.342203 7.22502C0.342377 7.22485 0.34255 7.22468 0.342724 7.22451L7.22578 0.341447Z" fill="#FAFAFC"/>
<path id="Path (Stroke)_2" fill-rule="evenodd" clip-rule="evenodd" d="M5.97978 1.58611C6.17504 1.39085 6.49162 1.39085 6.68689 1.58611L8.74689 3.64611C8.94215 3.84138 8.94215 4.15796 8.74689 4.35322C8.55162 4.54848 8.23504 4.54848 8.03978 4.35322L5.97978 2.29322C5.78452 2.09796 5.78452 1.78138 5.97978 1.58611Z" fill="#FAFAFC"/>
</g>
</svg>`;

/**
 * The IBAN copy glyph. 17 × 17 of art in a 16 box, so it overhangs by half a
 * pixel each way — the box is what the row measures. This is not the same
 * drawing as the card's `ACCOUNT_COPY`, which is a 13 stroke.
 */
export const SHEET_COPY = `<svg preserveAspectRatio="none" overflow="visible" style="display: block;" width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
<path id="Icon" d="M2.9 10.9C2.15449 10.9 1.78174 10.9 1.48771 10.7782C1.09566 10.6158 0.784183 10.3043 0.621793 9.91229C0.5 9.61826 0.5 9.24551 0.5 8.5V3.06C0.5 2.16392 0.5 1.71587 0.67439 1.37362C0.827787 1.07256 1.07256 0.827787 1.37362 0.67439C1.71587 0.5 2.16392 0.5 3.06 0.5H8.5C9.24551 0.5 9.61826 0.5 9.91229 0.621793C10.3043 0.784183 10.6158 1.09566 10.7782 1.48771C10.9 1.78174 10.9 2.15449 10.9 2.9M8.66 16.5H13.94C14.8361 16.5 15.2841 16.5 15.6264 16.3256C15.9274 16.1722 16.1722 15.9274 16.3256 15.6264C16.5 15.2841 16.5 14.8361 16.5 13.94V8.66C16.5 7.76392 16.5 7.31587 16.3256 6.97362C16.1722 6.67256 15.9274 6.42779 15.6264 6.27439C15.2841 6.1 14.8361 6.1 13.94 6.1H8.66C7.76392 6.1 7.31587 6.1 6.97362 6.27439C6.67256 6.42779 6.42779 6.67256 6.27439 6.97362C6.1 7.31587 6.1 7.76392 6.1 8.66V13.94C6.1 14.8361 6.1 15.2841 6.27439 15.6264C6.42779 15.9274 6.67256 16.1722 6.97362 16.3256C7.31587 16.5 7.76392 16.5 8.66 16.5Z" stroke="white" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

/**
 * `Verified` — the badge with a tick knocked out of it, 16 × 16.
 *
 * Figma draws it twice in two colour schemes: white badge with an orange tick
 * on the gradient balance card, grey badge with a white tick in the product
 * list. It is one drawing, so both fills are placeholders — use
 * `verifiedArt()` rather than this string directly.
 */
const VERIFIED_TEMPLATE = `<svg preserveAspectRatio="none" overflow="visible" style="display: block;" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<g id="Verified">
<g id="Verified / Default">
<path fill-rule="evenodd" clip-rule="evenodd" d="M5.34778 1.59697C5.85112 0.647392 6.84948 0 8 0C9.15052 0 10.1489 0.647391 10.6522 1.59697C11.6796 1.28143 12.8433 1.5296 13.6569 2.34315C14.4704 3.15669 14.7186 4.32041 14.403 5.34778C15.3526 5.85112 16 6.84948 16 8C16 9.15052 15.3526 10.1489 14.403 10.6522C14.7186 11.6796 14.4704 12.8433 13.6569 13.6569C12.8433 14.4704 11.6796 14.7186 10.6522 14.403C10.1489 15.3526 9.15052 16 8 16C6.84947 16 5.85112 15.3526 5.34778 14.403C4.32041 14.7186 3.15669 14.4704 2.34314 13.6569C1.52961 12.8433 1.28144 11.6796 1.59698 10.6522C0.647392 10.1489 0 9.15052 0 8C0 6.84948 0.647391 5.85112 1.59697 5.34778C1.28143 4.32041 1.5296 3.15669 2.34314 2.34314C3.15669 1.5296 4.32041 1.28143 5.34778 1.59697ZM11.81 5.99246C11.8686 6.05104 11.8686 6.14602 11.81 6.20459L7.07236 10.9422C7.01378 11.0008 6.91881 11.0008 6.86023 10.9422L4.24393 8.32591C4.18536 8.26734 4.18536 8.17236 4.24393 8.11378L5.09246 7.26525C5.15104 7.20668 5.24602 7.20668 5.30459 7.26525L6.86023 8.82089C6.91881 8.87947 7.01378 8.87947 7.07236 8.82089L10.7493 5.14393C10.8079 5.08536 10.9029 5.08536 10.9614 5.14393L11.81 5.99246Z" fill="__BADGE__"/>
<path d="M11.81 6.20459C11.8686 6.14602 11.8686 6.05104 11.81 5.99246L10.9614 5.14393C10.9029 5.08536 10.8079 5.08536 10.7493 5.14393L7.07236 8.82089C7.01378 8.87947 6.91881 8.87947 6.86023 8.82089L5.30459 7.26525C5.24602 7.20668 5.15104 7.20668 5.09246 7.26525L4.24393 8.11378C4.18536 8.17236 4.18536 8.26734 4.24393 8.32591L6.86023 10.9422C6.91881 11.0008 7.01378 11.0008 7.07236 10.9422L11.81 6.20459Z" fill="__TICK__"/>
</g>
</g>
</svg>`;

/** The `Verified` badge in a given pair of colours. See the template above. */
export function verifiedArt(badge: string, tick: string) {
  return VERIFIED_TEMPLATE.split('__BADGE__').join(badge).split('__TICK__').join(tick);
}
