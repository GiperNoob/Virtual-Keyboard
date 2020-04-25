/* eslint-disable no-param-reassign */
/* eslint-disable  import/extensions */

import * as storage from './storage.js';
import create from './utils/create.js';
import language from './layouts/index.js'; // {en, ru} object
import Key from './Key.js';

const main = create('main', '',
  [create('h1', 'title', 'RSS Virtual Keyboard'),
    create('h3', 'subtitle', 'Windows keyboard that has been made under Windows'),
    create('p', 'hint', 'Use left <kbd>Ctrl</kbd> + <kbd>Alt</kbd> to switch language. Last language saves in localStorage')]);

export default class Keyboard {
  constructor(rowsOrder) {
    this.rowsOrder = rowsOrder;
    this.keysPressed = {};
    this.isCaps = false;
  }

  init(langCode) {
    this.keyBase = language[langCode];
    this.output = create('textarea', 'output', null, main,
      ['placeholder', 'Start type something...'],
      ['rows', 5],
      ['cols', 50],
      ['spellcheck', false],
      ['autocorrect', 'off']);
    this.container = create('div', 'keyboard', null, main, ['language', langCode]);
    document.body.prepend(main);
    return this;
  }

  generateLayout() {
    this.keyButtons = [];
    this.rowsOrder.forEach((row, i) => {
      const rowElement = create('div', 'keyboard__row', null, this.container, ['row', i + 1]);
      row.forEach((code) => {
        const keyObj = this.keyBase.find((key) => key.code === code);
        if (keyObj) {
          const keyButton = new Key(keyObj);
          this.keyButtons.push(keyButton);
          rowElement.appendChild(keyButton.div);
        }
      });
    });

    document.addEventListener('keydown', this.handleEvent);
    document.addEventListener('keyup', this.handleEvent);
  }

  handleEvent = (event) => {
    if (event.stopPropagation()) event.stopPropagation();
    const { code, type } = event;
    const keyObj = this.keyButtons.find((key) => key.code === code);
    if (!keyObj) return;
    this.output.focus();

    if (type.match(/keydown|mousedown/)) {
      if (type.match(/key/)) event.preventDefault();
      keyObj.div.classList.add('active');

      // Switch language
      if (code.match(/Control/)) this.ctrlKey = true;
      if (code.match(/Alt/)) this.altKey = true;

      if (code.match(/Control/) && this.altKey) this.switchLanguage();
      if (code.match(/Alt/) && this.ctrlKey) this.switchLanguage();
    } else if (type.match(/keyup|mouseup/)) {
      keyObj.div.classList.remove('active');

      if (code.match(/Control/)) this.ctrlKey = false;
      if (code.match(/Alt/)) this.altKey = false;
    }
  }

  switchLanguage = () => {
    const langAbbr = Object.keys(language);
    let langIndex = langAbbr.indexOf(this.container.dataset.language);
    this.keyBase = langIndex + 1 < langAbbr.length ? language[langAbbr[langIndex += 1]]
      : language[langAbbr[langIndex -= langIndex]];
    this.container.dataset.language = langAbbr[langIndex];
    storage.set('kbLang', langAbbr[langIndex]);

    this.keyButtons.forEach((button) => {
      const keyObj = this.keyBase.find((key) => key.code === button.code);
      if (!keyObj) return;
      button.shift = keyObj.shift;
      button.small = keyObj.small;
      if (keyObj.shift && keyObj.shift.match(/[^a-zA-Zа-яА-ЯёЁ0-9]/g)) {
        button.sub.innerHTML = keyObj.shift;
      } else {
        button.sub.innerHTML = '';
      }
      button.letter.innerHTML = keyObj.small;
    });
  }
}
