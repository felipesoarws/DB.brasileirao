import Head from 'next/head';
import {absoluteUrl,jsonLd,SITE_NAME} from '../lib/site';

export default function Seo({title,description,path,image='/favicon.png?v=20260923',icon,schema}:{title:string;description:string;path:string;image?:string;icon?:string;schema?:Record<string,unknown>}){
  const canonical=absoluteUrl(path.split(/[?#]/,1)[0]||'/');
  const imageUrl=absoluteUrl(image);
  return <Head>
    <title>{title}</title>
    <meta key="description" name="description" content={description}/>
    <link key="canonical" rel="canonical" href={canonical}/>
    {icon&&<link key="favicon" rel="icon" type="image/png" href={icon}/>}
    <meta key="og:type" property="og:type" content="website"/>
    <meta key="og:locale" property="og:locale" content="pt_BR"/>
    <meta key="og:site_name" property="og:site_name" content={SITE_NAME}/>
    <meta key="og:title" property="og:title" content={title}/>
    <meta key="og:description" property="og:description" content={description}/>
    <meta key="og:url" property="og:url" content={canonical}/>
    <meta key="og:image" property="og:image" content={imageUrl}/>
    <meta key="og:image:alt" property="og:image:alt" content="Brasileirão Database — dados do Campeonato Brasileiro Série A"/>
    <meta key="twitter:card" name="twitter:card" content="summary_large_image"/>
    <meta key="twitter:title" name="twitter:title" content={title}/>
    <meta key="twitter:description" name="twitter:description" content={description}/>
    <meta key="twitter:image" name="twitter:image" content={imageUrl}/>
    {schema&&<script key="structured-data" type="application/ld+json" dangerouslySetInnerHTML={{__html:jsonLd(schema)}}/>}
  </Head>;
}
