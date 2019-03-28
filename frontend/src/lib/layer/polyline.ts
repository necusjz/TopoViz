import Layer from './layer';
import { GraphType, Vertex } from '../typeof/typeof';
import {Polyline as mPolyline, Base, Bound} from '../math';
import Util from '../util/util';

export default class Polyline extends Layer {
  protected geometry: Vertex[] | Vertex[][];
  constructor(geo: Vertex[] | Vertex[][], options: {[k: string]: any} = {}) {
    super();
    const defaultOptions = {
      stroke: true,
      weight: 1,
    };
    this.setOptions({...defaultOptions, ...options});
    this.highOptions.fill = false;
    this.geometry = this.clearnData(geo);
  }
  public clone(): Polyline {
    const options = {...this.options};
    delete options._stage;
    delete options._render;
    return new Polyline(this.geometry, options);
  }
  public getLayerType(): GraphType {
    return GraphType.POLYLINE;
  }
  public getGeometry(): Vertex[] | Vertex[][] {
    return this.geometry;
  }
  public setGeometry(geo: Vertex[] | Vertex[][]) {
    this.geometry = geo;
    this.updateAll();
  }
  public addVertex(vertex: Vertex) {
    const geometry: any = this.getGeometry();
    if (!this.isMutiLine()) {
      geometry.push(vertex);
      this.updateAll();
    }
  }
  public translate(dx: number, dy: number) {
    if (!this.isMutiLine()) {
      const geo: Vertex[] = (this.geometry as Vertex[]).map((pt: Vertex) => {
        return [pt[0] + dx, pt[1] + dy];
      });
      this.setGeometry(geo);
    } else {
      const geo = (this.geometry as Vertex[][]).map((pts: Vertex[]) => {
        return pts.map((pt: Vertex) => {
          return [pt[0] + dx, pt[1] + dy];
        });
      });
      this.setGeometry(geo);
    }
  }
  public isMutiLine(): boolean {
    const level: number = Util.dimension_Array(this.geometry);
    return level === 3;
  }
  public setLastVertex(vertex: Vertex) {
    const geometry: any = this.getGeometry();
    if (!this.isMutiLine()) {
      geometry.splice(-1, 1, vertex);
      this.updateAll();
    }
  }
  public getMinDistance(p: Vertex): number {
    let dis: number = Number.MAX_SAFE_INTEGER;
    const geometry: any = this.getGeometry();
    if (!this.isMutiLine()) {
      const mply: mPolyline = new mPolyline(geometry);
      const nearestPoint: Vertex = mply.getNearestPoint(p);
      dis = Base.getDistance(p, nearestPoint);
    } else {
      for (const geo of geometry) {
        const mply: mPolyline = new mPolyline(geo);
        const nearestPoint: Vertex = mply.getNearestPoint(p);
        const ddis: number = Base.getDistance(p, nearestPoint);
        dis = Math.min(dis, ddis);
      }
    }
    return dis;
  }
  public getNearestPoint(p: Vertex): Vertex {
    let dis: number = Number.MAX_SAFE_INTEGER;
    const geometry: any = this.getGeometry();
    if (!this.isMutiLine()) {
      const mply: mPolyline = new mPolyline(geometry);
      const nearestPoint: Vertex = mply.getNearestPoint(p);
      return nearestPoint;
    } else {
      let vertex: Vertex = [0, 0];
      for (const geo of geometry) {
        const mply: mPolyline = new mPolyline(geo);
        const nearestPoint: Vertex = mply.getNearestPoint(p);
        const ddis: number = Base.getDistance(p, nearestPoint);
        if (ddis < dis) {
          vertex = nearestPoint;
          dis = ddis;
        }
      }
      return vertex;
    }
  }
  public isPointClosest(p: Vertex, tolerance?: number): boolean {
    const dis = this.getMinDistance(p);
    return tolerance !== undefined ? dis <= tolerance : dis <= this.tolerance;
  }
  public isIntersectWithBound(bound: Bound): boolean {
    const geoms: any = this.getGeometry();
    if (!this.isMutiLine()) {
      for (let i = 0; i < geoms.length - 1; i++) {
        if (bound.isIntersectOfSegment(geoms[i], geoms[i + 1])) {
          return true;
        }
      }
    } else {
      for (const geo of geoms) {
        for (let i = 0; i < geo.length - 1; i++) {
          if (bound.isIntersectOfSegment(geo[i], geo[i + 1])) {
            return true;
          }
        }
      }
    }
    return false;
  }
}
