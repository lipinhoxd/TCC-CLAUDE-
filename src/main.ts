import './styles.css';
import { readWebConfig } from './config/env.ts';

function render(root: HTMLElement): void {
  const { appName } = readWebConfig();
  document.title = appName;

  const main = document.createElement('main');
  const title = document.createElement('h1');
  title.textContent = appName;
  const note = document.createElement('p');
  note.textContent = 'Fundação técnica do projeto. As funcionalidades serão adicionadas nas próximas atividades.';
  main.append(title, note);
  root.replaceChildren(main);
}

const root = document.getElementById('app');
if (root) {
  render(root);
}
