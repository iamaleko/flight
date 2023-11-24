import { World, Camera, Viewport, Light, Plane, Terrain, Star, Tooltip } from './world.js';
import { Geometry } from "./geometry.js";
import Animate from './animate.js';

class Game {
  static isModeling = false; // debug mode
  static isStresstest = false; // debug mode
  static isProfile = false; // profile mode
  
  // world items

  static world;
  static viewport;
  static camera;
  static plane;
  static planeShadow;
  static terrainFar;
  static terrainNear;
  static stars = new Set();
  static lastAddedStar;
  static planeTrailPoints = [];

  // world constants

  static pathHeight = 100;
  static pathWidth = 10;
  static pathAltitude = 0.3;
  static pathMinX = this.pathWidth / -2;
  static pathMaxX = this.pathWidth / 2;

  // world items coords

  static cameraMenuCoords = { x: 0, y: this.isModeling ? 12 : this.pathHeight / 2, z: -10, ax: 180, ay: 180, az: 180 };
  static cameraGameCoords = { x: 0, y: 0, z: -2, ax: 180, ay: 250, az: 180 };
  static planeGameCoords = { x: 0, y: 12, z: 2.8, ax: 0, ay: 0, az: 0 };
  static planeShadowGameCoords = { x: 0, y: this.planeGameCoords.y - 2, z: 3.4 };
  static planeTooltipGameCoords = { x: 0, y: this.planeGameCoords.y - 1.5, z: this.planeGameCoords.z + 0.6, ax: 0, ay: -60, az: 0 };

  // plane constants

  static planeMenuSpeed = this.isStresstest ? 50 : this.isModeling ? 0 : 0.4;
  static planeMinSpeed = 5;
  static planeMaxSpeed = 50 + this.planeMinSpeed;
  static planeMinTrailSpeed = 20; // from what speed plane trail start be visible
  static planeSideAcceleration = 1;
  static planeSideFriction = 0.002;
  static planeTrailSize = 10;
  static planeTrailWidth = 4;
  static planeTrailOpacity = 0.3;
  static planeTrailAccentPoint = 4;

  // game constants

  static menuLevel = 0;
  static minLevel = 1;
  static maxLevel = 10;
  static starsDencity = 4;
  static starsMaxMissed = 3; // hardcoded in tooltip!

  // renderer constants

  static scale = 200;

  // game state

  static planeSpeed = this.planeMinSpeed; // distance per second
  static planeSideVelocity = 0;
  static starsMissed = 0;
  static starsCollected = 0;
  static flightDistance = 0;
  static flightStartTime = 0;
  static level = this.menuLevel;
  static isControlsAvailable = this.isModeling || this.isStresstest ? true : false;
  static isLeftArrowPressed = false;
  static isRightArrowPressed = false;

  // animation promises

  static levelAnimation;
  static cameraAnimation;

  /**
   * initialisation
   */

  static async init() {
    this.initWorldItems();
    this.initWorldLifecicle();
    this.initControls();
    this.setLevel(this.menuLevel, 0);

    if (this.isStresstest) {
      await this.showIntroAnimation(0);
      await this.setCameraMode(true, 0);
      setTimeout(() => {
        this.viewport.markers && this.viewport.markers.flush();
      }, 5000);
      return;
    }

    if (this.isModeling) {
      this.showIntroAnimation(0);
      this.viewport.pause();
      return;  
    }

    this.initLeaderboard();
    this.setMenuMode(true);
    this.showIntroAnimation();
  }

  static initWorldItems() {
    this.world = new World();

    // add camera

    this.camera = new Camera(this.world, {
      x: this.cameraMenuCoords.x,
      y: this.cameraMenuCoords.y,
      z: this.cameraMenuCoords.z,
      ax: this.cameraMenuCoords.ax,
      ay: this.cameraMenuCoords.ay,
      az: this.cameraMenuCoords.az,
      dist: this.pathHeight,
      profile: this.isProfile,
    });

    // add lights

    this.world.add(new Light({
      x: 0,
      y: -10,
      z: -5,
      r: 82,
      g: 27,
      b: 51,
      a: 1.8,
    }));

    // add terrain

    this.world.add(this.terrainFar = new Terrain({
      x: 0,
      y: this.pathHeight / 2 + this.pathHeight,
      z: 4,
      height: this.pathHeight,
      width: this.pathWidth,
      altitude: this.pathAltitude,
      r: 206,
      g: 54,
      b: 49,
    }));

    const altitudeMap = {};
    for (const x in this.terrainFar.altitudeMap) {
      altitudeMap[x] = {};
      altitudeMap[x][this.pathHeight] = this.terrainFar.altitudeMap[x][0];
      altitudeMap[x][0] = this.terrainFar.altitudeMap[x][this.pathHeight];
    }

    this.world.add(this.terrainNear = new Terrain({
      x: this.terrainFar.x,
      y: this.pathHeight / 2,
      z: this.terrainFar.z,
      height: this.pathHeight,
      width: this.pathWidth,
      altitude: this.pathAltitude,
      r: this.terrainFar.r,
      g: this.terrainFar.g,
      b: this.terrainFar.b,
      altitudeMap: altitudeMap,
    }));

    // add plane

    this.world.add(this.plane = new Plane({
      x: this.planeGameCoords.x,
      y: this.planeGameCoords.y,
      z: this.planeGameCoords.z,
      ax: this.planeGameCoords.ax,
      ay: this.planeGameCoords.ay,
      az: this.planeGameCoords.az,
      width: 1.8,
      height: 3, 
      r: 255,
      g: 255,
      b: 255,
    }));
    this.world.add(this.planeShadow = new Light({
      x: this.planeShadowGameCoords.x,
      y: this.planeShadowGameCoords.y,
      z: this.planeShadowGameCoords.z,
      r: 82,
      g: 27,
      b: 51,
      a: 0.5,
      d: 10,
    }));
    this.world.add(this.planeTooltip = new Tooltip({
      x: this.planeTooltipGameCoords.x,
      y: this.planeTooltipGameCoords.y,
      z: this.planeTooltipGameCoords.z,
      ax: this.planeTooltipGameCoords.ax,
      ay: this.planeTooltipGameCoords.ay,
      az: this.planeTooltipGameCoords.az,
      r: 0,
      g: 0,
      b: 0,
      sr: 255,
      sg: 176,
      sb: 0,
      a: 0.9,
      m: 0.6,
      height: 0.33,
    }));
  }

  static initWorldLifecicle() {
    this.viewport = new Viewport(this.camera, {
      canvas: window.canvas,
      scale: this.scale,
      profile: this.isProfile,
      r: 41,
      g: 12,
      b: 29,
      onbeforedraw: (frameTime) => {
        this.movePlane(frameTime);
        this.moveTerrain(frameTime);
        this.moveStars(frameTime);

        this.processStars();
        this.processScore(frameTime);
      },
      onafterdraw: (frameTime) => {
        this.processPlainTrails(frameTime);
      },
    });
    this.viewport.play();
  }

  static initControls() {
    document.addEventListener('keydown', (ev) => {
      if (!this.isControlsAvailable) return;

      switch (ev.code) {
        case 'ArrowRight':
          this.isRightArrowPressed = true;
          break;

        case 'ArrowLeft':
          this.isLeftArrowPressed = true;
          break;
      }
    });
    document.addEventListener('keyup', (ev) => {
      switch (ev.code) {
        case 'ArrowRight':
          this.isRightArrowPressed = false;
          break;

        case 'ArrowLeft':
          this.isLeftArrowPressed = false;
          break;
      }
    });
  }

  static initLeaderboard() {
    window.leaderboard.innerHTML = '';
    const fr = new DocumentFragment();
    const leaderboard = this.loadLeaderboard();
    leaderboard.sort((a, b) => b.flightDistance - a.flightDistance);
    for (const row of leaderboard) {
      const li = document.createElement('li');
      const date = new Date(row.date);
      li.textContent = `${String(date.getDate()).padStart(2, 0)}.${String(date.getMonth() + 1).padStart(2, 0)}.${String(date.getFullYear()).slice(2)}` +
        ` ${String(date.getHours()).padStart(2, 0)}:${String(date.getMinutes()).padStart(2, 0)}` +
        ` — ${Math.round(row.flightDistance)}m`;
      fr.appendChild(li);
    }
    window.leaderboard.appendChild(fr);
  }

  /**
   * menu and hud
   */

  static async setCameraMode(isGame, time = 3500) {
    if (this.cameraAnimation) {
      this.cameraAnimation.stop();
    }
    
    const from = isGame ? this.cameraMenuCoords : this.cameraGameCoords,
          to = isGame ? this.cameraGameCoords : this.cameraMenuCoords;
    
    this.cameraAnimation = new Animate((i) => {
      for (const coord in from) {
        this.camera[coord] = from[coord] + (to[coord] - from[coord]) * i;
      }
    }, time, Animate.easeOutCubic);
    
    return this.cameraAnimation.start();
  }

  static setMenuMode(isShown) {
    document.body.classList[isShown ? 'remove' : 'add']('nomenu');
    document.body.classList[isShown ? 'remove' : 'add']('nocursor');
    document.body.classList[!isShown ? 'remove' : 'add']('nohud');
  }

  static setGameoverMode(isGameOver) {
    document.body.classList[isGameOver ? 'add' : 'remove']('gameover');
  }

  static async showIntroAnimation(time = 1500) {
    await new Animate((i) => {
      window.canvas.style.opacity = i;
    }, time, Animate.easeOut).start();
  }

  /**
   * process and move items
   */

  static drawPlaneTrail(trail, step, planeTrailOpacity) {
    for (const n in this.planeTrailPoints) {
      const point = this.planeTrailPoints[n][trail];
      if (n) point.move(0, step, 0);
      const coords = this.camera.normalizeCoords(this.viewport, point.x, point.y, point.z);
      
      if (coords) {
        const [x, y] = coords,
              a = (n < this.planeTrailAccentPoint ? n / this.planeTrailSize : 1 - n / this.planeTrailSize) * planeTrailOpacity;
        if (n) {
          this.viewport.ctx.lineTo(x, y);
          this.viewport.ctx.strokeStyle = `rgba(236, 104, 93, ${a})`;
          this.viewport.ctx.lineWidth = this.planeTrailWidth;
          this.viewport.ctx.stroke();
          this.viewport.ctx.beginPath();
          this.viewport.ctx.moveTo(x, y);
        } else {
          this.viewport.ctx.beginPath();
          this.viewport.ctx.moveTo(x, y);
        }
      }
    }
  }

  static processPlainTrails(frameTime) {
    const FPS = 1000 / frameTime;
    const FPSDependantAcceleration = Math.log2(120 / FPS) + 1;
    const step = -this.planeSpeed * (frameTime / 1000) / FPSDependantAcceleration;

    if (this.planeSpeed >= this.planeMinTrailSpeed) {
      this.planeTrailPoints.unshift([
        this.plane.leftWingPoint.copy(),
        this.plane.rightWingPoint.copy(),
      ]);
      if (this.planeTrailPoints.length > this.planeTrailSize) this.planeTrailPoints.pop();

      const planeTrailStep = step * 10 / (this.planeSpeed / 10),
            planeTrailOpacity = this.planeTrailOpacity * ((this.planeSpeed - this.planeMinTrailSpeed) / (this.planeMaxSpeed - this.planeMinTrailSpeed));

      this.drawPlaneTrail(0, planeTrailStep, planeTrailOpacity);
      this.drawPlaneTrail(1, planeTrailStep, planeTrailOpacity);
    }
  }

  static processStars() {
    // detect collected and count missed
    for (const star of this.stars) {
      if (star.y < 0) {
        this.world.delete(star);
        this.stars.delete(star);
        if (!star.collected) {
          ++this.starsMissed;
        }
      } else if (!star.collected && Geometry.dist(this.plane.x, this.plane.y, 0, star.x, star.y, 0) < this.plane.height / 2) {
        star.collected = true;
        ++this.starsCollected;

        const from = star.z;
        new Animate((i) => {
          star.moveTo(star.x, star.y, from - 6 * i);
        }, 700 + 1000 * (1 - this.planeSpeed / this.planeMaxSpeed), Animate.easeOutCubic).start();
      }
    }

    // generate new ones
    const starY = this.pathHeight * 1.1;
    if (this.level !== this.menuLevel && (!this.lastAddedStar || this.lastAddedStar.y < starY - starY / this.starsDencity)) {
      this.lastAddedStar = new Star({
        x: this.pathMinX * 0.8 + Math.random() * this.pathWidth * 0.8,
        y: starY,
        z: this.planeGameCoords.z,
        ax: 0,
        ay: -90,
        az: 360 * Math.random(),
        r: 255,
        g: 176,
        b: 0,
        tails: 4,
        insize: 0.2,
        size: 0.4,
      });
      this.world.add(this.lastAddedStar);
      this.stars.add(this.lastAddedStar);
    }
  }

  static moveStars(frameTime) {
    const step = -this.planeSpeed * frameTime / 1000;

    for (const star of this.stars) {
      star.move(0, step, 0);
      star.rotate(star, 0, 0, 0.3);
    }
  }

  static moveTerrain(frameTime) {
    const step = -this.planeSpeed * frameTime / 1000;

    if (this.terrainNear.y + this.pathHeight / 2 < 0) {
      this.terrainNear.moveTo(this.terrainNear.x, this.terrainFar.y + this.pathHeight + step, this.terrainNear.z);
    } else {
      this.terrainNear.move(0, step, 0);
    }

    if (this.terrainFar.y + this.pathHeight / 2 < 0) {
      this.terrainFar.moveTo(this.terrainFar.x, this.terrainNear.y + this.pathHeight, this.terrainFar.z);
    } else {
      this.terrainFar.move(0, step, 0);
    }
  }

  static movePlane(frameTime) {
    const acceleration = this.planeSideAcceleration / (1000 / frameTime);

    if (this.isLeftArrowPressed) this.planeSideVelocity -= acceleration;
    if (this.isRightArrowPressed) this.planeSideVelocity += acceleration;

    if (this.planeSideVelocity) {
      const FPS = 1000 / frameTime;
      const FPSDependantAcceleration = Math.log2(120 / FPS) + 1; // i don't know how i got it, magic
      const FPSDependantFriction = Math.pow(this.planeSideFriction, 1 / FPS); // complex percents

      const planeX = Math.max(this.pathMinX, Math.min(this.pathMaxX, this.plane.x + this.planeSideVelocity * FPSDependantAcceleration));

      this.plane.moveTo(planeX, this.planeGameCoords.y, this.planeGameCoords.z);
      this.plane.rotateTo(this.planeSideVelocity * 100 + -planeX, this.planeGameCoords.ay, this.planeGameCoords.az);

      this.planeShadow.moveTo(planeX, this.planeShadowGameCoords.y, this.planeShadowGameCoords.z);

      this.planeTooltip.moveTo(planeX, this.planeTooltipGameCoords.y, this.planeTooltipGameCoords.z);

      this.planeSideVelocity = this.planeSideVelocity * FPSDependantFriction;
    }
  }

  static resetStars() {
    this.lastAddedStar = undefined;
    for (const star of this.stars) {
      this.world.delete(star);
      this.stars.delete(star);
    }
  }

  static resetPlane() {
    this.planeSideVelocity = 0;
    this.plane.moveTo(this.planeGameCoords.x, this.planeGameCoords.y, this.planeGameCoords.z);
    this.plane.rotateTo(this.planeGameCoords.ax, this.planeGameCoords.ay, this.planeGameCoords.az);
    this.planeShadow.moveTo(this.planeShadowGameCoords.x, this.planeShadowGameCoords.y, this.planeShadowGameCoords.z);
    this.planeTooltip.moveTo(this.planeTooltipGameCoords.x, this.planeTooltipGameCoords.y, this.planeTooltipGameCoords.z);
    this.planeTooltip.setStarsCount(this.starsMaxMissed);
  }

  /**
   * state
   */

  static start() {
    this.resetStars();
    this.resetPlane();
    this.flightDistance = 0;
    this.flightStartTime = Date.now();
    this.starsMissed = 0;
    this.starsCollected = 0;
    this.isControlsAvailable = true;
    this.setLevel(this.minLevel);
    this.setMenuMode(false);
    this.setCameraMode(true);
  }

  static finish() {
    this.isControlsAvailable = false;
    const place = this.saveLeaderboard();
    this.updateResults(place);
    this.setLevel(this.menuLevel);
    this.setGameoverMode(true);
    this.setCameraMode(false);
    this.setMenuMode(true);
    this.viewport.markers && this.viewport.markers.flush();
  }

  static loadLeaderboard() {
    const data = window.localStorage.getItem('leaderboard');
    return JSON.parse(data) || [];
  }

  static updateResults(place) {
    window.results.innerHTML = `
      ${place === 1 ? 'New record!' : (place > 10 ? 'Not even close!' : `Now the ${place} line is yours!`)}<br><br>
      Flight distance: ${Math.round(this.flightDistance)}m<br>
      Stars collected: ${this.starsCollected}<br>
      Level reached: ${this.level}<br>
      Maximum speed: ${Math.round(this.planeSpeed)}
    `;
  }

  static saveLeaderboard() {
    const leaderboard = this.loadLeaderboard();
    const newRow = {
      flightDistance: this.flightDistance,
      starsCollected: this.starsCollected,
      date: Date.now(),
    };

    leaderboard.push(newRow);
    leaderboard.sort((a, b) => b.flightDistance - a.flightDistance);

    let place = 1;
    for (const row of leaderboard) {
      if (row === newRow) break;
      ++place;
    }

    if (leaderboard.length > 10) leaderboard.pop();
    window.localStorage.setItem('leaderboard', JSON.stringify(leaderboard));
    this.initLeaderboard();

    return place;
  }

  static processScore(frameTime) {
    if (this.level == this.menuLevel) return;

    if (this.starsMissed >= this.starsMaxMissed) {
      this.finish();
      return;
    }

    this.planeTooltip.setStarsCount(this.starsMaxMissed - this.starsMissed);

    const levelUp = this.getLevelStars(this.level);
    window.speed.textContent = Math.round(this.planeSpeed);
    window.level.textContent = this.level;
    window.collected.innerHTML = this.starsCollected + ' / ' + (this.level === this.maxLevel ? '&infin;' : levelUp);

    if (this.level < this.maxLevel && this.starsCollected >= levelUp) {
      this.setLevel(this.level + 1);
    }

    // update hud score
    if (this.level !== this.menuLevel) {
      this.flightDistance += this.planeSpeed * frameTime / 1000;;
      window.score.textContent = Math.round(this.flightDistance);
    }
  }

  static getLevelSpeed(level) {
    if (level === this.menuLevel) return this.planeMenuSpeed;
    return this.planeMinSpeed + (this.planeMaxSpeed - this.planeMinSpeed) * (1 / this.maxLevel * level);
  }

  static getLevelStars(level) {
    return 10 * ((level * (level - 1)) / 2 + 1);
  }

  static async setLevel(level, time = 5000) {
    if (this.levelAnimation) {
      this.levelAnimation.stop();
    }
    
    this.level = level;
    
    const from = this.planeSpeed,
          to = this.getLevelSpeed(level);

    this.levelAnimation = new Animate((i) => {
      this.planeSpeed = from + (to - from) * i;
    }, time, Animate.easeInOut);

    return this.levelAnimation.start();
  }

}

Game.init();
window.Game = Game;
