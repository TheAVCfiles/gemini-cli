/**
 * AVC Client Relay SDK (browser / Next.js client-side)
 * - Encrypt snapshot payload with AES-GCM (Web Crypto)
 * - Sign snapshot metadata with ECDSA P-256 (Web Crypto)
 * - POST /api/v1/snapshots
 * - Optional WS subscription helper
 *
 * Design goals:
 * - minimal surface area
 * - no external deps
 * - works in modern browsers (and Next.js client components)
 */

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

function b64urlEncode(bytes) {
  const bin = String.fromCharCode(...new Uint8Array(bytes));
  const b64 = btoa(bin)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
  return b64;
}
function b64urlDecode(str) {
  const b64 =
    str.replace(/-/g, '+').replace(/_/g, '/') +
    '==='.slice((str.length + 3) % 4);
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

async function sha256(bytes) {
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return new Uint8Array(digest);
}

export async function generateIdentity() {
  // ECDSA signing key
  const signKeyPair = await crypto.subtle.generateKey(
    { name: 'ECDSA', namedCurve: 'P-256' },
    true,
    ['sign', 'verify'],
  );

  // Export public key as JWK (safe to share)
  const publicJwk = await crypto.subtle.exportKey('jwk', signKeyPair.publicKey);

  // Export private key as JWK (keep local; store in IndexedDB/localStorage only if you accept risk)
  const privateJwk = await crypto.subtle.exportKey(
    'jwk',
    signKeyPair.privateKey,
  );

  return { publicJwk, privateJwk };
}

export async function importSigningKeys({ publicJwk, privateJwk }) {
  const publicKey = await crypto.subtle.importKey(
    'jwk',
    publicJwk,
    { name: 'ECDSA', namedCurve: 'P-256' },
    true,
    ['verify'],
  );
  const privateKey = await crypto.subtle.importKey(
    'jwk',
    privateJwk,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign'],
  );
  return { publicKey, privateKey };
}

export async function encryptSnapshot(payload, { aad = {} } = {}) {
  // payload: object
  const plaintext = textEncoder.encode(JSON.stringify(payload));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt'],
  );

  const additionalData = textEncoder.encode(JSON.stringify(aad));

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, additionalData },
    key,
    plaintext,
  );

  const rawKey = new Uint8Array(await crypto.subtle.exportKey('raw', key));
  const digest = await sha256(plaintext);

  return {
    v: 1,
    iv: b64urlEncode(iv),
    key: b64urlEncode(rawKey), // ⚠️ for MVP only. In production, wrap key with recipient public key / KMS.
    aad: b64urlEncode(additionalData),
    ct: b64urlEncode(new Uint8Array(ciphertext)),
    sha256: b64urlEncode(digest),
  };
}

export async function signEnvelope(envelope, signingPrivateKey) {
  // envelope: { ... } object
  const bytes = textEncoder.encode(JSON.stringify(envelope));
  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    signingPrivateKey,
    bytes,
  );
  return b64urlEncode(new Uint8Array(signature));
}

export async function verifyEnvelope(
  envelope,
  signatureB64Url,
  signingPublicKey,
) {
  const bytes = textEncoder.encode(JSON.stringify(envelope));
  const sig = b64urlDecode(signatureB64Url);
  return crypto.subtle.verify(
    { name: 'ECDSA', hash: 'SHA-256' },
    signingPublicKey,
    sig,
    bytes,
  );
}

export async function postSnapshot({
  baseUrl,
  token,
  projectId,
  type = 'snapshot',
  payload,
  signingKeys, // {privateKey, publicKeyJwk}
  meta = {},
}) {
  const createdAt = new Date().toISOString();
  const envelope = {
    v: 1,
    type,
    projectId,
    createdAt,
    meta,
  };

  const encrypted = await encryptSnapshot(payload, { aad: envelope });
  const signature = signingKeys?.privateKey
    ? await signEnvelope({ envelope, encrypted }, signingKeys.privateKey)
    : null;

  const body = {
    envelope,
    encrypted,
    signature,
    signer: signingKeys?.publicJwk || null,
  };

  const res = await fetch(`${baseUrl.replace(/\/$/, '')}/api/v1/snapshots`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Snapshot upload failed (${res.status}): ${text}`);
  }
  return res.json();
}

export function subscribeWS({
  wsUrl,
  token,
  onMessage,
  onOpen,
  onClose,
  onError,
}) {
  // wsUrl example: ws://localhost:3000/ws
  const url = new URL(wsUrl);
  if (token) url.searchParams.set('token', token);

  const ws = new WebSocket(url.toString());

  ws.onopen = () => onOpen?.();
  ws.onclose = (e) => onClose?.(e);
  ws.onerror = (e) => onError?.(e);
  ws.onmessage = (evt) => {
    try {
      const data = JSON.parse(evt.data);
      onMessage?.(data);
    } catch {
      onMessage?.(evt.data);
    }
  };

  return () => ws.close();
}
