import type {ReactNode} from 'react';

/** Browser media selection avoids downloading/playing the GIF in reduced mode. */
export default function GifPicture({src,children}:{src:string;children:ReactNode}) {
 if(!src.startsWith('/media/')||!src.endsWith('.gif'))return <>{children}</>;
 return <picture className="gif-picture"><source media="(prefers-reduced-motion: reduce)" type="image/webp" srcSet={src+'.poster.webp'} />{children}</picture>;
}
