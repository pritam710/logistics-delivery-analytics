const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
        Table, TableRow, TableCell, WidthType, ShadingType, BorderStyle,
        LevelFormat, ImageRun } = require("docx");
const fs = require("fs");
const sizeOf = (p) => { // minimal PNG dimension reader (no extra deps)
  const buf = fs.readFileSync(p);
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
};
const codeFont = "Consolas";
const CH = "/home/claude/logistics_project/charts";

function heading(text, level) { return new Paragraph({ text, heading: level, spacing: { before: 240, after: 120 } }); }
function body(text, opts = {}) { return new Paragraph({ children: [new TextRun({ text, ...opts })], spacing: { after: 160 } }); }
function bullet(text) { return new Paragraph({ text, numbering: { reference: "bullets", level: 0 }, spacing: { after: 60 } }); }
function caption(text) { return new Paragraph({ children: [new TextRun({ text, italics: true, size: 18, color: "555555" })], alignment: AlignmentType.CENTER, spacing: { after: 240 } }); }
function codeBlock(lines) {
  return new Paragraph({
    children: lines.map((l, i) => new TextRun({ text: l, font: codeFont, size: 18, break: i === 0 ? 0 : 1 })),
    shading: { type: ShadingType.CLEAR, fill: "F2F2F2" },
    spacing: { before: 120, after: 200 },
    border: { top: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC" }, bottom: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC" },
              left: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC" }, right: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC" } },
    indent: { left: 200, right: 200 },
  });
}
function chartImage(file, capText) {
  const dims = sizeOf(`${CH}/${file}`);
  const maxW = 5800; // twips-ish scale via px approximation below (we use px directly, docx uses EMU via px*9525)
  const targetWidthPx = 480;
  const scale = targetWidthPx / dims.width;
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [ new ImageRun({ type: "png", data: fs.readFileSync(`${CH}/${file}`),
        transformation: { width: targetWidthPx, height: Math.round(dims.height * scale) } }) ],
      spacing: { before: 120, after: 60 },
    }),
    caption(capText),
  ];
}
function table(rows, widths) {
  return new Table({
    width: { size: widths.reduce((a,b)=>a+b,0), type: WidthType.DXA },
    columnWidths: widths,
    rows: rows.map((r, i) => new TableRow({
      children: r.map((c, j) => new TableCell({
        width: { size: widths[j], type: WidthType.DXA },
        shading: i === 0 ? { type: ShadingType.CLEAR, fill: "2E5EAA" } : undefined,
        children: [new Paragraph({ children: [new TextRun({ text: String(c), bold: i === 0, color: i === 0 ? "FFFFFF" : "000000" })] })],
      })),
    })),
  });
}

const doc = new Document({
  numbering: { config: [{ reference: "bullets", levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 480, hanging: 260 } } } }] }] },
  sections: [{
    properties: { page: { size: { width: 12240, height: 15840 } } },
    children: [
      new Paragraph({ text: "Week 3: Advanced Data Analysis and Visualization in Logistics", heading: HeadingLevel.TITLE, spacing: { after: 80 } }),
      new Paragraph({ children: [new TextRun({ text: "Logistics Data Analyst Intern — YuvaIntern", italics: true, size: 22, color: "555555" })], spacing: { after: 60 } }),
      new Paragraph({ children: [new TextRun({ text: "Prepared by: Pritam Thavaru Rathod", size: 20 })], spacing: { after: 300 } }),

      heading("1. Exploratory Data Analysis Overview", HeadingLevel.HEADING_1),
      body("This report analyzes the 601-row cleaned delivery dataset from Week 2 to identify the operational factors most associated with delivery time and cost, using Python (pandas, matplotlib, seaborn)."),
      table([
        ["Statistic", "distance_km", "delivery_time_min", "traffic_index", "cost_inr"],
        ["Mean", "5.56", "38.49", "5.48", "57.64"],
        ["Std Dev", "3.56", "13.81", "2.84", "21.00"],
        ["Min", "0.04", "5.50", "1", "16.39"],
        ["Max", "20.13", "71.65", "10", "140.34"],
      ], [2400, 2400, 2400, 2000, 1700]),

      heading("2. Distribution of Delivery Time", HeadingLevel.HEADING_1),
      ...chartImage("01_delivery_time_dist.png", "Figure 1. Delivery time is right-skewed, clustering between 25-50 minutes with a long tail of slower deliveries."),
      body("A histogram was chosen because it directly shows the shape and spread of the target variable, which informs the outlier-capping decision made in Week 2 and the modeling approach in Week 4."),

      heading("3. Delivery Time vs Distance, by Weather", HeadingLevel.HEADING_1),
      ...chartImage("02_time_vs_distance.png", "Figure 2. Delivery time rises with distance; rain and fog visibly shift the trend upward."),
      body("A scatter plot with a categorical color encoding was used to inspect two continuous-vs-continuous relationships and a categorical effect simultaneously, revealing that weather adds a near-constant time penalty on top of the distance effect rather than changing the slope."),

      heading("4. Correlation Analysis", HeadingLevel.HEADING_1),
      ...chartImage("03_correlation_heatmap.png", "Figure 3. Correlation matrix of numeric logistics variables."),
      body("Distance_km (r = 0.72) and cost_inr (r = 0.62) show the strongest correlation with delivery_time_min, followed by traffic_index (r = 0.34). Driver experience and package weight show weak correlation, suggesting they play a minor role compared to route-level factors."),

      heading("5. Delivery Time by Vehicle Type and Time of Day", HeadingLevel.HEADING_1),
      ...chartImage("04_time_by_vehicle_tod.png", "Figure 4. Trucks show consistently higher average delivery time than bikes and vans across all time slots."),
      body("A grouped bar chart was used because it compares a continuous KPI (average delivery time) across two categorical dimensions at once, which is exactly the comparison operations teams need for fleet-scheduling decisions."),

      heading("6. Delivery Time Across Traffic Levels", HeadingLevel.HEADING_1),
      ...chartImage("05_traffic_boxplot.png", "Figure 5. Delivery time spread widens and shifts upward as traffic index increases."),
      body("A boxplot was used to show both the central tendency and the spread/outliers at each traffic level, which a simple bar chart of means would hide."),

      heading("7. Code Excerpt", HeadingLevel.HEADING_1),
      codeBlock([
        "sns.scatterplot(data=df, x='distance_km', y='delivery_time_min',",
        "                hue='weather', alpha=0.7)",
        "",
        "corr = df[num_cols].corr()",
        "sns.heatmap(corr, annot=True, fmt='.2f', cmap='coolwarm', center=0)",
      ]),
      body("Full script: code/03_eda_visualize.py."),

      heading("8. Analytical Insights", HeadingLevel.HEADING_1),
      bullet("Operational efficiency: distance and traffic index are the two largest, most controllable drivers of delivery time — route planning and traffic-aware dispatch timing offer the biggest efficiency gains."),
      bullet("Cost drivers: cost_inr correlates strongly with distance (r = 0.65) and moderately with delivery time (r = 0.62), confirming that longer/slower routes are also the most expensive — a strong argument for route-density-based hub placement."),
      bullet("Bottlenecks: trucks are the slowest vehicle class across every time-of-day slot, and rain/fog conditions add a consistent time penalty independent of distance — both are addressable via smarter vehicle assignment and weather-aware SLA buffers."),

      heading("9. Conclusion", HeadingLevel.HEADING_1),
      body("The EDA confirms the Week 1 hypothesis: distance and traffic dominate delivery time, with weather and vehicle type as secondary but actionable levers. These insights directly motivate the predictive model and optimization recommendations developed in Week 4."),
    ],
  }],
});

Packer.toBuffer(doc).then((buf) => fs.writeFileSync("/home/claude/logistics_project/Week3_EDA_Visualization_Report.docx", buf));
