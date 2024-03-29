import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/monokai.css';
import '../index.css';
import { App } from './app';

// Insert html content into the body
const element = document.createElement('div');
element.innerHTML = `
  <div class="wrapper">
    <header class="header">
      <h1>Goose</h1>
      <div class="output-select">
        <button class="language-button" id="js-language-button">JS</button>
        <button class="language-button" id="cpp-language-button">C++</buttonc>
      </div>
    </header>
    <div class="editor-wrapper">
      <div class="editor">
        <textarea class="editor-input" id="editor" style="width: 500px; height: 500px;"></textarea>
      </div>
      <div class="editor">
        <textarea class="editor-input" id="output"></textarea>
      </div>
    </div>
  </div>
`;
document.body.appendChild(element);

const editorElement = document.getElementById('editor');
const outputElement = document.getElementById('output');
const jsLanguageButton = document.getElementById('js-language-button');
const cppLanguageButton = document.getElementById('cpp-language-button');
if (!editorElement || !outputElement || !jsLanguageButton || !cppLanguageButton) {
  throw new Error('Failed to find #editor and #output elements');
}

new App(
  editorElement as HTMLTextAreaElement,
  outputElement as HTMLTextAreaElement,
  jsLanguageButton as HTMLButtonElement,
  cppLanguageButton as HTMLButtonElement,
);
