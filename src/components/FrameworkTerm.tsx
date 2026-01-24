import { useState } from 'react';
import { AlpacaExplains } from './AlpacaExplains';

interface FrameworkTermProps {
  term: string;
}

export function FrameworkTerm({ term }: FrameworkTermProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="inline-flex items-center border-b-2 border-dotted border-primary hover:border-solid hover:bg-primary/10 transition-all cursor-pointer text-primary font-medium"
      >
        {term}
      </button>
      <AlpacaExplains 
        term={term} 
        open={showModal} 
        onClose={() => setShowModal(false)} 
      />
    </>
  );
}