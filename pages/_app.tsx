import type {AppProps} from 'next/app';
import Head from 'next/head';
import localFont from 'next/font/local';
import '../styles/theme.css';
import '../styles/globals.css';
import '../styles/standings.css';
import '../styles/mobile.css';
import '../styles/branding.css';
import '../styles/match-detail.css';
import '../styles/head-to-head.css';
import '../styles/position-timeline.css';
import '../styles/team-select.css';
import AppShell from '../components/AppShell';

const geist=localFont({src:'../node_modules/geist/dist/fonts/geist-sans/Geist-Variable.woff2',variable:'--font-geist'});
const mono=localFont({src:'../node_modules/geist/dist/fonts/geist-mono/GeistMono-Variable.woff2',variable:'--font-mono'});

export default function App({Component,pageProps}:AppProps){
  return <div className={`${geist.className} ${geist.variable} ${mono.variable}`}><Head><meta key="application-name" name="application-name" content="Brasileirão Database"/><link key="favicon" rel="icon" type="image/png" href="/favicon.png?v=20260923"/></Head><AppShell><Component {...pageProps}/></AppShell></div>;
}
