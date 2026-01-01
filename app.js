import express from "express";
import QRCode from "qrcode";
import PDFDocument from "pdfkit";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.render("index", {
    qrData: null,
    data: "",
    size: 260,
    fgColor: "#2F3E56",
    bgColor: "#FFFFFF"
  });
});

app.post("/generate", async (req, res) => {
  const { data, size, fgColor, bgColor } = req.body;
  if (!data) return res.redirect("/");

  const qrData = await QRCode.toDataURL(data, {
    width: Number(size),
    margin: 2,
    color: {
      dark: fgColor,
      light: bgColor
    }
  });

  res.render("index", {
    qrData,
    data,
    size,
    fgColor,
    bgColor
  });
});

app.get("/download-pdf", async (req, res) => {
  let { data, fgColor, bgColor } = req.query;
  if (!data) return res.status(400).send("Missing data");

  const valid = c => /^#[0-9A-Fa-f]{6}$/.test(c);
  fgColor = valid(fgColor) ? fgColor : "#2F3E56";
  bgColor = valid(bgColor) ? bgColor : "#FFFFFF";

  const png = await QRCode.toBuffer(data, {
    width: 300,
    margin: 2,
    color: { dark: fgColor, light: bgColor }
  });

  const doc = new PDFDocument({ size: "A4" });
  res.setHeader("Content-Disposition", "attachment; filename=qrcode.pdf");
  res.setHeader("Content-Type", "application/pdf");

  doc.pipe(res);
  doc.image(
    png,
    (doc.page.width - 300) / 2,
    (doc.page.height - 300) / 2,
    { width: 300 }
  );
  doc.end();
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
