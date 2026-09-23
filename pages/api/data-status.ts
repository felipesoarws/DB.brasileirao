import type {NextApiRequest, NextApiResponse} from 'next';
import {updatedAt} from '../../lib/data/gold';

export default function handler(req:NextApiRequest,res:NextApiResponse){
  if(req.method!=='GET'){
    res.setHeader('Allow','GET');
    return res.status(405).end();
  }
  res.setHeader('Cache-Control','public, s-maxage=3600, stale-while-revalidate=86400');
  return res.status(200).json({lastUpdated:updatedAt()});
}
