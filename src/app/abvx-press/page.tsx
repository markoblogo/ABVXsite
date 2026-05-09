import DirectionPage from '@/components/direction-page';
import { getBooks, getProjects } from '@/lib/abvx-data';
import { DIRECTIONS } from '@/lib/directions';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'ABVX Press',
  description: 'Books, translation series, companion landings, free editions, and publishing experiments by ABVX.',
  alternates: { canonical: 'https://abvx.xyz/books' },
};

export default async function AbvxPressPage() {
  const [projects, books] = await Promise.all([getProjects(), getBooks()]);
  const direction = DIRECTIONS.find((item) => item.name === 'ABVX Press')!;

  return <DirectionPage direction={direction} projects={projects} books={books} />;
}
