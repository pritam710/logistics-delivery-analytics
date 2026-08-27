const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
        Table, TableRow, TableCell, WidthType, ShadingType, BorderStyle,
        LevelFormat, ImageRun } = require("docx");
const fs = require("fs");
const sizeOf = (p) => { const buf = fs.readFileSync(p); return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) }; };
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
  const targetWidthPx = 460;
  const scale = targetWidthPx / dims.width;
  return [
    new Paragraph({ alignment: AlignmentType.CENTER,
      children: [ new ImageRun({ type: "png", data: fs.readFileSync(`${CH}/${file}`),
        transformation: { width: targetWidthPx, height: Math.round(dims.height * scale) } }) ],
      spacing: { before: 120, after: 60 } }),
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
      new Paragraph({ text: "Week 4: Predictive Modeling and Optimization in Logistics Systems", heading: HeadingLevel.TITLE, spacing: { after: 80 } }),
      new Paragraph({ children: [new TextRun({ text: "Logistics Data Analyst Intern — YuvaIntern", italics: true, size: 22, color: "555555" })], spacing: { after: 60 } }),
      new Paragraph({ children: [new TextRun({ text: "Prepared by: Pritam Thavaru Rathod", size: 20 })], spacing: { after: 300 } }),

      heading("1. Problem Definition", HeadingLevel.HEADING_1),
      body("Building on Weeks 1-3, this task forecasts delivery_time_min (minutes) for each order using the cleaned 601-row dataset, so that the operations team can flag likely-late orders before dispatch and reassign vehicles/routes proactively. Features used: distance_km, package_weight_kg, traffic_index, driver_experience_years, shipment_volume, weather, time_of_day, and vehicle_type."),

      heading("2. Model Selection and Implementation", HeadingLevel.HEADING_1),
      body("Two models were compared:"),
      bullet("Linear Regression — a fast, interpretable baseline; suitable if relationships are close to additive/linear, which the Week 3 correlation analysis suggested."),
      bullet("Random Forest Regressor — captures non-linear interactions (e.g. traffic mattering more at long distances) that linear regression cannot."),
      body("Categorical features (weather, time_of_day, vehicle_type) were one-hot encoded inside a scikit-learn Pipeline so preprocessing and modeling are reproducible in one object. Data was split 80/20 train/test."),
      codeBlock([
        "pre = ColumnTransformer([",
        "    ('cat', OneHotEncoder(handle_unknown='ignore'), features_cat)",
        "], remainder='passthrough')",
        "",
        "lin_pipe = Pipeline([('pre', pre), ('model', LinearRegression())])",
        "rf_pipe  = Pipeline([('pre', pre), ('model', RandomForestRegressor(random_state=42))])",
        "",
        "grid = GridSearchCV(rf_pipe,",
        "    param_grid={'model__n_estimators': [100, 200],",
        "                'model__max_depth': [5, 8, None]},",
        "    cv=5, scoring='neg_root_mean_squared_error')",
      ]),

      heading("3. Evaluation and Validation", HeadingLevel.HEADING_1),
      body("Models were scored on the held-out test set using RMSE, MAE, and R². 5-fold cross-validation and GridSearchCV (over n_estimators and max_depth) were used to tune the Random Forest and check result stability."),
      table([
        ["Model", "RMSE (min)", "MAE (min)", "R\u00b2"],
        ["Linear Regression", "5.02", "3.44", "0.845"],
        ["Random Forest (tuned)", "6.38", "4.57", "0.750"],
      ], [3300, 2100, 2100, 2000]),
      body("Random Forest 5-fold CV RMSE: 7.15 \u00b1 1.15 minutes."),
      body("Linear Regression outperformed the tuned Random Forest on every metric. This is consistent with how the underlying delivery-time process was constructed — as a sum of independent linear effects (distance, traffic, weight, experience) plus fixed category penalties for weather and vehicle type — so a linear model recovers the true structure more efficiently than a tree ensemble, which needs more data to approximate smooth linear effects. Linear Regression is therefore the recommended model, with Random Forest retained as a non-linearity check."),
      ...chartImage("07_pred_vs_actual.png", "Figure 6. Random Forest predicted vs. actual delivery time — points cluster around the diagonal with some spread at higher delivery times."),
      ...chartImage("06_feature_importance.png", "Figure 7. Random Forest feature importances — distance and traffic dominate, consistent with the Week 3 correlation analysis."),

      heading("4. Optimization Strategies", HeadingLevel.HEADING_1),
      body("Using the model insights, three concrete optimization strategies are proposed:"),
      bullet("Traffic-aware dispatch windows: since traffic_index is a top driver, orders in high-traffic-index windows should be batched or delayed by 15-20 minutes where SLA allows, reducing average delay without adding fleet capacity."),
      bullet("Distance-based vehicle assignment: bikes show the lowest time penalty and lowest cost; routing short-distance, low-weight orders to bikes (rather than vans/trucks) can cut both average delivery time and cost per shipment."),
      bullet("Weather-adjusted SLAs and hub placement: rain/fog add a consistent time penalty independent of distance; building a dynamic SLA buffer for these conditions, combined with reviewing hub placement to shorten average distance_km (the strongest cost driver, r = 0.65), directly targets the two biggest levers identified in this analysis."),

      heading("5. Final Recommendations", HeadingLevel.HEADING_1),
      body("The Linear Regression model (RMSE \u2248 5.0 minutes, R\u00b2 \u2248 0.85) is recommended for production use as a delivery-time estimator shown to customers and used for proactive late-order flagging, given its accuracy and interpretability. Operationally, the three levers above — traffic-aware scheduling, distance-based vehicle assignment, and weather-adjusted SLAs — should be piloted first, since they act directly on the two variables (distance, traffic) shown across Weeks 3-4 to have the largest, most consistent effect on both delivery time and cost."),

      heading("6. Conclusion", HeadingLevel.HEADING_1),
      body("This four-week project moved from strategic scenario definition through data cleaning, exploratory analysis, and predictive modeling to arrive at specific, data-backed optimization recommendations for last-mile delivery operations. The consistent finding across every phase — that distance and traffic dominate both time and cost — gives the operations team a clear, low-ambiguity starting point for improving service levels."),
    ],
  }],
});

Packer.toBuffer(doc).then((buf) => fs.writeFileSync("/home/claude/logistics_project/Week4_Predictive_Modeling_Report.docx", buf));
