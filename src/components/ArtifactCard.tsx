import type { Artifact } from '@/content';
import CatalogueCard from './CatalogueCard';

export default function ArtifactCard({ artifact }: { artifact: Artifact }) {
  return <CatalogueCard artifact={artifact} />;
}
