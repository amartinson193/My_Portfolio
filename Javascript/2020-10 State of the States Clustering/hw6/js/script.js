loadData().then(data => {
    console.log("HERE IS THE DATA", data)

    setup_page()

    // Get distinct values, taken from: https://codeburst.io/javascript-array-distinct-5edc93501dc4
    const distinct = (value, index, self) => {
        return self.indexOf(value) === index;
    }
    

    let categories = data.map(x => x.category).filter(distinct);
    const bubble = new bubble_chart(data, categories);

    bubble.draw_scatter() // Draw the scatterplot

    const table_viz = new table(data, categories, []);
    table_viz.draw_table() // Draw the table
    
})



function setup_page(){
    d3.select('body')
      .append('span')
      .attr('id','bubble_main')
      .attr('position', 'relative')
    d3.select('body')
      .append('span')
      .attr('id','table_main')
      .attr('position', 'relative')
    
}

// Import the JSON file
async function loadData() {
    try {
        console.log('Load Data')
        const data = await d3.json('./data/words.json')
        console.log('Data Loaded')
        return data
    }
    catch (error) {
        console.log(error)
    }
}