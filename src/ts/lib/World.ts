import Markers from '@lib/Markers';
import Geometry from "@lib/Geometry";
import Mesh from "@lib/meshes/Mesh";
import Point from "@lib/primitives/Point";
import Light from '@lib/primitives/Light';
import Polygon from '@lib/primitives/Polygon';

export type NormalizedPolygon = [
  Polygon,
  number, // distance from camera
  number, // x1
  number, // y1
  number, // x2
  number, // y2
  number, // x3
  number, // y3
  number, // r
  number, // g
  number, // b
  number, // a
];

export class World extends Point {
  objects: Set<Mesh>;
  lights: Set<Light>;
  markers: Markers;

  constructor() {
    super(0, 0, 0);

    this.objects = new Set();
    this.lights = new Set();
    this.markers = new Markers();
  }

  add(object: Mesh | Light): World {
    if (object instanceof Light) {
      this.lights.add(object);
      if (object.size) this.objects.add(object);
    } else {
      this.objects.add(object);
    }
    return this;
  }

  delete(object: Mesh | Light): World {
    if (object instanceof Light) {
      this.lights.delete(object);
      if (object.size) this.objects.delete(object);
    } else {
      this.objects.delete(object);
    }
    return this;
  }
}

export class Camera extends Mesh {
  vFOV: number;
  hFOV: number;
  dist: number;
  world: World;
  markers?: Markers;

  constructor(world: World, opts: Record<string, number>) {
    super(opts);
    
    this.vFOV = opts.vFOV ?? 65;
    this.hFOV = opts.hFOV ?? 65;
    this.dist = opts.dist ?? 100;
    this.world = world;
    this.markers = opts.profile ? this.world.markers : undefined;
  }

  rotateFocused(point: Point, ax: number = 0, ay: number = 0, az: number = 0): Camera {
    if (ax || ay || az) {
      super.rotate(point, ax, ay, az);
      this.ax -= ax;
      this.ay -= ay;
      this.az -= az;
    }
    return this;
  }

  private _normalizePrepare(viewport: Viewport): number[] {
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

  normalizeCoords(viewport: Viewport, x: number, y: number, z: number): [number, number] | false {
    const [,, axSin, axCos, aySin, ayCos, azSin, azCos, hRatio, vRatio] = this._normalizePrepare(viewport),
          ds = Geometry.dist(x, y, z, this.x, this.y, this.z);

    // far clipping
    if (ds > this.dist) return false;

    // move
    x -= this.x;
    y -= this.y;
    z -= this.z;

    // rotate az
    if (this.ax) [x, z] = [x * axCos - z * axSin, x * axSin + z * axCos];
    if (this.ay) [y, z] = [y * ayCos - z * aySin, y * aySin + z * ayCos];

    // near clipping (kind of)
    if (z < 0) return false;

    // rotate az
    if (this.az) [x, y] = [x * azCos - y * azSin, x * azSin + y * azCos];

    // fov
    x *= hRatio / z;
    y *= vRatio / z;

    // scale
    x = x * viewport.scale + viewport.width / 2;
    y = viewport.height - (y * viewport.scale + viewport.height / 2);

    return [x, y];
  }

  normalizePolygons(viewport: Viewport): NormalizedPolygon[] {
    this.markers && this.markers.start('camera');

    const [halfWidth, halfHeight, axSin, axCos, aySin, ayCos, azSin, azCos, hRatio, vRatio] = this._normalizePrepare(viewport);

    this.markers && this.markers.log('camera', 'prepare');

    const normalized: NormalizedPolygon[] = [];
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

        normalized.push([polygon, ds, x1, y1, x2, y2, x3, y3, 0, 0, 0, 0]);
      }
    }

    this.markers && this.markers.log('camera', 'normalize');

    normalized.sort((a, b) => b[1] - a[1]);

    this.markers && this.markers.log('camera', 'sort');
    this.markers && this.markers.stop('camera');
    
    return normalized;
  }
}

export class Viewport {
  camera: Camera;
  canvas: HTMLCanvasElement;
  scale: number;
  FPSLimit: number;
  r: number;
  g: number;
  b: number;
  markers?: Markers;

  ctx!: CanvasRenderingContext2D;
  width!: number;
  height!: number;

  onbeforedraw?: (frameTime: number) => {};
  onafterdraw?: (frameTime: number) => {};

  private _continue = false;
  private _ts = 0;

  constructor(camera: Camera, opts: Record<string, any>) {
    this.camera = camera;
    this.canvas = opts.canvas;
    this.scale = opts.scale ?? 1;

    this.FPSLimit = opts.FPSLimit ?? Infinity;

    this.r = opts.r ?? 255;
    this.g = opts.g ?? 255;
    this.b = opts.b ?? 255;

    this.markers = opts.profile ? this.camera.world.markers : undefined;

    this.onbeforedraw = opts.onbeforedraw;
    this.onafterdraw = opts.onafterdraw;

    this.resize();
  }

  play(): Viewport {
    this._continue = true;
    this.render();
    return this;
  }

  pause(): Viewport {
    this._continue = false;
    return this;
  }

  toggle(): Viewport {
    this._continue = !this._continue;
    this.render();
    return this;
  }

  resize(): Viewport {
    const dpr = window.devicePixelRatio,
          rect = this.canvas.getBoundingClientRect();

    this.width = this.canvas.width = rect.width * dpr;
    this.height = this.canvas.height = rect.height * dpr;
    this.ctx = this.canvas.getContext('2d', { alpha: false })!;
    return this;
  }

  clear(): Viewport {
    this.ctx.fillStyle = `rgb(${this.r} ${this.g} ${this.b})`;
    this.ctx.fillRect(0, 0, this.width, this.height);
    return this;
  }

  mixColor(r1: number, g1: number, b1: number, r2: number, g2: number, b2: number, amount: number): [number, number, number] { 
    return [
      Math.round(r1 * (1 - amount) + r2 * amount),
      Math.round(g1 * (1 - amount) + g2 * amount),
      Math.round(b1 * (1 - amount) + b2 * amount),
    ];
  }

  lighting(normalizedPolygons: NormalizedPolygon[]): Viewport {
    for (const data of normalizedPolygons) {
      const [polygon, ds] = data;
      let r, g, b, a;

      if (polygon.object instanceof Light) {
        r = polygon.object.r;
        g = polygon.object.g;
        b = polygon.object.b;
        a = 1;
      } else {
        r = polygon.r ?? polygon.object.r,
        g = polygon.g ?? polygon.object.g,
        b = polygon.b ?? polygon.object.b;
        a = polygon.a ?? polygon.object.a;

        const m = polygon.m ?? polygon.object.m; // mixing with lighting ratio

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

            const angle = Geometry.angle(
              polygon.normA.x, polygon.normA.y, polygon.normA.z,
              polygon.normB.x, polygon.normB.y, polygon.normB.z,
              light.x, light.y, light.z
            );
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
    return this;
  }

  draw(normalizedPolygons: NormalizedPolygon[]): Viewport {
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
    return this;
  }

  render(): void {
    if (!this._continue) return;

    requestAnimationFrame((ts) => {
      const frameTime = ts - this._ts;
      this._ts = ts;

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