import PageHeader from '@/components/PageHeader';
import SectionPanel from '@/components/SectionPanel';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About',
  description:
    'Anton Biletskiy-Volokh designs and builds complex systems at the intersection of strategy, markets, technology, language and AI.',
  alternates: { canonical: 'https://abvx.xyz/about' },
};

export default function AboutPage() {
  return (
    <div className="route-about grid gap-8">
      <PageHeader
        eyebrow="About"
        title="About"
        summary="I design and build complex systems at the intersection of strategy, markets, technology, language and AI."
      />

      <SectionPanel title="Systems that can be used" eyebrow="Background">
        <div className="prose-block">
          <p>
            For more than 25 years, I have worked across strategic marketing,
            creative direction, product development and go-to-market: creating
            brands, products, technologies and launch systems for companies,
            partners and my own ventures.
          </p>
          <p>
            My current work is shaped by AI-native development and agentic
            workflows. I use them not as a theme to comment on from the outside,
            but as practical leverage for building my own, partner and client
            projects.
          </p>
          <p>
            My current business focus is digital infrastructure for agro-commodity
            trading and brokerage: standards, indexes, workflows, interfaces and
            AI-assisted tools for physical commodity markets.
          </p>
          <p>
            ABVX is a working catalogue of my recent work: market infrastructure,
            web services, protocols, language experiments, constructed-language
            research, books, translations and essays.
          </p>
        </div>
      </SectionPanel>

      <SectionPanel title="Career timeline" eyebrow="Elsewhere" accent>
        <p>For the full career timeline, see LinkedIn.</p>
        <div className="link-strip">
          <a
            href="https://www.linkedin.com/in/abvcreative/"
            target="_blank"
            rel="noreferrer"
          >
            LinkedIn
          </a>
          <a href="mailto:a.biletskiy@gmail.com">Contact</a>
        </div>
      </SectionPanel>
    </div>
  );
}
