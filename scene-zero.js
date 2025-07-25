// js/scene0.js
loadData().then(({ countries, path, legendGroup }) => {
  const svg = d3.select("#map");

  /* 0‑A  neutral basemap (light grey, no values) */
  svg.append("g")
     .selectAll("path")
     .data(countries)
     .enter().append("path")
       .attr("d", path)
       .attr("fill", "#eeeeee")
       .attr("stroke", "#cccccc")
       .attr("stroke-width", 0.7);

  /* 0‑B  ensure legend stays hidden in Scene 0 */
  legendGroup.style("opacity", 0);
});
