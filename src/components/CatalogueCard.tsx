import type { Artifact } from '@/content';
import ProjectCatalogueCard from './ProjectCatalogueCard';

export default function CatalogueCard({ artifact }: { artifact: Artifact }) {
  return <ProjectCatalogueCard artifact={artifact} />;
}
