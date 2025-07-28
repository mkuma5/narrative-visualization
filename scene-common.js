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
  "czechia": "czechrepublic",
};
function key(str) {
  const k = clean(str);
  return alias[k] || k;
}

let _cache;
function loadData() {
  if (_cache) return _cache;

  _cache = Promise.all([
    d3.csv("data/labor_gap_long.csv", d3.autoType),
    d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json")
  ]).then(([rows, world]) => {
    const latestYear = d3.max(rows, d => d.Year);
    const latest     = rows.filter(d => d.Year === latestYear);
    const ratioByName = new Map(latest.map(d => [key(d["Country Name"]), d.Ratio]));

    const projection = d3.geoNaturalEarth1().fitSize([960, 500], { type: "Sphere" });
    const path = d3.geoPath().projection(projection);
    const color = d3.scaleSequential(d3.interpolateYlOrRd).domain([110, 40]);
    const countries = topojson.feature(world, world.objects.countries).features;

    const svg = d3.select("#map");
    const legendGroup = svg.append("g")
        .attr("class", "legend")
        .attr("transform", `translate(720,470)`)
        .style("opacity", 0);

    return { latest, latestYear, countries, path, color, ratioByName, legendGroup };
  });

  return _cache;
}

function buildLegend(g, color) {
  const legendWidth  = 200;
  const legendHeight = 10;

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
      .attr("transform", `translate(${width - legendWidth - 40},${height - 40})`);

  legendGroup.append("rect")
      .attr("width",  legendWidth)
      .attr("height", legendHeight)
      .style("fill", "url(#legend-grad)");

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
      .text("Participation gap (%)");
}
