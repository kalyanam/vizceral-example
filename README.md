![](https://raw.githubusercontent.com/Netflix/vizceral/master/logo.png)

# Vizceral Example

A modernized rewrite of [Netflix/vizceral-example](https://github.com/Netflix/vizceral-example), a sample
application for the [vizceral](https://github.com/Netflix/vizceral) traffic graph. Both Netflix repositories
are archived, so the vizceral library and its React wrapper are vendored in [`src/lib`](src/lib) and
ported to current three.js and React.

Stack: React 19, Vite, three.js, Bootstrap 5 / react-bootstrap 2, ESLint flat config, Node 22+.

## Setup

1. Install dependencies and start the dev server.

   ```sh
   git clone https://github.com/kalyanam/vizceral-example.git
   cd vizceral-example
   npm install
   npm run dev
   ```

2. Open `localhost:8080` in your browser.

## Scripts

| Command            | Description                                     |
| ------------------ | ----------------------------------------------- |
| `npm run dev`      | Dev server with hot reload on port 8080         |
| `npm run build`    | Production build into `dist/`                   |
| `npm run preview`  | Serve the production build on port 8080         |
| `npm run lint`     | Lint with ESLint                                |
| `npm audit`        | Check dependencies for known vulnerabilities    |

Set `HIDE_DATA=1` at build time to hide the data values in the focused node view.

## Docker

The Dockerfile builds the app and serves the static files with unprivileged nginx:

```sh
docker build -t vizceral-example .
docker run --rm -p 8080:8080 vizceral-example
```

## Data

The graph is loaded from [`public/sample_data.json`](public/sample_data.json). The other `public/sample_data_*.json`
files are alternative datasets; see the [vizceral data format](https://github.com/Netflix/vizceral/blob/master/DATAFORMATS.md).

## License

Apache-2.0. See [LICENSE](LICENSE).
