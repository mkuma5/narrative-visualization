loadData().then(({ latest, countries, path, color, ratioByName, legendGroup }) => {

  // --- explicit scene state (parameters) ---
  const state = {
    scene: 1,                 // which step of the story
    year: latest.length ? latest[0].Year : undefined,
    mode: 'topN',             // highlighting strategy
    n: 3,                     // how many to highlight
    baseFill: '#eeeeee',      // baseline country fill
    legendVisible: true,      // show/hide legend in this scene
    showAnnotations: true     // toggle callout labels
  };

  const svg = d3.select("#map");
  svg.selectAll("*").remove();   // clear previous scene

  /* --- 1. identify the top‑N rows & keys --- */
  const topRows = [...latest]
      .sort((a, b) => d3.descending(a.Ratio, b.Ratio))
      .slice(0, state.n);

  const topKeys = new Set(topRows.map(r => key(r["Country Name"])));

  /* --- 2. BASE LAYER: draw every country in grey --- */
  svg.append("g")
     .selectAll("path")
     .data(countries)
     .enter().append("path")
       .attr("d", path)
       .attr("fill", state.baseFill)
       .attr("stroke", "#cccccc")
       .attr("stroke-width", 0.5);

  /* --- 3. TOP LAYER: colour & outline the winners --- */
  svg.append("g")
     .selectAll("path")
     .data(countries.filter(f => topKeys.has(key(f.properties.name))))
     .enter().append("path")
       .attr("d", path)
       .attr("fill", d => color(ratioByName.get(key(d.properties.name))))
       .attr("stroke", "#222")
       .attr("stroke-width", 1.2);

  /* --- 4. annotations (honours state.showAnnotations) --- */
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

  /* --- 5. reveal/hide the legend per state --- */
  legendGroup.style("opacity", state.legendVisible ? 1 : 0);
});
