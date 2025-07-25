// /* -------------- scene1.js -------------- */
// /* highlight the three countries with the highest female‑to‑male
//    labour‑force‑participation ratios in the latest year            */

// loadData().then(({ latest, countries, path, color, ratioByName, legendGroup }) => {

//   const svg = d3.select("#map");
//   svg.selectAll("*").remove();               // wipe whatever Scene 0 left

//   /* -------- 1. choropleth base map -------- */
//   const base = svg.append("g")
//       .selectAll("path")
//       .data(countries)
//       .enter().append("path")
//         .attr("d", path)
//         .attr("fill", d => {
//           const v = ratioByName.get(key(d.properties.name));
//           return v == null ? "#ccc" : color(v);
//         })
//         .attr("stroke", "#fff")
//         .attr("stroke-width", 0.5);

//   /* -------- 2. determine TOP‑3 countries -------- */
//   const top3Rows = latest
//       .sort((a, b) => d3.descending(a.Ratio, b.Ratio))
//       .slice(0, 3);                                     // highest first

//   const top3Keys = top3Rows.map(r => key(r["Country Name"]));

//   /* -------- 3. outline those countries -------- */
//   svg.append("g")
//       .selectAll("path")
//       .data(countries.filter(f => top3Keys.includes(key(f.properties.name))))
//       .enter().append("path")
//         .attr("d", path)
//         .attr("fill", "none")
//         .attr("stroke", "#222")
//         .attr("stroke-width", 2.8);

//   /* -------- 4. annotations -------- */
//   const annData = top3Rows.map((row, i) => {
//     const feat = countries.find(f => key(f.properties.name) === key(row["Country Name"]));
//     if (!feat) return null;
//     const [cx, cy] = path.centroid(feat);
//     const offsets  = [ {dx: 40,  dy: -25},
//                        {dx: -40, dy:  35},
//                        {dx:  0,  dy: -45} ];
//     return {
//       note: { title: row["Country Name"],
//               label: `${row.Ratio.toFixed(1)} %` },
//       x: cx, y: cy,
//       dx: offsets[i].dx, dy: offsets[i].dy
//     };
//   }).filter(Boolean);

//   svg.append("g")
//      .call(
//        d3.annotation()
//          .type(d3.annotationLabel)
//          .annotations(annData)
//      )
//      .selectAll("text")
//        .attr("font-size", d => d.type === "title" ? 14 : 12)
//        .attr("font-weight", d => d.type === "title" ? 600 : 400)
//        .attr("fill", "#222");

//   /* -------- 5. show legend in this scene -------- */
//   legendGroup.style("opacity", 1);
// });

/* ---------- scene‑one.js  (classic script version) ---------- */
/* Colours only the top‑3 countries; all others use grey fill. */

/* If you switched to modules, add:
   import { loadData, key } from './scene-common.js';          */

loadData().then(({ latest, countries, path, color, ratioByName, legendGroup }) => {

  const svg = d3.select("#map");
  svg.selectAll("*").remove();                     // clear previous scene

  /* --- 1. identify the top‑3 rows & keys --- */
  const top3Rows = [...latest]
      .sort((a, b) => d3.descending(a.Ratio, b.Ratio))
      .slice(0, 3);

  const top3Keys = new Set(top3Rows.map(r => key(r["Country Name"])));

  /* --- 2. BASE LAYER: draw every country in grey --- */
  svg.append("g")
     .selectAll("path")
     .data(countries)
     .enter().append("path")
       .attr("d", path)
       .attr("fill", "#eeeeee")        // same grey as Scene 0
       .attr("stroke", "#cccccc")
       .attr("stroke-width", 0.5);

  /* --- 3. TOP LAYER: colour & outline the winners --- */
  svg.append("g")
     .selectAll("path")
     .data(countries.filter(f => top3Keys.has(key(f.properties.name))))
     .enter().append("path")
       .attr("d", path)
       .attr("fill", d => color(ratioByName.get(key(d.properties.name))))
       .attr("stroke", "#222")
       .attr("stroke-width", 1.2);

  /* --- 4. annotations --- */
  const offsets = [ {dx: 35, dy: -20}, {dx: -35, dy:-25}, {dx: 60, dy: 30} ];

  const annData = top3Rows.map((row, i) => {
    const feat = countries.find(f => key(f.properties.name) === key(row["Country Name"]));
    const [cx, cy] = path.centroid(feat);
    return {
      note: { title: row["Country Name"], label: `${row.Ratio.toFixed(1)} %` },
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

  /* --- 5. reveal the legend in this scene --- */
  legendGroup.style("opacity", 1);
});

