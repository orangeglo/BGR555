/*
  TODO
  - warn about overflow from bgr -> hex ? ex over 7FFF big e
*/

const app = new Vue({
  el: '#app',
  data: {
    hexColor: 'FFFFFF',
    bgrColor: null,
    direction: 'right',
    endian: 'little',
    note: '',
    savedColors: [],
  },
  created: function() {
    this.setRandomHex();
    this.loadFromStorage();
  },
  mounted: function() {
    window.addEventListener('keydown', (e) => {
      const focused = document.activeElement;
      if (!(focused && focused.id === 'note-input')) {
        if (e.key === 's') {
          this.saveColor();
        } else if (e.key === 'p') {
          this.$refs.picker.click();
        } else if (e.key === 'r') {
          this.setRandomHex();
        }
      }
    });
  },
  methods: {
    colorChanged: function(colorType) {
      if (colorType === 'hex') {
        this.direction = 'right';
        this.setBGRFromHex();
      } else { // colorType === 'bgr'
        this.direction = 'left'
        this.setHexFromBGR();
      }
    },
    hexToBGR: function() {
      const r = Math.floor(parseInt(this.hexColor.slice(0, 2), 16) / 8) << 0;
      const g = Math.floor(parseInt(this.hexColor.slice(2, 4), 16) / 8) << 5;
      const b = Math.floor(parseInt(this.hexColor.slice(4, 6), 16) / 8) << 10;
      return (b + g + r).toString(16).padStart(4, '0').toUpperCase(); // big endian
    },
    setBGRFromHex: function() {
      const bgrColor = this.hexToBGR();
      this.bgrColor = this.bgrWithEndian(bgrColor, 'big');
    },
    bgrToHex: function() {
      let bgrInt = parseInt(this.bgrWithEndian(this.bgrColor, 'big'), 16);
      bgrInt = Math.min(bgrInt, Math.pow(2, 15) - 1); // limit to 15-bit

      const r = (bgrInt & 0b11111) * 8;
      const g = ((bgrInt >>> 5) & 0b11111) * 8;
      const b = ((bgrInt >>> 10) & 0b11111) * 8;
      const rError = Math.floor(r / 32);
      const gError = Math.floor(g / 32);
      const bError = Math.floor(b / 32);

      return (
        (r + rError).toString(16).padStart(2, '0') +
        (g + gError).toString(16).padStart(2, '0') +
        (b + bError).toString(16).padStart(2, '0')
      ).toUpperCase();
    },
    setHexFromBGR: function() {
      this.hexColor = this.bgrToHex();
    },
    setRandomHex: function() {
      this.hexColor = (Math.random() * 0xFFFFFF << 0).toString(16).padStart(6, '0').toUpperCase();
      this.setBGRFromHex();
    },
    saveColor: function() {
      this.savedColors.unshift({
        id: Math.floor(Math.random() * 10000000000),
        hexColor: this.hexColor.toUpperCase(),
        bgrColorLE: this.bgrWithEndian(this.bgrColor, 'little').toUpperCase(),
        bgrColorBE: this.bgrWithEndian(this.bgrColor, 'big').toUpperCase(),
        direction: this.direction,
        note: this.note,
      });
    },
    removeColor: function(i) {
      this.savedColors.splice(i, 1);
    },
    removeAllColors: function() {
      this.savedColors = [];
    },
    bgrWithEndian: function(bgr, endian) {
      if (endian === this.endian) {
        return bgr;
      } else {
        return bgr.slice(2, 4) + bgr.slice(0, 2);
      }
    },
    updateColorFromPicker(e) {
      this.hexColor = e.target.value.slice(1, 7);
      this.setBGRFromHex();
    },
    saveToStorage: function() {
      localStorage.setItem('savedColors', JSON.stringify(this.savedColors));
    },
    loadFromStorage: function() {
      const stored = localStorage.getItem('savedColors');
      if (stored) {
        this.savedColors = JSON.parse(stored);
      }
    }
  },
  computed: {
    invalid: function() {
      return (this.hexColor.length < 6 || this.bgrColor.length < 4) && 'invalid';
    },
  },
  watch: {
    savedColors: function() {
      this.saveToStorage();
    },
    endian: function() {
      if (this.direction === 'right') {
        this.setBGRFromHex();
      } else { // this.direction === 'left'
        this.setHexFromBGR();
      }
    }
  }
});
