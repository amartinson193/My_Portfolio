/** Class representing a Tree. */
class Tree {
    /**
     * Creates a Tree Object
     * Populates a single attribute that contains a list (array) of Node objects to be used by the other functions in this class
     * note: Node objects will have a name, parentNode, parentName, children, level, and position
     * @param {json[]} json - array of json objects with name and parent fields
     */
    constructor(json) {
        this.json = json
        this.node_list = []
        this.max_position = 0
        this.viz = 'viz'
        // Instantiate the node class and add it to the node list
        for (let node of this.json) {
            let node_object = new Node(node["name"],node["parent"]);
            this.node_list.push(node_object);
        }

        // This adds the parent nodes
        for (let node_name of this.node_list) {
            for (let node_parent of this.node_list) {
                if (node_name["parentName"] === node_parent["name"]){
                    node_name.parentNode = node_parent
                }
            }
        }

        // This add the child nodes
        for (let node_name of this.node_list) {
            for (let node_parent of this.node_list) {
                if (node_name["name"] === node_parent["parentName"]){
                    node_name.children.push(node_parent)
                }
            }
        }
    }
    
    /**
     * Function that builds a tree from a list of nodes with parent refs
     */
    buildTree() {
        // note: in this function you will assign positions and levels by making calls to assignPosition() and assignLevel()
        // Assign the level + positions
        let max_position = 0
        let countr = 0
        for (let node of this.node_list)
            if (node["parentName"]==="root") {
                this.assignLevel(node,0);
                this.assignPosition(node,0,0);
            }

        // Find the max level;
        // let i = 0;
        // let max_level = 0;
        // let position = 0;
        // for (let node of this.node_list){
        //     if (node.level > max_level){
        //         max_level = node.level
        //     }
        // }
        
        // while (i <= max_level) {
        //     for (let node of this.node_list){
        //         if (node.level === i){
        //             node.position = position
        //             position += 1
        //         }
        //     }
        //     i += 1
        //     position = 0
        // }
        // Print the list
        console.log(this.node_list);
}

    /**
     * Recursive function that assign levels to each node
     */
    assignLevel(node, level) {
        node.level = level // initally sets to 0  
        for (let child_node of node.children){
            this.assignLevel(child_node, level + 1);
        }
    }

    /**
     * Recursive function that assign positions to each node
     */
    assignPosition(node, position) {  
        node.position = position
        console.log(node.name, "has been given a position of ", position)
        for (let child_no in node.children){
            if (child_no == 0){
                this.assignPosition(node.children[child_no], position);
            }
            else {
                // Find the max position
                let max_position = 0
                let node_ = ''
                for (node_ of this.node_list){
                    if (node_.position > max_position){
                        max_position = node_.position
                    }
                }
                this.assignPosition(node.children[child_no], max_position + 1);
            }
        }
    }

    /**
     * Function that renders the tree
     */
    renderTree() {
        this.viz = d3.select("body");
        this.viz.append("svg").attr('height',1200).attr("width",1200)
        let svg = d3.select("svg");
        
        let add_loc = 1
        let level_mult = 125
        let position_mult = 100
        
        let line_selection = svg.selectAll("line").data(this.node_list);
        
        line_selection
        .join("line");

        let line = d3.selectAll("line");
        line
            .attr("x1", function sort(d){
                            if (d.parentName === 'root'){
                                return (d.level + add_loc) * level_mult
                            }
                            else {
                                return (d.parentNode.level + add_loc) * level_mult
                            }
                        }
            )
            .attr("y1", function sort(d){
                            if (d.parentName === 'root'){
                                return (d.position + add_loc) * position_mult
                            }
                            else {
                                return (d.parentNode.position + add_loc) * position_mult
                            }
                        }
            )
            .attr("x2", d => (d.level + add_loc) * level_mult)
            .attr("y2", d => (d.position + add_loc) * position_mult);

        let selection = svg.selectAll("g").data(this.node_list);
  
        selection
          .join("g")
          .attr("class","nodeGroup");
          
        let group = d3.selectAll("g");

        group.append("circle")
            .attr("cx", d => (d.level + add_loc) * level_mult) 
            .attr("cy", d => (d.position + add_loc) * position_mult)
            .attr("r", 40);
            
        
        group.append("text")
            .attr("x", function(d) { return (d.level + add_loc) * level_mult; })
            .attr("y", function(d) { return (d.position + add_loc) * position_mult; })
            .attr("class","label")
            .html(d => d.name)
        
        group.attr("transform", d => "translate (1 1)") 
    }

}