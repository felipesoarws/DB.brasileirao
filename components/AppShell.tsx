import Link from './Link';
import {useRouter} from 'next/router';
import {ReactNode,useEffect,useRef,useState} from 'react';

type Theme='light'|'dark';
const nav=[['⌘','Dashboard','/'],['▣','Temporadas','/temporadas'],['♙','Clubes','/clubes'],['○','Partidas','/partidas'],['⇄','Confrontos','/confrontos'],['◷','Linha do tempo','/linha-do-tempo'],['▤','Simulação','/simulacao'],['▥','Recordes','/recordes']];

function BrandMark(){return <span className="mark"><img src="/favicon.png?v=20260923" alt=""/></span>}

function Menu({close,updated,theme,onToggle}:{close?:()=>void;updated:string;theme:Theme;onToggle:()=>void}){
  const router=useRouter();
  return <>
    <Link className="brand" href="/" onClick={close}><BrandMark/><span><b>Database</b><small>Brasileirão Série A</small></span></Link>
    {close&&<button type="button" className="drawer-close" aria-label="Fechar menu" onClick={close}>×</button>}
    <span className="nav-label">Navegação</span>
    <nav className="nav">
      {nav.map(([icon,name,href])=><Link key={href} href={href} onClick={close} className={router.pathname===href||(href!=='/'&&router.pathname.startsWith(href))?'active':''}><span className="ico">{icon}</span>{name}</Link>)}
    </nav>
    <div className="spacer"/>
    <div className="institutional">{[['Sobre','/sobre'],['Fontes','/fontes'],['Privacidade','/privacidade'],['Termos','/termos'],['Cookies','/cookies']].map(([name,href])=><Link href={href} key={href} onClick={close}>{name}</Link>)}</div>
    <div className="side-foot">
      <button type="button" className="theme-toggle" role="switch" aria-checked={theme==='dark'} onClick={onToggle}>
        <span className="ico" aria-hidden="true">{theme==='dark'?'☀':'☾'}</span><span>{theme==='dark'?'Tema claro':'Tema escuro'}</span><span className="theme-toggle-state">{theme==='dark'?'Ativo':''}</span>
      </button>
      <div className="side-foot-divider" aria-hidden="true"/>
      {[
        ['in','LinkedIn','https://www.linkedin.com/in/felipesoarws/'],
        ['github','GitHub','https://github.com/felipesoarws'],
        ['↗','Portfólio','https://www.felipesoarws.me/'],
      ].map(item=><a className="social" href={item[2]} target="_blank" rel="noreferrer" key={item[1]}><span className="ico">{item[0]==='github'?<svg viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.48 0-.237-.009-.866-.014-1.7-2.782.605-3.369-1.342-3.369-1.342-.455-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.091-.647.35-1.087.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.684-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.748-1.025 2.748-1.025.546 1.377.202 2.394.1 2.647.64.7 1.028 1.593 1.028 2.684 0 3.842-2.339 4.687-4.566 4.935.359.31.678.92.678 1.855 0 1.339-.012 2.419-.012 2.747 0 .266.18.577.687.479A10.002 10.002 0 0 0 22 12c0-5.523-4.477-10-10-10Z" clipRule="evenodd"/></svg>:item[0]}</span>{item[1]}</a>)}
      <p className="status"><i className="dot"/>{updated?`Dados atualizados em ${updated}`:'Data de atualização indisponível'}</p>
    </div>
  </>;
}

function Cookie(){
  const [value,setValue]=useState<string|null>(null);
  useEffect(()=>setValue(localStorage.getItem('brdb-cookie')),[]);
  if(value)return null;
  const save=(next:string)=>{localStorage.setItem('brdb-cookie',next);setValue(next)};
  return <aside className="cookie"><div><b>Preferências locais</b><br/>Usamos armazenamento local apenas para lembrar sua decisão sobre cookies.</div><div><Link className="btn" href="/cookies">Saiba mais</Link> <button className="btn" onClick={()=>save('rejected')}>Recusar</button> <button className="btn primary" onClick={()=>save('accepted')}>Aceitar</button></div></aside>;
}

function BackButton(){
  const router=useRouter();
  const back=()=>{const path=router.pathname,destination=path==='/temporadas'||path==='/clubes'?'/':path.startsWith('/temporadas/')?'/temporadas':path.startsWith('/clubes/')?'/clubes':path.startsWith('/partidas/')?'/partidas':'/';window.location.assign(destination)};
  return <button className="page-back" type="button" onClick={back} aria-label="Voltar para a página anterior"><span aria-hidden="true">←</span><span>Voltar</span></button>;
}

export default function AppShell({children}:{children:ReactNode}){
  const [open,setOpen]=useState(false),[closing,setClosing]=useState(false),[updated,setUpdated]=useState(''),[theme,setTheme]=useState<Theme>('light');
  const router=useRouter();
  const openRef=useRef(open);
  openRef.current=open;
  function closeMenu(){if(openRef.current)setClosing(true)}
  useEffect(()=>{
    const saved=localStorage.getItem('brdb-theme');
    const initial:Theme=saved==='dark'?'dark':'light';
    setTheme(initial);
    document.documentElement.dataset.theme=initial;
    document.documentElement.style.colorScheme=initial;
    const handleEscape=(event:KeyboardEvent)=>{if(event.key==='Escape')closeMenu()};
    addEventListener('keydown',handleEscape);
    fetch('/api/data-status').then(response=>response.ok?response.json():null).then(data=>{if(data?.lastUpdated){const date=new Date(data.lastUpdated);if(!Number.isNaN(date.getTime()))setUpdated(date.toLocaleDateString('pt-BR',{timeZone:'America/Sao_Paulo'}))}}).catch(()=>{});
    return()=>removeEventListener('keydown',handleEscape);
  },[]);
  useEffect(()=>{
    if(!closing)return;
    const timer=window.setTimeout(()=>{setOpen(false);setClosing(false)},220);
    return()=>window.clearTimeout(timer);
  },[closing]);
  const toggleTheme=()=>setTheme(current=>{
    const next:Theme=current==='dark'?'light':'dark';
    localStorage.setItem('brdb-theme',next);
    document.documentElement.dataset.theme=next;
    document.documentElement.style.colorScheme=next;
    return next;
  });
  const menuProps={updated,theme,onToggle:toggleTheme};
  return <div className={`shell app-${router.pathname==='/'?'home':'page'}`}>
    <aside className="sidebar"><Menu {...menuProps}/></aside>
    <header className="mobile"><Link href="/" className="brand" aria-label="Página inicial"><BrandMark/></Link><button className="btn" aria-label="Abrir menu" aria-expanded={open&&!closing} onClick={()=>{setClosing(false);setOpen(true)}}>☰</button></header>
    {open&&<><div className={`overlay${closing?' is-closing':''}`} onClick={closeMenu}/><aside className={`drawer${closing?' is-closing':''}`}><Menu {...menuProps} close={closeMenu}/></aside></>}
    <main className="main"><div className="page" key={router.asPath}>{router.pathname!=='/'&&<BackButton/>}{children}</div></main>
    <Cookie/>
  </div>;
}
