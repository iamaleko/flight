import { Geometry } from "./geometry.js";
import Markers from './markers.js';

export class Point {
  constructor(x = 0, y = 0, z = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  copy() {
    return new Point(this.x, this.y, this.z);
  }

  move(x = 0, y = 0, z = 0) {
    this.x += x;
    this.y += y;
    this.z += z;
    return this;
  }

  moveTo(x, y, z) {
    return this.move(x - this.x, y - this.y, z - this.z);
  }
  
  rotate(point, ax = 0, ay = 0, az = 0) {
    if (ax) [this.x, this.z] = Geometry.rotate(this.x, this.z, point.x, point.z, ax);
    if (ay) [this.y, this.z] = Geometry.rotate(this.y, this.z, point.y, point.z, ay);
    if (az) [this.x, this.y] = Geometry.rotate(this.x, this.y, point.x, point.y, az);
    return this;
  }
}

export class World extends Point {
  constructor() {
    super(0, 0, 0);

    this.objects = new Set();
    this.lights = new Set();

    this.markers = new Markers();
  }

  add(object) {
    if (object instanceof Light) {
      this.lights.add(object);
      if (object.size) this.objects.add(object);
    } else {
      this.objects.add(object);
    }
    return this;
  }

  delete(object) {
    this.objects.delete(object);
    this.lights.delete(object);
    return this;
  }
}

export class Object extends Point {
  constructor(opts) {
    super(opts.x, opts.y, opts.z);
    
    this.ax = opts.ax ?? 0;
    this.ay = opts.ay ?? 0;
    this.az = opts.az ?? 0;
    this.r = opts.r ?? 80;
    this.g = opts.g ?? 80;
    this.b = opts.b ?? 80;
    this.a = opts.a;
    this.m = opts.m;

    this.polygons = [];
  }

  move(x = 0, y = 0, z = 0) {
    if (x || y || z) {
      for (const polygon of this.polygons) polygon.move(x, y, z);
      super.move(x, y, z);
    }
    return this;
  }

  rotate(point, ax = 0, ay = 0, az = 0) {
    if (ax || ay || az) {
      for (const polygon of this.polygons) polygon.rotate(point, ax, ay, az);
      this.ax += ax;
      this.ay += ay;
      this.az += az;
      super.rotate(point, ax, ay, az);
    }
    return this;
  }

  rotateTo(ax, ay, az) {
    return this.rotate(this, ax - this.ax, ay - this.ay, az - this.az);
  }
}

export class Polygon {
  constructor(pt1, pt2, pt3, object, opts = {}) {
    this.pt1 = pt1;
    this.pt2 = pt2;
    this.pt3 = pt3;
    
    this.r = opts.r;
    this.g = opts.g;
    this.b = opts.b;
    this.a = opts.a;
    this.m = opts.m;
    
    this.object = object;

    this.normA = new Point();
    this.normB = new Point();
  }

  updateNormals() {
    this.normA.x = (this.pt1.x + this.pt2.x + this.pt3.x) / 3;
    this.normA.y = (this.pt1.y + this.pt2.y + this.pt3.y) / 3;
    this.normA.z = (this.pt1.z + this.pt2.z + this.pt3.z) / 3;
    this.normB.x = (this.pt3.y - this.normA.y) * (this.pt2.z - this.normA.z) - (this.pt3.z - this.normA.z) * (this.pt2.y - this.normA.y) + this.normA.x;
    this.normB.y = (this.pt3.z - this.normA.z) * (this.pt2.x - this.normA.x) - (this.pt3.x - this.normA.x) * (this.pt2.z - this.normA.z) + this.normA.y;
    this.normB.z = (this.pt3.x - this.normA.x) * (this.pt2.y - this.normA.y) - (this.pt3.y - this.normA.y) * (this.pt2.x - this.normA.x) + this.normA.z;
  }

  move(x = 0, y = 0, z = 0) {
    if (x || y || z) {
      this.pt1.move(x, y, z);
      this.pt2.move(x, y, z);
      this.pt3.move(x, y, z);
    }
    return this;
  }

  rotate(point, ax = 0, ay = 0, az = 0) {
    if (ax || ay || az) {
      this.pt1.rotate(point, ax, ay, az);
      this.pt2.rotate(point, ax, ay, az);
      this.pt3.rotate(point, ax, ay, az);
    }
    return this;
  }
}

export class Camera extends Object {
  constructor(world, opts) {
    super(opts);
    
    this.vFOV = opts.vFOV ?? 65;
    this.hFOV = opts.hFOV ?? 65;
    this.dist = opts.dist ?? 100;
    this.world = world;
    this.markers = opts.profile ? this.world.markers : undefined;
  }

  rotateFocused(point, ax = 0, ay = 0, az = 0) {
    if (ax || ay || az) {
      super.rotate(point, ax, ay, az);
      this.ax -= ax;
      this.ay -= ay;
      this.az -= az;
    }
    return this;
  }

  #normalizePrepare(viewport) {
    const axRad = Geometry.deg2Rad(-this.ax),
          ayRad = Geometry.deg2Rad(-this.ay),
          azRad = Geometry.deg2Rad(-this.az),
          diag = Math.sqrt(viewport.width ** 2 + viewport.height ** 2),
          vRatio = diag / ( Geometry.rad2Deg(Math.atan(Geometry.deg2Rad(this.vFOV))) * 10 ),
          hRatio = diag / ( Geometry.rad2Deg(Math.atan(Geometry.deg2Rad(this.hFOV))) * 10 );

    return [
      viewport.width / viewport.scale / 2,
      viewport.height / viewport.scale / 2,
      Math.sin(axRad),
      Math.cos(axRad),
      Math.sin(ayRad),
      Math.cos(ayRad),
      Math.sin(azRad),
      Math.cos(azRad),
      hRatio,
      vRatio,
    ];
  }

  normalizeCoords(viewport, x, y, z) {
    const [halfWidth, halfHeight, axSin, axCos, aySin, ayCos, azSin, azCos, hRatio, vRatio] = this.#normalizePrepare(viewport);
    const ds = Geometry.dist(x, y, z, this.x, this.y, this.z);

    // far clipping
    if (ds > this.dist) return;

    // move
    x -= this.x;
    y -= this.y;
    z -= this.z;

    // rotate az
    if (this.ax) [x, z] = [x * axCos - z * axSin, x * axSin + z * axCos];
    if (this.ay) [y, z] = [y * ayCos - z * aySin, y * aySin + z * ayCos];

    // near clipping (kind of)
    if (z < 0) return;

    // rotate az
    if (this.az) [x, y] = [x * azCos - y * azSin, x * azSin + y * azCos];

    // fov
    x *= hRatio / z;
    y *= vRatio / z;

    // scale
    x = x * viewport.scale + viewport.width / 2;
    y = viewport.height - (y * viewport.scale + viewport.height / 2);

    return [x, y, y > halfHeight || x > halfWidth || y < -halfHeight || x < -halfWidth];
  }

  normalizePolygons(viewport) {
    this.markers && this.markers.start('camera');

    const [halfWidth, halfHeight, axSin, axCos, aySin, ayCos, azSin, azCos, hRatio, vRatio] = this.#normalizePrepare(viewport);

    this.markers && this.markers.log('camera', 'prepare');

    const normalized = [];
    for (const object of this.world.objects) {
      for (const polygon of object.polygons) {
        polygon.updateNormals();

        const ds = Geometry.dist(polygon.normA.x, polygon.normA.y, polygon.normA.z, this.x, this.y, this.z);

        // far clipping
        if (ds > this.dist) continue;

        this.markers && this.markers.log('camera', 'far clipping');

        // backface culling
        if(!Geometry.isCodirectional(
          polygon.normA.x, polygon.normA.y, polygon.normA.z,
          polygon.normB.x, polygon.normB.y, polygon.normB.z,
          polygon.normA.x, polygon.normA.y, polygon.normA.z,
          this.x, this.y, this.z,
        )) continue;

        this.markers && this.markers.log('camera', 'backface culling');
        
        // move
        let x1 = polygon.pt1.x - this.x,
            y1 = polygon.pt1.y - this.y,
            z1 = polygon.pt1.z - this.z,
            x2 = polygon.pt2.x - this.x,
            y2 = polygon.pt2.y - this.y,
            z2 = polygon.pt2.z - this.z,
            x3 = polygon.pt3.x - this.x,
            y3 = polygon.pt3.y - this.y,
            z3 = polygon.pt3.z - this.z;

        this.markers && this.markers.log('camera', 'move');

        // rotate az
        if (this.ax) {
          [x1, z1] = [x1 * axCos - z1 * axSin, x1 * axSin + z1 * axCos];
          [x2, z2] = [x2 * axCos - z2 * axSin, x2 * axSin + z2 * axCos];
          [x3, z3] = [x3 * axCos - z3 * axSin, x3 * axSin + z3 * axCos];
        }
        if (this.ay) {
          [y1, z1] = [y1 * ayCos - z1 * aySin, y1 * aySin + z1 * ayCos];
          [y2, z2] = [y2 * ayCos - z2 * aySin, y2 * aySin + z2 * ayCos];
          [y3, z3] = [y3 * ayCos - z3 * aySin, y3 * aySin + z3 * ayCos];
        }

        this.markers && this.markers.log('camera', 'rotate ax ay');

        // near clipping (kind of)
        if (z1 < 0 || z2 < 0 || z3 < 0) continue;

        this.markers && this.markers.log('camera', 'near clipping');

        // rotate az
        if (this.az) {
          [x1, y1] = [x1 * azCos - y1 * azSin, x1 * azSin + y1 * azCos];
          [x2, y2] = [x2 * azCos - y2 * azSin, x2 * azSin + y2 * azCos];
          [x3, y3] = [x3 * azCos - y3 * azSin, x3 * azSin + y3 * azCos];
        }

        this.markers && this.markers.log('camera', 'rotate az');

        // fov
        x1 *= hRatio / z1;
        y1 *= vRatio / z1;
        x2 *= hRatio / z2;
        y2 *= vRatio / z2;
        x3 *= hRatio / z3;
        y3 *= vRatio / z3;

        this.markers && this.markers.log('camera', 'fov');

        // frustum culling
        if (
          Math.min(y1,y2,y3) > halfHeight ||
          Math.min(x1,x2,x3) > halfWidth ||
          Math.max(y1,y2,y3) < -halfHeight ||
          Math.max(x1,x2,x3) < -halfWidth
        ) continue;

        this.markers && this.markers.log('camera', 'frustum culling');

        // scale
        x1 = x1 * viewport.scale + viewport.width / 2;
        y1 = viewport.height - (y1 * viewport.scale + viewport.height / 2);
        x2 = x2 * viewport.scale + viewport.width / 2;
        y2 = viewport.height - (y2 * viewport.scale + viewport.height / 2);
        x3 = x3 * viewport.scale + viewport.width / 2;
        y3 = viewport.height - (y3 * viewport.scale + viewport.height / 2);

        this.markers && this.markers.log('camera', 'scale');

        normalized.push([polygon, ds, x1, y1, x2, y2, x3, y3, 0, 0, 0, 0, ds]);
      }
    }

    this.markers && this.markers.log('camera', 'normalize');

    normalized.sort((a, b) => b[12] - a[12]);

    this.markers && this.markers.log('camera', 'sort');
    this.markers && this.markers.stop('camera');
    
    return normalized;
  }
}

export class Viewport {
  #continue = false;
  #ts = 0;

  constructor(camera, opts) {
    this.camera = camera;
    this.canvas = opts.canvas;
    this.scale = opts.scale ?? 1;

    this.FPSLimit = opts.FPSLimit ?? Infinity;

    this.r = opts.r ?? 255;
    this.g = opts.g ?? 255;
    this.b = opts.b ?? 255;

    this.onbeforedraw = opts.onbeforedraw;
    this.onafterdraw = opts.onafterdraw;

    this.markers = opts.profile ? this.camera.world.markers : undefined;
  }

  play() {
    this.#continue = true;
    this.render();
  }

  pause() {
    this.#continue = false;
  }

  toggle() {
    this.#continue = !this.#continue;
    this.render();
  }

  resize() {
    const dpr = window.devicePixelRatio;
    const rect = canvas.getBoundingClientRect();

    this.width = this.canvas.width = rect.width * dpr;
    this.height = this.canvas.height = rect.height * dpr;

    this.ctx = this.canvas.getContext('2d', { alpha: false });
  }

  clear() {
    this.ctx.fillStyle = `rgb(${this.r} ${this.g} ${this.b})`;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  mixColor(r1, g1, b1, r2, g2, b2, amount) { 
    return [
      Math.round(r1 * (1 - amount) + r2 * amount),
      Math.round(g1 * (1 - amount) + g2 * amount),
      Math.round(b1 * (1 - amount) + b2 * amount),
    ];
  }

  lighting(normalizedPolygons) {
    for (const data of normalizedPolygons) {
      const [polygon, ds] = data;

      let r, g, b, a;

      if (polygon.object instanceof Light) {
        r = polygon.object.r;
        g = polygon.object.g;
        b = polygon.object.b;
        a = 1;
      } else {
        r = polygon.r ?? polygon.object.r ?? 80,
        g = polygon.g ?? polygon.object.g ?? 80,
        b = polygon.b ?? polygon.object.b ?? 80;
        a = polygon.a ?? polygon.object.a ?? 1;

        const m = polygon.m ?? polygon.object.m ?? 1; // mixing with lighting ratio

        // apply light sources
        if (m > 0) {
          for (const light of this.camera.world.lights) {
            // light source is disabled
            if (light.a <= 0) continue;

            const dist = Geometry.dist(polygon.normA.x, polygon.normA.y, polygon.normA.z, light.x, light.y, light.z);

            // far clipping
            if (dist > light.d) continue;

            // backface culling
            if(!Geometry.isCodirectional(
              polygon.normA.x, polygon.normA.y, polygon.normA.z,
              polygon.normB.x, polygon.normB.y, polygon.normB.z,
              polygon.normA.x, polygon.normA.y, polygon.normA.z,
              light.x, light.y, light.z,
            )) continue;

            const angle = Geometry.angle(polygon.normA.x, polygon.normA.y, polygon.normA.z, polygon.normB.x, polygon.normB.y, polygon.normB.z, light.x, light.y, light.z);
            const luminosity = (1 - angle / 90) * (1 - dist / light.d) * light.a * m;

            if (luminosity) [r, g, b] = this.mixColor(r, g, b, light.r, light.g, light.b, luminosity);
          }
        }

        // distance fade
        [r, g, b] = this.mixColor(r, g, b, this.r, this.g, this.b, ds / this.camera.dist);
      }

      data[8] = r;
      data[9] = g;
      data[10] = b;
      data[11] = a;
    }
  }

  draw(normalizedPolygons) {
    this.clear();
    this.ctx.lineWidth = 1;
    for (let [,, x1, y1, x2, y2, x3, y3, r, g, b, a] of normalizedPolygons) {
      this.ctx.beginPath();
      this.ctx.moveTo(x1, y1);
      this.ctx.lineTo(x2, y2);
      this.ctx.lineTo(x3, y3);
      this.ctx.lineTo(x1, y1);
      this.ctx.closePath();
      this.ctx.strokeStyle = this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
      this.ctx.stroke();
      this.ctx.fill();
    }
  }

  zBuffer(normalizedPolygons) {
    
  }

  render() {
    if (!this.#continue) return;

    requestAnimationFrame((ts) => {
      const frameTime = ts - this.#ts;
      this.#ts = ts;

      this.markers && this.markers.start('viewport');
    
      if (this.onbeforedraw) this.onbeforedraw(frameTime);
      this.markers && this.markers.log('viewport', 'beforedraw');

      this.resize();
      this.markers && this.markers.log('viewport', 'resize');
      
      const normalizedPolygons = this.camera.normalizePolygons(this);
      this.markers && this.markers.log('viewport', 'normalize');

      this.lighting(normalizedPolygons);
      this.markers && this.markers.log('viewport', 'lighting');

      this.draw(normalizedPolygons);
      this.markers && this.markers.log('viewport', 'draw');

      if (this.onafterdraw) this.onafterdraw(frameTime);
      this.markers && this.markers.log('viewport', 'afterdraw');

      this.markers && this.markers.stop('viewport');

      setTimeout(() => this.render(), 1000 / this.FPSLimit);
    });
  }
}

export class Sphere extends Object {
  constructor(opts) {
    super(opts);

    this.quality = opts.quality;
    this.size = opts.size ?? 1;

    const x = this.x;
    const y = this.y - this.size / 2;
    const z = this.z;
    const hs = 360 / this.quality;
    const vs = 180 / this.quality;

    let vi = this.quality;
    while (vi) {
      let hi = this.quality;
      while (hi) {
        let pt1, pt2, pt3;
        if (vi > 0 && vi < this.quality) {
          const i = this.quality - vi - 1;

          pt1 = new Point(x, y, z).rotate(this, 0, vs * i, 0);
          pt1.rotate(new Point(x, pt1.y, z), hs * (hi + 1), 0, 0);
          pt2 = new Point(x, y, z).rotate(this, 0, vs * (i + 1), 0)
          pt2.rotate(new Point(x, pt2.y, z), hs * (hi + 1), 0, 0);
          pt3 = new Point(x, y, z).rotate(this, 0, vs * (i + 1), 0)
          pt3.rotate(new Point(x, pt3.y, z), hs * (hi + 2), 0, 0);
          this.polygons.push(new Polygon(pt1, pt3, pt2, this));

          pt1 = new Point(x, y, z).rotate(this, 0, vs * i, 0);
          pt1.rotate(new Point(x, pt1.y, z), hs * (hi + 1), 0, 0);
          pt2 = new Point(x, y, z).rotate(this, 0, vs * (i + 1), 0)
          pt2.rotate(new Point(x, pt2.y, z), hs * (hi + 2), 0, 0);
          pt3 = new Point(x, y, z).rotate(this, 0, vs * i, 0)
          pt3.rotate(new Point(x, pt3.y, z), hs * (hi + 2), 0, 0);
          this.polygons.push(new Polygon(pt1, pt3, pt2, this));
        }
        if (vi === 1) {
          pt1 = new Point(x, y + this.size, z);
          pt2 = pt1.copy().rotate(this, 0, vs, 0)
          pt2.rotate(new Point(x, pt2.y, z), hs * (hi + 1), 0, 0);
          pt3 = pt1.copy().rotate(this, 0, vs, 0)
          pt3.rotate(new Point(x, pt3.y, z), hs * (hi + 2), 0, 0);
          this.polygons.push(new Polygon(pt1, pt2, pt3, this));
        }
        hi--;
      }
      vi--;
    }

    this.rotate(this, this.ax, this.ay, this.az);
  }
}

export class Cube extends Object {
  constructor(opts) {
    super(opts);

    this.size = opts.size ?? 1;

    const hs = this.size / 2;

    // bottom
    this.polygons.push(new Polygon(
      new Point(this.x - hs, this.y - hs, this.z - hs),
      new Point(this.x + hs, this.y - hs, this.z - hs),
      new Point(this.x - hs, this.y + hs, this.z - hs),
      this)
    );
    this.polygons.push(new Polygon(
      new Point(this.x + hs, this.y + hs, this.z - hs),
      new Point(this.x - hs, this.y + hs, this.z - hs),
      new Point(this.x + hs, this.y - hs, this.z - hs),
      this)
    );

    // top
    this.polygons.push(new Polygon(
      new Point(this.x - hs, this.y - hs, this.z + hs),
      new Point(this.x - hs, this.y + hs, this.z + hs),
      new Point(this.x + hs, this.y - hs, this.z + hs),
      this
    ));
    this.polygons.push(new Polygon(
      new Point(this.x + hs, this.y + hs, this.z + hs),
      new Point(this.x + hs, this.y - hs, this.z + hs),
      new Point(this.x - hs, this.y + hs, this.z + hs),
      this
    ));

    // left
    this.polygons.push(new Polygon(
      new Point(this.x - hs, this.y - hs, this.z + hs),
      new Point(this.x + hs, this.y - hs, this.z - hs),
      new Point(this.x - hs, this.y - hs, this.z - hs),
      this
    ));
    this.polygons.push(new Polygon(
      new Point(this.x + hs, this.y - hs, this.z + hs),
      new Point(this.x + hs, this.y - hs, this.z - hs),
      new Point(this.x - hs, this.y - hs, this.z + hs),
      this
    ));

    // right
    this.polygons.push(new Polygon(
      new Point(this.x - hs, this.y + hs, this.z + hs),
      new Point(this.x - hs, this.y + hs, this.z - hs),
      new Point(this.x + hs, this.y + hs, this.z - hs),
      this
    ));
    this.polygons.push(new Polygon(
      new Point(this.x + hs, this.y + hs, this.z + hs),
      new Point(this.x - hs, this.y + hs, this.z + hs),
      new Point(this.x + hs, this.y + hs, this.z - hs),
      this
    ));

    // back
    this.polygons.push(new Polygon(
      new Point(this.x - hs, this.y + hs, this.z + hs),
      new Point(this.x - hs, this.y - hs, this.z - hs),
      new Point(this.x - hs, this.y + hs, this.z - hs),
      this
    ));
    this.polygons.push(new Polygon(
      new Point(this.x - hs, this.y + hs, this.z + hs),
      new Point(this.x - hs, this.y - hs, this.z + hs),
      new Point(this.x - hs, this.y - hs, this.z - hs),
      this
    ));

    // front
    this.polygons.push(new Polygon(
      new Point(this.x + hs, this.y + hs, this.z + hs),
      new Point(this.x + hs, this.y + hs, this.z - hs),
      new Point(this.x + hs, this.y - hs, this.z - hs),
      this
    ));
    this.polygons.push(new Polygon(
      new Point(this.x + hs, this.y + hs, this.z + hs),
      new Point(this.x + hs, this.y - hs, this.z - hs),
      new Point(this.x + hs, this.y - hs, this.z + hs),
      this
    ));

    this.rotate(this, this.ax, this.ay, this.az);
  }
}

export class Light extends Sphere {
  constructor(opts) {
    super(opts);

    this.quality = opts.quality ?? 0;
    this.size = opts.size ?? 0;

    this.r = opts.r ?? 255;
    this.g = opts.g ?? 255;
    this.b = opts.b ?? 255;
    this.a = opts.a ?? 0.5;
    this.d = opts.d ?? 100;
  }
}

export class Terrain extends Object {
  constructor(opts) {
    super(opts);

    this.size = opts.size ?? 1;
    this.width = opts.width ?? 1;
    this.height = opts.height ?? 1;
    this.altitude = opts.altitude ?? 0;

    this.altitudeMap = opts.altitudeMap ?? {};

    const xOffset = (this.width * this.size) / 2;
    const yOffset = (this.height * this.size) / 2;

    for (let w = 0; w < this.width; ++w) {
      for (let h = 0; h < this.height; ++h) {
        const x = w * this.size + this.x - xOffset,
              y = h * this.size + this.y - yOffset,
              nx = x + this.size,
              ny = y + this.size;

        this.polygons.push(new Polygon(
          new Point(x, y, this.#getAltitude(w, h)),
          new Point(nx, y, this.#getAltitude(w + 1, h)),
          new Point(x, ny, this.#getAltitude(w, h + 1)),
          this)
        );
        this.polygons.push(new Polygon(
          new Point(nx, y, this.#getAltitude(w + 1, h)),
          new Point(nx, ny, this.#getAltitude(w + 1, h + 1)),
          new Point(x, ny, this.#getAltitude(w, h + 1)),
          this)
        );
      }
    } 

    this.rotate(this, this.ax, this.ay, this.az);
  }

  #getAltitude(w, h) {
    if (!this.altitudeMap[w]) this.altitudeMap[w] = {};
    if (!this.altitudeMap[w][h]) this.altitudeMap[w][h] = this.z + Math.random() * this.altitude;
    return this.altitudeMap[w][h];
  }
}

export class Plane extends Object {
  constructor(opts) {
    super(opts);

    this.width = opts.width ?? 1;
    this.height = opts.height ?? 3;

    const inner = 0.15;
    const depth = 0.44;

    const y = this.y + this.height / 2;

    // right wing
    this.polygons.push(new Polygon(
      new Point(this.x, y, this.z),
      new Point(this.x + this.width / 2 * inner, y - this.height, this.z),
      this.rightWingPoint = new Point(this.x + this.width / 2, y - this.height, this.z),
      this)
    );

    // inner right
    this.polygons.push(new Polygon(
      new Point(this.x, y, this.z),
      new Point(this.x, y - this.height, this.z + this.width / 2 * depth),
      new Point(this.x + this.width / 2 * inner, y - this.height, this.z),
      this)
    );
    this.polygons.push(new Polygon(
      new Point(this.x, y, this.z),
      new Point(this.x + this.width / 2 * inner, y - this.height, this.z),
      new Point(this.x, y - this.height, this.z + this.width / 2 * depth),
      this)
    );

    // left wing
    this.polygons.push(new Polygon(
      new Point(this.x, y, this.z),
      this.leftWingPoint = new Point(this.x - this.width / 2, y - this.height, this.z),
      new Point(this.x - this.width / 2 * inner, y - this.height, this.z),
      this)
    );

    // inner left
    this.polygons.push(new Polygon(
      new Point(this.x, y, this.z),
      new Point(this.x - this.width / 2 * inner, y - this.height, this.z),
      new Point(this.x, y - this.height, this.z + this.width / 2 * depth),
      this)
    );
    this.polygons.push(new Polygon(
      new Point(this.x, y, this.z),
      new Point(this.x, y - this.height, this.z + this.width / 2 * depth),
      new Point(this.x - this.width / 2 * inner, y - this.height, this.z),
      this)
    );

    this.rotate(this, this.ax, this.ay, this.az);
  }
}

export class Star extends Object {
  constructor(opts) {
    super(opts);

    const size = opts.size ?? 1;
    const insize = opts.insize ?? size * 0.5;
    const depth = opts.depth ?? size * 0.3;
    const tails = opts.tails ?? 5;

    const center = new Point(this.x, this.y, this.z);
    const front = new Point(this.x, this.y, this.z - depth);
    const back = new Point(this.x, this.y, this.z + depth);

    const angle = Math.PI * 2 / tails,
          sideX = Math.sin(angle / 2) * insize,
          sideY = Math.sqrt(Math.pow(insize, 2) - Math.pow(sideX, 2));
    
    for (let i = 0; i < tails; ++i) {
      // front
      this.polygons.push(new Polygon(
        new Point(this.x, this.y + size, this.z).rotate(center, 0, 0, Geometry.rad2Deg(angle * i)),
        front.copy(),
        new Point(this.x + sideX, this.y + sideY, this.z).rotate(center, 0, 0, Geometry.rad2Deg(angle * i)),
        this)
      );
      this.polygons.push(new Polygon(
        new Point(this.x, this.y + size, this.z).rotate(center, 0, 0, Geometry.rad2Deg(angle * i)),
        new Point(this.x - sideX, this.y + sideY, this.z).rotate(center, 0, 0, Geometry.rad2Deg(angle * i)),
        front.copy(),
        this)
      );

      // back
      this.polygons.push(new Polygon(
        new Point(this.x, this.y + size, this.z).rotate(center, 0, 0, Geometry.rad2Deg(angle * i)),
        new Point(this.x + sideX, this.y + sideY, this.z).rotate(center, 0, 0, Geometry.rad2Deg(angle * i)),
        back.copy(),
        this)
      );
      this.polygons.push(new Polygon(
        new Point(this.x, this.y + size, this.z).rotate(center, 0, 0, Geometry.rad2Deg(angle * i)),
        back.copy(),
        new Point(this.x - sideX, this.y + sideY, this.z).rotate(center, 0, 0, Geometry.rad2Deg(angle * i)),
        this)
      );
    }

    this.rotate(this, this.ax, this.ay, this.az);
  }
}

export class Tooltip extends Object {
  constructor(opts) {
    super(opts);

    this.height = opts.height ?? 1;
    this.width = opts.height * 3;
    this.sr = opts.sr;
    this.sg = opts.sg;
    this.sb = opts.sb;
    this.count = 3;

    const starSize = this.height * 0.3 * 2;
    const starGap = (this.width - starSize * 3) / 4;

    const t = new Terrain({
      x: this.x,
      y: this.y - this.height / 2,
      z: this.z,
      width: 3,
      height: 1,
      size: this.height,
    })

    this.polygons = this.polygons.concat(t.polygons);

    this.polygons.push(new Polygon(
      new Point(this.x, this.y + this.height / 5, this.z),
      new Point(this.x - this.height / 5, this.y, this.z),
      new Point(this.x + this.height / 5, this.y, this.z),
      this)
    );

    this.sta = new Star({
      x: this.x - starGap - starSize,
      y: this.y - this.height / 2,
      z: this.z,
      tails: 4,
      insize: starSize / 4,
      size: starSize / 2,
      depth: starSize / 4,
    })
    this.stb = new Star({
      x: this.x,
      y: this.y - this.height / 2,
      z: this.z,
      tails: 4,
      insize: starSize / 4,
      size: starSize / 2,
      depth: starSize / 4,
    })
    this.stc = new Star({
      x: this.x + starGap + starSize,
      y: this.y - this.height / 2,
      z: this.z,
      tails: 4,
      insize: starSize / 4,
      size: starSize / 2,
      depth: starSize / 4,
    })
    const starPolygons = this.sta.polygons.concat(this.stb.polygons, this.stc.polygons);
    for (const pl of starPolygons) {
      pl.r = this.sr;
      pl.g = this.sg;
      pl.b = this.sb;
    }
    this.polygons = this.polygons.concat(starPolygons);
    for (const pl of this.polygons) {
      pl.parent = pl.object;
      pl.object = this;
    }

    this.rotate(this, this.ax, this.ay, this.az);
  }

  setStarsCount(count) {
    if (this.count === count) return;
    this.count = count;
    for (const pl of this.polygons) {
      if (pl.parent === this.sta) {
        pl.r = count > 0 ? this.sr : this.r;
        pl.g = count > 0 ? this.sg : this.g;
        pl.b = count > 0 ? this.sb : this.b;
      } else if (pl.parent === this.stb) {
        pl.r = count > 1 ? this.sr : this.r;
        pl.g = count > 1 ? this.sg : this.g;
        pl.b = count > 1 ? this.sb : this.b;
      } else if (pl.parent === this.stc) {
        pl.r = count > 2 ? this.sr : this.r;
        pl.g = count > 2 ? this.sg : this.g;
        pl.b = count > 2 ? this.sb : this.b;
      }
    }
  }
}