import {
  SiGoogle,
  SiApple,
  SiAmazon,
  SiMeta,
  SiX,
  SiStripe,
  SiDiscord,
  SiCoinbase,
} from 'react-icons/si';
import { Link2 } from 'lucide-react';

interface Company {
  id: string;
  name: string;
  icon: JSX.Element;
  tagline: string;
  prioritizes: string[];
}

const companies: Company[] = [
  {
    id: 'google',
    name: 'Google',
    icon: <SiGoogle className="w-4 h-4" />,
    tagline: 'Data-driven, user-centric',
    prioritizes: [
      'Metrics and A/B testing',
      'User research at scale',
      '10x thinking and moonshots',
    ],
  },
  {
    id: 'apple',
    name: 'Apple',
    icon: <SiApple className="w-4 h-4" />,
    tagline: 'Design excellence, quality bar',
    prioritizes: [
      'User experience perfection',
      'Cohesive ecosystem',
      '"It just works" reliability',
    ],
  },
  {
    id: 'coinbase',
    name: 'Coinbase',
    icon: <SiCoinbase className="w-4 h-4" />,
    tagline: 'Trust, security, compliance',
    prioritizes: [
      'Regulatory compliance first',
      'User education and trust',
      'Conservative, safe approach',
    ],
  },
  {
    id: 'chainlink',
    name: 'Chainlink',
    icon: <Link2 className="w-4 h-4" />,
    tagline: 'Decentralized infrastructure',
    prioritizes: [
      'Oracle network reliability',
      'Developer tools and docs',
      'Cross-chain interoperability',
    ],
  },
  {
    id: 'discord',
    name: 'Discord',
    icon: <SiDiscord className="w-4 h-4" />,
    tagline: 'Community-first, customizable',
    prioritizes: [
      'Server owner control',
      'Community authenticity',
      'Gaming-grade performance',
    ],
  },
  {
    id: 'stripe',
    name: 'Stripe',
    icon: <SiStripe className="w-4 h-4" />,
    tagline: 'Developer experience',
    prioritizes: [
      'API design as product',
      'Infrastructure reliability',
      'Developer documentation',
    ],
  },
  {
    id: 'meta',
    name: 'Meta',
    icon: <SiMeta className="w-4 h-4" />,
    tagline: 'Growth and engagement',
    prioritizes: [
      'Engagement loops',
      'Ship to learn quickly',
      'Network effects',
    ],
  },
  {
    id: 'amazon',
    name: 'Amazon',
    icon: <SiAmazon className="w-4 h-4" />,
    tagline: 'Customer obsession',
    prioritizes: [
      'Customer obsession',
      'Bias for action',
      'Work backwards from customer',
    ],
  },
  {
    id: 'twitter',
    name: 'Twitter',
    icon: <SiX className="w-4 h-4" />,
    tagline: 'Real-time conversation',
    prioritizes: [
      'Public conversation',
      'Real-time information',
      'Creator economy',
    ],
  },
];

interface CompanySelectorProps {
  selected: string;
  onSelect: (companyId: string) => void;
  expanded: boolean;
  onToggle: () => void;
}

export function CompanySelector({ selected, onSelect, expanded, onToggle }: CompanySelectorProps) {
  const selectedCompany = companies.find(c => c.id === selected) || companies[0];

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground uppercase tracking-wide">
        Choose PM Style
      </p>

      {/* Clean Horizontal Chip Selector */}
      <div className="flex flex-wrap gap-2">
        {companies.map(company => (
          <button
            key={company.id}
            onClick={() => onSelect(company.id)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
              selected === company.id
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-card border-border hover:border-primary/50 hover:bg-secondary/50'
            }`}
          >
            {company.icon}
            <span className="text-sm font-medium">{company.name}</span>
          </button>
        ))}
      </div>

      {/* Selected Company Details - Always Show, Clean */}
      <div className="p-4 bg-secondary/20 rounded-lg border border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {selectedCompany.icon}
            <div>
              <p className="text-sm font-semibold">{selectedCompany.name}</p>
              <p className="text-xs text-muted-foreground">{selectedCompany.tagline}</p>
            </div>
          </div>
          <button
            onClick={onToggle}
            className="text-xs text-primary hover:underline"
          >
            {expanded ? 'Hide details' : 'Show details'}
          </button>
        </div>

        {/* Expanded Details */}
        {expanded && (
          <div className="pt-3 border-t border-border space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              What {selectedCompany.name} Prioritizes
            </p>
            <ul className="text-xs space-y-1.5">
              {selectedCompany.prioritizes.map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
