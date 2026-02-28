import { Link } from "react-router-dom";

export default function Breadcrumbs({ items }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex items-center gap-2 font-sans text-xs uppercase tracking-[0.3em] text-charcoal/50">
        <li>
          <Link to="/" className="hover:text-charcoal transition-colors">
            Home
          </Link>
        </li>
        {items.map((item, i) => (
          <li key={item.label} className="flex items-center gap-2">
            <span aria-hidden="true">&gt;</span>
            {i === items.length - 1 ? (
              <span aria-current="page" className="text-charcoal/80">
                {item.label}
              </span>
            ) : (
              <Link to={item.to} className="hover:text-charcoal transition-colors">
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
