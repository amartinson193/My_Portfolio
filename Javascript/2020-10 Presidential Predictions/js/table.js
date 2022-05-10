/** Class implementing the table. */
class Table {
    /**
     * Creates a Table Object
     */
    constructor(forecastData, pollData) {
        this.forecastData = forecastData;
        this.tableData = [...forecastData];
        // add useful attributes
        for (let forecast of this.tableData)
        {
            forecast.isForecast = true;
            forecast.isExpanded = false;
        }
        this.pollData = pollData;
        this.headerData = [
            {
                sorted: false,
                ascending: false,
                key: 'state'
            },
            {
                sorted: false,
                ascending: false,
                key: 'margin',
                alterFunc: d => Math.abs(+d)
            },
            {
                sorted: false,
                ascending: false,
                key: 'winstate_inc',
                alterFunc: d => +d
            },
        ]

        this.vizWidth = 300;
        this.vizHeight = 30;
        this.smallVizHeight = 20;

        this.scaleX = d3.scaleLinear()
            .domain([-100, 100])
            .range([0, this.vizWidth]);
        
        this.xAxis = d3.axisBottom();
        this.xAxis.scale(this.scaleX).tickValues([-75, -50, -25, 0, 25, 50, 75]);

        this.attachSortHandlers();
        this.drawLegend();
    }

    drawLegend() {
        ////////////
        // PART 2 // 
        ////////////
        /**
         * Draw the legend for the bar chart.
         */
        

        d3.select('#marginAxis')
            .attr('width',this.vizWidth)
            .attr('height',this.vizHeight)
            
            .call(this.xAxis)

        .selectAll('text')
            .join()
            .text(d => {
                if (d > 0){
                    return '+' + d
                }
                else if (d < 0){
                    return '+' + d * -1
                }
                else {
                    return ''
                }
            })
            .attr('class',d => d > 0 ? 'trump': 'biden')
            .style('font-size',15)
            
        //Remove the axis line

        d3.select('#marginAxis')
            .call(g => g.select('.domain').remove()) 

        // Set all line heights to 0 except the middle one

        d3.select('#marginAxis').selectAll('g').select('line')
            .attr('y2', d => d == 0 ? '30': '0')
    }

    drawTable() {
        // Show the data
        
        //
        this.updateHeaders(); // Part 7
        let rowSelection = d3.select('#predictionTableBody') // This adds a row for each state
            .selectAll('tr')
            .data(this.tableData)
            .join('tr');

        rowSelection.on('click', (event, d) =>  // I assume this is to add rows when clicking on a state for the polling groupings
            {
                if (d.isForecast)
                {
                    this.toggleRow(d, this.tableData.indexOf(d)); // Part 8
                }
            });

        let forecastSelection = rowSelection.selectAll('td') // Add the columns
            .data(this.rowToCellDataTransform)
            .join('td')
            .attr('class', d => d.class);

        ////////////
        // PART 1 // 
        ////////////
        /**
         * with the forecastSelection you need to set the text based on the dat value as long as the type is 'text'
         */

         // Show SVG Viz's
        let vizSelection = forecastSelection.filter(d => d.type === 'viz');
        
        // vizSelection.selectAll('svg').remove()
        let svgSelect = vizSelection.selectAll('svg')
            .data(d => [d])     
            .join('svg')
            .attr('width', this.vizWidth)
            .attr('height', d => d.isForecast ? this.vizHeight : this.smallVizHeight);
            // .attr('preserveAspectRatio','none');

        let grouperSelect = svgSelect.selectAll('g')
            .data(d => [d, d, d])
            .join('g');

        this.addGridlines(grouperSelect.filter((d,i) => i === 0), [-75, -50, -25, 0, 25, 50, 75]);
        this.addRectangles(grouperSelect.filter((d,i) => i === 1));
        this.addCircles(grouperSelect.filter((d,i) => i === 2));

        // Show Text

        let textSelection = forecastSelection.filter(d => d.type == 'text');
        
        textSelection
            .text(d => d.value)
            
    }

    rowToCellDataTransform(d) {
        let stateInfo = {
            type: 'text',
            class: d.isForecast ? 'state-name' : 'poll-name', // Adding classes
            value: d.isForecast ? d.state : d.name // I am not sure what d.name is referring to here @todo
        };

        let marginInfo = {
            type: 'viz',
            value: {
                marginLow: +d.margin_lo,
                margin: +d.margin,
                marginHigh: +d.margin_hi,
            }
        };
        let winChance;
        if (d.isForecast)
        {
            const trumpWinChance = +d.winstate_inc;
            const bidenWinChance = +d.winstate_chal;

            const trumpWin = trumpWinChance > bidenWinChance;
            const winOddsValue = 100 * Math.max(trumpWinChance, bidenWinChance);
            let winOddsMessage = `${Math.floor(winOddsValue)} of 100`
            if (winOddsValue > 99.5 && winOddsValue !== 100)
            {
                winOddsMessage = '> ' + winOddsMessage
            }
            winChance = {
                type: 'text',
                class: trumpWin ? 'trump' : 'biden',
                value: winOddsMessage
            }
        }
        else
        {
            winChance = {type: 'text', class: '', value: ''}
        }

        let dataList = [stateInfo, marginInfo, winChance];
        for (let point of dataList)
        {
            point.isForecast = d.isForecast;
        }
        return dataList;
    }

    updateHeaders() {
        ////////////
        // PART 7 // 
        ////////////
        /**
         * update the column headers based on the sort state
         */
        //Completed this portion in part 6
    }

    addGridlines(containerSelect, ticks) {
        ////////////
        // PART 3 // 
        ////////////
        /**
         * add gridlines to the vizualization
         */
      
        // Color all lines except the middle @todo Eliminate spaces between the lines to make it appear like there is a continuous line
        
        containerSelect.selectAll('line') 
            .data(ticks)
            .join('line')
            
            .attr('x1',d => this.scaleX(d))
            .attr('y1',0)
            .attr('x2',d => this.scaleX(d))
            .attr('y2','30')
            .style('stroke',d => d == 0? 'black': 'gray')
    }

    addRectangles(containerSelect) {
        ////////////
        // PART 4 // 
        ////////////
        /**
         * add rectangles for the bar charts
         */

        d3.selectAll('rect').remove()
        function UpdateMargins(marginLow, marginHigh, candidate, scaleFunction){
            if (candidate == 'biden'){
                return [scaleFunction(marginLow),scaleFunction(0)]
            } else if (candidate == 'trump') {
                return [scaleFunction(0),scaleFunction(marginHigh)]
            }
            else {
                return [scaleFunction(marginLow), scaleFunction(marginHigh)]
            }
        }

        // Append Biden rectangles in the middle
        containerSelect.filter(d => d.value.marginLow < 0 && d.value.marginHigh >= 0)
            .data(d => [d])
            .append('rect')
            .attr('x', d => {
                if (d == 0) {
                    return this.scaleX(0)
                }
                else {
                    return this.scaleX(d.value.marginLow)
                }
            })
            .attr('y',5)
            .attr('width', d => {
                return UpdateMargins(d.value.marginLow,d.value.marginHigh,'biden', this.scaleX)[1] //High
                - 
                UpdateMargins(d.value.marginLow,d.value.marginHigh,'biden', this.scaleX)[0] //Low
            })
            .attr('height', this.smallVizHeight)

            .classed('biden',true)
            .style('opacity',.5)
        
        // Append Trump rectangles in the middle
        containerSelect.filter(d => d.value.marginLow < 0 && d.value.marginHigh >= 0)
            .data(d => [d])
            .append('rect')
            .attr('x', d => UpdateMargins(d.value.marginLow,d.value.marginHigh,'trump', this.scaleX)[0])
            .attr('y',5)
            .attr('width', d => {
                return UpdateMargins(d.value.marginLow,d.value.marginHigh,'trump', this.scaleX)[1] //High
                - 
                UpdateMargins(d.value.marginLow,d.value.marginHigh,'trump', this.scaleX)[0] //Low
            })
            .attr('height', this.smallVizHeight)
            .classed('trump',true)
            .style('opacity',.5)
        
        // // Append Both Candidate Rectangles
        containerSelect.filter(d => (d.value.marginLow <= 0 && d.value.marginHigh <= 0) || (d.value.marginLow > 0 && d.value.marginHigh > 0)) // @todo Can I put the boolean in a variable?
            .selectAll('rect')
            .data(d => [d])
            .join('rect')
            // .append('rect')
            .attr('x', d => UpdateMargins(d.value.marginLow,d.value.marginHigh,'all', this.scaleX)[0])
            .attr('y',5)
            .attr('width', d => {
                return UpdateMargins(d.value.marginLow,d.value.marginHigh,'all', this.scaleX)[1] //High
                - 
                UpdateMargins(d.value.marginLow,d.value.marginHigh,'all', this.scaleX)[0] //Low
            })
            .attr('height', this.smallVizHeight)
            .attr('class',d => d.value.marginHigh <= 0 ? 'biden':'trump')
            .style('opacity',.5)    
 
    }

    addCircles(containerSelect) {
        ////////////
        // PART 5 // 
        ////////////
        /**
         * add circles to the vizualizations
         */
        d3.selectAll('circle').remove()
        containerSelect
            .data(d => [d])
            .append('circle')
            .attr('cx', d => this.scaleX(d.value.margin))
            .attr('cy',15)
            .attr('r',d => d.isForecast ? 5 : 3.5)
            .attr('class', d => d.value.margin <= 0? 'biden':'trump')
            .attr('stroke','black')


    }

    attachSortHandlers() 
    {
        ////////////
        // PART 6 // 
        ////////////
        /**
         * Attach click handlers to all the th elements inside the columnHeaders row.
         * The handler should sort based on that column and alternate between ascending/descending.
         */
        // <tr id="columnHeaders">
        // <th class="sortable">State <i class="fas no-display"></i></th>
        // <th class="sortable">Margin of Victory <i class="fas no-display"></i></th>
        // <th class="sortable">Wins <i class="fas no-display"></i></th>
        
        d3.select('#columnHeaders').selectAll('th')
            .data(this.headerData)
            .attr('id', d => d.key)
    
        // Sort state
        d3.select('#state')
            .on('click', (event, d) =>
            {
                let ascending_flag = d.ascending == false ? 1 : -1;
                d.ascending = d.ascending == false ? true : false;

                // Clear styling
                d3.selectAll('i')
                    .attr('class','fas no-display')

                d3.selectAll('th')
                    .classed('sorting',false)
                
                // Add styling

                d3.select('#state')
                    .classed('sorting',true)
                    .select('i')
                    .attr('class', ascending_flag == 1 ? 'fas fa-sort-up' : 'fas fa-sort-down' )


                this.tableData.sort((a, b) =>
                {
                  if (a.state > b.state)
                  {
                    return 1 * ascending_flag;
                  }
                  else if (a.state < b.state) {
                    return -1 * ascending_flag;
                  }
                  return 0;
                })
                this.collapseAll()
                this.drawTable()
            });
        
        // Sort Wins
            d3.select('#winstate_inc')
                .on('click', (event, d) =>
                {
                    let ascending_flag_win = d.ascending == false ? 1 : -1;
                    d.ascending = d.ascending == false ? true : false;
                    
                // Clear styling
                d3.selectAll('i')
                    .attr('class','fas no-display')

                d3.selectAll('th')
                    .classed('sorting',false)
                
                // Add styling

                d3.select('#winstate_inc')
                    .classed('sorting',true)
                    .select('i')
                    .attr('class', ascending_flag_win == 1 ? 'fas fa-sort-up' : 'fas fa-sort-down' )

                    this.tableData.sort((a, b) =>
                    {
                      if (d.alterFunc(a.margin) > d.alterFunc(b.margin))
                      {
                        return 1 * ascending_flag_win;
                      }
                      else if (d.alterFunc(a.margin) < d.alterFunc(b.margin)) {
                        return -1 * ascending_flag_win;
                      }
                      return 0;
                    })        ;
                this.collapseAll()
                this.drawTable();
              });

        // Sort Margin of Victory
        d3.select('#margin')
        .on('click', (event, d) =>
        {
            let ascending_flag_win = d.ascending == false ? 1 : -1;
            d.ascending = d.ascending == false ? true : false;

                // Clear styling
                d3.selectAll('i')
                    .attr('class','fas no-display')

                d3.selectAll('th')
                    .classed('sorting',false)
                
                // Add styling

                d3.select('#margin')
                    .classed('sorting',true)
                    .select('i')
                    .attr('class', ascending_flag_win == 1 ? 'fas fa-sort-up' : 'fas fa-sort-down' )

            this.tableData.sort((a, b) =>
            {
              if (d.alterFunc(a.margin) > d.alterFunc(b.margin))
              {
                return 1 * ascending_flag_win;
              }
              else if (d.alterFunc(a.margin) < d.alterFunc(b.margin)) {
                return -1 * ascending_flag_win;
              }
              return 0;
            })        ;
        this.collapseAll()    
        this.drawTable();
      });
              
    }


    toggleRow(rowData, index) { 
        ////////////
        // PART 8 // 
        ////////////
        /**
         * Update table data with the poll data and redraw the table.
         */
        // console.log(this.tableData.isExpanded)
        console.log(this.pollData.get(rowData.state))


        if (this.pollData.get(rowData.state) && rowData['isExpanded'] == false){
            
            this.tableData.splice(index+1,0, ...this.pollData.get(rowData.state))
            rowData.isExpanded = true
            this.drawTable()
        } else {
            if (rowData.isExpanded == true){
                this.tableData.splice(index+1, this.pollData.get(rowData.state).length)
                rowData.isExpanded = false
                this.drawTable();
            }
    

        }

    }

    collapseAll() {
        this.tableData = this.tableData.filter(d => d.isForecast)
    }

}
