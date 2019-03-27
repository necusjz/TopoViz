export enum Geometry_Type {
  VECTOR,
  LINE,
  BOX,
}
export interface XY {
  x: number;
  y: number;
}

export interface Vertex {
  [k: number]: number;
}
