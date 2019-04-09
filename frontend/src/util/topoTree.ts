import * as xCanvas from '@/lib';
import { generateUUID } from './util';

interface NeNode {
    name: string;
    type: string;
}
interface TopoOptions {
    interval: number;
    step: number;
    size: number;
}
class Node {
    public id: string;
    public name: string;
    public type: string;
    public position!: {x: number, y: number};
    public layer!: xCanvas.Layer;
    public front: Node[] = [];
    public next: Node[] = [];
    constructor(name: string, type: string) {
        this.name = name;
        this.type = type;
        this.id = generateUUID();
    }
    public setPosition(pos: {x: number, y: number}) {
        this.position = pos;
    }
}
class Edge {
    public source: Node;
    public target: Node;
    constructor(souce: Node, target: Node) {
        this.source = souce;
        this.target = target;
    }
}
export default class TopoTreeHelper {
    public nodes: Map<string, Node> = new Map();
    public edges: Edge[] = [];
    public options: TopoOptions;
    private stage!: xCanvas.Stage;
    private data: NeNode[][] = [];
    constructor(stage: xCanvas.Stage, topoData: NeNode[][], options = {}) {
        this.stage = stage;
        this.data = topoData;
        const defaultOptions: TopoOptions = {
            step: 90,
            interval: 80,
            size: 20
        };
        this.options = {...defaultOptions, ...options};
        this.initializeData();
    }
    public run() {
        const roots = this.getNodeByFilter((node: Node) => node.front.length === 0);
        for (const root of roots) {
            root.setPosition(this.getValidPosition())
            this.updatePos(root);
        }
    }
    private updatePos(root: Node) {
        for (const nextNode of root.next) {
            if (!nextNode.position) {
                if (nextNode.type === root.type) {
                    nextNode.setPosition({x: root.position.x + this.options.interval, y: root.position.y});
                } else {
                    nextNode.setPosition({x: root.position.x, y: root.position.y - this.options.step});
                }
            } else {
                this.updateParent(nextNode);
            }
            this.updatePos(nextNode);
        }
    }
    private updateParent(childNode: Node) {
        const parents = childNode.front.filter((node: Node) => {
            node.type !== childNode.type;
        });
        const angle = 180 / (parents.length + 1);
        const pt = new xCanvas.Math.Vector2(childNode.position);
        const dir = new xCanvas.Math.Vector2(1, 0);
        for (let i = 0; i < parents.length; i++) {
            const pNode = parents[i];
            const len = this.options.step / Math.cos(xCanvas.Math.Operation.degreeToRadius(Math.abs(angle * (i + 1) - 90)));
            const pos = pt.add(dir.rotate(angle * (i + 1)).scale(len));
            pNode.setPosition({x: pos.x, y: pos.y});
            this.updateParent(pNode);
        }
    }
    private initializeData() {
        for (const neNodes of this.data) {
            let preNode!: Node;
            for (const neNode of neNodes) {
                const node = this.nodes.get(neNode.name) || new Node(neNode.name, neNode.type);
                this.nodes.set(node.name, node);
                if (preNode) {
                    const edge = new Edge(preNode, node);
                    this.edges.push(edge);
                    node.front.push(preNode);
                    preNode.next.push(node);
                }
                preNode = node;
            }
        }
    }
    private getNodeByFilter(filter: any): Node[] {
        const res: Node[] = [];
        for (const node of this.nodes.values()) {
            if (filter(node)) {
                res.push(node);
            }
        }
        return res;
    }
    private getValidPosition() {
        let x = 0;
        for (const node of this.nodes.values()) {
            if (node.front.length === 0 && node.position) {
                x = Math.max(node.position.x);
            }
        }
        return {x: x + this.options.interval, y: 0};
    }
}