interface Node {
    id: string | number;
    [k: string]: any;
}
interface Edge {
    source: Node;
    target: Node;
    [k: string]: any;
}

export default class ForceDirect {
    private nodes: Node[] = [];
    private edges: Edge[] = [];
    private nodeMap: Map<string | number, Node> = new Map();
    private dxMap: Map<string | number, { dx: number, dy: number }> = new Map();
    protected k: number = 0;
    protected size: { w: number, h: number } = { w: 1000, h: 500 };
    protected count: number = 0;
    constructargetr(options?: { [k: string]: any }) {
        if (options && options.size) {
            this.size = options.size;
        }
    }
    public getNode(id: string | number) {
        const node = this.nodes.find((n: Node) => n.id === id);
        if (node) {
            return node;
        }
    }
    public setNode(node: Node) {
        const mnode: Node = { ...node };
        this.nodes.push(mnode);
        this.nodeMap.set(mnode.id, mnode);
    }
    public setEdge(edge: Edge) {
        const medge: Edge = { ...edge };
        this.edges.push(medge);
    }
    public run(callback?: any) {
        if (this.nodes.length > 0) {
            this.k = Math.sqrt(this.size.w * this.size.h / this.nodes.length);
        }
        this.initPosition();
        this.amination(callback);
    }
    private amination(callback?: any) {
        requestAnimationFrame(() => {
            this.count++;
            this.calculateRepulsive();
            this.calculateTraction();
            this.controlBound();
            if (callback) {
                callback(this.nodes, this.edges);
            }
            if (this.count < 600) {
                this.amination(callback);
            }
        });
    }
    /**
     * 初始化随机位置
     */
    private initPosition() {
        const initailX: number = 0;
        const initailY: number = 0;
        for (const node of this.nodes) {
            this.dxMap.set(node.id, { dx: 0, dy: 0 });
            node.x = initailX + this.size.w * (Math.random() - 0.5);
            node.y = initailY + this.size.h * (Math.random() - 0.5);
        }
    }
    /**
     * 计算两个node产生的斥力
     */
    private calculateRepulsive() {
        let ejectFactor = 6;
        for (let i = 0; i < this.nodes.length; i++) {
            for (let j = i + 1; j < this.nodes.length; j++) {
                const dx: number = this.nodes[j].x - this.nodes[i].x;
                const dy: number = this.nodes[j].y - this.nodes[i].y;
                const squareDist: number = dx ** 2 + dy ** 2;
                const dist: number = Math.sqrt(squareDist);
                if (dist < 30) {
                    ejectFactor = 5;
                }
                if (dist < 250) {
                    const f_x: number = dx / dist * this.k * this.k / dist * ejectFactor;
                    const f_y: number = dy / dist * this.k * this.k / dist * ejectFactor;
                    const mdx1: any = this.dxMap.get(this.nodes[i].id);
                    const mdx2: any = this.dxMap.get(this.nodes[j].id);
                    mdx1.dx -= f_x;
                    mdx1.dy -= f_y;
                    mdx2.dx += f_x;
                    mdx2.dy += f_y;
                }
            }
        }
    }
    /**
     * 计算edge对node产生的引力
     */
    private calculateTraction() {
        const condenseFactargetr: number = 3;
        for (const edge of this.edges) {
            const source: Node = edge.source;
            const target: Node = edge.target;
            const dx: number = source.x - target.x;
            const dy: number = source.y - target.y;
            const dist: number = Math.sqrt(dx ** 2 + dy ** 2);
            const f_x: number = dx * dist / this.k * condenseFactargetr;
            const f_y: number = dy * dist / this.k * condenseFactargetr;
            const mdx1: any = this.dxMap.get(source.id);
            const mdx2: any = this.dxMap.get(target.id);
            mdx1.dx -= f_x;
            mdx1.dy -= f_y;
            mdx2.dx += f_x;
            mdx2.dy += f_y;
        }
    }
    private controlBound() {
        const mat_x = 4;
        const mat_y = 3;
        for (const node of this.nodes) {
            let { dx, dy } = this.dxMap.get(node.id) as { dx: number, dy: number };
            if (dx < -mat_x) dx = -mat_x;
            if (dx > mat_x) dx = mat_x;
            if (dy < -mat_y) dy = -mat_y;
            if (dy > mat_y) dy = mat_y;
            if ((node.x + dx) >= this.size.w / 2 || (node.x + dx <= -this.size.w / 2)) {
                node.x -= dx;
            } else {
                node.x += dx;
            }
            if ((node.y + dy) >= this.size.h / 2 || (node.y + dy <= -this.size.h / 2)) {
                node.y -= dy;
            } else {
                node.y += dy;
            }
        }
    }
}