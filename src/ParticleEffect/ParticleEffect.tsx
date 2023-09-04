import { useLayoutEffect, useRef } from "react";
import invariant from "tiny-invariant";
import imgSrc from "../assets/jurassic-park-logo-640.png";

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
  private ease = 0.56;
  private radius = 80;
  private friction = 0.8;

  constructor(x: number, y: number, color: string) {
    this.x = Math.random() * 640;
    this.y = Math.random() * 480;
    // this.x = x;
    // this.y = y;
    this.originX = x;
    this.originY = y;
    this.color = color;
    this.size = ROUGHNESS;
    this.vx = 1; // Math.random() * 2 - 1;
    this.vy = 1; // Math.random() * 2 - 1;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.size, this.size);
  }

  update({ mouse }: { mouse: MouseData }) {
    const mouseDx = mouse.x - this.x;
    const mouseDy = mouse.y - this.y;
    const distance = Math.sqrt(mouseDx ** 2 + mouseDy ** 2);
    if (distance < this.radius) {
      // const force = -this.radius / distance;
      const force = distance - this.radius;
      const angle = Math.atan2(mouseDy, mouseDx);
      const moveX = force * Math.cos(angle);
      const moveY = force * Math.sin(angle);
      this.vx = moveX;
      this.vy = moveY;
    }
    this.vx *= this.friction;
    this.vy *= this.friction;
    this.x += this.vx + (this.originX - this.x) * this.ease;
    this.y += this.vy + (this.originY - this.y) * this.ease;
    // this.x += (this.originX - this.x) * this.ease;
    // this.y += (this.originY - this.y) * this.ease;
  }
}

interface MouseData {
  x: number;
  y: number;
}

class Effect {
  width: number;
  height: number;
  particles: Array<Particle>;
  img: HTMLImageElement;
  mouse: MouseData;

  private pixelStep: number;

  constructor(width: number, height: number, image: HTMLImageElement) {
    this.width = width;
    this.height = height;
    this.particles = [];
    this.img = image;
    this.pixelStep = ROUGHNESS;
    this.mouse = { x: 0, y: 0 };
    window.addEventListener("mousemove", (event) => {
      this.mouse.x = event.offsetX;
      this.mouse.y = event.offsetY;
    });
  }

  init(ctx: CanvasRenderingContext2D) {
    // center image
    const x = this.width * 0.5 - this.img.width * 0.5;
    const y = this.height * 0.5 - this.img.height * 0.5;
    ctx.drawImage(this.img, x, y);
    const imageData = ctx.getImageData(0, 0, this.width, this.height);
    console.log({ imageData });
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
    //     Math.random() * this.height,
    //     'black'
    //   );
    //   this.particles.push(particle);
    // }
  }

  draw(ctx: CanvasRenderingContext2D) {
    this.particles.forEach((particle) => particle.draw(ctx));
  }

  update() {
    this.particles.forEach((particle) =>
      particle.update({ mouse: this.mouse })
    );
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
