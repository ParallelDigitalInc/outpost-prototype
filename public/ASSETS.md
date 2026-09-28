# Outpost assets

## Typeface

Onest, normal variable weights 100–900. Downloaded from the official Google Fonts distribution on 28 September 2026. No runtime requests to Google Fonts are needed.

- CSS source: https://fonts.googleapis.com/css2?family=Onest:wght@100..900&display=swap
- Latin WOFF2: https://fonts.gstatic.com/s/onest/v11/gNMKW3F-SZuj7xmf-HY.woff2
- Latin extended WOFF2: https://fonts.gstatic.com/s/onest/v11/gNMKW3F-SZuj7xmR-HY6EQ.woff2
- License source: https://raw.githubusercontent.com/google/fonts/main/ofl/onest/OFL.txt
- Local license: `fonts/OFL.txt` (SIL Open Font License 1.1).

`fonts/onest.css` declares both local subsets; the extended subset includes the Indian rupee sign. Load the CSS using the configured Vite base path.

## Approved Paper images

- `images/mohit-arora.webp`: exported from `062ZE8BRM3K18YW7W4SP52P04S.png` in the approved M01 Mentors screen (`1KKZ-0`). Source: https://app.paper.design/file-assets/01M2MD5ZMXSHB5WPVM8S3PG5D9/062ZE8BRM3K18YW7W4SP52P04S.png
- Design page: https://app.paper.design/file/01M2MD5ZMXSHB5WPVM8S3PG5D9/p-4-1/1KKZ-0
- Conversion preserves the 400 × 400 source image, saved as WebP quality 86. Paper positions this portrait at `50% 8%`, with `background-size: auto 180%` in a 48 × 54 list thumbnail.

The other portraits use the same Paper file-assets URL prefix and approved M01 screen. Local WebP filenames map to these exact source assets:

| Local file | Paper source asset |
| --- | --- |
| `images/kishore-varkey.webp` | `6SKKNQXNE8AYX03H6K0RYX1QT2.png` |
| `images/priya-sharma.webp` | `430SEN15ZTG421PQPNN2QQ5YCW.png` |
| `images/vishal-gandhi.webp` | `2YPFWAA4J71KWRCYR0NQX2ZX21.jpg` |
| `images/ramesh-c.webp` | `7TYXGAB3NBYKCZ53SR3NK27K0H.png` |
| `images/siva-kumar-pasupathi.webp` | `1MHM7BFE7129NGS9C6XW83JJQ3.png` |
| `images/varadharaju-j.webp` | `5MWC9F245Z1TPRR6SAN747E1N5.jpg` |
| `images/anjali-kapoor.webp` | `3ZSSYYRAVTB641F1NN8HHV4WD0.png` |
| `images/ravi-mehta.webp` | `17KR0Z1RZA9NY4ZHJ9Z35K45E4.png` |
| `images/meera-nair.webp` | `7G65FDYD3N69SVHYD6RYY5TYGV.png` |

These use a maximum 800px dimension with original aspect ratio preserved and WebP quality 86. Each is below 51KB, comfortably under the 200KB budget. Original image positions are recorded in the data fixtures.

The photos belong to the supplied design. No broader image license is asserted here. Visible mentor facts and discover counts in `src/data/mentors.ts` and `src/data/onboarding.ts` come verbatim from approved H01 and M01 nodes; the fixed founder profile comes from BRIEF.md §4. M01 intentionally uses “Head of operations, Razorpay” on Priya’s featured card and “Head of ops, Razorpay” on her list row, preserved in the respective fixtures.

## Challenge logos

The H01 Discover row uses the following approved Paper assets. Both PNG sources were converted losslessly to WebP at their original dimensions; the SVG is unmodified. Paper applies a white silhouette filter to the first and third logos in this row, retained as a presentation style rather than baked into the image.

| Local file | Paper source asset | Dimensions |
| --- | --- | --- |
| `images/honda-logo.webp` | `6BV2MYDXWM4MHE7M21BR7PSFBT.png` | 438 × 64 |
| `images/challenge-logo-2.svg` | `53T8EGSBWE97W6PPH5TGBVDME0.svg` | viewBox 0 0 107 29 |
| `images/challenge-logo-3.webp` | `6F3JTX4PX80577EH0XKBHK1J8P.png` | 235 × 54 |

Source URL prefix: `https://app.paper.design/file-assets/01M2MD5ZMXSHB5WPVM8S3PG5D9/`. All three appear in H01 node `27AP-0`.

## App icons

`favicon.svg`, `icons/icon-192.png`, `icons/icon-512.png`, and `apple-touch-icon.png` are local prototype artwork: a simple lowercase “o” mark in the approved ink `#222222` on yellow `#FFCC00`. The icon is a shell asset, not an exported final brand icon. The PNGs use the same ellipse geometry as the SVG. The mark is inside the central maskable safe area.

## Phone preview QR

The desktop QR is generated locally in the browser from the current page’s `location.href` using the runtime `qrcode` package. No development IP address is baked into the production build, and generation makes no network request. Open the computer’s network URL to create a phone-reachable code.

## M3 and M4 logo tiles

Sixteen challenge/grant logo tiles were exported directly from the approved Paper nodes. Exact node IDs and source references are recorded in `references/opportunities/README.md`. Files are under `images/opportunities/` and remain below the 200KB image budget.
