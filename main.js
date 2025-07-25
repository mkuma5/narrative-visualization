const svg    = d3.select("#map");
const width  = +svg.attr("width");
const height = +svg.attr("height");

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

Promise.all([
  d3.csv("data/labor_gap_long.csv", d3.autoType),
  d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json")
]).then(([rows, world]) => {

  /* ---------- 1. filter to the most recent year ---------- */
  const latestYear = d3.max(rows, d => d.Year);
  const latest     = rows.filter(d => d.Year === latestYear);

  const ratioByName = new Map(
    latest.map(d => [key(d["Country Name"]), d.Ratio])
  );
  console.log(`Year ${latestYear}: values for`, ratioByName.size, "countries");

  /* ---------- 2. projection & path ---------- */
  const projection = d3.geoNaturalEarth1()
                       .fitSize([width, height], { type: "Sphere" });
  const path = d3.geoPath().projection(projection);

  /* ---------- 3. colour scale ---------- */
 const color = d3.scaleSequential(d3.interpolateYlOrRd)
                .domain([110, 40]);

  /* ---------- 4. draw countries ---------- */
  const countries = topojson.feature(world, world.objects.countries).features;

  svg.append("g")
     .selectAll("path")
     .data(countries)
     .enter().append("path")
       .attr("d", path)
       .attr("fill", d => {
         const v = ratioByName.get(key(d.properties.name));
         return v == null ? "#ccc" : color(v);
       })
       .attr("stroke", "#fff")
       .attr("stroke-width", 0.5)
       .on("mousemove", showTooltip)
       .on("mouseout",  hideTooltip);

  /* ---------- 5. simple annotation for the max country (optional) ---------- */
  const maxRatio = d3.max(latest, d => d.Ratio);
  const topRow   = latest.find(d => d.Ratio === maxRatio);
  const topFeat  = countries.find(f => key(f.properties.name) === key(topRow["Country Name"]));

  if (topFeat) {
    const [cx, cy] = path.centroid(topFeat);
    svg.append("g").call(
      d3.annotation()
        .type(d3.annotationLabel)
        .annotations([{
          note: { title: topRow["Country Name"], label: `${maxRatio.toFixed(1)} %` },
          x: cx, y: cy, dx: 50, dy: -35
        }])
    );
  }

  /* ---------- annotation: country with the LOWEST ratio ---------- */

    const minRatio  = d3.min(latest, d => d.Ratio);
    const lowRow    = latest.find(d => d.Ratio === minRatio);
    const lowFeat   = countries.find(
    f => key(f.properties.name) === key(lowRow["Country Name"])
    );

    if (lowFeat) {
    const [cx, cy] = path.centroid(lowFeat);

    svg.append("g").call(
        d3.annotation()
        .type(d3.annotationLabel)
        .annotations([{
            note: {
            title: lowRow["Country Name"],
            label: `${minRatio.toFixed(1)} %`
            },
            x: cx, y: cy, dx: 10, dy: 80   // tweak dx/dy as you like
        }])
    );
    }

  /* ---------- 6. tooltip ---------- */
  const tooltip = d3.select("body")
                    .append("div")
                    .attr("class", "tooltip")
                    .style("opacity", 0);

  function showTooltip(event, d) {
    const v = ratioByName.get(key(d.properties.name));
    tooltip.style("opacity", 1)
           .html(`${d.properties.name}<br>${v ? v.toFixed(1) + " %" : "no data"}`)
           .style("left",  (event.pageX + 10) + "px")
           .style("top",   (event.pageY + 10) + "px");
  }
  function hideTooltip() {
    tooltip.style("opacity", 0);
  }

  /* ---------- 7. legend ---------- */
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

});

