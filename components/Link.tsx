import type {AnchorHTMLAttributes,ReactNode} from 'react';

type LinkProps=Omit<AnchorHTMLAttributes<HTMLAnchorElement>,'href'|'children'>&{
  href:string;
  children:ReactNode;
};

/**
 * Use native document navigation instead of Next.js client transitions.
 * The Pages Router transports page props through `/_next/data/*.json` on
 * client-side navigation, which the site owner wants to avoid exposing in
 * the browser Network panel.
 */
export default function Link({href,children,...props}:LinkProps){
  return <a href={href} {...props}>{children}</a>;
}
