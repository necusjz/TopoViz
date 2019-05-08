if (Array.prototype.flat === undefined) {
  Array.prototype.flat = function() {
    const arr: any = [];
    for (let i = 0; i < this.length; i++) {
      if (Array.isArray(this[i])) {
        arr.push(...this[i]);
      } else {
        arr.push(this[i]);
      }
    }
    return arr;
  }
}