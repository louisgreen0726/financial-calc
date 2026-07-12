# UI Visual Direction

## Research Basis

This direction was established from live desktop and mobile review on 2026-07-12, not from static mood boards.

- [Awwwards Sites of the Day](https://www.awwwards.com/websites/sites_of_the_day/): disciplined palettes, strong media, 8px as the dominant radius, and atmosphere created by composition rather than card decoration.
- [CSS Design Awards winners](https://www.cssdesignawards.com/wotd-award-winners): engineering-oriented editorial grids and high-contrast visual systems, especially SSTR and Radian.
- [Linear](https://linear.app): near-black canvas, thin borders, restrained blur, dense product UI, and 100-160ms tool interactions.
- [Stripe](https://stripe.com): one memorable spectral asset over an otherwise quiet financial interface.
- [Raycast](https://www.raycast.com): precise dark surfaces, layered inset highlights, and controlled luminous media.
- [Ramp](https://ramp.com): financial grid language, real product states, asymmetric modules, and a single action color.
- [Notion](https://www.notion.com): calm document hierarchy, personality concentrated in a few visual elements, and mature mobile reduction.

## Adopted Direction

FinCalc uses an **Institutional Luminous Workspace** system:

1. A bespoke financial-grid bitmap is the single atmospheric visual.
2. Navigation, the home focus band, and raised result surfaces use controlled translucency.
3. Form controls remain materially opaque for dependable contrast.
4. Category colors are local semantic cues, not full-card decoration.
5. Main results are visual rewards; secondary metrics remain compact and scannable.
6. Motion is limited to 140-320ms UI feedback and never gates content visibility.
7. Geometry stays compact: 6px controls, 8px cards, and larger radii only for the home focus band or mobile dock.

## Explicit Non-Goals

- No full-page glassmorphism.
- No decorative gradient orbs or unrelated photography.
- No giant marketing typography inside calculator views.
- No scroll hijacking, cursor followers, persistent WebGL, or hidden-until-animated content.
- No fake financial values used only as decoration.

## Visual Assets

The light and dark workspace bitmaps live in `public/visuals/`. Regenerate them with:

```bash
npm run visuals:generate
```

The generator is deterministic and uses `sharp`, so exported assets remain reproducible without a hosted image service.
