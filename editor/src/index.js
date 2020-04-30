"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
require("codemirror/lib/codemirror.css");
require("codemirror/theme/monokai.css");
require("../index.css");
const app_1 = tslib_1.__importDefault(require("./app"));
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
const app = new app_1.default(editorElement, outputElement);
//# sourceMappingURL=index.js.map