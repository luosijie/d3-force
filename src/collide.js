import {quadtree} from "d3-quadtree";
import constant from "./constant.js";
import jiggle from "./jiggle.js";

// 定义四叉树读取的x坐标值
function x(d) {
  return d.x + d.vx;
}

// 定义四叉树读取的y坐标值
function y(d) {
  return d.y + d.vy;
}

/**
 * 力模型: 碰撞
 * 根据 radius 生成一个圆形碰撞检测力模型
 * @param {Function} radius 
 * @returns {Function} force
 */
export default function(radius) {
  var nodes,          // 节点数据
      radii,          // 节点半径数据
      strength = 1,   // 碰撞强度
      iterations = 1; // 碰撞检测的迭代次数

  if (typeof radius !== "function") radius = constant(radius == null ? 1 : +radius);

  function force() {
    var i,                 // 节点索引值
        n = nodes.length,  // 节点长度
        tree,              // 将节点数据存储到四叉树中
        node,              // 正在遍历的节点
        xi,                // 正在遍历的节点-坐标x
        yi,                // 正在遍历的节点-坐标y
        ri,                // 正在遍历的节点-半径
        ri2;               // 正在遍历的节点-半径的平方

    for (var k = 0; k < iterations; ++k) {
      tree = quadtree(nodes, x, y).visitAfter(prepare);
      for (i = 0; i < n; ++i) {
        node = nodes[i];
        ri = radii[node.index], ri2 = ri * ri;
        xi = node.x + node.vx;
        yi = node.y + node.vy;
        tree.visit(apply);
      }
    }

    /**
     * 遍历四叉树节点执行的函数
     * @param {Node} quad 四叉树遍历到的节点
     * @param {Number} x0 四叉树节点的下界坐标x
     * @param {Number} y0 四叉树节点的下界坐标y
     * @param {Number} x1 四叉树节点的上界坐标x
     * @param {Number} y1 四叉树节点的上界坐标y
     * @returns {Boolean} true: 遍历子节点; false: 不遍历子节点
     */
    function apply(quad, x0, y0, x1, y1) {
      // data: 四叉树节点数据
      // rj: 四叉树节点数据-半径
      // r: 
      var data = quad.data, rj = quad.r, r = ri + rj;
      if (data) {
        if (data.index > node.index) {
          // l: 计算正在遍历的节点和四叉树节点的距离
          var x = xi - data.x - data.vx,
              y = yi - data.y - data.vy,
              l = x * x + y * y;
          // l < r * r: 说明2者相交，达到碰撞条件
          if (l < r * r) {
            if (x === 0) x = jiggle(), l += x * x;
            if (y === 0) y = jiggle(), l += y * y;
            l = (r - (l = Math.sqrt(l))) / l * strength;
            node.vx += (x *= l) * (r = (rj *= rj) / (ri2 + rj));
            node.vy += (y *= l) * r;
            data.vx -= x * (r = 1 - r);
            data.vy -= y * r;
          }
        }
        return;
      }
      return x0 > xi + r || x1 < xi - r || y0 > yi + r || y1 < yi - r;
    }
  }

  function prepare(quad) {
    if (quad.data) return quad.r = radii[quad.data.index];
    for (var i = quad.r = 0; i < 4; ++i) {
      if (quad[i] && quad[i].r > quad.r) {
        quad.r = quad[i].r;
      }
    }
  }

  function initialize() {
    if (!nodes) return;
    var i, n = nodes.length, node;
    radii = new Array(n);
    // 为每个节点初始化半径
    for (i = 0; i < n; ++i) node = nodes[i], radii[node.index] = +radius(node, i, nodes);
  }

  /**
   * 初始化力模型
   * @param {Array} _ 节点数据
   */
  force.initialize = function(_) {
    nodes = _;
    initialize();
  };

  /**
   * 力模型赋值：迭代次数
   * @param {Number} _ 
   */
  force.iterations = function(_) {
    return arguments.length ? (iterations = +_, force) : iterations;
  };

  /**
   * 力模型赋值：碰撞强度
   * @param {Number} _
   */
  force.strength = function(_) {
    return arguments.length ? (strength = +_, force) : strength;
  };

  /**
   * 力模型赋值：碰撞半径
   */
  force.radius = function(_) {
    return arguments.length ? (radius = typeof _ === "function" ? _ : constant(+_), initialize(), force) : radius;
  };

  return force;
}
