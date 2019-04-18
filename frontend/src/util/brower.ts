if (Array.prototype.flat === undefined) {
  Array.prototype.flat = function() {
    const arr: any = [];
    for (let i = 0; i < this.length; i++) {

    }
    return arr;
  }
}