const svg    = d3.select("#map");
const width  = +svg.attr("width");
const height = +svg.attr("height");

function clean(str = "") {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/gi, "")
    .toLowerCase();
}

const alias = {
  "unitedstates": "unitedstatesofamerica",
  "ivorycoast": "cotedivoire",
  "czechia": "czechrepublic"
};
function key(str) {
  const k = clean(str);
  return alias[k] || k;
}

Promise.all([
  d3.csv("data/labor_gap_long.csv", d3.autoType),
  d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json")
]).then(([rows, world]) => {
  const latestYear = d3.max(rows, d => d.Year);
  const latest     = rows.filter(d => d.Year === latestYear);

  const state = {
    scene: 3,
    year: latestYear,
    tooltipEnabled: true,
    legendVisible: true,
    noDataFill: "#ccc",
    countryStroke: "#fff",
    countryStrokeWidth: 0.5,
    colorDomain: [110, 40],
    tooltipOffsetY: -8,
    tooltipBgFill: "rgba(0,0,0,0.75)",
    tooltipBgStroke: "#fff",
    tooltipTextFill: "#fff",
    tooltipTextSize: 12,
    tooltipTextWeight: 600,
    legendWidth: 200,
    legendHeight: 10,
    legendMarginX: 40,
    legendMarginY: 40,
    legendTitle: "Participation gap (%)"
  };

  const ratioByName = new Map(
    latest.map(d => [key(d["Country Name"]), d.Ratio])
  );
  console.log(`Year ${state.year}: values for`, ratioByName.size, "countries");

  const projection = d3.geoNaturalEarth1()
                       .fitSize([width, height], { type: "Sphere" });
  const path = d3.geoPath().projection(projection);

  const color = d3.scaleSequential(d3.interpolateYlOrRd)
                  .domain(state.colorDomain);

  const countries = topojson.feature(world, world.objects.countries).features;

  let countryPaths = svg.append("g")
     .selectAll("path")
     .data(countries)
     .enter().append("path")
       .attr("d", path)
       .attr("fill", d => {
         const v = ratioByName.get(key(d.properties.name));
         return v == null ? state.noDataFill : color(v);
       })
       .attr("stroke", state.countryStroke)
       .attr("stroke-width", state.countryStrokeWidth);

  if (state.tooltipEnabled) {
    countryPaths
      .attr("tabindex", 0)
      .on("mouseenter", (event, d) => showTooltip(d))
      .on("mouseleave", hideTooltip)
      .on("focus",      (event, d) => showTooltip(d))
      .on("blur",       hideTooltip);
  }

  const tipG = svg.append("g")
    .attr("class", "svg-tooltip")
    .style("display", "none")
    .style("pointer-events", "none");

  const tipRect = tipG.append("rect")
    .attr("rx", 4).attr("ry", 4)
    .attr("fill", state.tooltipBgFill)
    .attr("stroke", state.tooltipBgStroke)
    .attr("stroke-width", 0.5);

  const tipText = tipG.append("text")
    .attr("fill", state.tooltipTextFill)
    .attr("font-size", state.tooltipTextSize)
    .attr("font-weight", state.tooltipTextWeight)
    .attr("text-anchor", "middle");

  function showTooltip(feature) {
    if (!state.tooltipEnabled) return;

    const name = feature.properties.name;
    const v = ratioByName.get(key(name));
    const lines = [name, v != null ? `${v.toFixed(1)} %` : "no data"];

    tipText.selectAll("tspan").remove();
    tipText.selectAll("tspan")
      .data(lines)
      .enter().append("tspan")
        .attr("x", 0)
        .attr("dy", (d, i) => i === 0 ? 0 : 14)
        .text(d => d);

    const b = tipText.node().getBBox();
    const padX = 8, padY = 6;
    tipRect
      .attr("x", b.x - padX)
      .attr("y", b.y - padY)
      .attr("width",  b.width  + padX * 2)
      .attr("height", b.height + padY * 2);

    const [cx, cy] = path.centroid(feature);
    tipG
      .attr("transform", `translate(${cx}, ${cy + state.tooltipOffsetY})`)
      .style("display", null)
      .raise();
  }

  function hideTooltip() {
    tipG.style("display", "none");
  }

  const legendWidth  = state.legendWidth;
  const legendHeight = state.legendHeight;

  const defs = svg.append("defs");
  const gradient = defs.append("linearGradient")
      .attr("id", "legend-grad");

  gradient.selectAll("stop")
    .data(d3.range(0, 1.01, 0.1))
    .enter().append("stop")
      .attr("offset", d => d)
      .attr("stop-color", d => color(40 + d*70));

  const legendGroup = svg.append("g")
      .attr("class", "legend")
      .attr("transform",
        `translate(${width - legendWidth - state.legendMarginX},
                    ${height - state.legendMarginY})`)
      .style("opacity", state.legendVisible ? 1 : 0);

  legendGroup.append("rect")
      .attr("width",  legendWidth)
      .attr("height", legendHeight)
      .style("fill", "url(#legend-grad)")
      .attr("stroke", "#999");

  const xLeg = d3.scaleLinear()
                 .domain([40, 110])
                 .range([0, legendWidth]);

  legendGroup.append("g")
      .attr("transform", `translate(0, ${legendHeight})`)
      .call(d3.axisBottom(xLeg)
              .ticks(5)
              .tickFormat(d => d + "%"))
      .select(".domain").remove();

  legendGroup.append("text")
      .attr("x", legendWidth / 2)
      .attr("y", -6)
      .attr("text-anchor", "middle")
      .attr("font-size", 12)
      .text(state.legendTitle);
});
