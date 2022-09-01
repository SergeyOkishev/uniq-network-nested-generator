import axios from "axios";
import fs from "fs";
import { createCanvas, loadImage } from "canvas";
import FormData from "form-data";

export interface IpfsImage {
  cid: string;
  fullUrl: string;
}

export interface Config {
  depth: number;
  bgColors: { [key: number]: string };
  textColors: { [key: number]: string };
}

const nestedConfig = {
  depth: 5,
  bgColors: {
    0: "#FFFFFF",
    1: "#0558FE",
    2: "#05FE5C",
    3: "#EFFE05",
    4: "#800080",
    5: "#FE2E05",
  },
  textColors: {
    0: "#000000",
    1: "#3C6A69",
    2: "#3C506A",
    3: "#4B3C6A",
    4: "#6A3C68",
    5: "#6A3C3C",
  },
} as Config;

// TODO: env
const uploadUrl = "https://rest.dev.uniquenetwork.dev/ipfs/upload-file";

class ImageGenerator {
  // prefix - parent.name
  public async generateImage(
    depth: number,
    index: number,
    prefix: string
  ): Promise<IpfsImage> {
    const bgColor = nestedConfig.bgColors[depth];
    const textColor = nestedConfig.textColors[index];

    // set up scene
    const width = 240;
    const height = 100;
    const fontSize = 40;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = bgColor;
    ctx.beginPath();
    ctx.fillRect(0, 0, width, height);
    ctx.fill();
    ctx.font = `${fontSize}px Arial`;

    ctx.fillStyle = "#000000";
    ctx.fillText(prefix, fontSize / 2, height - fontSize);

    ctx.fillStyle = textColor;
    ctx.fillText(
      `-${index + 1}`,
      ctx.measureText(prefix).width + fontSize / 2,
      height - fontSize
    );

    const catImage = await loadImage("./cat.png");
    ctx.drawImage(catImage, width - 50, height - 50, 50, 50);

    const buffer = canvas.toBuffer();
    // fs.writeFileSync(`./nested-images/${depth}/${index}.png`, buffer);
    // return { cid: '', fullUrl: '' }
    return await this.uploadImage(buffer);
  }

  public async uploadImage(file: Buffer): Promise<IpfsImage> {
    const form = new FormData();
    form.append("file", file, "file");

    const response = await axios({
      method: "post",
      url: uploadUrl,
      data: form,
      headers: {
        "Content-Type": `multipart/form-data`,
      },
    });

    return response.data as IpfsImage;
  }
}

export default new ImageGenerator();
