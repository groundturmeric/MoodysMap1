//https://nationalzoo.si.edu/migratory-birds/migratory-birds-tracking-table
// make the SVG and viewbox
const svg = d3.select("div#chart").append("svg")
    .attr("preserveAspectRatio", "xMinYMin meet")
    .attr("viewBox", "0 0 " + window.innerWidth  + " " + window.innerHeight)
    // .style("background-color", "white")
    .attr("id", "map-svg")
    .classed("svg-content", true);

    let projectionScale = 250;

// define the settings for map projection

// const projection = d3.geoOrthographic()
const projection = d3.geoEqualEarth()
    .translate([window.innerWidth / 2, window.innerHeight / 2])
    .rotate([0, 0,0])
    .scale(150)
    .center([0, 0]);



// create the geo path generator
let geoPathGenerator = d3.geoPath().projection(projection);



/* 
    ADD TOOLTIP FOR LATER
    The visualization gets too cluttered if we try to add text labels;
    use a tooltip instead
    */
const tooltip = d3.select("#chart")
    .append("div")
    .attr("class", "tooltip");

// great a g element to append all of our objects to
// const g = svg.append("g");

// will be used later for grid lines
const graticule = d3.geoGraticule();

// maps use multiple file types. we can store the "type" of each file along with the URL for easy loading!
const files = [
    { "type": "json", "file": "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson" },
    { "type": "csv", "file": "data/MoodysOfficesLocations.csv" } // dataset of every earthquake on Mar 21, 2022 from here: https://earthquake.usgs.gov/earthquakes/feed/v1.0/csv.php
];
let promises = [];

// for each file type, add the corresponding d3 load function to our promises
files.forEach(function (d) {
    if (d.type == "json") {
        promises.push(d3.json(d.file));
    } else {
        promises.push(d3.csv(d.file));
    }
});

// when our data has been loaded, call the draw map function
Promise.all(promises).then(function (values) {
    drawMap(values[0], values[1])
});

/*
ALL THE MAP STUFF HAPPENS HERE AND IT DEPENDS ON DATA BEING LOADED
*/
function drawMap(geo, data) {

    let allSpecies = data.map(function (d) {
        return d.Branch;
    })
    // console.log(speciesPerRow)
    let species = [...new Set(allSpecies)];
    console.log(allSpecies);

    // Moody's logo blue #052e9d    and    #090524
    fillScale = d3.scaleOrdinal(d3.schemeCategory10)
    .domain(species)
    .range([ "#1a9fdc", "#b0ddd3", "#052e9d", "#f5943d"]);

    console.log(species)

    // our function has two parameters, both of which should be data objects
    console.log('GEO: ', geo)
    console.log('dataset: ', data)

    // we want to scale the size of each bubble based on an attribute of the data
    // var rScale = d3.scaleSqrt()
    //     .domain(d3.extent(data, function (d) { return +d.mag }))
    //     .range([0.1, 20]);
        
        // var rScale = d3.scaleLog()
        // .domain([1,10])        
        // .range([0.1, 20]);





    // use a for loop to draw a few sample circle sizes for our legend
    // next to each circle, add the corresponding number value
    // we can see what our "max" magnitude is by inspecting the domain of our rScale
    // console.log(fillScale.domain())





    // Draw the map


//     svg.append('rect')
//   .attr('width', 300)
//   .attr('height', 300)
//   .attr("d", geoPathGenerator)
// //   .attr('x', window.innerWidth/2 -150)
// //   .attr('y', window.innerHeight/2 -150)





        // add grid lines
        var lines =svg.append("path")
        .datum(graticule)
        .attr("class", "graticule")
        .attr("d", geoPathGenerator)
        .style("fill", "none")
        .style("opacity", 1)
        ;

    var basemap = svg
        .selectAll("continent")
        .data(geo.features)
        .enter()
        .append("path")
        .attr("class", 'continent')
        // draw each country
        .attr("d", geoPathGenerator)
        // .attr("country", function (d) { return d.id })
        .attr("fill", "#eeeeee");



    

    function updateCircles(dataset, scale = 1) {

        
        // draw dots for each earthquake
        var circs = svg
            .selectAll('circle')
            .data(dataset)
            .join('circle')
            .style("stroke-width", 0.5)
            .style("stroke", "white")
            .attr("fill-opacity", 1)
            .attr("fill",function (d) {
                return fillScale(d.Branch) ;
            })
            .attr("cx", function (d) {
                // console.log(projection([d.longitude, d.latitude]))
                return projection([d.Long, d.Lat])[0]
            })
            .attr("cy", function (d) { return projection([d.Long, d.Lat])[1] })
            // .attr("r", function (d) {
            //     return rScale(d.mag) / (scale / 1.2);
            // })
            .attr("r", 3)
            .on('mouseover', function (e, d) {
                d3.select(this)
                    .style("stroke", "black");

                tooltip.style("visibility", "visible");
            })
            .on('mousemove', function (e, d) {
                let x = e.offsetX;
                let y = e.offsetY;

                tooltip.style("left", x + 20 + "px")
                    .style("top", y + "px")
                    .html(d.Name + "</br>" + d.Address);
            })
            .on('mouseout', function () {
                d3.select(this)
                    .style("stroke", "gray");

                tooltip.style("visibility", "hidden");
            });






    // create a legend group and tranform it to be top left of page
    var legend = svg.append("g")
        .attr("transform", "translate(20,20)")
        .attr("class", "Legend");

    // add a title for the legend
    legend.append("text")
        .attr("x", 0)
        .attr("y", 0)
        .text("Branches")

//Legend Drawing
    fillScale.domain().forEach((d, i) => {
        for(i=0; i<4; i++){
            legend.append("text")
        // .attr("text-anchor", "middle")
            .attr("x", 20)
            .attr('y', ((i + 1) * 20))
            .attr("font-size", 12)
            .text([species[i]])

            legend.append("circle")
            .attr("cx", 10)
            .attr("cy", ((i + 1) * 20) - 5)
            .attr("r", 5)
            .attr("fill", fillScale(species[i]));
        }

    })

    
    }
//draw circles once
updateCircles(data);
    

    // on zoom or pan, we need to scale the map and circles so they stay proportional
    // this block of code will read a user zoom event and then transform the circles and map path
    // var drag = d3.zoom()
    //     .scaleExtent([1, 8])
    //     .on('zoom', function (event) {
    //         // console.log(event)
    //         g.attr("transform", "translate(" + event.transform.x + "," + event.transform.y + ")scale(" + event.transform.k + ")");
    //         updateCircles(data, event.transform.k)
    //     });

    // call zoom so it is "listening" for an event on our SVG


    const sensitivity = 75

var drag = d3.drag().on('drag', function (event) {
    console.log(event)
    const rotate = projection.rotate()
    const k = sensitivity / projection.scale()

    projection.rotate([
        rotate[0] + event.dx * k,
        rotate[1] - event.dy * k
    ])
    geoPathGenerator = d3.geoPath().projection(projection)
    svg.selectAll("path").attr("d", geoPathGenerator)
    
    
    updateCircles(data);
})

svg.call(drag);
// circs.call(drag);

const zoom = d3.zoom().on('zoom', function (event) {
    console.log(event)
    projection.scale(projectionScale * event.transform.k)
    geoPathGenerator = d3.geoPath().projection(projection)
    svg.selectAll("path").attr("d", geoPathGenerator)

    updateCircles(data);
})


// g.call(drag)
svg.call(zoom)
}




