loadData().then(({ latest, countries, path, color, ratioByName, legendGroup }) => {
  const state = {
    scene: 1,
    year: latest.length ? latest[0].Year : undefined,
    mode: 'topN',
    n: 3,
    baseFill: '#eeeeee',
    legendVisible: true,
    showAnnotations: true
  };

  const svg = d3.select("#map");
  svg.selectAll("*").remove();

  const topRows = [...latest]
      .sort((a, b) => d3.descending(a.Ratio, b.Ratio))
      .slice(0, state.n);

  const topKeys = new Set(topRows.map(r => key(r["Country Name"])));

  svg.append("g")
     .selectAll("path")
     .data(countries)
     .enter().append("path")
       .attr("d", path)
       .attr("fill", state.baseFill)
       .attr("stroke", "#cccccc")
       .attr("stroke-width", 0.5);

  svg.append("g")
     .selectAll("path")
     .data(countries.filter(f => topKeys.has(key(f.properties.name))))
     .enter().append("path")
       .attr("d", path)
       .attr("fill", d => color(ratioByName.get(key(d.properties.name))))
       .attr("stroke", "#222")
       .attr("stroke-width", 1.2);

  if (state.showAnnotations) {
    const offsets = [ {dx: 35, dy: -20}, {dx: -35, dy: -25}, {dx: 60, dy: 30} ];

    const annData = topRows.map((row, i) => {
      const feat = countries.find(f => key(f.properties.name) === key(row["Country Name"]));
      const [cx, cy] = path.centroid(feat);
      return {
        note: { title: row["Country Name"], label: `${row.Ratio.toFixed(1)} %` },
        x: cx, y: cy, dx: offsets[i].dx, dy: offsets[i].dy
      };
    });

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
