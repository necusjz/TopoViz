import * as xCanvas from '@/lib';
import { generateUUID } from './util';
import { NetWorkLevel, NodeData } from '@/types/type'

interface TopoOptions {
    interval: number;
    step: number;
    size: number;
    width?: number;
    height?: number;
}
interface GroupData {
    type: string;
    level: number;
    nodes: Node[];
    groupedNodes: Node[][];
    relatedNodes: Node[][]
}
class Node {
    public id: string;
    public name: string;
    public level: number;
    public type: string;
    public color: string;
    public position: { x: number, y: number } = {x: 0, y: 0};
    public right: Node[] = [];
    public bottom: Node[] = [];
    public left: Node[] = [];
    public top: Node[] = [];
    public effectX: number[] = [];
    constructor(name: string, type: string, level: number, color: string) {
        this.name = name;
        this.type = type;
        this.level = level;
        this.color = color;
        this.id = generateUUID();
    }
    public setPosition(pos: { x: number, y: number }) {
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
    private data: NodeData[][] = [];
    private levelY: {[k: string]: number} = {};
    constructor(topoData: NodeData[][], options = {}) {
        this.data = topoData;
        const defaultOptions: TopoOptions = {
            step: 60,
            interval: 80,
            size: 20
        };
        this.options = { ...defaultOptions, ...options };
        this.initializeData();
    }
    public run() {
        // goup路径同层关联的nodes
        const parts: any = this.data.map((part) => {
            return part.map((ne) => this.nodes.get(ne.name));
        });
        const groupData: GroupData[] = [];
        for (const node of this.nodes.values()) {
            let group = groupData.find((g) => g.level === node.level);
            if (!group) {
                group = {type: node.type, level: node.level, nodes: [], groupedNodes: [], relatedNodes: []};
                groupData.push(group);
            }
            group.nodes.push(node);
        }
        for (const group of groupData) {
            const gparts: Node[][] = parts.map((part: Node[]) => {
                return part.filter((ne: Node) => ne && ne.level === group.level);
            }).filter((part: Node[]) => part.length > 0);
            const cloneParts = [...gparts];
            const checkedNodes = new Set();
            for (let i = 0; i < gparts.length; i++) {
                const souce = gparts[i];
                if (checkedNodes.has(souce[0])) continue;
                const related_set = new Set(souce);
                souce.forEach((node: Node) => checkedNodes.add(node));
                for (let j = i + 1; j < cloneParts.length; j++) {
                    const target = cloneParts[j];
                    if (checkedNodes.has(target[0])) continue;
                    if (this.isHasIntersect(souce, target)) {
                        target.forEach((node: Node) => {
                            related_set.add(node);
                            checkedNodes.add(node);
                        });
                    }
                }
                group.relatedNodes.push([...related_set]);
            }
        }
        groupData.sort((pre, next) => next.nodes.length - pre.nodes.length);
        for (let i = 0; i < groupData.length; i++) {
            const group = groupData[i];
            if (i === 0) {
                this.levelY[group.level] = 0;
            }
            this.adjustSameLevel(group);
        }
        // 同层节点位置排序结束, todo: 相邻层连接
        this.updateParentPostionX(groupData[0].nodes);
        this.updateChildrenPositionX(groupData[0].nodes);
        this.autoFixLayout(groupData);
    }
    public isHasIntersect(souce: Node[], target: Node[]): boolean {
        for (let i = 0; i < souce.length; i++) {
            if (target.includes(souce[i])) {
                return true;
            }
        }
        return false;
    }
    // 同层节点调整位置
    public adjustSameLevel(levelNodes: GroupData) {
        const relatedNodes: Node[][] = levelNodes.relatedNodes;
        for (const pathNode of relatedNodes) {
            const root = pathNode.find((node: Node) => node.left.length === 0);
            // 头节点(左侧无节点)
            let maxPath: Node[] = [];
            if (root) {
                this.findMaxLengthPath(root, [], maxPath);
            } else {
                if (pathNode.length === 0) {
                    debugger;
                }
                this.findMaxLengthPath(pathNode[0], [], maxPath);
            }
            const insertNodes: {node: Node, weight: number}[] = [];
            for (const gnode of pathNode) {
                if (maxPath.includes(gnode)) continue;
                insertNodes.push({node: gnode, weight: this.findWeightOfNode(gnode, maxPath)});
            }
            insertNodes.sort((pre, next) => pre.weight - next.weight);
            this.insertNode(insertNodes, maxPath);
            levelNodes.groupedNodes.push(maxPath);
        }
        this.updateX(levelNodes.groupedNodes);
    }
    // 相连的点集中找出最长的路径
    public findMaxLengthPath(root: Node, curPath: Node[], maxPath: Node[]) {
        curPath.push(root);
        // 孤点
        if (root.right.length === 0) {
            maxPath.push(root);
            return;
        }
        for (const rightNode of root.right) {
            if (curPath.includes(rightNode) || rightNode.right.length === 0) {
                curPath.push(rightNode);
                if (maxPath.length < curPath.length) {
                    maxPath.splice(0, maxPath.length, ...curPath);
                }
                curPath.pop();
            } else {
                this.findMaxLengthPath(rightNode, curPath, maxPath);
            }
        }
    }
    // 找到节点在已存在路径中的靠近的位置权重
    public findWeightOfNode(node: Node, pathNode: Node[]) {
        return pathNode.findIndex((gnode) => {
            return gnode.left.includes(node) || gnode.right.includes(node);
        });
    }
    // 递归插入剩余的点
    public insertNode(nodes: {node: Node, weight: number}[], groupedNodes: Node[]) {
        const restNodes = nodes.filter((item) => item.weight === -1);
        for (const g of nodes) {
            if (g.weight === -1) continue;
            if (g.weight < Math.floor(groupedNodes.length / 2)) {
                groupedNodes.splice(0, 0, g.node);
            } else {
                groupedNodes.push(g.node);
            }
        }
        if (restNodes.length > 0) {
            for (const g of restNodes) {
                g.weight = this.findWeightOfNode(g.node, groupedNodes);
            }
            this.insertNode(restNodes, groupedNodes);
        }
    }
    public isStraight(x1: number, x2: number, type: string): boolean {
        const nodes = this.getNodeByFilter((node: Node) => node.type === type);
        const xrange = nodes.map((node: Node) => node.position.x);
        return xrange.some((x: number) => (x - x1) * (x - x2) < 0);
    }
    public updateX(groupedNodes: Node[][]) {
        let x = 0;
        for (const group of groupedNodes) {
            for (const node of group) {
                x += this.options.interval;
                node.position.x = x;
                node.position.y = 0;
            }
        }
    }
    // 更新子节点对父节点x坐标的影响
    public updateParentPostionX(nodes: Node[]) {
        const parentNodes_set = new Set();
        for (const node of nodes) {
            for (const parentNode of node.top) {
                parentNode.effectX.push(node.position.x);
                parentNodes_set.add(parentNode);
            }
        }
        for (const node of nodes) {
            for (const parentNode of node.top) {
                if (parentNode.effectX.length > 0) {
                    parentNode.position.x = parentNode.effectX.reduce((pre, cur) => {
                        return pre + cur;
                    });
                    parentNode.position.x /= parentNode.effectX.length;
                    parentNode.position.y += node.position.y + this.options.step;
                    parentNode.effectX = [];
                }
            }
        }
        const parentNodes = [...parentNodes_set];
        if (parentNodes.length > 0) {
            this.updateParentPostionX(parentNodes);
        }
    }
    // 更新父节点对子节点x坐标的影响
    public updateChildrenPositionX(nodes: Node[]) {
        const childNodes_set = new Set();
        for (const node of nodes) {
            for (const childNode of node.bottom) {
                childNode.effectX.push(node.position.x);
                childNodes_set.add(childNode);
            }
        }
        for (const node of nodes) {
            for (const childNode of node.bottom) {
                if (childNode.effectX.length > 0) {
                    childNode.position.x = childNode.effectX.reduce((pre, cur) => {
                        return pre + cur;
                    });
                    childNode.position.x /= childNode.effectX.length;
                    childNode.position.y -= this.options.step;
                    childNode.effectX = [];
                }
            }
        }
        const childNodes = [...childNodes_set];
        if (childNodes.length > 0) {
            this.updateChildrenPositionX(childNodes);
        }
    }
    private initializeData() {
        for (const NodeDatas of this.data) {
            let preNode!: Node;
            for (const NodeData of NodeDatas) {
                const node = this.nodes.get(NodeData.name) || new Node(NodeData.name, NodeData.type, NodeData.level, NodeData.color);
                node.level = NodeData.level === null ? preNode.level : NodeData.level;
                this.nodes.set(node.name, node);
                if (preNode) {
                    const edge = new Edge(preNode, node);
                    this.edges.push(edge);
                    if (preNode.level === node.level) {
                        if (!preNode.right.find((nd) => nd === node)) {
                            preNode.right.push(node);
                        }
                        if (!node.left.find((nd) => nd === preNode)) {
                            node.left.push(preNode);
                        }
                    } else if (node.level - preNode.level === 1) {
                        if (!preNode.bottom.find((nd) => nd === node)) {
                            preNode.bottom.push(node);
                        }
                    } else if (node.level - preNode.level === -1) {
                        if (!node.top.find((nd) => nd === node)) {
                            node.top.push(preNode);
                        }
                    }
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
    private autoFixLayout(groupData: GroupData[]) {
        const w = this.options.width;
        const h = this.options.height;
        if (w && h) {
            groupData.sort((a, b) => {
                if (a.nodes.length > 0 && b.nodes.length > 0) {
                    return a.nodes[0].position.y - b.nodes[0].position.y;
                } else {
                    return 0;
                }
            });
            const step = h / groupData.length;
            for (let k = 0; k < groupData.length; k++) {
                const group = groupData[k];
                const interval = w / group.nodes.length;
                const nodes = group.nodes.sort((a, b) => a.position.x - b.position.x);
                for (let i = 0; i < nodes.length; i++) {
                    const node = nodes[i];
                    const x: number = interval * i + interval * (0.25 + Math.random() * 0.5);
                    const y: number = step * k + step * (0.25 + Math.random() * 0.5);
                    node.setPosition({x, y});
                }
            }
        }
    }
}