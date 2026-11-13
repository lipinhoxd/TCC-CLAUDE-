import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { App } from '../src/App.tsx';

describe('App', () => {
  it('exibe o nome informado como titulo principal', () => {
    const html = renderToStaticMarkup(<App appName="Teste" />);
    expect(html).toContain('<h1>Teste</h1>');
  });

  it('exibe o nome padrao quando nenhum nome e informado', () => {
    const html = renderToStaticMarkup(<App />);
    expect(html).toContain('<h1>');
  });
});
