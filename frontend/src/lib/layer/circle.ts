import Layer from './layer';
import { GraphType, XY, Vertex} from '@/lib/typeof/typeof';
import * as math from '../math';

export default class Circle extends Layer {
  protected geometry: Vertex;
  protected radius: number = 0;
  constructor(geo: Vertex, radius: number, options: {[k: string]: any}) {
    super();
    this.setOptions(options);
    this.highOptions.fill = this.options.fill;
    this.geometry = geo;
    this.radius = radius;
  }
  public getLayerType(): GraphType {
    return GraphType.CIRCLE;
  }
  public getGeometry(): Vertex {
    return this.geometry;
  }
  public getCenter(): Vertex {
    return this.geometry;
  }
  public getRadius(): number {
    return this.radius;
  }
  public getBound(): math.Bound {
    return new math.Bound(this.geometry[0] - this.radius, this.geometry[1] - this.radius, this.radius * 2, this.radius * 2);
  }
  public setGeometry(geo: number[]) {
    this.geometry = geo;
    this.updateAll();
  }
  public setRadius(radius: number) {
    this.radius = radius;
    this.updateAll();
  }
  public contain(p: Vertex): boolean {
    const distance: number = math.Base.getDistance(p, this.geometry);
    return distance < this.radius;
  }
  public translate(dx: number, dy: number) {
    const geo = [this.geometry[0] + dx, this.geometry[1] + dy];
    this.setGeometry(geo);
  }
  public isPointClosest(pt: Vertex, tolerance?: number): boolean {
    if (this.options.fill || !this.options.strict) {
      return math.Base.getSquareDistance(pt, this.geometry) <= this.radius ** 2;
    } else {
      const distance: number = math.Base.getDistance(pt, this.geometry);
      const tol = tolerance !== undefined ? tolerance : this.tolerance;
      return math.Base.isZero(distance - this.radius, tol);
    }
  }
  public getNearestPoint(p: Vertex): Vertex {
    const center = new math.Vector2(this.geometry);
    const vp = new math.Vector2(p);
    const dir = new math.Vector2(vp.x - center.x, vp.y - center.y).normalize();
    const np = center.clone().add(dir.scale(this.radius));
    return [np.x, np.y];
  }
  public isIntersectWithBound(bound: math.Bound): boolean {
    const center: math.Vector2 = new math.Vector2(this.getCenter());
    const bCenter: math.Vector2 = new math.Vector2(bound.getCenter());
    const v: math.Vector2 = center.clone().substract(bCenter);
    v.x = Math.abs(v.x);
    v.y = Math.abs(v.y);
    const h: math.Vector2 = new math.Vector2(bound.width / 2, bound.height / 2);
    const u: math.Vector2 = v.clone().substract(h);
    u.x = Math.max(u.x, 0);
    u.y = Math.max(u.y, 0);
    const d: number = u.getSquareLength();
    let contain = false;
    for (const p of bound.getVetexs()) {
      if (!this.contain(p)) {
        contain = true;
      }
    }
    if (d <= this.radius ** 2) {
      if (!this.options.fill || this.options.strict) {
        return contain;
      }
      return true;
    }
    return false;
  }
  public clone() {
    const options = {...this.options, _render: null, _stage: null};
    return new Circle([this.geometry[0], this.geometry[1]], this.radius, options);
  }
}
