import { useLayoutEffect, useRef } from "react";
import imgSrc from "../assets/jurassic-park-logo-640.png";
import invariant from "tiny-invariant";

const ROUGHNESS = 3;

class Particle {
  x: number;
  y: number;
  originX: number;
  originY: number;
  color: string;
  vx: number;
  vy: number;
  size: number;
  private ease: number;

  constructor(x: number, y: number, color: string) {
    this.x = Math.random() * 640;
    this.y = 0;
    // this.x = x;
    // this.y = y;
    this.originX = x;
    this.originY = y;
    this.color = color;
    this.size = ROUGHNESS;
    this.vx = Math.random() * 2 - 1;
    this.vy = Math.random() * 2 - 1;
    this.ease = 0.05;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.size, this.size);
  }

  update() {
    this.x += (this.originX - this.x) * this.ease;
    this.y += (this.originY - this.y) * this.ease;
  }
}

class Effect {
  width: number;
  height: number;
  particles: Array<Particle>;
  img: HTMLImageElement;

  private pixelStep: number;

  constructor(width: number, height: number, image: HTMLImageElement) {
    this.width = width;
    this.height = height;
    this.particles = [];
    this.img = image;
    this.pixelStep = ROUGHNESS;
  }

  init(ctx: CanvasRenderingContext2D) {
    // center image
    const x = this.width * 0.5 - this.img.width * 0.5;
    const y = this.height * 0.5 - this.img.height * 0.5;
    ctx.drawImage(this.img, x, y);
    const imageData = ctx.getImageData(0, 0, this.width, this.height);
    const pixels = imageData.data;
    for (let y = 0; y < this.height; y += this.pixelStep) {
      for (let x = 0; x < this.width; x += this.pixelStep) {
        const index = (y * this.width + x) * 4;
        const red = pixels[index];
        const green = pixels[index + 1];
        const blue = pixels[index + 2];
        const alpha = pixels[index + 3];
        if (alpha > 0) {
          const color = `rgb(${red}, ${green}, ${blue})`;
          const particle = new Particle(x, y, color);
          this.particles.push(particle);
        }
      }
    }
    // console.log({ pixels });
    // for (let i = 0; i < 100; i++) {
    //   const particle = new Particle(
    //     Math.random() * this.width,
    //     Math.random() * this.height
    //   );
    //   this.particles.push(particle);
    // }
  }

  draw(ctx: CanvasRenderingContext2D) {
    this.particles.forEach((particle) => particle.draw(ctx));
  }

  update() {
    this.particles.forEach((particle) => particle.update());
  }
}

async function loadImage(src: string): Promise<HTMLImageElement> {
  const img = new Image();
  img.src = src;
  return new Promise((resolve, reject) => {
    img.addEventListener("load", () => resolve(img));
    img.addEventListener("error", (error) => reject(error));
  });
}

async function onCanvasRender(el: HTMLCanvasElement, imageSource: string) {
  const ctx = el.getContext("2d");
  invariant(ctx);
  const img = await loadImage(imageSource);
  const effect = new Effect(el.width, el.height, img);
  effect.init(ctx);
  function animate() {
    invariant(ctx);
    effect.draw(ctx);
    effect.update();
    window.requestAnimationFrame(() => {
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      animate();
    });
  }
  animate();
}

export function Particles() {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const mountedRef = useRef(false);

  useLayoutEffect(() => {
    if (mountedRef.current) {
      return;
    }
    mountedRef.current = true;
    console.log("layouteffect");
    invariant(ref.current);
    onCanvasRender(ref.current, imgSrc);
  }, []);

  return (
    <>
      <canvas
        ref={ref}
        width="640"
        height="480"
        style={{ border: "1px solid" }}
      ></canvas>
    </>
  );
}
