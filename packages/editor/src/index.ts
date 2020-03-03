import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/monokai.css';
import '../index.css';
import App from './app';

// Insert html content into the body
const element = document.createElement('div');
element.innerHTML = `
  <div class="wrapper">
    <div class="editor">
      <textarea class="editor-input" id="editor" style="width: 500px; height: 500px;"></textarea>
    </div>
    <div class="editor">
      <textarea class="editor-input" id="output"></textarea>
    </div>
  </div>
`;
document.body.appendChild(element);

const editorElement = document.getElementById('editor');
const outputElement = document.getElementById('output');
if (!editorElement || !outputElement) {
  throw new Error('Failed to find #editor and #output elements');
}

const app = new App(editorElement as HTMLTextAreaElement, outputElement as HTMLInputElement);

