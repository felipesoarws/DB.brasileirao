import {Html,Head,Main,NextScript} from 'next/document';
import Script from 'next/script';

export default function Document(){
  return <Html lang="pt-BR" suppressHydrationWarning><Head/><body>
    <Script id="brdb-theme-init" strategy="beforeInteractive" dangerouslySetInnerHTML={{__html:"try{var theme=localStorage.getItem('brdb-theme');document.documentElement.dataset.theme=theme==='dark'?'dark':'light';document.documentElement.style.colorScheme=theme==='dark'?'dark':'light'}catch(_){document.documentElement.dataset.theme='light'}"}}/>
    <Main/><NextScript/>
  </body></Html>;
}
