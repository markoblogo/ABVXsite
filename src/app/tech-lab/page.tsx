import DirectionPage from '@/components/direction-page';
import { getBooks, getProjects } from '@/lib/abvx-data';
import { DIRECTIONS } from '@/lib/directions';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Tech Lab',
  description: 'AI-development tooling, open-source utilities, landing systems, services, and shipped experiments.',
  alternates: { canonical: 'https://abvx.xyz/tech-lab' },
};

export default async function TechLabPage() {
  const [projects, books] = await Promise.all([getProjects(), getBooks()]);
  const direction = DIRECTIONS.find((item) => item.name === 'Tech Lab')!;

  return <DirectionPage direction={direction} projects={projects} books={books} />;
}
