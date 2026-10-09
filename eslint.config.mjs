import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';

const compat = new FlatCompat({ baseDirectory: dirname(fileURLToPath(import.meta.url)) });

const config = [
  {
    ignores: [
      '.next/**',
      // Split-port dev builds (scripts/dev.mjs) — generated output, not source.
      '.next-*/**',
      'node_modules/**',
      'next-env.d.ts',
      'out/**',
    ],
  },
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
];

export default config;
