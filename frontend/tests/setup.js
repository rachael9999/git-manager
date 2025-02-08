import { JSDOM } from 'jsdom'
import { beforeAll, afterAll, vi } from 'vitest';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import { config } from '@vue/test-utils';
import '@mdi/font/css/materialdesignicons.css';
import 'vuetify/styles';

const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>')
global.window = dom.window
global.document = dom.window.document
global.navigator = dom.window.navigator

const vuetify = createVuetify({
  components,
  directives,
  defaults: {
    global: {
      ripple: false,
    },
  },
});

// Setup Vuetify for all tests
config.global.plugins = [vuetify];

// Mock window properties
beforeAll(() => {
  global.CSS = { 
    supports: () => false,
    escape: (str) => str
  };
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

// Handle CSS imports
vi.mock('*.css', () => {
  return { default: {} };
});

// Cleanup after tests
afterAll(() => {
  vi.clearAllMocks();
});