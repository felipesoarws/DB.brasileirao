import Institutional from '../components/Institutional';

function Section({title,children}:{title:string;children:React.ReactNode}){return <section className="section"><h2>{title}</h2><p className="desc">{children}</p></section>}

export default function Privacy(){
  return <Institutional title="Privacidade" desc="Como o Database lida com informações durante a navegação.">
    <p className="caption">Última atualização: 23 de setembro de 2026</p>
    <Section title="Um site sem cadastro">O Database não oferece contas ou login e não solicita dados pessoais em formulários. A aplicação não inclui ferramentas próprias de publicidade ou analytics.</Section>
    <Section title="Preferência salva no navegador">Para lembrar sua decisão sobre o aviso de preferências, o site armazena localmente no navegador o valor “aceita” ou “recusada”, na chave <code>brdb-cookie</code>. Esse registro não é um cookie HTTP e não é enviado pelo site como dado de perfil. Você pode alterar ou apagar sua escolha na página <a href="/cookies">Cookies</a> ou removendo os dados locais do navegador.</Section>
    <Section title="Dados técnicos e hospedagem">Como qualquer site, a infraestrutura que entrega as páginas pode processar informações técnicas da conexão para funcionamento, diagnóstico e segurança. A retenção desses registros depende da configuração do serviço de hospedagem.</Section>
    <Section title="Imagens e links externos">Os emblemas são solicitados por uma rota do próprio site e podem depender de um serviço externo de imagens. Links para LinkedIn, GitHub e outros serviços levam a sites de terceiros, que seguem suas próprias políticas.</Section>
    <Section title="Seus direitos e contato">Para dúvidas ou solicitações relacionadas à privacidade, <a href="https://www.linkedin.com/in/felipesoarws/" target="_blank" rel="noreferrer">fale comigo pelo LinkedIn</a>. Solicitações serão avaliadas conforme os dados efetivamente tratados e as obrigações aplicáveis.</Section>
    <Section title="Atualizações desta página">Este texto poderá mudar se as funcionalidades ou práticas do projeto forem alteradas. A data no início indica a revisão mais recente.</Section>
  </Institutional>;
}
