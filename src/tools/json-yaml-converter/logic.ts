import { isCollection, isMap, isScalar, parseDocument, stringify, visit } from 'yaml';
import { assertJsonValue, MAX_DATA_DEPTH, MAX_DATA_NODES, parseJson } from '../../lib/json';
import { validateText } from '../../lib/files';
import { JSON_SAMPLE } from '../json-visualizer/logic';

export type ConversionMode = 'json-yaml' | 'yaml-json';
export const YAML_SAMPLE =
  'project: Web Tools Box\nlocalOnly: true\ntools:\n  - name: JSON Visualizer\n    ready: true\n  - name: Markdown Preview\n    ready: true\nversion: 1\nnote: null\n';
export const conversionSamples = { 'json-yaml': JSON_SAMPLE, 'yaml-json': YAML_SAMPLE };

export function convertData(text: string, mode: ConversionMode) {
  validateText(text);
  if (mode === 'json-yaml')
    return stringify(parseJson(text), { lineWidth: 0, aliasDuplicateObjects: false });
  const document = parseDocument(text, {
    version: '1.2',
    schema: 'core',
    uniqueKeys: true,
    strict: true,
    prettyErrors: true,
  });
  if (document.errors.length || document.warnings.length) {
    const issue = document.errors[0] ?? document.warnings[0]!;
    const line = issue.linePos?.[0]?.line;
    throw new Error(
      `YAML${line ? `の${line}行目付近` : ''}を確認してください。${issue.message.split('\n')[0]}`,
    );
  }
  let count = 0;
  visit(document, (_key, node, path) => {
    // The YAML AST also contains a Pair and a key node for each mapping value.
    if (++count > MAX_DATA_NODES * 3 || path.length > MAX_DATA_DEPTH * 2 + 2)
      throw new Error('YAMLは10,000項目・40階層以内にしてください。');
    if (isMap(node))
      for (const pair of node.items) {
        if (!isScalar(pair.key) || typeof pair.key.value !== 'string')
          throw new Error(
            'JSONのキーにできるのは文字列だけです。YAMLのキーを引用符で囲んでください。',
          );
      }
    if (
      isCollection(node) &&
      node.tag &&
      !['tag:yaml.org,2002:map', 'tag:yaml.org,2002:seq'].includes(node.tag)
    )
      throw new Error('JSONに対応しないYAMLタグは変換できません。');
  });
  let value: unknown;
  try {
    value = document.toJS({ maxAliasCount: 50 });
  } catch {
    throw new Error('YAMLのエイリアス参照を解決できないか、展開量が上限を超えています。');
  }
  assertJsonValue(value);
  return JSON.stringify(value, null, 2);
}
