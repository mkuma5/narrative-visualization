// js/scene-zero.js
loadData().then(({ countries, path, legendGroup }) => {
  // --- explicit scene state (parameters) ---
  const state = {
    scene: 0,
    baseFill: '#eeeeee',
    baseStroke: '#cccccc',
    baseStrokeWidth: 0.7,
    legendVisible: false,   // Scene 0 keeps legend hidden
    tooltipEnabled: false   // no tooltips in the intro
  };

  const svg = d3.select("#map");
  svg.selectAll("*").remove(); // clear just in case

  // 0‑A  neutral basemap (light grey, no values)
  svg.append("g")
     .selectAll("path")
     .data(countries)
     .enter().append("path")
       .attr("d", path)
       .attr("fill", state.baseFill)
       .attr("stroke", state.baseStroke)
       .attr("stroke-width", state.baseStrokeWidth);

  // 0‑B  ensure legend visibility follows state
  if (legendGroup) legendGroup.style("opacity", state.legendVisible ? 1 : 0);
});

