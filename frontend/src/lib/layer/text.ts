import Layer from './layer';
import { GraphType, Vertex, TextAlign, BaseLine } from '../typeof/typeof';
import * as math from '../math';


export default class IText extends Layer {
  public text: string;
  public content: Array<{text: string, width: number}> = [];
  protected geometry: Vertex;
  constructor(geo: Vertex, text: string, options: {[k: string]: any} = {}) {
    super();
    this.geometry = geo;
    this.text = text;
    const defaultOptions = {
      fill: true,
      stroke: false,
      font: '14px Arial',
      textAlign: TextAlign.LEFT, // 'start|end|center|left|right'
      baseLine: BaseLine.MIDDLE, // 'alphabetic|top|hanging|middle|ideographic|bottom'
      maxLength: 0,
      verticleSpace: 0,
    };
    // textAlign 设置或返回文本内容的当前对齐方式
    // start : 默认。文本在指定的位置开始。
    // end : 文本在指定的位置结束。
    // center: 文本的中心被放置在指定的位置。
    // left : 文本左对齐。
    // right : 文本右对齐。
    // -----------------------------------------
    // alphabetic ： (默认)文本基线是普通的字母基线。 英文字母底部对齐
    // top ： 文本基线是 em 方框的顶端。顶部对齐
    // hanging ： 文本基线是悬挂基线。 顶部对齐
    // middle ： 文本基线是 em 方框的正中。中部对齐
    // ideographic： 文本基线是em基线。底部对齐
    // bottom ： 文本基线是 em 方框的底端。底部对齐
    this.setOptions({...defaultOptions, ...options});
    if (options.fontSize && typeof options.fontSize === 'number') {
      this.options.font = options.fontSize.toString() + 'px Arial';
    }
  }
  public getLayerType(): GraphType {
    return GraphType.TEXT;
  }
  public getGeometry(): Vertex {
    return this.geometry;
  }
  /**
   * 返回文字的Bound
   */
  public getBound(): math.Bound {
    const fontSize: number = this.getFontSize();
    const len = this.content.length;
    const height: number = fontSize * len + (len - 1) * this.options.verticleSpace;
    let width: number = this.options.maxLength;
    if (len === 1) {
      width = this.content[0].width;
    }
    let [x, y] = [this.geometry[0], this.geometry[1]];
    if (this.options.textAlign === 'end' || this.options.textAlign === 'right') {
      x -= width;
    } else if (this.options.textAlign === 'center') {
      x -= width / 2;
    }
    if (this.options.baseLine === 'top' || this.options.baseLine === 'hanging') {
      y -= height;
    } else if (this.options.baseLine === 'middle') {
      y -= height / 2;
    }
    return new math.Bound(x, y, width, height);
  }
  /**
   * 返回文字的轮廓线
   */
  public computeOutline(): Vertex[] {
    const fontSize: number = this.getFontSize();
    const offsetY = fontSize + this.options.verticleSpace;
    const vertexs: Vertex[] = this.getBound().getVetexs();
    if (this.content.length > 1) {
      const firstPt = vertexs[0];
      const lastPt = vertexs[vertexs.length - 1];
      const lastRow = this.content[this.content.length - 1];
      if (this.options.textAlign === 'end' || this.options.textAlign === 'right') {
        vertexs.splice(0, 1, [vertexs[0][0], vertexs[0][1] + offsetY]);
        vertexs.push([lastPt[0] - lastRow.width, lastPt[1]], [lastPt[0] - lastRow.width, lastPt[1] + offsetY]);
      } else if (this.options.textAlign === 'center') {
        const offsetX: number = (this.options.maxLength - lastRow.width) / 2;
        vertexs.splice(0, 1, [vertexs[0][0], vertexs[0][1] + offsetY]);
        const temp = [
          [lastPt[0], lastPt[1] + offsetY],
          [lastPt[0] - offsetX, lastPt[1] + offsetY],
          [lastPt[0] - offsetX, lastPt[1]],
          [lastPt[0] - offsetX - lastRow.width, lastPt[1]],
          [lastPt[0] - offsetX - lastRow.width, lastPt[1] + offsetY],
        ];
        vertexs.splice(-1, 1, ...temp);
      } else {
        const temp = [
          [lastPt[0], lastPt[1] + offsetY],
          [firstPt[0] + lastRow.width, firstPt[1] + offsetY],
          [firstPt[0] + lastRow.width, firstPt[1]],
        ];
        vertexs.splice(-1, 1, ...temp);
      }
    }
    return vertexs;
  }
  /**
   * 设置文字内容
   * @param text string
   */
  public setText(text: string) {
    this.text = text;
    this.fixContent();
    this.updateAll();
  }
  public translate(dx: number, dy: number) {
    this.geometry[0] += dx;
    this.geometry[1] += dy;
    this.updateAll();
  }
  public isPointClosest(pos: Vertex): boolean {
    const outline = this.computeOutline();
    outline.push(outline[0]);
    let count = 0;
    for (let i = 0; i < outline.length - 1; i++) {
      const curPt = outline[i];
      const nextPt = outline[i + 1];
      if (math.Base.isZero(curPt[0] - nextPt[0]) && pos[0] < curPt[0] && (pos[1] - curPt[1]) * (pos[1] - nextPt[1]) < 0) {
        count++;
      }
    }
    return count % 2 === 1;
  }
  /**
   * 对文字进行重新编排
   */
  public fixContent() {
    if (!this.text) {
      return;
    }
    if (!!this.options.maxLength && this.options.maxLength > 0) {
      const rows: string[] = this.text.split('');
      const temp: string[] = [rows[0]];
      for (let i = 1; i < rows.length; i++) {
        const text: string = temp.join('');
        const width = this.options._render.canvasHelper.getTextWidth(text + rows[i], this.options.font);
        if (width > this.options.maxLength) {
          this.content.push({text, width});
          temp.length = 0;
        } else if (i === rows.length - 1) {
          this.content.push({text: text + rows[i], width});
        }
        temp.push(rows[i]);
      }
    } else {
      const width = this.options._render.canvasHelper.getTextWidth(this.text, this.options.font);
      this.content.push({text: this.text, width});
    }
  }
  /**
   * 返回字体大小
   */
  public getFontSize(): number {
    const defaultFontSize = 10;
    const font = this.options.font.match(/\d+px/);
    if (font.length > 0) {
      return parseInt(font[0], 10);
    }
    return defaultFontSize;
  }
  public isIntersectWithBound(bound: math.Bound): boolean {
    const geoms: Vertex[] = this.computeOutline();
    for (let i = 0; i < geoms.length - 1; i++) {
      if (bound.isIntersectOfSegment(geoms[i], geoms[i + 1])) {
        return true;
      }
    }
    return false;
  }
  public clone() {
    const options = {...this.options, _render: null, _stage: null};
    return new IText(this.geometry, this.text, options);
  }
}
