import Head from 'next/head';
export default function Home(){
  const koFiUrl = "https://ko-fi.com/s/ROQUEPin001"; // replace
  return (
    <>
      <Head>
        <title>ROQUE Drop 001 — Hand-Hemmed Sigil Pin</title>
        <meta name="description" content="ROQUE Drop 001 — Hand-Hemmed Sigil Pin. Wear the ledger. Activate the ritual."/>
      </Head>
      <main style={{fontFamily:'Georgia, serif',background:'#0b0c0d',color:'#f8f6f3',minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',padding:28}}>
        <div style={{maxWidth:920}}>
          <img src="/images/hero.jpg" alt="ROQUE Sigil Pin" style={{width:'100%',borderRadius:8}}/>
          <h1 style={{fontSize:40,marginTop:20}}>ROQUE Drop 001 — Hand-Hemmed Sigil Pin</h1>
          <p style={{fontSize:18,opacity:0.9}}>A limited edition of 75. Each piece is hand-finished, numbered, signed, and archived.</p>
          <p style={{marginTop:20}}><strong>Price:</strong> $150 — <strong>Ships:</strong> USA $5 / Intl $18</p>
          <div style={{marginTop:24}}>
            <a href={koFiUrl} target="_blank" rel="noreferrer" style={{background:'#d4af37',color:'#000',padding:'14px 22px',borderRadius:8,fontWeight:700,textDecoration:'none'}}>Buy on Ko-fi</a>
          </div>
          <div style={{marginTop:24,fontSize:14,opacity:0.85}}>
            <p><em>When you purchase, the card with the NFC & QR will be prepared and shipped. Scanning it activates the ritual and records provenance in your name.</em></p>
          </div>
        </div>
      </main>
    </>
  );
}
