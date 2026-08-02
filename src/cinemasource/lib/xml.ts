import { XMLParser } from 'fast-xml-parser';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  transformAttributeName: (name) => (name === '@_attributes' ? '@attributes' : name),
});

export function xmlToObject<T = Record<string, unknown>>(xml: string): T {
  if (!xml.trim()) {
    return {} as T;
  }

  const parsed = parser.parse(xml) as Record<string, unknown>;
  return transformAttributes(parsed) as T;
}

function transformAttributes(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(transformAttributes);
  }

  if (value && typeof value === 'object') {
    const input = value as Record<string, unknown>;
    const output: Record<string, unknown> = {};

    for (const [key, nested] of Object.entries(input)) {
      if (key.startsWith('@_')) {
        const attrKey = key.slice(2);
        output['@attributes'] ??= {};
        (output['@attributes'] as Record<string, unknown>)[attrKey] = nested;
        continue;
      }
      output[key] = transformAttributes(nested);
    }

    return output;
  }

  return value;
}
