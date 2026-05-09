import DirectionPage from '@/components/direction-page';
import { getBooks, getProjects } from '@/lib/abvx-data';
import { DIRECTIONS } from '@/lib/directions';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Current Focus',
  description: 'Commodity trading infrastructure: services, dashboards, monitors, and productized market tools.',
  alternates: { canonical: 'https://abvx.xyz/focus' },
};

export default async function CroptoPage() {
  const [projects, books] = await Promise.all([getProjects(), getBooks()]);
  const direction = DIRECTIONS.find((item) => item.name === 'Cropto')!;

  return <DirectionPage direction={direction} projects={projects} books={books} />;
}
