import prisma from "@/prisma/client";
import { type NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import puppeteer from "puppeteer";
import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
} from "docx";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format") || "excel";
    const search = searchParams.get("search") || "";
    const idsParam = searchParams.get("ids");

    // Parse the IDs from the query parameter
    const selectedIds = idsParam
      ? idsParam.split(",").map((id) => Number.parseInt(id, 10))
      : [];

    // Build the where clause based on whether we have selected IDs
    const whereClause = {
      ...(selectedIds.length > 0 ? { idLoaiXe: { in: selectedIds } } : {}),
      ...(search
        ? {
            OR: [
              { TenLoai: { contains: search } },
              { NhanHieu: { contains: search } },
            ],
          }
        : {}),
    };

    const vehicles = await prisma.loaiXe.findMany({
      where: whereClause,
      include: {
        _count: {
          select: {
            Xe: true,
          },
        },
      },
    });

    const exportData = vehicles.map((vehicle) => ({
      ID: vehicle.idLoaiXe,
      "Tên Loại": vehicle.TenLoai || "N/A",
      "Nhãn Hiệu": vehicle.NhanHieu || "N/A",
      "Hình Ảnh": vehicle.HinhAnh || "N/A",
    }));

    if (format === "pdf") {
      const browser = await puppeteer.launch({
        headless: true,
      });
      const page = await browser.newPage();

      const htmlContent = `
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              h1 { text-align: center; color: #333; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: center; }
              th { background-color: #f4f4f4; }
            </style>
          </head>
          <body>
            <h1>Danh sách loại xe</h1>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Tên Loại</th>
                  <th>Nhãn Hiệu</th>
                  <th>Hình Ảnh</th>
                </tr>
              </thead>
              <tbody>
                ${exportData
                  .map(
                    (vehicle) => `
                    <tr>
                      <td>${vehicle["ID"]}</td>
                      <td>${vehicle["Tên Loại"]}</td>
                      <td>${vehicle["Nhãn Hiệu"]}</td>
                      <td>${vehicle["Hình Ảnh"]}</td>
                    </tr>`
                  )
                  .join("")}
              </tbody>
            </table>
          </body>
        </html>
      `;

      await page.setContent(htmlContent);
      const pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: {
          top: "20mm",
          right: "20mm",
          bottom: "20mm",
          left: "20mm",
        },
      });

      await browser.close();

      return new NextResponse(pdfBuffer, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": 'attachment; filename="LoaiXe.pdf"',
        },
      });
    }

    if (format === "excel") {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("LoaiXe");

      const headers = Object.keys(exportData[0]);
      worksheet.addRow(headers);

      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE0E0E0" },
      };

      exportData.forEach((vehicle) => {
        worksheet.addRow(Object.values(vehicle));
      });

      worksheet.columns.forEach((column) => {
        column.width = 20;
        column.alignment = { vertical: "middle", horizontal: "left" };
      });

      const buffer = await workbook.xlsx.writeBuffer();

      return new NextResponse(buffer, {
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": 'attachment; filename="LoaiXe.xlsx"',
        },
      });
    }

    if (format === "doc") {
      const rows = [
        new TableRow({
          children: Object.keys(exportData[0]).map(
            (header) =>
              new TableCell({
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: header, bold: true })],
                  }),
                ],
              })
          ),
        }),
        ...exportData.map(
          (vehicle) =>
            new TableRow({
              children: Object.values(vehicle).map(
                (value) =>
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [new TextRun({ text: String(value) })],
                      }),
                    ],
                  })
              ),
            })
        ),
      ];

      const doc = new Document({
        sections: [
          {
            properties: {},
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Danh sách loại xe",
                    bold: true,
                    size: 32,
                  }),
                ],
                spacing: {
                  after: 200,
                },
              }),
              new Table({
                rows: rows,
              }),
            ],
          },
        ],
      });

      const buffer = await Packer.toBuffer(doc);

      return new NextResponse(buffer, {
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "Content-Disposition": 'attachment; filename="LoaiXe.docx"',
        },
      });
    }

    return NextResponse.json({ error: "Unsupported format" }, { status: 400 });
  } catch (error: any) {
    console.error("Export error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
