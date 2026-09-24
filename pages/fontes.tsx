import Institutional from '../components/Institutional';

function Section({title,children}:{title:string;children:React.ReactNode}){return <section className="section"><h2>{title}</h2><p className="desc">{children}</p></section>}

export default function Sources(){
  return <Institutional title="Fontes e créditos" desc="Informações sobre os dados e elementos exibidos no Database.">
    <Section title="Dados apresentados">O projeto organiza informações de partidas, temporadas, classificações, clubes, jogadores, estatísticas e recordes do Brasileirão Série A. A disponibilidade de cada indicador pode variar conforme a cobertura dos dados.</Section>
    <Section title="Critérios de leitura">Resultados e estatísticas são apresentados conforme registrados na base do projeto. Temporadas em andamento são parciais; partidas agendadas, adiadas ou sem resultado confirmado não são tratadas como finalizadas.</Section>
    <Section title="Marcas e elementos visuais">Nomes, emblemas e demais marcas de clubes e competições pertencem aos seus respectivos titulares. São exibidos para identificação e contexto, sem sugerir vínculo, patrocínio ou endosso oficial.</Section>
    <Section title="Dúvidas e correções">Se algum dado ou crédito precisar de revisão, <a href="https://www.linkedin.com/in/felipesoarws/" target="_blank" rel="noreferrer">entre em contato comigo pelo LinkedIn</a>.</Section>
  </Institutional>;
}
