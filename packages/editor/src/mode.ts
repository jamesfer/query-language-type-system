import { defineMode } from 'codemirror';
import { once } from 'lodash';
import Highlighter from './highlighter';

export const MODE_NAME = 'query-language';

export const initializeMode = once(function initializeModeInner() {
  defineMode(MODE_NAME, (config, options) => new Highlighter(config, options));
});
