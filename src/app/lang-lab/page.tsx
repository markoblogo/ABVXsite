import DirectionPage from '@/components/direction-page';
import { getBooks, getProjects } from '@/lib/abvx-data';
import { DIRECTIONS } from '@/lib/directions';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Lang Lab',
  description: 'Language systems, Toki Pona work, pictographic protocols, translators, and language-AI experiments.',
  alternates: { canonical: 'https://abvx.xyz/lang-lab' },
};

export default async function LangLabPage() {
  const [projects, books] = await Promise.all([getProjects(), getBooks()]);
  const direction = DIRECTIONS.find((item) => item.name === 'Lang Lab')!;

  return <DirectionPage direction={direction} projects={projects} books={books} />;
}
