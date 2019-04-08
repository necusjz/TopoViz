import Evt from '../core/evt';
import Stage from '../core/stage';
import Util from '../util/util';
import { GraphType, XY, Vertex } from '@/lib/typeof/typeof';
import * as math from '../math';
import LayerGroup from './layerGroup';

export default abstract class Layer extends Evt {
  public dirtyData: any; // 业务脏数据
  public userCache: boolean = true;
  public readonly id: string;
  public readonly options: {
    [k: string]: any,
  };
  public highOptions: {
    [k: string]: any,
  } = {
    fill: true,
    fillColor: '#0FFFFF',
    color: '#0FFFFF',
  };
  public type: GraphType;
  protected tolerance: number = 5;
  constructor() {
    super();
    this.id = Util.createID();
    this.options = {
      stroke: true,
      color: '#3388ff',
      weight: 1,
      opacity: 1,
      lineCap: 'butt',
      lineJoin: 'miter',
      dashArray: null,
      dashOffset: null,
      fill: false,
      fillColor: null,
      fillOpacity: 1,
      fillRule: 'evenodd',
      strict: true,
    };
    this.type = this.getLayerType();
  }
  /**
   * 返回绑定图层的Stage
   */
  public getStage(): Stage | undefined {
    return this.options._stage;
  }
  /**
   * 返回业务脏数据
   */
  public getDirtyData() {
    return this.dirtyData;
  }
  /**
   * 设置图层属性
   * @param options Object
   */
  public setOptions(options: {[k: string]: any}) {
    Object.keys(options).forEach((k: string) => {
      this.options[k] = options[k];
    });
  }
  /**
   * 设置图层样式
   * @param options Object
   */
  public setStyle(options: {[k: string]: any}) {
    this.setOptions(options);
    this.updateAll();
  }
  /**
   * 设置
   * @param data any
   */
  public setDirtyData(data: any) {
    this.dirtyData = data;
  }
  /**
   * 高亮图层
   * @param options Object
   */
  public highLight(options: {[k: string]: any} = {}) {
    this.setHighlightOptions(options);
    (this.getStage() as Stage).addHighLightLayer(this);
  }
  /**
   * 设置高亮样式
   * @param options 高亮图层style
   */
  public setHighlightOptions(options: {[k: string]: any} = {}) {
    this.highOptions = {...this.highOptions, ...options};
  }
  /**
   * 清除高亮
   */
  public clearHighLight() {
    (this.getStage() as Stage).clearHighLightLayer(this);
  }
  /**
   * 添加图层到Stage或者Layergroup
   * @param stage Stage
   */
  public addTo(stage: Stage | LayerGroup) {
    stage.addLayer(this);
    return this;
  }
  /**
   * 添加图层
   * @param stage Stage
   */
  public layerAdd(stage: Stage) {
    this.setRender(stage);
    this.options._render.addDraw(this);
    this.fire('loaded', {layer: this, sourceTarget: stage.container});
    stage.fire('layerAdd', {layer: this});
  }
  /**
   * 将XY对象格式数据转为数组格式
   * @param vertexs Geometry
   */
  public clearnData(vertexs: any[]): Vertex[] | Vertex[][] {
    const pts: number[][] = [];
    for (const vertex of vertexs) {
      pts.push(this.transformVertex(vertex));
    }
    return pts;
  }
  /**
   * 转换坐标点数据格式
   * @param vertex 坐标点
   */
  public transformVertex(vertex: XY | number[]): number[] {
    if (!Array.isArray(vertex)) {
      return this.transformToArray(vertex);
    } else {
      return vertex;
    }
  }
  /**
   * 对象格式转数组格式
   * @param xy XY对象格式坐标点
   */
  public transformToArray(xy: XY): number[] {
    return [xy.x, xy.y];
  }
  /**
   * 更新全部图层
   */
  public updateAll() {
    if (this.options._render) {
      this.options._render.redraw();
    }
  }
  /**
   * 添加某个图层路径
   */
  public addPath() {
    if (this.options._render) {
      this.options._render.addDraw(this);
    }
  }
  /**
   * 删除某个图层
   */
  public remove() {
    if (this.options._stage) {
      this.options._stage.removeLayer(this);
    }
  }
  public removePath() {
    const bound = this.getBound();
    this.options._render.clearBoundPath(bound);
  }
  /**
   * 返回图层的Bound
   */
  public getBound(): math.Bound {
    const geometry = this.getGeometry();
    if (geometry instanceof math.Bound) {
      return geometry;
    }
    const level: number = Util.dimension_Array(geometry);
    if (level === 2) {
      const polyline = new math.Polyline(geometry);
      return polyline.getBound();
    } else if (level === 3) { // 最多三维数组
      let bound = null;
      for (const geo of geometry) {
        const line = new math.Polyline(geo);
        if (bound) {
          bound = line.getBound().expand(bound);
        } else {
          bound = line.getBound();
        }
      }
      return bound as math.Bound;
    }
    return new math.Bound(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER);
  }
  /**
   * 返回图层Bound的中心
   */
  public getCenter(): Vertex {
    const bound = this.getBound();
    return bound.getCenter();
  }
  /**
   * 返回图层Bound时候包含待测点
   * @param pos 待测点
   */
  public containPoint(pos: Vertex): boolean {
    const bound: math.Bound = this.getBound();
    return bound.contain(pos);
  }
  /**
   * 设置图层渲染器
   * @param stage Stage
   */
  public setRender(stage: Stage) {
    this.options._stage = stage;
    this.options._render = stage.render;
  }
  /**
   * 图层是否与Bound相交
   * @param bound Bound
   */
  public isIntersectWithBound(bound: math.Bound): boolean {
    return false;
  }
  public isWithinBound(bound: math.Bound): boolean {
    return bound.contain(this.getBound());
  }
  /**
   * 返回图层的类型
   */
  public abstract getLayerType(): GraphType;
  /**
   * 返回图层的坐标数据
   */
  public abstract getGeometry(): any;
  /**
   * 返回待测点是否在Layer容差范围内
   * @param pos 待测点
   */
  public abstract isPointClosest(pos: Vertex, tolerance?: number): boolean;
  /**
   * 克隆layer
   */
  public abstract clone(): Layer;
  /**
   * 平移图层
   */
  public abstract translate(dx: number, dy: number): void;
}
