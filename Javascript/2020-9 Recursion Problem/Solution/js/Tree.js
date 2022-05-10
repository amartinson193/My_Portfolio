/** Class representing a Tree. */
class Tree {
  /**
     *  Creates a Tree Object
     *  Populates a single attribute that contains a list (array) of Node objects to be used by the other functions in this class
     *  note: Node objects will have a name, parentNode, parentName, children, level, and position
     * @param {json[]} json - array of json object with name and parent fields
     */
    constructor(json) {
        // Create an array of newly instantiated node objects
        this.nodes = json.map(n => {
            return new Node(n.name, n.parent);
        });

        console.log(this.nodes)

        // Iterate through array and populate with parentNodes
        //	note: may be integrated into buildTree()
        this.nodes.forEach(node => {
            node.parentNode = this.nodes.find(n => {
                return n.name === node.parentName;
            });
        });
    }

    /**
     * Function that builds a tree from a list of nodes with parent refs
     */
    buildTree() {

        // Populate children
        this.nodes.forEach(n => {	
            console.log("n", n)			// for each node
            if (n.parentNode !== undefined) { 	// if parentNode exists
                n.parentNode.addChild(n); 		// add node as child to parentNode
            }
        });

        // Find root
        let root = this.nodes.find(n => {
            return !n.parentNode;
        });

        // Assign levels and positions to each node, starting at root
        this.assignLevel(root, 0);
        this.assignPosition(root, 0);

        // For generating nodeStructure image
        // console.log(this.nodes[2]);

        // For generating wrong image
        // this.nodes.filter(n => n.level === 3).forEach(n => n.position = n.position-2)
    }

    /**
     * Recursive function that assign levels to each node
     */
    assignLevel(node, level) {
        // Assign level
        node.level = level;

        // Recursively call assignLevel on this node's children;
        node.children.forEach(n => {
            this.assignLevel(n, level + 1);
        });
    }

    /**
     * Recursive function that assign positions to each node
     */
    // Better Solution
    assignPosition(node, position) {
        node.position = position;
        if (node.children.length === 0) return ++position;

        node.children.forEach((child) => {
            position = this.assignPosition(child, position);
        });

        return position;
    }

    /**
     * Function that renders the tree
     */
    renderTree() {
        // ----------- Custom -----------
        // Convenience structure for updating variables (not required)
        let custom_vars = {
            x_scale: 160,
            y_scale: 100,
            x_offset: 50,
            y_offset: 50,
            radius: 43
        };

        // ----------- Initalize SVG -----------
        // Create svg if it doesn't already exist										(!) Lab Discussion 1 -- Explain why this check exists
        let svg = d3.select('#container');

        if (svg.size() === 0) {
            svg = d3.select('body')
                .append('svg')
                .attr('id', 'container');
        }

        // Style svg
        svg.attr('width', 1200)
            .attr('height', 1200);

        // ----------- Render Edges -----------

        //(!) Lab Discussion 2 -- Update, Enter, Exit Loop
        
        ///New d3V5 data binding///
        let allEdges = svg.selectAll('line')
            .data(this.nodes.filter(n => {
                return n.parentNode;
            })).join('line');

        // Update properties according to data
        allEdges.attr('x1', n => {
            return n.level * custom_vars.x_scale + custom_vars.x_offset;
        })
            .attr('x2', n => {
                return n.parentNode.level * custom_vars.x_scale + custom_vars.x_offset;
            })
            .attr('y1', n => {
                return n.position * custom_vars.y_scale + custom_vars.y_offset;
            })
            .attr('y2', n => {
                return n.parentNode.position * custom_vars.y_scale + custom_vars.y_offset;
            });

        /**
         *  This is an update to for the homework, designed to provide more experience
         *  with nesting structures...  -- required for full credit
         *                                                                             */
        // ----------- Render Nodes (Full Credit) -----------
        //Existing(Update) Selection
        let allNodeGroups = svg.selectAll('.nodeGroup')
            .data(this.nodes).join('g').classed('nodeGroup', true);

        // Update properties according to data											(!) Lab Discussion 3 -- Judicious Use of Groups, SVG Order importance
        allNodeGroups
            .attr("transform", d => {
                    return "translate("
                        + (d.level * custom_vars.x_scale + custom_vars.x_offset) // x position
                        + ","
                        + (d.position * custom_vars.y_scale + custom_vars.y_offset) // y position
                        + ")"
                }
            );

        console.log(allNodeGroups)

        // -- Add circles to each group
        allNodeGroups.append("circle")
            .attr("r", custom_vars.radius);

        // -- Add text to each group
        allNodeGroups.append("text")
            .attr("class", "label")
            .text(d => {
                return d.name.toUpperCase();
            }); 
        // For generating node position image 
        // .text(d => {
        //     return d.level+","+d.position;
        // }); 
    }

}