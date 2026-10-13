import { ImageResponse } from "next/og";
import { AppIconArt } from "./app-icon-art";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

const AppleIcon = () => new ImageResponse(<AppIconArt size={180} />, size);

export default AppleIcon;
