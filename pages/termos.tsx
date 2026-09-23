import Institutional from '../components/Institutional';

const Section=({title,children}:{title:string;children:React.ReactNode})=><section className="section"><h2>{title}</h2><p className="desc">{children}</p></section>;

export default function Terms(){
  return <Institutional title="Termos de uso" desc="Condições para consultar o Brasileirão Database.">
    <p className="caption">Última atualização: 23 de setembro de 2026</p>
    <Section title="Sobre o projeto">O Brasileirão Database é um projeto independente, informativo e sem vínculo oficial com a Confederação Brasileira de Futebol (CBF), os clubes, atletas, competições ou fornecedores cujos nomes e serviços apareçam no site. O uso do site não cria relação comercial ou representação entre essas partes.</Section>
    <Section title="Uso das informações">As páginas organizam dados de temporadas, clubes e partidas para consulta. A base pode conter lacunas, divergências ou atrasos; jogos agendados e informações de temporadas em andamento podem mudar. Confira os canais oficiais da competição e dos clubes antes de tomar decisões com base nessas informações.</Section>
    <Section title="Disponibilidade e limitações">O site e os dados são fornecidos conforme disponíveis, sem garantia de atualização contínua, ausência de erros ou funcionamento ininterrupto. Campos sem informação são exibidos como indisponíveis e não devem ser interpretados como zero ou como confirmação de um fato.</Section>
    <Section title="Uso permitido">Você pode consultar e compartilhar links para as páginas do projeto. Não use o site de forma que prejudique sua disponibilidade, tente contornar controles de segurança ou apresente os dados como publicação oficial de terceiros. A reutilização de bases, textos ou imagens deve respeitar os direitos e termos de seus respectivos titulares e fontes.</Section>
    <Section title="Marcas, imagens e links">Nomes, escudos, marcas e conteúdos de terceiros pertencem aos respectivos titulares. Sua exibição serve apenas para identificar clubes e contextualizar os dados; não implica endosso ou autorização além dos direitos aplicáveis. Links externos levam a serviços independentes, cujos conteúdos e termos não são controlados por este projeto.</Section>
    <Section title="Mudanças nestes termos">Estes termos podem ser atualizados quando o projeto ou seus dados mudarem. A versão vigente estará disponível nesta página, com a data da revisão mais recente.</Section>
  </Institutional>;
}
