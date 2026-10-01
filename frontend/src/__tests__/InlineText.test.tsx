import { render, screen } from '@testing-library/react';
import MarkdownContent from '@/components/MarkdownContent';
import { CardTile } from '@/components/dashboard/CardTile';
import { CardView } from '@/components/session/CardEditor';
import type { CardDTO } from '@/services/cardService';

// AI-written text is full of `inline code` and **bold**. It must render as
// such everywhere a card's text appears, never as literal backticks.

const baseCard: CardDTO = {
  card_id: 1,
  question_id: 1,
  session_id: 1,
  user_id: 1,
  concept: 'useMemo vs useCallback',
  definition: 'Hooks que memorizan un valor o una función.',
  explanation: '`useMemo` memoriza el resultado; `useCallback` memoriza la función.',
  use_case: 'Evitar recalcular listas grandes.',
  avoid_when: null,
  mnemonic: null,
  code: null,
  code_language: 'javascript',
  tags: [],
  difficulty: 2,
  created_at: '2026-09-01',
};

describe('inline markdown in text blocks', () => {
  it('renders `code` as a code element and **bold** as strong', () => {
    const { container } = render(<MarkdownContent text="Usa `prev` y **no** el índice." />);
    expect(container.querySelector('code')?.textContent).toBe('prev');
    expect(container.querySelector('strong')?.textContent).toBe('no');
    expect(container.textContent).not.toContain('`');
    expect(container.textContent).not.toContain('**');
  });

  it('leaves an unclosed backtick as plain text', () => {
    const { container } = render(<MarkdownContent text="Esto `no se cierra" />);
    expect(container.querySelector('code')).toBeNull();
    expect(container.textContent).toContain('`no se cierra');
  });

  it('never injects markup from the text', () => {
    const { container } = render(<MarkdownContent text="<img src=x onerror=alert(1)> y `<b>hola</b>`" />);
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('b')).toBeNull();
    expect(container.querySelector('code')?.textContent).toBe('<b>hola</b>');
  });
});

describe('card text on the dashboard and in the card view', () => {
  it('CardTile preview shows inline code without backticks', () => {
    const { container } = render(<CardTile card={baseCard} onOpen={() => {}} />);
    const codes = Array.from(container.querySelectorAll('code')).map((c) => c.textContent);
    expect(codes).toEqual(['useMemo', 'useCallback']);
    expect(screen.getByRole('button').textContent).not.toContain('`');
  });

  it('CardView renders inline code in the definition and the mnemonic', () => {
    const { container } = render(
      <CardView
        card={{
          ...baseCard,
          definition: 'Usa `useMemo` para cálculos.',
          mnemonic: 'Recuerda `useCallback` guarda la función.',
        }}
      />
    );
    const codes = Array.from(container.querySelectorAll('code')).map((c) => c.textContent);
    expect(codes).toContain('useMemo');
    expect(codes).toContain('useCallback');
    expect(container.textContent).not.toContain('`');
  });
});
