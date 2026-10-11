// JSON sits inside an HTML script element: a literal < can terminate it.
export function serializeJsonLd(data) {
  return JSON.stringify(data)?.replace(/</g, '\\u003c');
}
