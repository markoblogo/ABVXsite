import { getBooks, getEcosystems, getProjects } from '@/lib/abvx-data';
import EcosystemCard from '@/components/ecosystem-card';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Ecosystems',
};

export default async function EcosystemsPage() {
  const [ecosystems, projects, books] = await Promise.all([
    getEcosystems(),
    getProjects(),
    getBooks(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Ecosystems</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
          The main directions I’m building right now.
        </p>
      </header>

      <div className="grid gap-3 md:grid-cols-2">
        {ecosystems.map((eco) => (
          <EcosystemCard key={eco.id} eco={eco} books={books} projects={projects} />
        ))}
      </div>
    </div>
  );
}
