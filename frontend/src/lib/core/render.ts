import CanvasHelper from './canvas';
import { GraphType, Vertex } from '../typeof/typeof';
import Stage from './stage';
import Layer from '../layer/layer';
import Circle from '../layer/circle';
import Polyline from '../layer/polyline';
import ImageLayer from '../layer/imageLayer';
import LayerGroup from '../layer/layerGroup';
import IText from '../layer/text';
import * as math from '../math';
import Rectangle from '../layer/rectangle';

export default class Render {
  // 是否渲染全部图层
  private renderAll: boolean = false;
  // 还未加载成功的图层
  private peddingLayers: Set<string>;
  private stage: Stage;
  private canvasHelper: CanvasHelper;
  private cacheHelper: CanvasHelper;
  private isBatching: boolean =  false;
  constructor(w: number, h: number, stage: Stage) {
    const scale: number = stage.getZoom();
    this.canvasHelper = new CanvasHelper(w, h, this, scale);
    this.cacheHelper = new CanvasHelper(w, h, this, scale);
    this.cacheHelper.isCache = true;
    this.stage = stage;
    this.peddingLayers = new Set();
  }
  /**
   * 更新画布长宽
   * @param w 画布宽度
   * @param h 画布高度
   */
  public resize(w: number, h: number) {
    this.canvasHelper.updateSize(w, h);
    this.cacheHelper.updateSize(w, h);
    this.redraw();
  }
  /**
   * 获得画布中心的世界坐标
   */
  public getCenter(): Vertex {
    return this.canvasHelper.getCenterPoint();
  }
  /**
   * 返回鼠标位置的世界坐标
   * @param pos 屏幕像素坐标
   */
  public getPos(pos: Vertex): Vertex {
    return this.canvasHelper.screenToWorldCoordinate(pos);
  }
  /**
   * 返回canvas dom实例
   */
  public getCanvasDom(): HTMLCanvasElement {
    const mainCanvas: HTMLCanvasElement = this.canvasHelper.getCanvasDom();
    mainCanvas.style.zIndex = '0';
    mainCanvas.style.position = 'absolute';
    mainCanvas.style.top = '0';
    mainCanvas.style.left = '0';
    return mainCanvas;
  }
  /**
   * 返回缓存canvas dom实例
   */
  public getCacheCanvasDom(): HTMLCanvasElement {
    const cacheCanvas: HTMLCanvasElement = this.cacheHelper.getCanvasDom();
    cacheCanvas.style.zIndex = '1';
    cacheCanvas.style.position = 'absolute';
    cacheCanvas.style.top = '0';
    cacheCanvas.style.left = '0';
    return cacheCanvas;
  }
  /**
   * 返回canvas实例类
   */
  public getCanvasHelper(): CanvasHelper {
    return this.canvasHelper;
  }
  /**
   * 返回cacheCanvas实例类
   */
  public getCacheHelper(): CanvasHelper {
    return this.cacheHelper;
  }
  /**
   * 返回当前视口画布的Bound坐标
   */
  public getBound(): math.Bound {
    return this.canvasHelper.getViewBound();
  }
  /**
   * 设置批处理状态，减少重绘次数
   * @param status Boolean
   */
  public setBatch(status: boolean) {
    this.isBatching = status;
  }
  /**
   * 返回加载所有图层的画布canvas
   * @param options 渲染参数
   */
  public cloneCanvas(options?: {[k: string]: any}): Promise<HTMLCanvasElement> {
    const bounds: math.Bound[] = [];
    this.stage.eachLayer((layer: Layer) => {
      const bbound: math.Bound = layer.getBound();
      bounds[0] = bounds.length === 1 ? bounds[0].union(bbound) : bbound;
    });
    if (bounds.length === 0) {
      return Promise.resolve(this.getCanvasDom());
    }
    const bound = bounds[0];
    let paddingLeft: number = 0;
    let paddingTop: number = 0;
    let paddingRight: number = 0;
    let paddingBottom: number = 0;
    let retina: number = 2;
    if (options) {
      paddingLeft = options.padding.left || 0;
      paddingTop = options.padding.top || 0;
      paddingRight = options.padding.right || 0;
      paddingBottom = options.padding.bottom || 0;
      retina = options.retina || 2;
    }
    const width: number = bound.width + paddingLeft + paddingRight;
    const height: number = bound.height + paddingTop + paddingBottom;
    const cache: Map<string, HTMLImageElement> = this.canvasHelper.getCache();
    const render: Render = new Render(width * retina, height * retina, this.stage);
    render._setRederAll(true);
    render.canvasHelper.setRetina(retina);
    render.canvasHelper.setCache(cache);
    const center: Vertex = [
      bound.width / 2 + bound.x - (paddingLeft - paddingRight) / 2,
      bound.height / 2 + bound.y - (paddingBottom - paddingTop) / 2,
    ];
    render.setCenter(center, 1);
    render.canvasHelper.startDraw();
    const layers = this.stage.getLayers();
    for (const layer of layers) {
      render.drawPath(layer);
    }
    return new Promise((resolve) => {
      const check = () => {
        if (render.peddingLayers.size === 0) {
          resolve(render.getCanvasDom());
        } else {
          requestAnimationFrame(check);
        }
      };
      requestAnimationFrame(check);
    });
  }
  /**
   * 绘制图层路径
   * @param layer Layer
   */
  public drawPath(layer: Layer, canvasHelper: CanvasHelper = this.canvasHelper) {
    const type: GraphType = layer.getLayerType();
    switch (type) {
      case GraphType.CIRCLE:
      case GraphType.POINT:
        canvasHelper.drawCircle(layer as Circle);
        break;
      case GraphType.POLYLINE:
      case GraphType.POLYGON:
        canvasHelper.drawPolyline(layer as Polyline);
        break;
      case GraphType.RECTANGLE:
        canvasHelper.drawRectangle(layer as Rectangle);
        break;
      case GraphType.IMAGE:
        canvasHelper.drawImage(layer as ImageLayer);
        break;
      case GraphType.TEXT:
        canvasHelper.drawText(layer as IText);
        break;
      case GraphType.GROUP:
        this.drawGroup(layer as LayerGroup, canvasHelper);
        break;
      default:
        break;
    }
  }
  /**
   * 用于绘制图层组
   * @param layer Group图层
   */
  public drawGroup(layer: LayerGroup, canvasHelper: CanvasHelper) {
    const layers = layer.getLayers();
    layer.setSubRender(layer.options._stage);
    for (const glayer of layers) {
      const type = glayer.getLayerType();
      if (type === GraphType.GROUP) {
        this.drawGroup(glayer as LayerGroup, canvasHelper);
      } else {
        this.drawPath(glayer, canvasHelper);
      }
    }
  }
  /**
   * 在缓存canvas画布上渲染高亮图层
   */
  public renderCacheCanvas() {
    this.cacheHelper.clear();
    const layers: Layer[] = this.stage.getHighLightLayers();
    if (layers.length === 0) {
      return;
    }
    this.cacheHelper.startDraw();
    const bound = this.stage.getBound();
    for (const layer of layers) {
      const bound1 = layer.getBound();
      if (bound1 && bound.isOverlaped(bound1)) {
        this.drawPath(layer, this.cacheHelper);
      }
    }
    this.cacheHelper.endDraw();
  }
  /**
   * 添加图层路径
   * @param layer Layer
   */
  public addDraw(layer: Layer) {
    if (layer instanceof IText) {
      layer.fixContent();
    }
    this.canvasHelper.startDraw();
    this.drawPath(layer);
    this.canvasHelper.endDraw();
  }
  /**
   * 画布重绘
   */
  public redraw() {
    if (this.isBatching) {
      return;
    }
    this.canvasHelper.clear();
    // this.canvasHelper.setBackground('#c6c6c6');
    this.canvasHelper.startDraw(true);
    const bound = this.stage.getBound();
    const layers = this.stage.getLayers();
    for (const layer of layers) {
      if (this.renderAll) {
        this.drawPath(layer);
        continue;
      }
      const bound1 = layer.getBound();
      if (bound1 && bound.isOverlaped(bound1)) {
        this.drawPath(layer);
      }
    }
    this.canvasHelper.endDraw(true);
    this.renderCacheCanvas();
  }
  /**
   * 设置画布缩放参数
   * @param scale 画布缩放参数
   */
  public setZoom(scale: number) {
    this.canvasHelper.setScale(scale);
    this.updateCacheCanvas();
  }
  /**
   * 设置画布中心和缩放
   * @param center 画布中心(世界坐标)
   * @param zoom 缩放参数
   */
  public setCenter(center: Vertex, zoom: number) {
    this.canvasHelper.setScale(zoom);
    const pt = this.canvasHelper.worldCoordinateToScreen(center);
    const offset = this.canvasHelper.getOffsetToScreenCenter(pt);
    const origin = this.canvasHelper.getOriginCenter();
    this.canvasHelper.setCenter([origin[0] - offset[0], origin[1] - offset[1]]);
    this.updateCacheCanvas();
  }
  public updateCacheCanvas() {
    const center = this.canvasHelper.getOriginCenter();
    const scale = this.canvasHelper.getScale();
    this.cacheHelper.setCenter(center);
    this.cacheHelper.setScale(scale);
  }
  /**
   * 清除指定Bound的画布区域
   * @param bound math.Bound
   */
  public clearBoundPath(bound: math.Bound) {
    this.canvasHelper.clearPart(bound);
  }
  /**
   * 删除待加载的图层
   * @param layer Layer
   */
  public deletePeddingLayer(layer: Layer) {
    if (this.peddingLayers.has(layer.id)) {
      this.peddingLayers.delete(layer.id);
    }
  }
  /**
   * 添加待加载的图层
   * @param id String
   */
  public setPeddingLayer(id: string) {
    this.peddingLayers.add(id);
  }
  /**
   * 设置是否渲染全部图层
   * @param bool boolean
   */
  protected _setRederAll(bool: boolean) {
    this.renderAll = bool;
  }
}
