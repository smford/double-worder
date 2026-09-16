import fs from 'fs';

// Read index.html
const html = fs.readFileSync('index.html', 'utf8');

// Set up minimal DOM simulation
class Element {
  constructor(tag, id = '', className = '') {
    this.tagName = tag.toUpperCase();
    this.id = id;
    this.className = className;
    this.classList = {
      classes: new Set(className.split(' ').filter(Boolean)),
      add: (c) => this.classList.classes.add(c),
      remove: (c) => this.classList.classes.delete(c),
      toggle: (c, force) => {
        if (force === undefined) {
          if (this.classList.classes.has(c)) this.classList.classes.delete(c);
          else this.classList.classes.add(c);
        } else if (force) {
          this.classList.classes.add(c);
        } else {
          this.classList.classes.delete(c);
        }
      },
      contains: (c) => this.classList.classes.has(c)
    };
    this.attributes = {};
    this.listeners = {};
    this.innerHTML = '';
    this.value = '';
    this.style = {};
  }
  setAttribute(k, v) { this.attributes[k] = v; }
  getAttribute(k) { return this.attributes[k]; }
  addEventListener(event, fn) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(fn);
  }
  click() {
    if (this.listeners['click']) {
      for (const fn of this.listeners['click']) {
        fn({ stopPropagation: () => {} });
      }
    }
  }
}

console.log('DOM mock setup ready');
