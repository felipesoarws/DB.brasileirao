import Head from 'next/head';
import Link from 'next/link';

export default function NotFoundPage(){
  return <>
    <Head>
      <title>404 — Brasileirão Database</title>
      <meta name="robots" content="noindex, nofollow"/>
      <meta name="description" content="A página que você procura não foi encontrada."/>
    </Head>
    <section className="not-found-page" aria-label="Erro 404">
      <section className="not-found-card card" aria-labelledby="not-found-title">
        <div className="not-found-code" aria-hidden="true">404</div>
        <div className="not-found-copy">
          <span className="not-found-eyebrow"><i/> PÁGINA NÃO ENCONTRADA</span>
          <h1 id="not-found-title">Esse caminho saiu pela linha de fundo.</h1>
          <p>O endereço pode estar incorreto ou a página não existe mais. Volte ao início ou explore as temporadas do Brasileirão.</p>
          <div className="not-found-actions">
            <Link href="/" className="btn primary">Ir para o início</Link>
            <Link href="/temporadas" className="btn">Ver temporadas</Link>
          </div>
        </div>
      </section>
      <style jsx>{`
        .not-found-page{min-height:min(72vh,760px);display:grid;place-items:center;padding:20px 0}
        .not-found-card{width:min(100%,760px);min-height:300px;display:grid;grid-template-columns:minmax(160px,.72fr) minmax(0,1.5fr);align-items:center;gap:30px;padding:38px 42px}
        .not-found-code{color:color-mix(in srgb,var(--theme-brand-primary) 18%,var(--theme-surface));font-size:clamp(82px,15vw,150px);font-weight:750;line-height:.9;letter-spacing:-.09em;text-align:center;font-variant-numeric:tabular-nums;user-select:none}
        .not-found-copy{min-width:0}
        .not-found-eyebrow{display:flex;align-items:center;gap:8px;color:var(--theme-brand-primary);font-size:10px;font-weight:700;letter-spacing:.09em}
        .not-found-eyebrow i{width:7px;height:7px;border-radius:50%;background:var(--theme-brand-primary)}
        h1{margin:12px 0 8px;color:var(--theme-text-primary);font-size:clamp(22px,3vw,30px);line-height:1.18;letter-spacing:-.035em}
        p{max-width:430px;margin:0;color:var(--theme-text-secondary);font-size:14px;line-height:1.65}
        .not-found-actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:22px}
        .not-found-actions .btn{display:inline-flex;align-items:center;justify-content:center;text-decoration:none;font-weight:550}
        @media(max-width:600px){.not-found-page{min-height:65vh;padding:4px 0}.not-found-card{grid-template-columns:1fr;gap:20px;min-height:0;padding:26px 20px;text-align:center}.not-found-code{font-size:96px}.not-found-eyebrow,.not-found-actions{justify-content:center}.not-found-copy p{margin-inline:auto}.not-found-actions{margin-top:18px}}
      `}</style>
    </section>
  </>;
}
