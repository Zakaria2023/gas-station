import { ImageResponse } from "next/og";
import { AppIconArt } from "./app-icon-art";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

const Icon = () => new ImageResponse(<AppIconArt size={512} />, size);

export default Icon;
