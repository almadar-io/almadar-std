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
import { SHAPE, STRING, list } from '../signature.js';

export const XML_OPERATORS: Record<string, StdOperatorMeta> = {
  'xml/valid': {
    module: 'xml',
    category: 'std-codec',
    minArity: 1,
    maxArity: 1,
    description: 'Test whether the XML parser accepts a complete document; valid empty or text-only elements return true and malformed XML returns false',
    hasSideEffects: false,
    returnType: 'boolean',
    params: [{ name: 's', type: 'string', description: 'The XML document to validate' }],
    example: '["xml/valid", "<a/>"] // => true',
  },
  'xml/parse': {
    module: 'xml',
    category: 'std-codec',
    minArity: 2,
    maxArity: 3,
    description: 'Parse XML text into a value of the declared shape (the second argument names a type): namespaces are ignored by local name, an attribute is the field "@name" (declare it in the shape as a quoted field, \`{ "@href" : string }\`, and read it with \`(object/get @x (quote "@href"))\`), a repeated child element is a list (a field the shape declares as a list is one even with a single child), an element with no attributes or children is its text (whitespace collapsed, trimmed), other elements are objects with "#text" for their own text; malformed XML is an evaluation error, a null input is null',
    hasSideEffects: false,
    returnType: SHAPE,
    params: [
      { name: 's', type: 'string', description: 'The XML text' },
      { name: 'shape', type: SHAPE, description: 'The name of the type the parsed value has' },
      { name: 'listPaths', type: list(list(STRING)), description: 'Written by the compiler, never by hand: every field path of the shape whose declared type is a list; each such path always reads as a list (one child becomes a one-element list, an absent one stays absent)', optional: true },
    ],
    example: '["xml/parse", "<a id=\\"1\\"><b>x</b></a>", "Row"] // => {"@id": "1", b: "x"}; read the attribute with (object/get @row (quote "@id"))',
  },
};

/**
 * Get all xml operator names.
 */
export function getXmlOperators(): string[] {
  return Object.keys(XML_OPERATORS);
}
