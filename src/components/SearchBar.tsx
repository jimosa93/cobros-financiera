"use client";

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { searchBlock, inputStyle, primaryButton } from '@/styles/ui';

interface SearchBarProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  addHref?: string;
  addLabel?: string;
  showAdd?: boolean;
  onAdd?: () => void;
}

export default function SearchBar({ value, onChange, placeholder = 'Buscar...', addHref, addLabel = '+ Nuevo', showAdd = true, onAdd }: SearchBarProps) {
  const router = useRouter();

  const handleAdd = () => {
    if (onAdd) return onAdd();
    if (addHref) return router.push(addHref);
  };

  return (
    <div style={searchBlock as any}>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={inputStyle as any}
      />
      {showAdd && (
        addHref ? (
          <Link href={addHref} style={primaryButton as any}>
            {addLabel}
          </Link>
        ) : (
          <button type="button" onClick={handleAdd} style={primaryButton as any}>
            {addLabel}
          </button>
        )
      )}
    </div>
  );
}

