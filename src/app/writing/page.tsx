export const metadata = {
  title: 'Writing',
};

export default function WritingPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold tracking-tight">Writing</h1>
      <p className="text-sm text-zinc-300">
        Next: a fast, reliable feed that aggregates Medium + Substack with proper
        cards (cover, title, date, excerpt). I’ll implement this after we confirm
        the feed URLs and desired ordering.
      </p>
    </div>
  );
}
