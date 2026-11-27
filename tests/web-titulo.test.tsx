// @vitest-environment jsdom
import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it, vi } from 'vitest';
import { usePageTitle } from '../src/ui.tsx';

/** Titulo da aba (AGT-017): ele muda junto com o conteudo da pagina, e nao um instante depois. */

function Pagina() {
  const [nome, setNome] = useState<string | null>(null);
  usePageTitle(nome ?? 'Carregando');
  useEffect(() => {
    void Promise.resolve().then(() => setNome('Excursao Ficticia'));
  }, []);
  return nome === null ? <p>aguarde</p> : <h1>{nome}</h1>;
}

describe('titulo da aba', () => {
  it('ja esta definido no instante em que o cabecalho aparece', async () => {
    // Sem o "act" dos testes: o React agenda o trabalho como no navegador.
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', false);
    const caixa = document.body.appendChild(document.createElement('div'));
    const root = createRoot(caixa);
    try {
      const tituloQuandoApareceu = await new Promise<string>((resolve) => {
        const observador = new MutationObserver(() => {
          if (caixa.querySelector('h1') === null) return;
          observador.disconnect();
          resolve(document.title);
        });
        observador.observe(caixa, { childList: true, subtree: true });
        root.render(<Pagina />);
      });
      expect(tituloQuandoApareceu).toBe('Excursao Ficticia · BPM Trip');
    } finally {
      root.unmount();
      caixa.remove();
      vi.unstubAllGlobals();
    }
  });
});
