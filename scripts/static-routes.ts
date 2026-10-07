import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import ts from 'typescript';

// Read literal slugs without loading the Registry's browser-only lazy components in Node.
export function registrySlugs(source: string) {
  const file = ts.createSourceFile('tools.ts', source, ts.ScriptTarget.Latest, true);
  const slugs: string[] = [];
  function visit(node: ts.Node) {
    if (ts.isPropertyAssignment(node) && node.name.getText(file) === 'slug') {
      if (
        !ts.isStringLiteral(node.initializer) ||
        !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(node.initializer.text)
      )
        throw new Error('Tool Registry slugs must be literal URL-safe strings.');
      slugs.push(node.initializer.text);
    }
    ts.forEachChild(node, visit);
  }
  visit(file);
  if (!slugs.length || new Set(slugs).size !== slugs.length)
    throw new Error('Tool Registry slugs must be nonempty and unique.');
  return slugs;
}

export async function writeStaticRoutes(root: string, output: string) {
  const slugs = registrySlugs(await readFile(resolve(root, 'src/data/tools.ts'), 'utf8'));
  const html = await readFile(resolve(output, 'index.html'), 'utf8');
  for (const route of ['about', ...slugs.map((slug) => `tools/${slug}`)]) {
    const directory = resolve(output, route);
    await mkdir(directory, { recursive: true });
    await writeFile(resolve(directory, 'index.html'), html);
  }
  await writeFile(resolve(output, '404.html'), html);
  await writeFile(resolve(output, '.nojekyll'), '');
}
