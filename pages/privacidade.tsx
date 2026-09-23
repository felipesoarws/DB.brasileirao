import Institutional from '../components/Institutional';

const Section=({title,children}:{title:string;children:React.ReactNode})=><section className="section"><h2>{title}</h2><p className="desc">{children}</p></section>;

export default function Privacy(){
  return <Institutional title="Privacidade" desc="Como o Brasileirão Database trata informações ao navegar pelo site.">
    <p className="caption">Última atualização: 23 de setembro de 2026</p>
    <Section title="Quem mantém este projeto">O Brasileirão Database é um projeto independente, sem vínculo oficial com a CBF, os clubes ou os fornecedores de dados e serviços mencionados no site.</Section>
    <Section title="Informações tratadas pelo site">O site não oferece cadastro ou login, não solicita dados pessoais em formulários e não tem ferramenta de analytics ou publicidade configurada no código da aplicação. A infraestrutura que hospeda o site pode processar dados técnicos de acesso para operação e segurança; os registros e prazos dependem da configuração do provedor de hospedagem e não são definidos por esta aplicação.</Section>
    <Section title="Preferência salva no navegador">O aviso de preferências grava somente a escolha “aceita” ou “recusada” no armazenamento local do navegador, na chave <code>brdb-cookie</code>, para não exibir o aviso novamente. Isso é armazenamento local, não um cookie HTTP. A escolha pode ser alterada ou removida na página <a href="/cookies">Cookies</a>; limpar os dados do navegador também a remove.</Section>
    <Section title="Emblemas e serviços externos">Os emblemas dos clubes são carregados por uma rota deste site, que busca as imagens no CDN da ESPN. Ao solicitar uma imagem, a infraestrutura do site e o serviço de origem podem receber dados técnicos da requisição. Links para LinkedIn, GitHub e outros sites abrem serviços de terceiros, sujeitos às políticas próprias desses serviços.</Section>
    <Section title="Seus direitos e contato">Quando houver tratamento de dados pessoais sujeito à legislação aplicável, pedidos relacionados a confirmação, acesso, correção ou eliminação podem ser encaminhados pelos <a href="https://www.felipesoarws.me/" target="_blank" rel="noreferrer">canais do responsável pelo projeto</a>. A viabilidade de cada pedido depende do tipo de dado e das obrigações legais ou técnicas aplicáveis.</Section>
    <Section title="Alterações">Esta página pode ser atualizada se o funcionamento do site ou as práticas descritas mudarem. A data acima indica a revisão mais recente do texto.</Section>
  </Institutional>;
}
