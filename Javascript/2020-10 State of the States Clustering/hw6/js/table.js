class table {
    /**
     * Creates a Table Object
     */
    constructor(data, categories) {
    this.data = data;
    this.data_new = data

    this.svg_height = 1000
    this.svg_width = 700

    this.categories = categories

    // Ascending/Descending Flag
    this.phrase_ascending = 1
    this.freq_ascending = 1
    this.pct_ascending = 1
    this.total_ascending = 1

    // Frequency Axis
    this.freq_width = 110
    this.freq_height = 20

    this.scale_freq = d3.scaleLinear()
        .domain([0, 1])
        .range([0, 100]);
    
    this.freq_axis = d3.axisBottom();
    this.freq_axis.scale(this.scale_freq).tickValues([0,.5,1]);

    // Percentages Axis
    this.pct_width = 220
    this.pct_height = 20

    let d_pct = this.data.map(x => +x.percent_of_d_speeches)
    let r_pct = this.data.map(x => +x.percent_of_r_speeches)

    this.scale_pct = d3.scaleLinear()
        .domain([-100, 100])
        .range([-1 * d3.max(d_pct), d3.max(r_pct)]);
    
    this.pct_axis = d3.axisBottom();
    this.pct_axis.scale(this.scale_pct).tickValues([-100,-50,0,50,100]);
    
        // Frequency color scale

        this.colorScale = d3.scaleOrdinal()
        .domain(this.categories)
        .range(d3.schemeSet2.slice(0,6))
    
    this.phrase_list = []
    

    } // End constructor

    draw_table(){

        // Set the data set
        d3.select('#table').remove()

        // Create a table html object
        let table = d3.select('#table_main').append('table')
            .style('display', 'inline')
            .style('vertical-align', 'top')
            .attr('id', 'table')

        // Add a row (tr) with 4 headers (th - phrase, frequency, percentages, and total))

        let columns = ['phrase','frequency', 'percentages', 'total']
        table.append('thead')
            .attr('id', 'table-header')
            .append('tr').selectAll('th')
            .data(columns)
            .join('th')
            .text((d) => d)
            .attr('id', d => d)
        
        let table_axis = d3.select('#table-header')
                            .append('tr')

        // Add tbody followed by a tr for each element

        table.append('tbody')
            .selectAll('tr')
                .data(this.data_new)
                .join('tr')
                .classed('table_rows', true)
            .selectAll('td')
                .data(d => [d, d, d, d.total])
                .join('td')
                .attr('class', (d,i) => columns[i])      

        // Add phrases
        d3.selectAll('.phrase')
            .text(d => d.phrase)

        // Add total
        d3.selectAll('.total')
            .text(d => d)

        // Add id for table axis
        table_axis.selectAll('td')
        .data(columns)
        .join('td')
        .attr('id', d => d + '_axis')
        
        this.frequency_rectangles()
        this.percentage_rectangles()
        this.sort_table()

    } // End draw table function

    frequency_rectangles() {

        d3.select('#frequency_axis')
            .append('svg')
            .attr('width', this.freq_width)
            .attr('height', this.freq_height)
            .call(this.freq_axis)
            .attr('transform', 'translate(5,0)')

        // Remove axis line
        d3.select('#frequency_axis')
            .call(g => g.select('.domain').remove()) 

        // Add frequency rectangles
        d3.selectAll('.frequency')
            .append('svg')
            .attr('width', this.freq_width)
            .attr('height',12)
            .append('rect')
            .attr('y',0)
            .attr('x',0)
            .attr('width', d => this.scale_freq(+d.total /50))
            .attr('height', 20)
            .attr('fill',d => this.colorScale(d.category))
            .attr('transform', 'translate(5,0)')

    } // End frequency rectangles

    percentage_rectangles() {

        // Draw axis
        d3.select('#percentages_axis')
            .append('svg')
            .attr('width', this.pct_width)
            .attr('height', this.pct_height)
            .append('g')
            .call(this.pct_axis)
            .attr('transform','translate(110,0)')

        // Remove axis line
        d3.select('#percentages_axis')
            .call(g => g.select('.domain').remove()) 

        // Draw rectangles
        
        let svg_select = d3.selectAll('.percentages')
            .append('svg')
                .attr('width', this.pct_width)
                .attr('height',12)

        svg_select.append('rect') // democrat rectangles
                .attr('y',0)
                .attr('x',d => this.scale_pct(+d.percent_of_d_speeches * -1))
                .attr('width', d => +d.percent_of_d_speeches)
                .attr('height', 20)
                .attr('transform', ' translate(110,0)')
                .style('fill', '#33A2FF')

        
        svg_select.append('rect')
                .attr('y',0)
                .attr('x',0)
                .attr('width', d => +d.percent_of_r_speeches)
                .attr('height', 20)
                .attr('transform', ' translate(110,0)')
                .style('fill', '#FF3333')
    }

    sort_table () {
        // Add sorting functionality

        d3.select('thead').on('click', () => {

            // Set variables for sorting
            if (d3.event.target.attributes[0].value == 'total'){
                
                // Sort table data
                this.data.sort((a, b) => 
                {
                if (+a.total > +b.total){
                    return 1 * this.total_ascending;
                }
                else if (+a.total < +b.total) {
                    return -1 * this.total_ascending;
                }
                else {
                return 0;
                }
                })
            } else if (d3.event.target.attributes[0].value == 'percentages'){
                
                // Sort table data
                this.data.sort((a, b) => 
                {
                if ((+a.percent_of_d_speeches - +a.percent_of_r_speeches) > (+b.percent_of_d_speeches - +b.percent_of_r_speeches)){
                // if ((+a.percent_of_d_speeches) > (+b.percent_of_d_speeches)){
                    return 1 * this.pct_ascending;
                }
                else if ((+a.percent_of_d_speeches - +a.percent_of_r_speeches) < (+b.percent_of_d_speeches - +b.percent_of_r_speeches)) {
                // else if ((+a.percent_of_d_speeches) < (+b.percent_of_d_speeches)) {
                    return -1 * this.pct_ascending;
                }
                else {
                return 0;
                }
                })
            } else if (d3.event.target.attributes[0].value == 'frequency'){
                
                // Sort table data
                this.data.sort((a, b) => 
                {
                if (+a.total > +b.total){
                    return 1 * this.freq_ascending;
                }
                else if (+a.total < +b.total) {
                    return -1 * this.freq_ascending;
                }
                else {
                return 0;
                }
                })
            } else if (d3.event.target.attributes[0].value == 'phrase'){
                
                // Sort table data
                this.data.sort((a, b) => 
                {
                if (a.phrase > b.phrase){
                    return 1 * this.phrase_ascending;
                }
                else if (a.phrase < b.phrase) {
                    return -1 * this.phrase_ascending;
                }
                else {
                return 0;
                }
                })
            }

            // Update ascending/descending flags
            if (d3.event.target.attributes[0].value == 'total'){this.total_ascending = this.total_ascending * -1 }
            else if (d3.event.target.attributes[0].value == 'percentages'){this.pct_ascending = this.pct_ascending * -1 }
            else if (d3.event.target.attributes[0].value == 'frequency'){this.freq_ascending = this.freq_ascending * -1 }
            else if (d3.event.target.attributes[0].value == 'phrase'){this.phrase_ascending = this.phrase_ascending * -1 }

            
            this.draw_table()
            
        
        }) // End click event listener
    } // End sort table function 
} // End Table Class