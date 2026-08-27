const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
        Table, TableRow, TableCell, WidthType, ShadingType, BorderStyle,
        LevelFormat } = require("docx");
const fs = require("fs");
const codeFont = "Consolas";

function heading(text, level) { return new Paragraph({ text, heading: level, spacing: { before: 240, after: 120 } }); }
function body(text, opts = {}) { return new Paragraph({ children: [new TextRun({ text, ...opts })], spacing: { after: 160 } }); }
function bullet(text) { return new Paragraph({ text, numbering: { reference: "bullets", level: 0 }, spacing: { after: 60 } }); }
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
      new Paragraph({ text: "Week 2: Data Collection, Cleaning, and Preprocessing for Logistics Analysis", heading: HeadingLevel.TITLE, spacing: { after: 80 } }),
      new Paragraph({ children: [new TextRun({ text: "Logistics Data Analyst Intern — YuvaIntern", italics: true, size: 22, color: "555555" })], spacing: { after: 60 } }),
      new Paragraph({ children: [new TextRun({ text: "Prepared by: Pritam Thavaru Rathod", size: 20 })], spacing: { after: 300 } }),

      heading("1. Data Collection Simulation", HeadingLevel.HEADING_1),
      body("Building on the Week 1 scenario, a synthetic dataset of 600 last-mile delivery orders was generated in Python to stand in for a publicly available operational logistics dataset (comparable in structure to city-courier / e-commerce delivery datasets such as those used in urban delivery-time-prediction research). Each row represents one delivery order with the fields below."),
      table([
        ["Field", "Description"],
        ["order_id", "Unique order identifier"],
        ["distance_km", "Distance from hub to delivery address"],
        ["package_weight_kg", "Parcel weight"],
        ["traffic_index", "1 (light) to 10 (heavy) congestion score"],
        ["weather", "Clear / Rain / Fog"],
        ["time_of_day", "Morning / Afternoon / Evening / Night"],
        ["driver_experience_years", "Years of driving experience"],
        ["vehicle_type", "Bike / Van / Truck"],
        ["shipment_volume", "Parcels carried in the same run"],
        ["delivery_time_min", "Target variable — total delivery time"],
        ["cost_inr", "Estimated delivery cost in ₹"],
      ], [2600, 6900]),
      body(""),
      body("To simulate the realities of operational data collection, deliberate data-quality issues were injected: missing values, invalid entries, sensor-glitch outliers, duplicate rows, and inconsistent text casing (see Section 2)."),

      heading("2. Data Cleaning", HeadingLevel.HEADING_1),
      body("Six categories of data-quality issues were identified and resolved:"),
      bullet("Duplicate rows — 5 exact duplicates removed with drop_duplicates()."),
      bullet("Inconsistent categorical casing — weather values like 'rain' vs 'Rain' normalized with .str.title()."),
      bullet("Invalid values — 5 negative distance_km entries (physically impossible) treated as missing and imputed."),
      bullet("Sensor-glitch outliers — 4 package_weight_kg readings above 50kg (unrealistic for bike/van parcels) treated as missing and imputed."),
      bullet("Missing values — package_weight_kg (28), driver_experience_years (18), distance_km (5), and cost_inr (12) imputed using the median within each vehicle_type group, which is more representative than a single global median since cost and weight scale with vehicle class."),
      bullet("Statistical outliers in delivery_time_min — 23 extreme-delay records identified via the IQR rule and capped at Q3 + 1.5×IQR (winsorized) rather than deleted, preserving sample size while limiting their leverage on later models."),

      heading("3. Methodological Explanation", HeadingLevel.HEADING_1),
      body("Median (rather than mean) imputation was used for numeric fields because several fields (distance, weight) are right-skewed, and the median is robust to that skew. Imputing within vehicle_type groups avoids blending, e.g., truck-scale weights with bike-scale weights. Outliers in the target variable were capped rather than dropped: deleting them would bias the model toward under-predicting genuinely rare but real long-delay events, while capping limits their distortion of the loss function during model training in Week 4."),

      heading("4. Code Documentation", HeadingLevel.HEADING_1),
      codeBlock([
        "# Group-wise median imputation",
        "num_cols = ['package_weight_kg', 'driver_experience_years',",
        "            'distance_km', 'cost_inr']",
        "for col in num_cols:",
        "    df[col] = df[col].fillna(",
        "        df.groupby('vehicle_type')[col].transform('median'))",
        "",
        "# IQR-based outlier capping on the target variable",
        "q1, q3 = df['delivery_time_min'].quantile([0.25, 0.75])",
        "iqr = q3 - q1",
        "upper = q3 + 1.5 * iqr",
        "df['delivery_time_min'] = df['delivery_time_min'].clip(upper=upper)",
      ]),
      body("Full pipeline: code/02_clean_data.py."),

      heading("5. Pipeline Results", HeadingLevel.HEADING_1),
      table([
        ["Metric", "Value"],
        ["Rows before cleaning", "606"],
        ["Duplicate rows removed", "5"],
        ["Invalid distance values fixed", "5"],
        ["Weight sensor glitches fixed", "4"],
        ["Delivery-time outliers capped", "23"],
        ["Rows after cleaning", "601"],
        ["Remaining nulls", "0"],
      ], [5500, 4000]),

      heading("6. Reflection", HeadingLevel.HEADING_1),
      body("Data quality directly determines analytical trustworthiness in logistics analytics. Uncleaned, the dataset contained impossible values (negative distances), implausible readings (500kg parcels), and duplicated orders — any of which would have inflated correlations, biased KPI averages (e.g. average delivery time skewed upward by uncapped outliers), or caused a predictive model to overfit to sensor noise rather than genuine delay drivers. The cleaned dataset (601 rows, zero nulls, normalized numeric ranges) is now suitable for the exploratory analysis in Week 3 and predictive modeling in Week 4."),
    ],
  }],
});

Packer.toBuffer(doc).then((buf) => fs.writeFileSync("/home/claude/logistics_project/Week2_Data_Cleaning_Report.docx", buf));
