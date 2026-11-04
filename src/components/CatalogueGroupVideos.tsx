import {YouTubeGallery,findYouTubeVideos} from './YouTubeEmbed';
type Group = {title: string; links?: readonly {type: string; url: string; label: string}[]};
export const hasCatalogueGroupVideos=(group: Group)=>findYouTubeVideos(group.links||[]).length>0;
export default function CatalogueGroupVideos({group}: {group: Group}) {
 const links=findYouTubeVideos(group.links||[]);
 return links.length ? <div className="catalogue-group-videos"><YouTubeGallery links={links} title={group.title} /></div> : null;
}
