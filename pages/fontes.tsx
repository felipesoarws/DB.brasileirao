import Institutional from '../components/Institutional';

function Section({title,children}:{title:string;children:React.ReactNode}){return <section className="section"><h2>{title}</h2><p className="desc">{children}</p></section>}

export default function Sources(){
  return <Institutional title="Dados, metodologia e créditos" desc="O que os indicadores do DB.brasileirao representam, como são calculados e quais limites de cobertura considerar.">
    <Section title="Cobertura">O acervo organiza temporadas, partidas, clubes, jogadores, classificações, estatísticas e recordes do Brasileirão Série A. Nem todo campo está disponível em todas as edições; cada página mantém essa distinção em vez de preencher lacunas com valores presumidos.</Section>
    <Section title="Partidas e resultados">Uma partida só compõe cálculos de resultado quando está identificada como finalizada e tem o placar disponível. Jogos agendados, adiados, em andamento ou sem placar confirmado não contam como resultados concluídos.</Section>
    <Section title="Classificação e mando de campo">A classificação total apresenta a campanha da edição. Os recortes Casa e Fora consideram, respectivamente, apenas partidas em que o clube aparece como mandante ou visitante. Pontos, vitórias, empates, derrotas, gols pró, gols contra e saldo seguem os dados disponíveis para aquela temporada.</Section>
    <Section title="Médias e aproveitamento">A média de gols da competição divide os gols marcados pelas duas equipes pelo número de partidas finalizadas. Na página de um clube, a média da temporada considera os gols daquele próprio clube e as partidas que ele disputou. Aproveitamento é calculado como pontos conquistados divididos pelos pontos possíveis nos jogos disputados, apresentado em percentual.</Section>
    <Section title="Forma recente e rodadas">A sequência dos últimos cinco jogos usa partidas finalizadas em ordem cronológica inversa, da mais recente para a mais antiga. Os líderes por rodada refletem as posições publicadas para cada rodada; rodadas futuras sem posição disponível aparecem como não definidas.</Section>
    <Section title="Previsões e cotações">Estimativas de placar e expectativa de gols são projeções calculadas a partir dos dados disponíveis, não resultados oficiais nem garantias. Cotações são informativas e não constituem recomendação de aposta ou investimento.</Section>
    <Section title="Marcas e elementos visuais">Nomes, emblemas e demais marcas de clubes e competições pertencem aos seus respectivos titulares. São exibidos para identificação e contexto, sem sugerir vínculo, patrocínio ou endosso oficial.</Section>
    <Section title="Dúvidas e correções">Se algum dado ou crédito precisar de revisão, <a href="https://www.linkedin.com/in/felipesoarws/" target="_blank" rel="noreferrer">entre em contato comigo pelo LinkedIn</a>.</Section>
  </Institutional>;
}
