loadData().then(({ latest, countries, path, color, ratioByName, legendGroup }) => {
  const state = {
    scene: 2,
    year: latest.length ? latest[0].Year : undefined,
    mode: 'bottomN',
    n: 3,
    onlyWithGeometry: true,
    baseFill: '#eeeeee',
    baseStroke: '#cccccc',
    baseStrokeWidth: 0.5,
    legendVisible: true,
    showAnnotations: true,
    annotationOffsets: [ {dx: 35, dy: 30}, {dx: -40, dy: -30}, {dx: 0, dy: -45} ]
  };

  const svg = d3.select("#map");
  svg.selectAll("*").remove();

  const ranked = [...latest]
    .filter(d => Number.isFinite(d.Ratio))
    .sort((a, b) => d3.ascending(a.Ratio, b.Ratio));

  const hasGeom = row =>
    countries.some(f => key(f.properties.name) === key(row["Country Name"]));

  const bottomRows = state.onlyWithGeometry
    ? ranked.filter(hasGeom).slice(0, state.n)
    : ranked.slice(0, state.n);

  if (state.onlyWithGeometry) {
    const missing = ranked.slice(0, 10).filter(r => !hasGeom(r)).map(r => r["Country Name"]);
    if (missing.length) console.warn("No geometry for:", missing);
  }

  const bottomKeys = new Set(bottomRows.map(r => key(r["Country Name"])));

  svg.append("g")
    .selectAll("path")
    .data(countries)
    .enter().append("path")
      .attr("d", path)
      .attr("fill", state.baseFill)
      .attr("stroke", state.baseStroke)
      .attr("stroke-width", state.baseStrokeWidth);

  svg.append("g")
    .selectAll("path")
    .data(countries.filter(f => bottomKeys.has(key(f.properties.name))))
    .enter().append("path")
      .attr("d", path)
      .attr("fill", d => color(ratioByName.get(key(d.properties.name))))
      .attr("stroke", "#222")
      .attr("stroke-width", 1.2);

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

  legendGroup.style("opacity", state.legendVisible ? 1 : 0);
});
