import {Html,Head,Main,NextScript} from 'next/document';

export default function Document(){
  return <Html lang="pt-BR" suppressHydrationWarning><Head/><body>
    <script src="/theme-init.js" />
    <Main/><NextScript/>
  </body></Html>;
}
