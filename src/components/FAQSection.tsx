import type { ContentFaq } from '@/content';

type FAQSectionProps = {
  id: string;
  eyebrow?: string;
  title: string;
  faqs: ContentFaq[];
};

export default function FAQSection({ id, eyebrow = 'FAQ', title, faqs }: FAQSectionProps) {
  if (!faqs.length) return null;

  return (
    <section className="faq-section" aria-labelledby={id}>
      <div className="home-section__header">
        <div className="eyebrow">{eyebrow}</div>
        <h2 id={id}>{title}</h2>
      </div>
      <div className="faq-list">
        {faqs.map((faq) => (
          <details key={faq.question} className="faq-item">
            <summary>{faq.question}</summary>
            <p>{faq.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
