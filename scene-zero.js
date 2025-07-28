loadData().then(({ countries, path, legendGroup }) => {
  const state = {
    scene: 0,
    baseFill: '#eeeeee',
    baseStroke: '#cccccc',
    baseStrokeWidth: 0.7,
    legendVisible: false,
    tooltipEnabled: false
  };

  const svg = d3.select("#map");
  svg.selectAll("*").remove();

  svg.append("g")
     .selectAll("path")
     .data(countries)
     .enter().append("path")
       .attr("d", path)
       .attr("fill", state.baseFill)
       .attr("stroke", state.baseStroke)
       .attr("stroke-width", state.baseStrokeWidth);

  if (legendGroup) legendGroup.style("opacity", state.legendVisible ? 1 : 0);
});
