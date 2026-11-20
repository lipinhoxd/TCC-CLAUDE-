import { describe, expect, it } from 'vitest';
import { centavosParaReais, dividirEmDuas, formatarReais, reaisParaCentavos } from '../shared/dinheiro.ts';
import { matchPath, normalizePath } from '../src/router.tsx';

describe('reais e centavos (RN-038)', () => {
  it('converte texto em reais para centavos inteiros', () => {
    expect(reaisParaCentavos('1.234,56')).toBe(123456);
    expect(reaisParaCentavos('1234,5')).toBe(123450);
    expect(reaisParaCentavos('1234')).toBe(123400);
    expect(reaisParaCentavos('R$ 12,00')).toBe(1200);
    expect(reaisParaCentavos('0,01')).toBe(1);
    expect(reaisParaCentavos('100.000,00')).toBe(10_000_000);
  });

  it('recusa formas ambiguas ou invalidas, sem ponto flutuante', () => {
    for (const ruim of ['', 'abc', '1,234.56', '12,345', '1.23', '1..000,00', '-5,00', '1 000,00', '12,', ',50', '1e3', '0x10']) {
      expect(reaisParaCentavos(ruim), ruim).toBeNull();
    }
    expect(reaisParaCentavos('99999999999999999999,99')).toBeNull();
  });

  it('formata centavos em reais e volta ao mesmo valor', () => {
    expect(centavosParaReais(123456)).toBe('1.234,56');
    expect(centavosParaReais(5)).toBe('0,05');
    expect(centavosParaReais(150000)).toBe('1.500,00');
    expect(formatarReais(10_000_000)).toBe('R$ 100.000,00');
    for (const c of [1, 99, 100, 123456, 9_999_999, 10_000_000]) {
      expect(reaisParaCentavos(centavosParaReais(c))).toBe(c);
    }
  });
});

describe('divisao em duas parcelas (RN-012)', () => {
  it('a primeira e a metade para baixo, a segunda e o restante, e a soma e o total', () => {
    expect(dividirEmDuas(150000)).toEqual({ primeira: 75000, segunda: 75000 });
    expect(dividirEmDuas(15001)).toEqual({ primeira: 7500, segunda: 7501 });
    expect(dividirEmDuas(1)).toEqual({ primeira: 0, segunda: 1 });
    for (const total of [2, 3, 99, 12345, 10_000_000]) {
      const { primeira, segunda } = dividirEmDuas(total);
      expect(primeira + segunda).toBe(total);
      expect(segunda - primeira).toBeLessThanOrEqual(1);
    }
  });
});

describe('roteador: parametros de URL', () => {
  it('casa padroes com parametro e devolve o valor', () => {
    expect(matchPath('/admin/excursoes/:id', '/admin/excursoes/7')).toEqual({ id: '7' });
    expect(matchPath('/a/:x/b/:y', '/a/1/b/2')).toEqual({ x: '1', y: '2' });
  });

  it('nao casa quando o tamanho ou o trecho fixo difere, ou o parametro e vazio', () => {
    expect(matchPath('/admin/excursoes/:id', '/admin/excursoes')).toBeNull();
    expect(matchPath('/admin/excursoes/:id', '/admin/excursoes/7/x')).toBeNull();
    expect(matchPath('/admin/excursoes/:id', '/outro/excursoes/7')).toBeNull();
    expect(matchPath('/admin/excursoes/:id', '/admin/excursoes/')).toBeNull();
  });

  it('decodifica o parametro e trata codificacao quebrada sem lancar erro', () => {
    expect(matchPath('/x/:v', '/x/a%20b')).toEqual({ v: 'a b' });
    expect(matchPath('/x/:v', '/x/%E0%A4%A')).toBeNull();
    expect(normalizePath('/admin/excursoes/7/')).toBe('/admin/excursoes/7');
  });
});
