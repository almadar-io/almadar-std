/**
 * XML Module - XML parsing
 *
 * `(xml/parse s Shape)` — pure, deterministic: XML text → a value of the declared shape (the second argument
 * names a type). Names are local names (namespaces ignored); an attribute is the field `@name`; a child is
 * the field `name`, a list when the name repeats; an element with no attributes and no children is its text
 * (whitespace runs collapsed to one space, trimmed); any other element is an object, with `#text` for text
 * of its own. Malformed XML is an evaluation error. Rust twin: `orbital_core` `operators/xml.rs`; TS twin:
 * `@almadar/evaluator` `std/xml.ts`.
 *
 * @packageDocumentation
 */

import type { StdOperatorMeta } from '../types.js';
import { SHAPE } from '../signature.js';

export const XML_OPERATORS: Record<string, StdOperatorMeta> = {
  'xml/parse': {
    module: 'xml',
    category: 'std-codec',
    minArity: 2,
    maxArity: 2,
    description: 'Parse XML text into a value of the declared shape (the second argument names a type): namespaces are ignored by local name, an attribute is the field "@name", a repeated child element is a list, an element with no attributes or children is its text (whitespace collapsed, trimmed), other elements are objects with "#text" for their own text; malformed XML is an evaluation error, a null input is null',
    hasSideEffects: false,
    returnType: SHAPE,
    params: [
      { name: 's', type: 'string', description: 'The XML text' },
      { name: 'shape', type: SHAPE, description: 'The name of the type the parsed value has' },
    ],
    example: '["xml/parse", "<a id=\\"1\\"><b>x</b></a>", "Row"] // => {"@id": "1", b: "x"}',
  },
};

/**
 * Get all xml operator names.
 */
export function getXmlOperators(): string[] {
  return Object.keys(XML_OPERATORS);
}
