/** A receipt drawn onto a picture, so it can be shared or saved. Nothing leaves the phone. */
export type Receipt = {
  bank: string;
  heading: string;
  amount: string;
  status: string;
  rows: [label: string, value: string][];
};

function fit(ctx: CanvasRenderingContext2D, text: string, max: number) {
  if (ctx.measureText(text).width <= max) return text;
  let cut = text;
  while (cut.length > 1 && ctx.measureText(`${cut}…`).width > max) cut = cut.slice(0, -1);
  return `${cut}…`;
}

export async function makeReceiptImage(receipt: Receipt): Promise<Blob> {
  const scale = 2;
  const width = 360;
  const rowHeight = 34;
  const top = 230;
  const height = top + receipt.rows.length * rowHeight + 90;
  const canvas = document.createElement("canvas");
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No drawing surface");
  ctx.scale(scale, scale);

  const font = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "#e10600";
  ctx.fillRect(0, 0, width, 64);
  ctx.fillStyle = "#ffffff";
  ctx.font = `600 20px ${font}`;
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  ctx.fillText(receipt.bank, 24, 32);

  ctx.textAlign = "center";
  ctx.fillStyle = "#6b6b76";
  ctx.font = `400 14px ${font}`;
  ctx.fillText(receipt.heading, width / 2, 102);
  ctx.fillStyle = "#14141a";
  ctx.font = `600 40px ${font}`;
  ctx.fillText(receipt.amount, width / 2, 146);

  ctx.font = `500 13px ${font}`;
  const pillWidth = ctx.measureText(receipt.status).width + 28;
  ctx.fillStyle = "#e3f1e8";
  ctx.beginPath();
  ctx.roundRect((width - pillWidth) / 2, 172, pillWidth, 28, 14);
  ctx.fill();
  ctx.fillStyle = "#1d6b3a";
  ctx.fillText(receipt.status, width / 2, 186);

  ctx.strokeStyle = "#d9d9e0";
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(24, 216);
  ctx.lineTo(width - 24, 216);
  ctx.stroke();
  ctx.setLineDash([]);

  receipt.rows.forEach(([label, value], index) => {
    const y = top + index * rowHeight + 14;
    ctx.textAlign = "left";
    ctx.fillStyle = "#6b6b76";
    ctx.font = `400 13px ${font}`;
    ctx.fillText(label, 24, y);
    ctx.textAlign = "right";
    ctx.fillStyle = "#14141a";
    ctx.font = `500 13px ${font}`;
    ctx.fillText(fit(ctx, value, width - 48 - 90), width - 24, y);
  });

  ctx.textAlign = "center";
  ctx.fillStyle = "#9a9aa6";
  ctx.font = `400 11px ${font}`;
  ctx.fillText("Keep this for your records.", width / 2, height - 38);
  ctx.fillText(`Made by ${receipt.bank}`, width / 2, height - 20);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Could not make the picture"))), "image/png");
  });
}

/** Opens the phone's share sheet with the picture. Falls back to saving it. */
export async function shareReceipt(receipt: Receipt, fileName: string): Promise<"shared" | "saved"> {
  const blob = await makeReceiptImage(receipt);
  const file = new File([blob], `${fileName}.png`, { type: "image/png" });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: `${receipt.bank} receipt` });
      return "shared";
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return "shared";
    }
  }
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${fileName}.png`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  return "saved";
}
