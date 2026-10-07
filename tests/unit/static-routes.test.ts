// @vitest-environment node
import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { registrySlugs } from '../../scripts/static-routes';
import { tools } from '../../src/data/tools';

it('uses every Registry route without a second tool list', () => {
  expect(registrySlugs(readFileSync('src/data/tools.ts', 'utf8'))).toEqual(
    tools.map((tool) => tool.slug),
  );
});
it.each(['', "[{slug:'../outside'}]", "[{slug:'same'}, {slug:'same'}]", '[{slug: dynamicValue}]'])(
  'rejects invalid or ambiguous route metadata',
  (source) => {
    expect(() => registrySlugs(source)).toThrow();
  },
);
