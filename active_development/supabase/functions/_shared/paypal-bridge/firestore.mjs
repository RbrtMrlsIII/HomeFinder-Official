// Minimal Firestore REST client for the Supabase Edge bridge.
// Web APIs only, so the same code runs in Deno (Edge) and Node (tests against the emulator).

export const SERVER_TIME = Symbol('SERVER_TIME');
export const increment = (n) => ({ __increment: Number(n) });

export class FirestoreError extends Error {
  constructor(httpStatus, status) {
    super(`Firestore request failed (${httpStatus}${status ? ` ${status}` : ''}).`);
    this.name = 'FirestoreError';
    this.httpStatus = httpStatus;
    this.status = status || null;
  }
}

const SIMPLE_SEGMENT = /^[A-Za-z_][A-Za-z0-9_]*$/;
const escapeSegment = (key) => (SIMPLE_SEGMENT.test(key) ? key : `\`${key.replace(/\\/g, '\\\\').replace(/`/g, '\\`')}\``);
const isIncrement = (v) => v !== null && typeof v === 'object' && '__increment' in v;
const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v) && !(v instanceof Date) && !isIncrement(v);

export function encodeValue(v) {
  if (v === null || v === undefined) return { nullValue: null };
  if (v instanceof Date) return { timestampValue: v.toISOString() };
  switch (typeof v) {
    case 'string': return { stringValue: v };
    case 'boolean': return { booleanValue: v };
    case 'number': return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
    case 'object':
      if (Array.isArray(v)) return { arrayValue: { values: v.map(encodeValue) } };
      return { mapValue: { fields: encodeFields(v) } };
    default: throw new Error(`Unsupported Firestore value type: ${typeof v}`);
  }
}
export function encodeFields(obj) {
  const out = {};
  for (const [key, value] of Object.entries(obj)) out[key] = encodeValue(value);
  return out;
}
export function decodeValue(val) {
  if ('stringValue' in val) return val.stringValue;
  if ('integerValue' in val) return Number(val.integerValue);
  if ('doubleValue' in val) return val.doubleValue;
  if ('booleanValue' in val) return val.booleanValue;
  if ('timestampValue' in val) return new Date(val.timestampValue);
  if ('nullValue' in val) return null;
  if ('mapValue' in val) return decodeFields(val.mapValue.fields || {});
  if ('arrayValue' in val) return (val.arrayValue.values || []).map(decodeValue);
  return null;
}
export function decodeFields(fields) {
  const out = {};
  for (const [key, value] of Object.entries(fields || {})) out[key] = decodeValue(value);
  return out;
}

function setNested(fields, segments, encoded) {
  let cursor = fields;
  for (let i = 0; i < segments.length - 1; i += 1) {
    cursor[segments[i]] ||= { mapValue: { fields: {} } };
    cursor = cursor[segments[i]].mapValue.fields;
  }
  cursor[segments[segments.length - 1]] = encoded;
}

/** Splits data into encoded fields, a merge mask of leaf paths, and server-side transforms. */
function flatten(data, prefix = [], out = { fields: {}, mask: [], transforms: [] }) {
  for (const [key, value] of Object.entries(data)) {
    const segments = [...prefix, key];
    const fieldPath = segments.map(escapeSegment).join('.');
    if (value === SERVER_TIME) {
      out.transforms.push({ fieldPath, setToServerValue: 'REQUEST_TIME' });
    } else if (isIncrement(value)) {
      out.transforms.push({ fieldPath, increment: { integerValue: String(value.__increment) } });
    } else if (isPlainObject(value) && Object.keys(value).length > 0) {
      flatten(value, segments, out);
    } else {
      setNested(out.fields, segments, encodeValue(value));
      out.mask.push(fieldPath);
    }
  }
  return out;
}

const AUTO_ID_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
function autoId() {
  const bytes = crypto.getRandomValues(new Uint8Array(20));
  return Array.from(bytes, (b) => AUTO_ID_ALPHABET[b % AUTO_ID_ALPHABET.length]).join('');
}

/**
 * getToken: async () => OAuth access token (production) or 'owner' (emulator).
 * baseUrl: https://firestore.googleapis.com in production, http://127.0.0.1:8080 for the emulator.
 */
export function createFirestore({ projectId, databaseId = 'homefinder', baseUrl = 'https://firestore.googleapis.com', getToken, fetchImpl = fetch }) {
  const dbPath = `projects/${projectId}/databases/${databaseId}`;
  const root = `${baseUrl.replace(/\/+$/, '')}/v1/${dbPath}`;
  const docUrl = (path) => `${root}/documents/${path.split('/').map(encodeURIComponent).join('/')}`;
  const docName = (path) => `${dbPath}/documents/${path}`;

  async function send(method, url, body) {
    const res = await fetchImpl(url, {
      method,
      headers: { Authorization: `Bearer ${await getToken()}`, 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body)
    });
    const text = await res.text();
    let json = null;
    try { json = text ? JSON.parse(text) : null; } catch { json = null; }
    return { httpStatus: res.status, ok: res.ok, json, status: json?.error?.status || null };
  }

  function buildWrite(path, data, { merge, precondition }) {
    const { fields, mask, transforms } = flatten(data);
    const write = { update: { name: docName(path), fields } };
    if (merge) write.updateMask = { fieldPaths: mask };
    if (transforms.length) write.updateTransforms = transforms;
    if (precondition) write.currentDocument = precondition;
    return write;
  }
  const commit = (writes) => send('POST', `${root}/documents:commit`, { writes });

  return {
    /** Reads a document. Returns { data, updateTime } or null when it does not exist. */
    async get(path) {
      const res = await send('GET', docUrl(path));
      if (res.httpStatus === 404) return null;
      if (!res.ok) throw new FirestoreError(res.httpStatus, res.status);
      return { data: decodeFields(res.json.fields || {}), updateTime: res.json.updateTime };
    },
    /** Atomic create. Returns false when the document already exists. */
    async createIfAbsent(path, data) {
      const res = await commit([buildWrite(path, data, { merge: false, precondition: { exists: false } })]);
      if (res.ok) return true;
      if (res.httpStatus === 409 || res.status === 'ALREADY_EXISTS') return false;
      throw new FirestoreError(res.httpStatus, res.status);
    },
    /** Merge write (creates the document when missing). */
    async merge(path, data) {
      const res = await commit([buildWrite(path, data, { merge: true })]);
      if (!res.ok) throw new FirestoreError(res.httpStatus, res.status);
    },
    /** Several merge writes committed atomically: [{ path, data }]. */
    async mergeMany(entries) {
      const res = await commit(entries.map((e) => buildWrite(e.path, e.data, { merge: true })));
      if (!res.ok) throw new FirestoreError(res.httpStatus, res.status);
    },
    /** Merge write that applies only if the document is unchanged since updateTime. Returns false otherwise. */
    async updateIfUnchanged(path, data, updateTime) {
      const res = await commit([buildWrite(path, data, { merge: true, precondition: { updateTime } })]);
      if (res.ok) return true;
      if (res.status === 'FAILED_PRECONDITION' || res.status === 'ABORTED' || res.httpStatus === 409) return false;
      throw new FirestoreError(res.httpStatus, res.status);
    },
    /** Adds a document with an auto-generated id; returns the id. */
    async add(collectionPath, data) {
      for (let attempt = 0; attempt < 3; attempt += 1) {
        const id = autoId();
        if (await this.createIfAbsent(`${collectionPath}/${id}`, data)) return id;
      }
      throw new Error('Could not allocate a document id.');
    }
  };
}
