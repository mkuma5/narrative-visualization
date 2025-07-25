/* js/scene-common.js — only one copy loaded by all scenes */
// ---------- helper to normalise names so "Côte d'Ivoire" == "Cote dIvoire"
function clean(str = "") {
  return str
    .normalize("NFD")                     // remove accents
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/gi, "")           // drop spaces & punctuation
    .toLowerCase();
}

// optional manual aliases for troublesome names
const alias = {
  "unitedstates": "unitedstatesofamerica",
  "ivorycoast": "cotedivoire",
  "czechia": "czechrepublic",             // etc. add if needed
};
function key(str) {                       // apply alias after cleaning
  const k = clean(str);
  return alias[k] || k;
}

let _cache;
function loadData() {
  if (_cache) return _cache;             // use cached promise on later pages

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

      /* build legend once (shared across scenes) */
      const svg = d3.select("#map");
      const legendGroup = svg.append("g")
          .attr("class", "legend")
          .attr("transform", `translate(720,470)`)
          .style("opacity", 0);          // scenes fade it in as needed
    //   buildLegend(legendGroup, color);

      return { latest, latestYear, countries, path, color, ratioByName, legendGroup };
    });

  return _cache;
}

function buildLegend(g, color) {
    const legendWidth  = 200;
const legendHeight = 10;

// 7 a. gradient definition
const defs = svg.append("defs");
const gradient = defs.append("linearGradient")
    .attr("id", "legend‑grad");

gradient.selectAll("stop")
  .data(d3.range(0, 1.01, 0.1))              // 0,0.1,…,1
  .enter().append("stop")
    .attr("offset", d => d)
    .attr("stop-color", d => color(40 + d*70));   // 40 → 110

// 7 b. container group (bottom‑right corner)
const legendGroup = svg.append("g")
    .attr("class", "legend")
    .attr("transform", `translate(${width - legendWidth - 40},
                                  ${height - 40})`);

// 7 c. coloured bar
legendGroup.append("rect")
    .attr("width",  legendWidth)
    .attr("height", legendHeight)
    .style("fill", "url(#legend‑grad)");

// 7 d. axis with tick labels
const xLeg = d3.scaleLinear()
               .domain([40, 110])            // same as colour scale
               .range([0, legendWidth]);

legendGroup.append("g")
    .attr("transform", `translate(0, ${legendHeight})`)
    .call(d3.axisBottom(xLeg)
            .ticks(5)
            .tickFormat(d => d + "%"))
    .select(".domain").remove();             // drop the axis line

// 7 e. title (optional)
legendGroup.append("text")
    .attr("x", legendWidth / 2)
    .attr("y", -6)
    .attr("text-anchor", "middle")
    .attr("font-size", 12)
    .text("Participation gap (%)");
}    
