
import React, { useState } from 'react';

interface CollapsibleSectionProps {
  id: string;
  title: string;
  children: React.ReactNode;
  initialOpen?: boolean;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({id, title, children, initialOpen=true}) => {
  const [isOpen, setIsOpen] = useState(initialOpen);
  return (
    <section id={id}>
      <h3 className="collapsible-title" onClick={() => setIsOpen(!isOpen)} aria-expanded={isOpen}>
        {title} <span className="toggle-icon" style={{transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)'}}>▼</span>
      </h3>
      <div className="section-content-wrapper" style={{display: isOpen ? 'flex' : 'none'}}>
        {children}
      </div>
    </section>
  );
};
