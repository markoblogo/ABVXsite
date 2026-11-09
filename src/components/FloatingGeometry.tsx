'use client';

import {useEffect, useRef, useState} from 'react';
import {usePathname} from 'next/navigation';

// Decorative copies stay outside hero clipping. Source artwork remains the
// no-JS/reduced-motion fallback; route changes and resize rebuild the copies.
export default function FloatingGeometry() {
  const pathname = usePathname();
  const layer = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const [available, setAvailable] = useState(false);
  useEffect(() => {
    document.documentElement.classList.toggle('geometry-paused', paused);
    const host = layer.current;
    if (!host) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    let dispose = () => {};
    const setup = () => {
      dispose();
      host.replaceChildren();
      if (!['/', '/about', '/focus', '/systems', '/books', '/writing', '/work-with-me'].includes(pathname.replace(/^\/(fr|uk)(?=\/|$)/, '') || '/')) {setAvailable(false);return;}
      if (reduced.matches || paused) {setAvailable(!reduced.matches && paused); return;}
      const hero = document.querySelector<HTMLElement>('.hero-poster, .route-focus .page-header, .route-systems .page-header, .route-books .page-header, .route-writing .page-header, .route-about .page-header, .work-with-me-page .page-header');
      if (!hero) {setAvailable(false); return;}
      hero.classList.remove('geometry-in-motion');
      const sources: Array<[HTMLElement, string | null]> = hero.matches('.hero-poster')
        ? [[hero, '::before'], [hero, '::after'], ...Array.from(hero.querySelectorAll<HTMLElement>('.hero-poster__motif span')).map(el => [el, null] as [HTMLElement, null])]
        : [[hero, '::after']];
      const properties = ['width','height','background','border','borderRadius','boxShadow','opacity'];
      const origin = hero.getBoundingClientRect();
      const pieces = sources.map(([el, pseudo], index) => {
        const style = getComputedStyle(el, pseudo);
        const copy = document.createElement('span');
        for (const prop of properties) copy.style.setProperty(prop.replace(/[A-Z]/g, c => '-'+c.toLowerCase()), style.getPropertyValue(prop.replace(/[A-Z]/g, c => '-'+c.toLowerCase())));
        const rect = el.getBoundingClientRect();
        const width = parseFloat(style.width), height = parseFloat(style.height);
        const x = pseudo ? origin.left + (style.left !== 'auto' ? parseFloat(style.left) : origin.width - parseFloat(style.right) - width) : rect.left;
        const y = pseudo ? origin.top + (style.top !== 'auto' ? parseFloat(style.top) : origin.height - parseFloat(style.bottom) - height) : rect.top;
        copy.style.left = `${x}px`; copy.style.top = `${y}px`;
        host.append(copy);
        return {copy, x, top: y, y: y + scrollY, width, height, index, transform: style.transform === 'none' ? '' : style.transform, opacity: Number(style.opacity)};
      });
      hero.classList.add('geometry-in-motion'); setAvailable(true);
      const start = performance.now();
      let currentScroll = scrollY;
      const draw = (now: number) => {
        const t = (now-start)/1000;
        currentScroll += (scrollY-currentScroll)*0.08;
        const progress = Math.min(1, currentScroll / Math.max(1, origin.height));
        for (const p of pieces) {
          const phase = t/9 + p.index*1.7;
          const targetX = (innerWidth-p.width) * (0.5 + 0.38*Math.sin(phase/2));
          const targetY = Math.max(100, (innerHeight-p.height)*(0.48 + 0.25*Math.cos(phase/3)));
          const x = p.x*(1-progress) + targetX*progress + Math.sin(phase)*14;
          const y = (p.y-currentScroll)*(1-progress) + targetY*progress + Math.cos(phase)*10;
          p.copy.style.transform = `translate3d(${x-p.x}px,${y-p.top}px,0) rotate(${Math.sin(phase/2)*7}deg) ${p.transform}`;
          // The pieces travel behind reading at low contrast after the hero.
          p.copy.style.opacity = String(p.opacity*(1-progress*0.86));
        }
        frame = requestAnimationFrame(draw);
      };
      const visibility = () => {cancelAnimationFrame(frame); if (!document.hidden) frame=requestAnimationFrame(draw);};
      visibility(); document.addEventListener('visibilitychange',visibility);
      dispose = () => {cancelAnimationFrame(frame);document.removeEventListener('visibilitychange',visibility);hero.classList.remove('geometry-in-motion');};
    };
    setup(); window.addEventListener('resize',setup); reduced.addEventListener('change',setup);
    return () => {document.documentElement.classList.remove('geometry-paused');dispose();host.replaceChildren();window.removeEventListener('resize',setup);reduced.removeEventListener('change',setup);};
  }, [pathname, paused]);
  return <><div ref={layer} className="floating-geometry" aria-hidden="true" />{available && <button className="geometry-toggle" type="button" aria-pressed={paused} onClick={()=>setPaused(!paused)}>{paused ? 'Resume motion' : 'Pause motion'}</button>}</>;
}
