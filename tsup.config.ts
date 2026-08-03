import { defineConfig, type Format } from 'tsup';

const formats: Format[] = ['esm', 'cjs'];

const shared = {
  format: formats,
  dts: true,
  splitting: false,
  sourcemap: true,
  treeshake: true,
  tsconfig: 'tsconfig.build.json',
  external: [
    'react',
    'react-dom',
    'react/jsx-runtime',
    'next',
    'next/server',
    'next/headers',
    'iron-session',
    'dayjs',
    'dayjs/plugin/customParseFormat',
    'fast-xml-parser',
  ],
};

export default defineConfig([
  {
    ...shared,
    entry: { index: 'src/cinemasource/index.ts' },
    clean: true,
  },
  {
    ...shared,
    entry: {
      server: 'src/cinemasource/server.ts',
      'routes/cinema-listing': 'src/cinemasource/routes/cinema-listing.ts',
      'routes/rts-proxy': 'src/cinemasource/routes/rts-proxy.ts',
      'routes/rts-session': 'src/cinemasource/routes/rts-session.ts',
      'routes/rts-redirect': 'src/cinemasource/routes/rts-redirect.ts',
      'routes/rts-complete': 'src/cinemasource/routes/rts-complete.ts',
    },
    clean: false,
  },
]);
