import Evt from './evt';
import Render from './render';
import { EventData, Vertex, GraphType } from '../typeof/typeof';
import Layer from '../layer/layer';
import * as math from '../math';
import LayerGroup from '../layer/layerGroup';

interface ValidEventType {
  [k: string]: string;
}
interface Options {
  zoom?: number;
  minZoom?: number;
  maxZoom?: number;
  zoomChange?: number;
}
export default class Stage extends Evt {
  public options: {[k: string]: any};
  public readonly container: HTMLDivElement;
  public readonly render: Render;
  private draggEnable: boolean = true;
  private center: Vertex;
  private zoom: number = 1;
  private minZoom: number = 0.1;
  private maxZoom: number = 30;
  private zoomChange: number = 0.1;
  private readonly layers: Map <string, Layer>;
  private readonly highLightLayers: Map <string, Layer>;
  constructor(id: string, options: Options = {}) {
    super();
    this.container = document.getElementById(id) as HTMLDivElement;
    if (!this.container) {
      throw new Error('Stage container is not found.');
    }
    this.render = new Render(this.container.clientWidth, this.container.clientHeight, this);
    this.layers = new Map();
    this.highLightLayers = new Map();
    this._initContainer();
    this.center = this.render.getCenter();
    this.options = options;
    this.options.id = id;
    this._setOptions(options);
    this._initEvents();
    this._resize();
  }
  /**
   * 返回所有图层
   */
  public getLayers(filter?: any): Layer[] {
    const layers = Array.from(this.layers.values());
    if (filter) {
      return layers.filter((layer) => filter(layer));
    }
    return layers;
  }
  /**
   * 返回满足条件的第一个图层
   * @param filter 过滤函数
   */
  public getLayer(filter: any): Layer | undefined {
    const layers = Array.from(this.layers.values());
    for (const layer of layers) {
      if (filter(layer)) {
        return layer;
      }
    }
  }
  /**
   * 返回所有高亮的图层
   */
  public getHighLightLayers(): Layer[] {
    return Array.from(this.highLightLayers.values());
  }
  /**
   * 返回当前缩放级别
   */
  public getZoom(): number {
    return this.zoom;
  }
  /**
   * 返回画布中心点的世界坐标
   */
  public getCenter(): Vertex {
    return this.render.getCenter();
  }
  /**
   * 返回最小缩放级别
   */
  public getMinzoom(): number {
    return this.minZoom;
  }
  /**
   * 返回最大缩放级别
   */
  public getMaxZoom(): number {
    return this.maxZoom;
  }
  /**
   * 返回当前视口的Bound
   */
  public getBound(): math.Bound {
    return this.render.getBound();
  }
  /**
   * 将世界坐标转换成屏幕坐标
   * @param pt 世界坐标
   */
  public transferWorldCoordinateToScreen(pt: Vertex): Vertex {
    const canvasHelper = this.render.getCanvasHelper();
    return canvasHelper.worldCoordinateToScreen(pt);
  }
  /**
   * 返回包含所有图层的画布图片
   * @param options 渲染参数
   */
  public async getAllLayerImage(options?: {[k: string]: any}): Promise<string> {
    const canvas: HTMLCanvasElement = await this.render.cloneCanvas(options);
    return canvas.toDataURL('image/png', 0.9);
  }
  /**
   * 返回当前视口的画布图片
   */
  public getViewImage(): string {
    const canvas: HTMLCanvasElement = this.render.getCanvasDom();
    return canvas.toDataURL('image/png', 0.9);
  }
  /**
   * 根据坐标点返回选中的图层
   * @param pos Vertex
   */
  public getLayersByPosition(pos: Vertex): Layer[] {
    const layers: Layer[] = [];
    for (const [id, layer] of this.layers) {
      if (layer.isPointClosest(pos)) {
        layers.push(layer);
      }
    }
    return layers;
  }
  /**
   * 根据坐标点返回选中的图层
   * @param pos Vertex
   */
  public getLayerByPosition(pos: Vertex, tolerance?: number): Layer | undefined {
    for (const [id, layer] of this.layers) {
      if (layer.isPointClosest(pos, tolerance)) {
        return layer;
      }
    }
  }
  /**
   * 查找与矩形相交的图层
   * @param bound Bound
   * @param intersect 图层与bound相交或者包含在bound
   */
  public getLayersByBound(bound: math.Bound, intersect: boolean = true): Layer[] {
    const layers: Layer[] = [];
    for (const [id, layer] of this.layers) {
      if (intersect && layer.isIntersectWithBound(bound)) {
        layers.push(layer);
      } else if (layer.isWithinBound(bound)) {
        layers.push(layer);
      }
    }
    return layers;
  }
  /**
   * 返回屏幕像素距离
   * @param dis number
   */
  public getScreenDistance(dis: number): number {
    const canvasHelper = this.render.getCanvasHelper();
    return canvasHelper.transformScreenDistance(dis);
  }
  /**
   * 添加图层
   * @param layer Layer
   */
  public addLayer(layer: Layer) {
    const id: string = layer.id;
    if (this.layers.has(id)) {
      return this;
    }
    this.layers.set(id, layer);
    layer.layerAdd(this);
    return this;
  }
  /**
   * 是否包含某个图层
   * @param layer Layer
   */
  public hasLayer(layer: Layer) {
    return !!layer && this.layers.has(layer.id);
  }
  /**
   * 删除某个图层
   * @param layer Layer
   */
  public removeLayer(layer: Layer) {
    if (layer && !this.layers.has(layer.id)) {
      return this;
    }
    this.layers.delete(layer.id);
    this.render.redraw();
    this.fire('removed', {layer});
  }
  /**
   * 删除某些图层
   * @param layers 图层组
   */
  public removeLayers(layers: Layer[]) {
    for (const layer of layers) {
      this.layers.delete(layer.id);
      this.highLightLayers.delete(layer.id);
    }
    this.render.redraw();
    for (const layer of layers) {
      layer.fire('removed', {layer});
    }
  }
  /**
   * 清空图层
   */
  public clearAllLayers() {
    this.layers.clear();
    this.render.redraw();
  }
  /**
   * 清除高亮图层
   */
  public clearHighLightLayer(layer?: Layer) {
    if (layer) {
      this.highLightLayers.delete(layer.id);
      this.highLightLayers.delete(layer.id);
    } else {
      this.highLightLayers.clear();
    }
    this.render.renderCacheCanvas();
  }
  /**
   * 添加高亮图层
   */
  public addHighLightLayer(layer: Layer) {
    this.highLightLayers.set(layer.id, layer);
  }
  /**
   * 高亮图层
   */
  public hilightLayers() {
    this.render.renderCacheCanvas();
  }
  /**
   * 遍历图层
   * @param callback 回调函数
   */
  public eachLayer(callback: any) {
    const arrayLayers = Array.from(this.layers);
    for (const value of this.layers) {
      if (callback) {
        callback(value[1], value[0], arrayLayers);
      }
    }
  }
  /**
   * 清空事件监听
   */
  public clearAllEvents() {
    this.events = {};
  }
  /**
   * 缩放
   * @param zoom 缩放级别
   */
  public setZoom(zoom: number) {
    const nzoom = this._getValidateZoom(zoom);
    if (nzoom) {
      this.zoom = nzoom;
    }
    this.setView(this.center, this.zoom);
  }
  /**
   * 放大
   */
  public zoomIn() {
    this.setZoom(this.zoom + this.zoomChange);
  }
  /**
   * 缩小
   */
  public zoomOut() {
    this.setZoom(this.zoom - this.zoomChange);
  }
  /**
   * 定位
   * @param center 定位点
   * @param zoom 缩放级别
   */
  public setView(center: Vertex, zoom?: number) {
    this.center = center;
    this.zoom = zoom || this.zoom;
    this.render.setCenter(center, this.zoom);
    this.render.redraw();
    this.fire('moveend', {target: this, sourceTarget: event});
  }
  /**
   * 缩放视图窗口至目标Bound
   * @param bound 缩放的Bound
   */
  public fitBound(bound: math.Bound) {
    this.center = bound.getCenter();
    const {width, height} = this.getBound();
    let zoom_w = width * this.zoom / bound.width;
    let zoom_h = height * this.zoom / bound.height;
    zoom_w = Math.floor(zoom_w / this.zoomChange) * this.zoomChange;
    zoom_h = Math.floor(zoom_h / this.zoomChange) * this.zoomChange;
    const zoom_min = Math.min(zoom_w, zoom_h);
    this.zoom = Math.max(zoom_min, this.minZoom);
    this.zoom = Math.min(this.zoom, this.maxZoom);
    this.render.setCenter(this.center, this.zoom);
    this.render.redraw();
    this.fire('moveend', {target: this, sourceTarget: event});
  }
  /**
   * 开启pan功能
   */
  public enableDrag() {
    this.draggEnable = true;
  }
  /**
   * 关闭pan功能
   */
  public disableDrag() {
    this.draggEnable = false;
  }
  /**
   * 更新画布尺寸
   */
  public updateSize() {
    this.render.resize(this.container.clientWidth, this.container.clientHeight);
  }
  /**
   * 开启批处理
   */
  public startBatch() {
    this.render.setBatch(true);
  }
  /**
   * 关闭批处理
   */
  public endBatch() {
    this.render.setBatch(false);
    this.render.redraw();
  }
  /**
   * 设置stage初始化参数
   * @param options options参数
   */
  protected _setOptions(options?: Options) {
    if (options) {
      this.zoom = options.zoom || this.zoom;
      this.minZoom = options.minZoom || this.minZoom;
      this.maxZoom = options.maxZoom || this.maxZoom;
      this.zoomChange = options.zoomChange || this.zoomChange;
    }
  }
  /**
   * 格式化缩放级别参数
   * @param zoom 缩放级别
   */
  private _getValidateZoom(zoom: number): number | undefined {
    if (isNaN(zoom)) {
      console.warn(`stage zoom can't be NaN`);
      return;
    }
    zoom = Number(zoom);
    zoom = Math.max(this.minZoom, zoom);
    zoom = Math.min(zoom, this.maxZoom);
    return zoom;
  }
  /**
   * 监听页面尺寸变化
   */
  private _resize() {
    window.addEventListener('resize', () => {
      this.updateSize();
    });
  }
  /**
   * 初始化canvas dom元素
   */
  private _initContainer() {
    this.container.appendChild(this.render.getCanvasDom());
    this.container.appendChild(this.render.getCacheCanvasDom());
  }
  /**
   * 初始化画布事件监听
   */
  private _initEvents() {
    const fn = this._eventHandler;
    const events: string[] = ['click', 'dblclick', 'mousedown', 'mousemove', 'mouseup', 'mouseover', 'mouseleave', 'mousewheel', 'contextmenu'];
    for (const evt of events) {
      this._listenerEvent(evt, fn);
    }
    // 绑定默认的平移缩放等事件
    const canvasDom = this.render.getCacheCanvasDom();
    // canvasDom.addEventListener(this._formatDOMEvent('mousewheel'), this._zoom.bind(this));
    canvasDom.addEventListener('mousedown', this._pan.bind(this));
    canvasDom.addEventListener('touchstart', this._pan.bind(this));
    document.addEventListener('selectstart', () => false);
  }
  /**
   * 画布缩放事件
   */
  private _zoom() {
    const canvasHelper = this.render.getCanvasHelper();
    const e: any = event;
    const delta = e.wheelDelta ? e.wheelDelta / 120 * this.zoomChange : -e.detail * this.zoomChange;
    if (delta < 0 && (this.zoom + delta) < this.minZoom || delta > 0 && (this.zoom + delta) > this.maxZoom) {
      return;
    }
    this.zoom += delta;
    const offset = canvasHelper.getOffset(e);
    canvasHelper.setScale(this.zoom);
    const center = canvasHelper.getOriginCenter();
    canvasHelper.setCenter([center[0] - offset[0] * delta, center[1] + offset[1] * delta]);
    this.render.updateCacheCanvas();
    this.render.redraw();
    this.fire('moveend', {target: this, sourceTarget: event});
    e.preventDefault();
  }
  /**
   * 画布平移事件
   */
  private _pan() {
    if (!this.draggEnable) {
      return;
    }
    const canvasHelper = this.render.getCanvasHelper();
    const e: any = event;
    let lastPosition: number[] = [e.clientX, e.clientY];
    if (e.touches) {
      lastPosition = [e.touches[0].clientX, e.touches[0].clientY];
    }
    e.preventDefault();
    const moveFunction = () => {
      let ev: any = event;
      if (ev.touches) {
        ev = ev.touches[0];
      }
      const curPosition = [ev.clientX, ev.clientY];
      const deltaX = (curPosition[0] - lastPosition[0]) * canvasHelper.retina;
      const deltaY = (curPosition[1] - lastPosition[1]) * canvasHelper.retina;
      lastPosition = curPosition;
      const center = canvasHelper.getOriginCenter();
      canvasHelper.setCenter([center[0] + deltaX, center[1] + deltaY]);
      this.render.updateCacheCanvas();
      this.render.redraw();
      ev.preventDefault();
    };
    const upFunction = () => {
      document.removeEventListener('mousemove', moveFunction);
      document.removeEventListener('mouseup', upFunction);
      document.removeEventListener('touchmove', moveFunction);
      document.removeEventListener('touchend', upFunction);
      const evt: any = event;
      this.center = this.getCenter();
      this.fire('moveend', {target: this, sourceTarget: evt});
      evt.preventDefault();
    };
    document.addEventListener(this._formatDOMEvent('mousemove'), moveFunction);
    document.addEventListener(this._formatDOMEvent('mouseup'), upFunction);
    document.addEventListener('touchmove', moveFunction);
    document.addEventListener('touchend', upFunction);
  }
  /**
   * 监听画布的事件
   * @param type 事件类型
   * @param fn 响应函数
   */
  private _listenerEvent(type: string, fn: any) {
    const evt: string = this._validEventType(type);
    if (evt) {
      const canvasDom = this.render.getCacheCanvasDom();
      canvasDom.addEventListener(evt, fn.bind(this));
    }
  }
  /**
   * 分发监听事件
   */
  private _eventHandler() {
    const e: any = event;
    const evt: string = e.type;
    const data: EventData = {target: this, sourceTarget: e};
    // 修改蔽默认的右键菜单事件
    if (e.type === 'contextmenu') {
      // evt = 'mousedown|mouseup|click';
      e.preventDefault();
    }
    if (e.type !== 'keypress') {
      data.pos = this.render.getPos([e.offsetX, e.offsetY]);
    }
    const events: string[] = evt.split('|');
    events.forEach((ets: string) => {
      this._fireEvent(ets, data);
    });
  }
  /**
   * 响应监听事件
   * @param evt 事件类型
   * @param data 回调参数
   */
  private _fireEvent(evt: string, data: EventData) {
    const targets: Evt[] = this._findEventTargets(evt, data.pos);
    for (const target of targets) {
      data.layer = target;
      target.fire(evt, data);
    }
  }
  /**
   * 查找事件监听目标
   * @param evt 事件类型
   * @param pos 鼠标事件的坐标
   */
  private _findEventTargets(evt: string, pos?: Vertex): Evt[] {
    const targets: Evt[] = [];
    for (const [id, layer] of this.layers) {
      if (layer.type === GraphType.GROUP) {
        // 修改layerGroup里面的子图层事件监听不到bug
        for (const glayer of (layer as LayerGroup).getLayers()) {
          if (glayer.listens(evt) && pos && glayer.isPointClosest(pos)) {
            targets.push(glayer);
            if (targets.includes(layer)) {
              targets.push(layer);
            }
          }
        }
      } else if (layer.listens(evt) && pos && layer.isPointClosest(pos)) {
        targets.push(layer);
      }
    }
    if (this.listens(evt)) {
      targets.push(this);
    }
    return targets;
  }
  /**
   * 处理浏览器之间事件的兼容性
   * @param evt 事件类型
   */
  private _formatDOMEvent(evt: string): string {
    if (navigator.userAgent.includes('Firefox')) {
      if (evt === 'mousewheel') {
        return 'DOMMouseScroll';
      }
    }
    return evt;
  }
  /**
   * 格式化事件类型
   * @param evt 事件类型
   */
  private _validEventType(evt: string): string {
    evt = evt.toLowerCase();
    const validType: ValidEventType = {
      click: 'click',
      dblclick: 'dblclick',
      mousedown: 'mousedown',
      mousemove: 'mousemove',
      mouseup: 'mouseup',
      mouseover: 'mouseover',
      mouseleave: 'mouseleave',
      mousewheel: 'mousewheel',
      contextmenu: 'contextmenu',
    };
    return validType[evt] || '';
  }
}
