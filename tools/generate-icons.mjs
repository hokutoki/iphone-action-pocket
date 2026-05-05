import { deflateSync } from "node:zlib";
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));

function rgba(hex) {
  const value = hex.replace("#", "");
  return [
    Number.parseInt(value.slice(0, 2), 16),
    Number.parseInt(value.slice(2, 4), 16),
    Number.parseInt(value.slice(4, 6), 16),
    255,
  ];
}

function blend(a, b, t) {
  return a.map((channel, index) => {
    if (index === 3) return 255;
    return Math.round(channel + (b[index] - channel) * t);
  });
}

function setPixel(data, size, x, y, color) {
  if (x < 0 || y < 0 || x >= size || y >= size) return;
  const offset = (y * size + x) * 4;
  data[offset] = color[0];
  data[offset + 1] = color[1];
  data[offset + 2] = color[2];
  data[offset + 3] = color[3];
}

function fillRoundedRect(data, size, x, y, width, height, radius, color) {
  for (let py = y; py < y + height; py += 1) {
    for (let px = x; px < x + width; px += 1) {
      const left = px < x + radius;
      const right = px >= x + width - radius;
      const top = py < y + radius;
      const bottom = py >= y + height - radius;
      let inside = true;

      if ((left || right) && (top || bottom)) {
        const cx = left ? x + radius : x + width - radius - 1;
        const cy = top ? y + radius : y + height - radius - 1;
        inside = (px - cx) ** 2 + (py - cy) ** 2 <= radius ** 2;
      }

      if (inside) setPixel(data, size, px, py, color);
    }
  }
}

function fillCircle(data, size, cx, cy, radius, color) {
  for (let py = cy - radius; py <= cy + radius; py += 1) {
    for (let px = cx - radius; px <= cx + radius; px += 1) {
      if ((px - cx) ** 2 + (py - cy) ** 2 <= radius ** 2) {
        setPixel(data, size, px, py, color);
      }
    }
  }
}

function fillLine(data, size, x1, y1, x2, y2, width, color) {
  const steps = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1));
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const x = Math.round(x1 + (x2 - x1) * t);
    const y = Math.round(y1 + (y2 - y1) * t);
    fillCircle(data, size, x, y, Math.round(width / 2), color);
  }
}

function crc32(buffer) {
  let crc = -1;
  for (const byte of buffer) {
    crc ^= byte;
    for (let k = 0; k < 8; k += 1) {
      crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
    }
  }
  return (crc ^ -1) >>> 0;
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type);
  const length = Buffer.alloc(4);
  const crc = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])));
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function createIcon(size) {
  const data = Buffer.alloc(size * size * 4);
  const green = rgba("#2f6f5e");
  const blue = rgba("#254b66");
  const paper = rgba("#fffdf8");
  const line = rgba("#d7ded9");
  const coral = rgba("#c75f50");
  const accentBlue = rgba("#346f92");

  for (let y = 0; y < size; y += 1) {
    const color = blend(green, blue, y / Math.max(1, size - 1));
    for (let x = 0; x < size; x += 1) {
      setPixel(data, size, x, y, color);
    }
  }

  const scale = size / 512;
  fillRoundedRect(data, size, Math.round(96 * scale), Math.round(96 * scale), Math.round(320 * scale), Math.round(320 * scale), Math.round(48 * scale), paper);
  fillLine(data, size, Math.round(150 * scale), Math.round(170 * scale), Math.round(360 * scale), Math.round(170 * scale), Math.round(22 * scale), line);
  fillLine(data, size, Math.round(150 * scale), Math.round(250 * scale), Math.round(294 * scale), Math.round(250 * scale), Math.round(22 * scale), coral);
  fillLine(data, size, Math.round(150 * scale), Math.round(330 * scale), Math.round(360 * scale), Math.round(330 * scale), Math.round(22 * scale), accentBlue);
  fillCircle(data, size, Math.round(370 * scale), Math.round(250 * scale), Math.round(38 * scale), green);
  fillLine(data, size, Math.round(350 * scale), Math.round(250 * scale), Math.round(365 * scale), Math.round(265 * scale), Math.round(12 * scale), paper);
  fillLine(data, size, Math.round(365 * scale), Math.round(265 * scale), Math.round(394 * scale), Math.round(232 * scale), Math.round(12 * scale), paper);

  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y += 1) {
    raw[y * (size * 4 + 1)] = 0;
    data.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

for (const size of [180, 192, 512]) {
  writeFileSync(join(root, "icons", `icon-${size}.png`), createIcon(size));
}
