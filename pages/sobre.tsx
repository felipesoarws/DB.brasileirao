import Institutional from '../components/Institutional';

function Section({title,children}:{title:string;children:React.ReactNode}){return <section className="section"><h2>{title}</h2><p className="desc">{children}</p></section>}

export default function About(){
  return <Institutional title="Sobre" desc="O Database é uma plataforma independente para explorar dados, temporadas e histórias do Campeonato Brasileiro Série A.">
    <Section title="Explore o Brasileirão">Consulte resultados por rodada, classificação geral e recortes de mandante e visitante, estatísticas de clubes e partidas, artilharia quando disponível, recordes e campanhas históricas.</Section>
    <Section title="Uma página para cada recorte">As páginas de temporada reúnem jogos, classificação e líderes por rodada. As páginas dos clubes organizam campanhas por edição; o detalhe de cada partida reúne placar, escalações e estatísticas publicadas para aquele jogo.</Section>
    <Section title="Como interpretar os números">Os indicadores são calculados somente quando há dados suficientes. Gols por jogo consideram partidas finalizadas com placar disponível; aproveitamento é a proporção de pontos conquistados sobre os pontos possíveis nos jogos disputados. Os recortes de casa e fora usam o mando registrado em cada partida.</Section>
    <Section title="Temporadas em andamento">A edição atual apresenta dados parciais. Jogos futuros não entram em resultados concluídos; líderes e posições de rodadas ainda não encerradas podem permanecer sem confirmação. Um dado ausente é mostrado como indisponível, não como zero.</Section>
    <Section title="Atualização e cobertura">A data da última atualização disponível é exibida no menu lateral. A cobertura de escalações, estatísticas e outros indicadores pode variar de uma temporada ou partida para outra; a página informa quando um dado não está disponível.</Section>
    <Section title="Projeto independente">Database não é um produto oficial da CBF nem representa clubes, atletas ou competições. A identidade visual dos times é usada para facilitar sua identificação.</Section>
    <Section title="Contato e correções">Encontrou algo que merece revisão ou quer conversar sobre o projeto? <a href="https://www.linkedin.com/in/felipesoarws/" target="_blank" rel="noreferrer">Fale comigo pelo LinkedIn</a>.</Section>
  </Institutional>;
}
