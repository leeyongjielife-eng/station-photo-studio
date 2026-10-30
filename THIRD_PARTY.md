# Third party dependencies

Self-hosted browser inference assets are distributed unmodified from these npm packages:

- `@mediapipe/selfie_segmentation@0.1.1675465747` — Google MediaPipe, Apache-2.0. https://www.npmjs.com/package/@mediapipe/selfie_segmentation
- `@mediapipe/face_mesh@0.4.1633559619` — Google MediaPipe, Apache-2.0. https://www.npmjs.com/package/@mediapipe/face_mesh

MediaPipe source and license: https://github.com/google-ai-edge/mediapipe . The original package README and package metadata remain in each `dist/vendor/` directory. Apache-2.0 license text is included as `LICENSE-mediapipe.txt`.

## User-specified official sheet template

`dist/assets/templates/resume-official.jpg` is the official Photo ME example supplied by the user, retained at their explicit request for the owner-private site. All nine example portraits are covered in generated output. The JPEGs are retained only as private historical references. Current previews and exported sheets draw reconstructed vector artwork and do not load these images. Source: https://www.me-group.jp/individual/photo-me/ . This image is not covered by the MediaPipe Apache license.

## Embedded receipt digits

`dist/assets/fonts/receipt-digits.otf` is a digits-only subset of Noto Sans CJK JP Regular (Google/Adobe), used to visually match the sample date labels. Licensed under SIL Open Font License 1.1; original package copyright and license are included in `dist/assets/fonts/LICENSE-Noto.txt`. It is not an official Photo ME font file.

Second-booth receipt typography uses separate regular and bold subsets of Noto Sans CJK JP under the existing SIL Open Font License in `dist/assets/fonts/LICENSE-Noto.txt`. These are visual reference fonts, not official machine font files.


## High-resolution vector printing

- `pdf-lib@1.17.1` and `@pdf-lib/fontkit@1.1.1` are bundled locally in `dist/vendor/print-pdf.js` for on-demand PDF creation (MIT).
- Runtime transitive packages include `@pdf-lib/standard-fonts@1.0.0`, `@pdf-lib/upng@1.0.1`, `pako@1.0.11` and `tslib@1.14.1`. Package licenses and notices are retained in `dist/vendor/LICENSE-print.txt` and the adjacent bundle legal notice.
- `esbuild@0.25.12` is a build-only development dependency (MIT).
- `dist/assets/fonts/print-*.ttf` are modified Noto CJK subsets renamed Ekimae Print, converted to quadratic TrueType outlines for reliable PDF embedding. SIL OFL 1.1 and original credit remain in `dist/assets/fonts/LICENSE-Noto.txt`; generated fonts also include license/name metadata. Rebuild instructions are in `scripts/build-print-fonts.py`.
