import Institutional from '../components/Institutional';

function Section({title,children}:{title:string;children:React.ReactNode}){return <section className="section"><h2>{title}</h2><p className="desc">{children}</p></section>}

export default function About(){
  return <Institutional title="Sobre" desc="O BR.database é uma plataforma independente para explorar dados, temporadas e histórias do Campeonato Brasileiro Série A.">
    <Section title="O que você encontra">Consulte a classificação geral, como mandante ou visitante; partidas e seus detalhes; páginas individuais dos clubes; e o histórico das temporadas.</Section>
    <Section title="Explore os dados">A plataforma também reúne estatísticas por temporada e clube, artilharia quando disponível, recordes históricos, comparações de confronto direto e a evolução da posição dos times rodada a rodada.</Section>
    <Section title="Dados em atualização">Temporadas em andamento podem conter jogos ainda não disputados e classificações parciais. Indicadores dependem dos dados disponíveis para cada competição, time e partida; informações ausentes são mostradas como indisponíveis, não como zero.</Section>
    <Section title="Projeto independente">BR.database não é um produto oficial da CBF nem representa clubes, atletas ou competições. A identidade visual dos times é usada para facilitar sua identificação.</Section>
    <Section title="Contato e correções">Encontrou algo que merece revisão ou quer conversar sobre o projeto? <a href="https://www.linkedin.com/in/felipesoarws/" target="_blank" rel="noreferrer">Fale comigo pelo LinkedIn</a>.</Section>
  </Institutional>;
}
