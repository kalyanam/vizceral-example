# Vendored Vizceral

`vizceral/` is vendored from [Netflix/vizceral](https://github.com/Netflix/vizceral) 4.9.0, and
`VizceralReact.jsx` / `vizceral-react.css` are adapted from
[Netflix/vizceral-react](https://github.com/Netflix/vizceral-react) 4.8.0. Both upstream
projects are archived and licensed under Apache-2.0 (see `vizceral/LICENSE`).

Local changes from upstream:

- Ported to current three.js: `Geometry` → `BufferGeometry`, `PlaneBufferGeometry` →
  `PlaneGeometry`, `raycaster.linePrecision` → `raycaster.params.Line.threshold`, color
  management disabled to keep the original colors.
- Ported to `@tweenjs/tween.js` 25 (explicit tween `Group`).
- Webpack loaders (`worker-loader`, `url-loader`) replaced with native Vite module workers and asset imports.
- The React wrapper is a function component using hooks and refs (React 19 compatible).
