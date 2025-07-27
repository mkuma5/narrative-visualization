// // Scene 2: colour ONLY the three lowest-ratio countries; everything else grey.
// loadData().then(({ latest, countries, path, color, ratioByName, legendGroup }) => {
//   const svg = d3.select("#map");
//   svg.selectAll("*").remove();

// const ranked = latest
// .filter(d => Number.isFinite(d.Ratio))
// .sort((a, b) => d3.ascending(a.Ratio, b.Ratio));

//     // 2) keep only rows that have a matching country polygon in the TopoJSON
//     const hasGeom = row =>
//     countries.some(f => key(f.properties.name) === key(row["Country Name"]));

//     // 3) take the first three that have geometry
//     const bottom3Rows = ranked.filter(hasGeom).slice(0, 3);

//     // (optional) debug: see which low-ratio names were skipped
//     const missing = ranked.slice(0, 10).filter(r => !hasGeom(r)).map(r => r["Country Name"]);
//     if (missing.length) console.warn("No geometry for:", missing);

//     // 4) keys set used for the coloured layer
//     const bottom3Keys = new Set(bottom3Rows.map(r => key(r["Country Name"])));

//   // 2) BASE LAYER: everyone in Scene 0 grey
//   svg.append("g")
//     .selectAll("path")
//     .data(countries)
//     .enter().append("path")
//       .attr("d", path)
//       .attr("fill", "#eeeeee")
//       .attr("stroke", "#cccccc")
//       .attr("stroke-width", 0.5);

//   // 3) TOP LAYER: colour & outline the bottom-3
//   svg.append("g")
//     .selectAll("path")
//     .data(countries.filter(f => bottom3Keys.has(key(f.properties.name))))
//     .enter().append("path")
//       .attr("d", path)
//       .attr("fill", d => color(ratioByName.get(key(d.properties.name))))
//       .attr("stroke", "#222")
//       .attr("stroke-width", 1.2);

//   // 4) Annotations for the three lowest
//   const offsets = [ {dx: 35, dy: 30}, {dx: -40, dy: -30}, {dx: 0, dy: -45} ];
//   const annData = bottom3Rows.map((row, i) => {
//     const feat = countries.find(f => key(f.properties.name) === key(row["Country Name"]));
//     if (!feat) return null;
//     const [cx, cy] = path.centroid(feat);
//     return {
//       note: { title: row["Country Name"], label: `${row.Ratio.toFixed(1)}%` },
//       x: cx, y: cy, dx: offsets[i].dx, dy: offsets[i].dy
//     };
//   }).filter(Boolean);

//   svg.append("g")
//      .call(
//        d3.annotation()
//          .type(d3.annotationLabel)
//          .annotations(annData)
//      )
//      .selectAll("text")
//        .attr("font-size", d => d.type === "title" ? 14 : 12)
//        .attr("font-weight", d => d.type === "title" ? 600 : 400)
//        .attr("fill", "#222");

//   // 5) show legend
//   legendGroup.style("opacity", 1);
// });

// Scene 2: colour ONLY the three lowest-ratio countries; everything else grey.
loadData().then(({ latest, countries, path, color, ratioByName, legendGroup }) => {

  // --- explicit scene state (parameters) ---
  const state = {
    scene: 2,
    year: latest.length ? latest[0].Year : undefined,
    mode: 'bottomN',
    n: 3,                      // how many to highlight
    onlyWithGeometry: true,    // ensure a matching polygon exists
    baseFill: '#eeeeee',
    baseStroke: '#cccccc',
    baseStrokeWidth: 0.5,
    legendVisible: true,
    showAnnotations: true,
    annotationOffsets: [ {dx: 35, dy: 30}, {dx: -40, dy: -30}, {dx: 0, dy: -45} ]
  };

  const svg = d3.select("#map");
  svg.selectAll("*").remove();

  // 1) rank by ascending ratio (lowest first), keep only numeric values
  const ranked = [...latest]
    .filter(d => Number.isFinite(d.Ratio))
    .sort((a, b) => d3.ascending(a.Ratio, b.Ratio));

  // 2) keep only rows that have a matching country polygon in the TopoJSON (if enabled)
  const hasGeom = row =>
    countries.some(f => key(f.properties.name) === key(row["Country Name"]));

  const bottomRows = state.onlyWithGeometry
    ? ranked.filter(hasGeom).slice(0, state.n)
    : ranked.slice(0, state.n);

  // (optional) debug: see which low-ratio names were skipped
  if (state.onlyWithGeometry) {
    const missing = ranked.slice(0, 10).filter(r => !hasGeom(r)).map(r => r["Country Name"]);
    if (missing.length) console.warn("No geometry for:", missing);
  }

  // 3) keys set used for the coloured layer
  const bottomKeys = new Set(bottomRows.map(r => key(r["Country Name"])));

  // BASE LAYER: everyone in Scene 0 grey
  svg.append("g")
    .selectAll("path")
    .data(countries)
    .enter().append("path")
      .attr("d", path)
      .attr("fill", state.baseFill)
      .attr("stroke", state.baseStroke)
      .attr("stroke-width", state.baseStrokeWidth);

  // TOP LAYER: colour & outline the bottom-N
  svg.append("g")
    .selectAll("path")
    .data(countries.filter(f => bottomKeys.has(key(f.properties.name))))
    .enter().append("path")
      .attr("d", path)
      .attr("fill", d => color(ratioByName.get(key(d.properties.name))))
      .attr("stroke", "#222")
      .attr("stroke-width", 1.2);

  // Annotations for the bottom-N (honours state.showAnnotations)
  if (state.showAnnotations) {
    const annData = bottomRows.map((row, i) => {
      const feat = countries.find(f => key(f.properties.name) === key(row["Country Name"]));
      if (!feat) return null;
      const [cx, cy] = path.centroid(feat);
      const { dx, dy } = state.annotationOffsets[i] || { dx: 35, dy: 30 };
      return {
        note: { title: row["Country Name"], label: `${row.Ratio.toFixed(1)}%` },
        x: cx, y: cy, dx, dy
      };
    }).filter(Boolean);

    svg.append("g")
      .call(
        d3.annotation()
          .type(d3.annotationLabel)
          .annotations(annData)
      )
      .selectAll("text")
        .attr("font-size", d => d.type === "title" ? 14 : 12)
        .attr("font-weight", d => d.type === "title" ? 600 : 400)
        .attr("fill", "#222");
  }

  // legend visibility per state
  legendGroup.style("opacity", state.legendVisible ? 1 : 0);
});

