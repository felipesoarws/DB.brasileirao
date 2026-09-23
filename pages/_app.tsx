import type {AppProps} from 'next/app';import localFont from 'next/font/local';import '../styles/globals.css';import '../styles/standings.css';import '../styles/mobile.css';import AppShell from '../components/AppShell';
const geist=localFont({src:'../node_modules/geist/dist/fonts/geist-sans/Geist-Variable.woff2',variable:'--font-geist'});
const mono=localFont({src:'../node_modules/geist/dist/fonts/geist-mono/GeistMono-Variable.woff2',variable:'--font-mono'});
export default function App({Component,pageProps}:AppProps){return <div className={`${geist.className} ${geist.variable} ${mono.variable}`}><AppShell><Component {...pageProps}/></AppShell></div>}
