import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '';

export default function Activate() {
  const router = useRouter();
  const { id } = router.query;
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activating, setActivating] = useState(false);

  useEffect(() => {
    if (!id) {
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`${API_BASE}/api/receipt/${id}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }
        return response.json();
      })
      .then((json) => {
        if (!cancelled) {
          setReceipt(json.receipt || null);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error(err);
          setError('Unable to load the receipt for this activation link.');
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  const provenanceUrl = useMemo(() => {
    if (!receipt?.artifact_ipfs) {
      return null;
    }
    return `https://ipfs.io/ipfs/${receipt.artifact_ipfs.replace('ipfs://', '')}`;
  }, [receipt?.artifact_ipfs]);

  async function activate() {
    if (!id || activating) {
      return;
    }

    setActivating(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/api/activate/${id}`, {
        method: 'POST',
      });

      if (!res.ok) {
        throw new Error(`Activation failed with status ${res.status}`);
      }

      const json = await res.json();
      if (json.ok) {
        alert('Activated. Share your ritual.');
      } else {
        throw new Error('Activation failed');
      }
    } catch (err) {
      console.error(err);
      setError('Activation failed. Please try again.');
    } finally {
      setActivating(false);
    }
  }

  const audioSrc =
    receipt?.dance_vector?.delivery?.audioUrl ||
    receipt?.dance_vector?.delivery?.mp3Url ||
    '';

  return (
    <div
      style={{
        fontFamily: 'Georgia,serif',
        background: '#0b0c0d',
        color: '#fff',
        minHeight: '100vh',
        padding: 30,
      }}
    >
      <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
        <h1>Activate ROQUE Sigil</h1>
        {loading && <p>Loading…</p>}
        {!loading && error && <p style={{ color: '#ff6b6b' }}>{error}</p>}
        {!loading && !error && !receipt && (
          <p>We couldn&apos;t find a receipt for this activation.</p>
        )}
        {!loading && !error && receipt && (
          <>
            <p>
              Edition:{' '}
              <strong>
                {receipt.dance_vector?.product_sku} #{receipt.dance_vector?.edition_number}
              </strong>
            </p>
            {provenanceUrl && (
              <p>
                <a href={provenanceUrl} target="_blank" rel="noreferrer">
                  View provenance certificate
                </a>
              </p>
            )}
            {audioSrc ? (
              <audio controls src={audioSrc} />
            ) : (
              <p>Audio for this ritual is not available.</p>
            )}
            <div style={{ marginTop: 20 }}>
              <button
                onClick={activate}
                disabled={activating}
                style={{
                  background: activating ? '#b39b2a' : '#d4af37',
                  padding: '12px 18px',
                  borderRadius: 8,
                  border: 'none',
                  fontWeight: 700,
                  cursor: activating ? 'not-allowed' : 'pointer',
                  opacity: activating ? 0.7 : 1,
                }}
              >
                {activating ? 'Activating…' : 'Activate & Play Ritual'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
