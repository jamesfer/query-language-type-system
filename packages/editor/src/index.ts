// import * as Buffer from 'buffer';
import App from './app';

// (window as any).Buffer = Buffer;

const editorElement = document.getElementById('editor');
const outputElement = document.getElementById('output');
if (!editorElement || !outputElement) {
  throw new Error('Failed to find #editor and #output elements');
}

const app = new App(editorElement as HTMLTextAreaElement, outputElement as HTMLInputElement);

