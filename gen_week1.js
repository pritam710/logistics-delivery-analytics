const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
        Table, TableRow, TableCell, WidthType, ShadingType, BorderStyle,
        LevelFormat, convertInchesToTwip } = require("docx");
const fs = require("fs");

const codeFont = "Consolas";

function heading(text, level) {
  return new Paragraph({ text, heading: level, spacing: { before: 240, after: 120 } });
}
function body(text, opts = {}) {
  return new Paragraph({ children: [new TextRun({ text, ...opts })], spacing: { after: 160 } });
}
function bullet(text) {
  return new Paragraph({ text, numbering: { reference: "bullets", level: 0 }, spacing: { after: 60 } });
}
function codeBlock(lines) {
  return new Paragraph({
    children: lines.map((l, i) => new TextRun({ text: l, font: codeFont, size: 18, break: i === 0 ? 0 : 1 })),
    shading: { type: ShadingType.CLEAR, fill: "F2F2F2" },
    spacing: { before: 120, after: 200 },
    border: { top: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC" },
              bottom: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC" },
              left: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC" },
              right: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC" } },
    indent: { left: 200, right: 200 },
  });
}
function kpiTable(rows) {
  return new Table({
    width: { size: 9500, type: WidthType.DXA },
    columnWidths: [3500, 6000],
    rows: rows.map(([a, b], i) => new TableRow({
      children: [
        new TableCell({ width: { size: 3500, type: WidthType.DXA },
          shading: i === 0 ? { type: ShadingType.CLEAR, fill: "2E5EAA" } : undefined,
          children: [new Paragraph({ children: [new TextRun({ text: a, bold: true, color: i === 0 ? "FFFFFF" : "000000" })] })] }),
        new TableCell({ width: { size: 6000, type: WidthType.DXA },
          shading: i === 0 ? { type: ShadingType.CLEAR, fill: "2E5EAA" } : undefined,
          children: [new Paragraph({ children: [new TextRun({ text: b, bold: i === 0, color: i === 0 ? "FFFFFF" : "000000" })] })] }),
      ],
    })),
  });
}

const doc = new Document({
  numbering: { config: [{ reference: "bullets", levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 480, hanging: 260 } } } }] }] },
  sections: [{
    properties: { page: { size: { width: 12240, height: 15840 } } },
    children: [
      new Paragraph({ text: "Week 1: Strategic Planning and Data Exploration in Logistics", heading: HeadingLevel.TITLE, spacing: { after: 80 } }),
      new Paragraph({ children: [new TextRun({ text: "Logistics Data Analyst Intern — YuvaIntern", italics: true, size: 22, color: "555555" })], spacing: { after: 60 } }),
      new Paragraph({ children: [new TextRun({ text: "Prepared by: Pritam Thavaru Rathod", size: 20 })], spacing: { after: 300 } }),

      heading("1. Introduction", HeadingLevel.HEADING_1),
      body("This report defines the strategic scope for a logistics data analytics project focused on last-mile delivery operations for an e-commerce logistics company operating in a mid-sized Indian city. The goal of the project is to use data science techniques in Python to understand what drives delivery delays and cost, and to build a foundation for predictive modeling and route/resource optimization in later phases of this internship."),

      heading("2. Logistics Scenario", HeadingLevel.HEADING_1),
      body("The company dispatches parcels from a single city hub using a mixed fleet of bikes, vans, and trucks. Each order has a distance to travel, a package weight, a traffic condition, weather condition, time-of-day slot, and is handled by drivers of varying experience. Delivery time and delivery cost currently vary widely between orders, and the operations team wants to know which factors matter most so they can improve on-time performance and reduce cost per shipment."),
      body("This scenario reflects real-world last-mile delivery challenges: unpredictable traffic and weather, heterogeneous fleet capability, and the trade-off between speed and cost when assigning vehicles to orders."),

      heading("3. Key Performance Indicators (KPIs)", HeadingLevel.HEADING_1),
      body("Three KPIs anchor the analysis:"),
      kpiTable([
        ["KPI", "Definition"],
        ["Average Delivery Time (min)", "Mean time from dispatch to delivery across all orders; the primary measure of service speed."],
        ["On-Time Delivery Rate (%)", "Share of orders delivered within a defined SLA threshold (e.g. 45 minutes for intra-city delivery)."],
        ["Cost per Shipment (₹)", "Average delivery cost per order, combining vehicle, distance, and weight-based cost components."],
      ]),
      body(""),
      body("These KPIs were chosen because they jointly capture the two things logistics operations must balance: speed/reliability for the customer and cost efficiency for the business."),

      heading("4. Literature and Data Research", HeadingLevel.HEADING_1),
      body("Public last-mile delivery research (e.g. urban delivery time-prediction studies and route-optimization literature) consistently identifies distance, traffic congestion, and weather as the dominant drivers of delivery time, with vehicle type and parcel weight as secondary factors. This aligns with the variables selected for this project's simulated dataset."),
      body("Relevant data science concepts to be applied:"),
      bullet("Regression — to model delivery time as a continuous function of distance, traffic, weather, and vehicle attributes (Week 4)."),
      bullet("Exploratory Data Analysis / correlation analysis — to identify which variables most strongly relate to delay and cost (Week 3)."),
      bullet("Data cleaning & preprocessing — to handle missing values, outliers, and inconsistent entries that are common in operational logistics data (Week 2)."),
      bullet("Optimization — using model insights (e.g. feature importance, cost drivers) to propose vehicle-assignment and routing rules that reduce average cost/time (Week 4)."),

      heading("5. Strategic Roadmap", HeadingLevel.HEADING_1),
      body("The end-to-end analysis proceeds in four phases, matching the internship's weekly structure:"),
      bullet("Phase 1 (this report) — Define scenario, KPIs, and analytical roadmap."),
      bullet("Phase 2 — Simulate a realistic raw dataset and build a cleaning/preprocessing pipeline (handle missing values, outliers, duplicates, inconsistent categories)."),
      bullet("Phase 3 — Conduct EDA: distributions, correlations, and visual comparisons across vehicle type, weather, and time of day."),
      bullet("Phase 4 — Train and evaluate predictive models for delivery time, then translate model insights into optimization recommendations."),

      heading("6. Code Illustration", HeadingLevel.HEADING_1),
      body("The dataset is generated with controlled, realistic relationships so that later analysis has genuine signal to recover. A simplified excerpt of the simulation logic:"),
      codeBlock([
        "# Core delivery-time signal (simplified)",
        "base = (5",
        "        + distance_km * 3.1",
        "        + traffic_index * 1.8",
        "        + package_weight_kg * 0.4",
        "        + shipment_volume * 2.0",
        "        - driver_experience_years * 0.35)",
        "",
        "weather_penalty = {'Clear': 0, 'Rain': 9, 'Fog': 6}[weather]",
        "vehicle_penalty = {'Bike': -3, 'Van': 0, 'Truck': 5}[vehicle_type]",
        "delivery_time_min = base + weather_penalty + vehicle_penalty + noise",
      ]),
      body("Full simulation code: code/01_simulate_raw_data.py (see project repository)."),

      heading("7. Conclusion & Expected Outcomes", HeadingLevel.HEADING_1),
      body("By the end of this project, the analysis is expected to show that distance and traffic are the strongest drivers of delivery time, with weather and vehicle type as secondary but operationally actionable factors. These findings should support concrete decisions: prioritizing bikes for short, low-weight urban orders; building weather-based time buffers into SLAs; and flagging high-traffic-index routes for schedule adjustment. Weeks 2–4 of this report series implement and validate this roadmap using Python."),
    ],
  }],
});

Packer.toBuffer(doc).then((buf) => fs.writeFileSync("/home/claude/logistics_project/Week1_Strategic_Planning_Report.docx", buf));
