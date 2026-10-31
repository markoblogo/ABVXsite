import {getLiveCatalogue} from '@/lib/live-catalogue';
import HeroPoster from '@/components/HeroPoster';
import HomepageLatestCard from '@/components/HomepageLatestCard';
import JsonLd from '@/components/JsonLd';
import SectionPanel from '@/components/SectionPanel';
import {defaultOgImage,metadataWithImage,SITE_URL,collectionPageJsonLd} from '@/lib/seo';
import pageMetadata from '../../content/pages.json';
import Link from 'next/link';
export const dynamic='force-dynamic';
const description='Anton Biletskyi-Volokh combines marketing, creative direction and product development with hands-on AI expertise to take ideas from brief to implementation and testing.';
export const metadata=metadataWithImage({title:pageMetadata['/'].seoTitle,description,canonicalPath:'/',image:defaultOgImage});
const capabilities=[
 {title:'Products & new opportunities',text:'Find the opportunity, shape the concept and build a prototype to test. Physical or digital products, grounded in a real audience and a clear proposition.'},
 {title:'Marketing & creative direction',text:'Positioning, brand ideas, campaigns and launches. Connect strategic thinking with creative execution, then test how people respond.'},
 {title:'AI & digital transformation',text:'Turn new technology into practical workflows. Build tools, automate repetitive work and organise processes that teams can use and improve.'},
];
export default async function Home(){
 const {getArtifacts}=await getLiveCatalogue();
 const projects=['framewright','mn7r','cropto'].flatMap(slug=>{const item=getArtifacts().find(x=>x.slug===slug);return item?[item]:[];});
 return <div className="home-redesign professional-home">
  <JsonLd id="jsonld-home-page" data={collectionPageJsonLd({id:SITE_URL+'/#home',name:'Anton Biletskyi-Volokh',description,url:SITE_URL,image:defaultOgImage})}/>
  <HeroPoster eyebrow="ANTON BILETSKYI-VOLOKH / MARKETING · CREATIVE · PRODUCT" title="From an idea to something that works." summary="I combine marketing and creative experience with hands-on AI and technology expertise to turn briefs into products, campaigns and working processes — then test and improve them.">
   <div className="hero-actions"><Link href="/work-with-me">Work with me →</Link><Link href="#selected-projects">Explore projects</Link></div>
  </HeroPoster>
  <section className="home-section" aria-labelledby="capabilities-title">
   <div className="home-section__header"><div className="eyebrow">What I can contribute</div><h2 id="capabilities-title">Strategy, creativity and the ability to build.</h2></div>
   <div className="professional-grid">{capabilities.map(item=><SectionPanel key={item.title} title={item.title}><p>{item.text}</p></SectionPanel>)}</div>
   <p className="professional-roles">Consultant · Marketing Director · Creative Director · Product Manager · Digital Transformation</p>
  </section>
  <section className="home-section" id="selected-projects" aria-labelledby="projects-title">
   <div className="home-section__header"><div className="eyebrow">Recent projects / last 12–18 months</div><h2 id="projects-title">A recent chapter of a longer career.</h2></div>
   <p>The projects, books and tools catalogued here were made over roughly the last year to year and a half. Earlier work is represented through the experience overview and selected stories, rather than a complete project archive.</p>
   <div className="professional-grid">{projects.map(item=><HomepageLatestCard key={item.slug} title={item.title} summary={item.summary} href={'/work/'+item.slug} image={item.thumbnail} label="Project" cta="Explore project"/>)}</div>
   <div className="hero-actions"><Link href="/systems">All projects & tools →</Link><Link href="/focus">Market infrastructure →</Link></div>
  </section>
  <section className="about-snapshot" aria-labelledby="experience-title">
   <div className="eyebrow">Experience</div><h2 id="experience-title">A marketing and creative foundation. A hands-on technology practice.</h2>
   <div className="about-snapshot__copy"><p>Over 20 years across strategic marketing, creative direction, brand, product development and international business communication shape how I approach a brief.</p><p>Today I use AI and modern development tools to shorten the path between a question and a testable solution: from concepts and prototypes to launches and operational workflows.</p><p>I work across digital products, consumer and hospitality concepts, and market infrastructure. The recent projects show how I apply that experience today.</p></div>
   <Link className="panel-link" href="/about">Experience & background →</Link>
  </section>
  <SectionPanel title="Have a role, a brief or an idea to discuss?" eyebrow="Employers & partners" accent><p>I am open to consulting, leadership roles and partnerships across marketing, creative direction, product management and digital transformation.</p><Link className="panel-link" href="/work-with-me">Explore ways to work together →</Link></SectionPanel>
  <section className="professional-library" aria-labelledby="library-title"><div><div className="eyebrow">Personal library</div><h2 id="library-title">Books & writing</h2><p>My books, notes and ongoing interests — an archive for readers and people following my work.</p></div><div className="hero-actions"><Link href="/books">Books →</Link><Link href="/writing">Writing →</Link></div></section>
 </div>;
}
