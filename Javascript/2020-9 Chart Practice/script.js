/**
 * Makes the first bar chart appear as a staircase.
 *
 * Note: use only the DOM API, not D3!
 * 
 */

function staircase() {
  // ****** TODO: PART II ******

  
  function sort_staircase(){
    width_array = []

    // Get the widths in an array
    for (i of document.getElementById("aBarChart").children){
      console.log(i.attributes.width.value)
      width_array.push(i.attributes.width.value)
    }

    // Function to put in the sort function
    function compareNumbers(a,b){
      return a-b
    }

    // Sort function taken from lecture notes: http://dataviscourse.net/tutorials/lectures/lecture-javascript/
    width_array.sort(compareNumbers);

    // Loop through the elements and assign the sorted widths
    count = 0
    for (i of document.getElementById("aBarChart").children){
      i.attributes.width.value = width_array[count]
      count+=1
    
    }

  }

  sort_staircase()
}


/**
 * Render the visualizations
 * @param data
 */
function update(data) {
  /**
   * D3 loads all CSV data as strings. While Javascript is pretty smart
   * about interpreting strings as numbers when you do things like
   * multiplication, it will still treat them as strings where it makes
   * sense (e.g. adding strings will concatenate them, not add the values
   * together, or comparing strings will do string comparison, not numeric
   * comparison).
   *
   * We need to explicitly convert values to numbers so that comparisons work
   * when we call d3.max()
   **/

  for (let d of data) {
    d.cases = +d.cases; //unary operator converts string to number
    d.deaths = +d.deaths; //unary operator converts string to number
  }

  // Set up the scales
  let barChart_width = 345;
  let areaChart_width = 295;
  let maxBar_width = 240;
  let data_length = 15;
  let max_cases = d3.max(data, d => d.cases);
  let max_deaths = d3.max(data, d => d.deaths);
  let aScale = d3
    .scaleLinear()
    .domain([0, d3.max(data, d => d.cases)])
    .range([0, maxBar_width])
    .nice();
  let bScale = d3
    .scaleLinear()
    .domain([0, d3.max(data, d => d.deaths)])
    .range([0, maxBar_width])
    .nice();
  let iScale_line = d3
    .scaleLinear()
    .domain([0, data.length])
    .range([10, 500]);
  let iScale_area = d3
    .scaleLinear()
    .domain([0, data_length])
    .range([0, 260]);
  
  // Draw axis for Bar Charts, Line Charts and Area Charts (You don't need to change this part.)
  d3.select("#aBarChart-axis").attr("transform", "translate(0,210)").call(d3.axisBottom(d3.scaleLinear().domain([0, d3.max(data, d => d.cases)]).range([barChart_width, barChart_width-maxBar_width])).ticks(5));
  d3.select("#aAreaChart-axis").attr("transform", "translate(0,245)").call(d3.axisBottom(d3.scaleLinear().domain([0, d3.max(data, d => d.cases)]).range([areaChart_width, areaChart_width-maxBar_width])).ticks(5));
  d3.select("#bBarChart-axis").attr("transform", "translate(5,210)").call(d3.axisBottom(bScale).ticks(5));
  d3.select("#bAreaChart-axis").attr("transform", "translate(5,245)").call(d3.axisBottom(bScale).ticks(5));
  let aAxis_line = d3.axisLeft(aScale).ticks(5);
  d3.select("#aLineChart-axis").attr("transform", "translate(50,15)").call(aAxis_line);
  d3.select("#aLineChart-axis").append("text").text("New Cases").attr("transform", "translate(50, -3)")
  let bAxis_line = d3.axisRight(bScale).ticks(5);
  d3.select("#bLineChart-axis").attr("transform", "translate(550,15)").call(bAxis_line);
  d3.select("#bLineChart-axis").append("text").text("New Deaths").attr("transform", "translate(-50, -3)")

  // ****** TODO: PART III (you will also edit in PART V) ******

  // TODO: Select and update the 'a' bar chart bars

  // Set Bar Chart A rectangle widths and scale them
  aBar = d3.select("#aBarChart")
           .selectAll('rect')
           .data(data)
  
  newBars = aBar.enter()
              .append("rect")
              .attr("width",d => aScale(d.cases))
              .attr("height",12)
              .attr("transform", (d,i) => {
                return "translate("
                    + 0 // x position
                    + ","
                    + (i * 14) // y position
                    + ")"
                    + "scale(-1,1)"
                  }
              )
 
  aBar.exit().remove()

  aBar = newBars.merge(aBar)

  aBar.attr("width",0)
    .transition()
    .duration(1000)
    .attr("width",d => aScale(d.cases))
  
  // add interactivity -- Referenced this code for help: https://observablehq.com/@zhou325/lab-2-next-steps
  aBar.on('mouseover', (d, i, g) => {
    d3.select(g[i]).style('fill', 'rgb(0,0,0)')
                   })

  aBar.on('mouseout', (d, i, g) => {
    d3.select(g[i]).style('fill', 'rgb(241,151,186)');
    }
  );

  // TODO: Select and update the 'b' bar chart bars
  bBar = d3.select("#bBarChart")
    .selectAll('rect')
    .data(data)
    
    bBar.join(
      enter =>
        enter
        .append("rect")
        .attr("width",0)
        .attr("height", 12)
        .attr("transform", (d,i) => {
          return "translate("
              + 0 // x position
              + ","
              + ((i+1) * 14) // y position
              + ")"
              + "scale(1,-1)"
            }
        )
        ,
    
      update =>
        update
        .transition()
        .duration(1000)
        .attr("width",d => bScale(d.deaths))
        .attr("transform", (d,i) => {
          return "translate("
              + 0 // x position
              + ","
              + ((i+1) * 14) // y position
              + ")"
              + "scale(1,-1)"
            }
        ),
      exit => exit.remove()
    );

    // add interactivity -- Referenced this code for help: https://observablehq.com/@zhou325/lab-2-next-steps
    bBar.on('mouseover', (d, i, g) => {
      d3.select(g[i]).style('fill', 'rgb(0,0,0)')
                     })
  
    bBar.on('mouseout', (d, i, g) => {
      d3.select(g[i]).style('fill', 'rgb(79,175,211)');
      }
    );

  // TODO: Select and update the 'a' line chart path using this line generator
  let aLineGenerator = d3
    .line()
    .x((d, i) => iScale_line(i))
    .y(d => aScale(d.cases));
  
  d3.select("#aLineChart")
    .datum(data)
    .attr("d",aLineGenerator)


  // TODO: Select and update the 'b' line chart path (create your own generator)

  let bLineGenerator = d3
  .line()
  .x((d, i) => iScale_line(i))
  .y(d => bScale(d.deaths));

d3.select("#bLineChart")
  .datum(data)
  .attr("d",bLineGenerator)
  
  // TODO: Select and update the 'a' area chart path using this area generator
  let aAreaGenerator = d3
    .area()
    .x((d, i) => iScale_area(i))
    .y0(0)
    .y1(d => aScale(d.cases));

    d3.select("#aAreaChart")
    .datum(data)
    .attr("d",aAreaGenerator)
    
  // TODO: Select and update the 'b' area chart path (create your own generator)

  let bAreaGenerator = d3
  .area()
  .x((d, i) => iScale_area(i))
  .y0(0)
  .y1(d => bScale(d.deaths));

  d3.select("#bAreaChart")
  .datum(data)
  .attr("d",bAreaGenerator)

  // TODO: Select and update the scatterplot points

  let xAxis = d3.axisBottom()
                .ticks(5);
  xAxis.scale(aScale);
  
  // X-Axis
  d3.select(".x-axis").remove();
  d3.select("#scatterplot")
    .append("g")
    .call(xAxis)
    .classed("x-axis",true)
    .attr("transform","translate(0, 240)");

  let yAxis = d3.axisLeft();
  yAxis.scale(bScale);

  // Y-Axis
  d3.select(".y-axis").remove();
  d3.select("#scatterplot")
    .append("g")
    .call(yAxis)
    .classed("y-axis",true);
  
  selection_scatter = d3.select("#scatterplot")
    .selectAll('circle')
    .data(data);
    
  selection_scatter.join(
    enter =>
      enter
      .append("circle")
      .attr("cx",d => aScale(d.cases) )
      .attr("cy",d => bScale(d.deaths) )
      .attr("r",5)
      ,
  
    update =>
      update
      .attr("cx",d => aScale(d.cases) )
      .attr("cy",d => bScale(d.deaths) )
      .attr("r",5)
      ,
    exit => exit.remove()
  );
 
  // Test to check console logs for events
  d3.select("#scatterplot").on("click", function () {

  let scatter_point = d3.event.target
  console.log("X: " + aScale.invert(scatter_point.attributes.cx.value) + ",Y: " + (bScale.invert(scatter_point.attributes.cy.value)))
  })

  // Add event listener for scatterplot point hover
  d3.select("#scatterplot").on("mouseover", function () {
    
    let scatter_point = d3.event.target
    d3.selectAll("circle > title").remove()
    d3.selectAll("#scatterplot > circle")
    .append("title")
    .text("X: " + aScale.invert(scatter_point.attributes.cx.value) + ",Y: " + (bScale.invert(scatter_point.attributes.cy.value)))
    
  })

          }
  // ****** TODO: PART IV ******

/**
 * Update the data according to document settings
 */
async function changeData() {
  //  Load the file indicated by the select menu

  console.log("ChangeData Function here")
  let dataFile = document.getElementById("dataset").value;
  try {
    const data = await d3.csv("data/" + dataFile + ".csv");
    if (document.getElementById("random").checked) {
      // if random
      update(randomSubset(data)); // update w/ random subset of data
    } else {
      // else
      update(data); // update w/ full data
    }
  } catch (error) {
    console.log(error)
    alert("Could not load the dataset!");
  }


}

/**
 *  Slice out a random chunk of the provided in data
 *  @param data
 */
function randomSubset(data) {
  return data.filter(d => Math.random() > 0.5);
}


