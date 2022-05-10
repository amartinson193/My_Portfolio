class bubble_chart {
    /**
     * Creates a Table Object
     */
    constructor(data, categories) {
        this.data = data
        this.categories = categories
    
    this.svg_height = 1000;
    this.svg_width = 1000;

    // Size Scale
    this.scaleSize = d3.scaleLinear() 
            .domain([1, 6])
            
    // Color Scale
    this.colorScale = d3.scaleOrdinal()
        .domain(this.categories)
        .range(d3.schemeSet2.slice(0,6))
    
    //Create the scales

    this.x_array_pos = this.data.map(x => x.position)
    this.x_array_s = this.data.map(x => x.sourceX)
    this.y_array_s = this.data.map(y => y.sourceY)
    this.y_array_m = this.data.map(y => y.moveY)

    this.scaleX = d3.scaleLinear()
        .domain([-50, d3.max(this.x_array_pos)])
        .range([0, d3.max(this.x_array_s)])
    
    // Toggle indicator
    this.toggle_indicator = false

    // Filtered data
    this.phrase_list = []
    
    // Grouped indicator
    this.grouped = true

    // X Value
    this.x = 'sourceX'

    // Table data
    this.table_data = this.data

    }
    
    draw_scatter(){
        
        // Add an svg
        let svg_select = d3.select('#bubble_main').append('svg')
                       .attr('height', this.svg_height)
                       .attr('width', this.svg_width)
                       .attr('id', 'svg_bubble')

        // Draw the brushes
        this.brushes()
        
        // Add a center line
        svg_select.append('line')
            .attr('x1', this.scaleX(0))
            .attr('y1',d3.min(this.y_array_s) - 10)
            .attr('x2', this.scaleX(0))
            .attr('y2',d3.max(this.y_array_s) + 10)
            .style('stroke','gray')
            .attr('transform', 'translate(20,150)')
            .attr('id', 'center-line')

        // Draw circles               
        svg_select.selectAll('circle')
                  .data(this.data)
                  .join('circle')
                  .attr('cx',d => d.sourceX)
                  .attr('cy',d => d.sourceY)
                  .attr('r',d => this.scaleSize(d.total))
                  .style('fill',d => this.colorScale(d.category))
                  .attr('stroke','gray')
                  .attr('transform', 'translate(20,150)')
                  .classed('circle', true)
                  
        // Set the axis 
        let xScale = d3.axisBottom(this.scaleX).tickFormat(d => Math.abs(d))

        svg_select.append('g')
            .call(xScale)
            .attr('transform', 'translate(20,40)')
            .classed('axis', true)
            
        // Remove the axis line
        svg_select
            .call(g => g.select('.domain').remove()) 
        
        // Add left text label
        svg_select.append('text')
            .attr('transform', 'translate(5,25)')
            .text('Democratic Leaning')
            .classed('axis', true)
        
        // Add right text label
        svg_select.append('text')
            .attr('transform', 'translate(' + (d3.max(this.x_array_s)-165) + ',25)')
            .text('Republican Leaning')
            .classed('axis', true)
        
        // Draw the toggle button
        this.toggle_button()

        // Draw the tooltip
        this.tooltip()


        
    } // end draw_scatter function

    toggle_button() {

        let button = d3.select('#header-wrap').append('button')
                        .attr('type', 'button')
                        .text('Grouped by Topic')
        
        button.on('click', (event, d) => {
            
            // Call the ungroup
            this.ungroup_regroup()
            
            });   

    } // end toggle_button function

    ungroup_regroup() {

        // Ungroup if toggle is False

        if (this.toggle_indicator == false){
            this.toggle_indicator = true

            // Expand line
            d3.select('#center-line')
                .transition()
                .duration(1000)
                .attr('y2',d3.max(this.y_array_m) + 10)
            
            // Ungroup circles
            d3.selectAll('circle')
                .data(this.data)
                .transition()
                .duration(1000)
                .attr("cy",d => d.moveY)
            
            // Add category text
            d3.select('svg').append('g').selectAll('text')
                .data(this.categories)
                .join('text')
                .text((d) => d)
                .attr('transform','translate(50,100)')
                .classed('category-subtext', true)
            
            // Animate text
            d3.selectAll('.category-subtext')
                .transition()
                .duration(1000)
                .attr('transform', (d,i) => 'translate(50,' + (100 + (130 * i)) + ')')
            
        // Regroup if toggle is true
        } else {
            this.toggle_indicator = false

            // Collapse line
            d3.select('#center-line')
            .transition()
            .duration(1000)
            .attr('y2',d3.max(this.y_array_s) + 10)

            // Regroup circles
            d3.selectAll('circle')
                .data(this.data)
                .transition()
                .duration(1000)
                .attr("cy",d => d.sourceY)
            
            // Animate text
            d3.selectAll('.category-subtext')
                .transition()
                .duration(1000)
                .attr('transform', (d,i) => 'translate(50,100)')
                .remove()            
            
        } // End if statement

    } // End ungroup/re-group function

    tooltip() {
        
        // Create tooltip    
        let tooltip = d3.select('#bubble_main').append('div') 
                        .attr('id','tooltip')
                        .style('visibility', 'hidden')

        // Mouse over
        d3.selectAll('.circle').on('mouseover', function(d){
            tooltip
            .style('visibility', 'visible')
            .style("top", d3.event.pageY -10 + 'px')
            .style("left", d3.event.pageX + 25 + 'px')
            
            .html("<p style=font-size:20px>" + d.category + "</p> \
                   <p>" + (d.position >= 0 ? 'R+ ' : 'D+ ') + Math.abs(d.position).toFixed(3) + "%</p> \
                   <p> In " + Math.round((+d.total /50 * 100)) + "% of speeches </p>"
            )    
                
        }) // End mouseover listener

        // Mouse move
        d3.selectAll('.circle').on('mousemove', () => {
            tooltip
            .style("top", d3.event.pageY -10 + 'px')
            .style("left", d3.event.pageX + 25 + 'px')
        }) // End mousemove listener

        // Mouse out
        d3.selectAll('.circle').on('mouseout', () => {
            tooltip.style('visibility', 'hidden')
        }) // End mouseout listener

    } // End of tooltip function

    brushes () {
              
        const xBrush = d3.brushX()
                        .extent([[d3.min(this.x_array_s), d3.min(this.y_array_s) - 10], [d3.max(this.x_array_s), d3.max(this.y_array_s) + 10]])
                        .on("start", () => {
                            // Clear the phrase list
                            this.phrase_list = []
                            const table_viz = new table(this.data, this.categories);
                            table_viz.draw_table()
                        })
                        
                        .on("brush", () => {
                            this.brushing_ind = true

                            // Get the coordinates
                            let xmin = d3.event.selection[0]
                            let xmax = d3.event.selection[1]

                            // Set x coordinates
                            if (this.grouped == true){
                                this.x = 'sourceX'
                            }
                            else {
                                this.x = 'moveX'
                            }
                            
                            // Create a list based on the coordinates
                            this.data.forEach((d) => {
                                if(d[this.x] >= xmin && d[this.x] <= xmax){
                                    this.phrase_list.push(d.phrase)
                                }
                            })

                            // Create new dataset
                            let filtered_data = []
                            if (this.phrase_list.length > 0){
                                this.data.forEach((d) => {
                                    if (this.phrase_list.indexOf(d.phrase) !== -1){
                                        filtered_data.push(d)
                                    }
                                })
                                this.table_data = filtered_data
                            } // end if statement

                        const table_viz = new table(this.table_data, this.categories);
                        table_viz.draw_table()
                        })

            d3.select('#svg_bubble').append('g')
                .classed('brushes', true)
                .attr('transform', 'translate(20,150)')
                .call(xBrush)
            
    }

} // end bubble chart class