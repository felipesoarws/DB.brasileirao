import {useEffect,useState} from 'react';
import Institutional from '../components/Institutional';

export default function Cookies(){
  const [value,setValue]=useState<string|null>(null);
  useEffect(()=>setValue(localStorage.getItem('brdb-cookie')),[]);
  const save=(next:string|null)=>{if(next)localStorage.setItem('brdb-cookie',next);else localStorage.removeItem('brdb-cookie');setValue(next)};
  return <Institutional title="Cookies e preferências" desc="Gerencie a preferência salva por este navegador.">
    <section className="card" aria-live="polite">
      <p>Status atual: <b>{value==='accepted'?'Aceito':value==='rejected'?'Recusado':'Ainda não escolhido'}</b></p>
      <p className="desc">O Database grava somente sua escolha sobre o aviso de preferências, no armazenamento local deste navegador. A aplicação não usa essa escolha para personalização ou publicidade.</p>
      <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
        <button className="btn primary" onClick={()=>save('accepted')}>Aceitar</button>
        <button className="btn" onClick={()=>save('rejected')}>Recusar</button>
        <button className="btn" onClick={()=>save(null)}>Redefinir escolha</button>
      </div>
    </section>
    <section className="section"><h2>Sobre o armazenamento</h2><p className="desc">A preferência fica no seu navegador sob a chave <code>brdb-cookie</code>. Ela não é um cookie HTTP. Você também pode removê-la limpando os dados locais do site no navegador.</p></section>
    <section className="section"><h2>Dúvidas</h2><p className="desc">Se tiver alguma dúvida sobre privacidade ou sobre o projeto, <a href="https://www.linkedin.com/in/felipesoarws/" target="_blank" rel="noreferrer">fale comigo pelo LinkedIn</a>.</p></section>
  </Institutional>;
}
