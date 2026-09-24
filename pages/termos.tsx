import Institutional from '../components/Institutional';

function Section({title,children}:{title:string;children:React.ReactNode}){return <section className="section"><h2>{title}</h2><p className="desc">{children}</p></section>}

export default function Terms(){
  return <Institutional title="Termos de uso" desc="Condições para consultar e compartilhar o Database.">
    <p className="caption">Última atualização: 23 de setembro de 2026</p>
    <Section title="Sobre o projeto">Database é uma iniciativa independente, informativa e sem vínculo oficial com a CBF, clubes, atletas, competições ou outros titulares de marcas exibidas no site.</Section>
    <Section title="Uso das informações">O site permite explorar partidas, temporadas, classificações, estatísticas, clubes e recordes do Brasileirão Série A. Os dados são apresentados para consulta e podem conter lacunas, divergências ou atrasos. Temporadas em andamento e partidas futuras estão sujeitas a alterações; confirme informações importantes junto aos canais oficiais relevantes.</Section>
    <Section title="Disponibilidade e limitações">O site é fornecido conforme disponível, sem garantia de atualização contínua, ausência de erros ou operação ininterrupta. Um campo indisponível significa que não há informação exibida para ele; não deve ser interpretado como zero nem como confirmação de um resultado.</Section>
    <Section title="Uso responsável">Você pode consultar e compartilhar links para as páginas. Não tente comprometer a segurança ou disponibilidade do serviço, contornar controles técnicos ou apresentar o projeto como publicação oficial. A reutilização de dados, textos, imagens, emblemas e marcas deve respeitar os direitos e condições de seus respectivos titulares.</Section>
    <Section title="Marcas e links externos">Nomes e elementos visuais de terceiros são usados para identificação e contexto, sem implicar endosso ou afiliação. Links externos direcionam a serviços independentes, cujos conteúdos e termos não são controlados pelo projeto.</Section>
    <Section title="Mudanças e contato">Estes termos podem ser revisados conforme o projeto evolui. Dúvidas sobre o site podem ser enviadas pelo <a href="https://www.linkedin.com/in/felipesoarws/" target="_blank" rel="noreferrer">LinkedIn do responsável pelo projeto</a>.</Section>
  </Institutional>;
}
