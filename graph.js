function Graph(title, config){
  //for internal functions
  var self = this;
  this.title = title;
  //flatten the data points into lists of x and y to find mins and maxes
  this.flatten = function(data){
    var x = [];
    var y = []
    for(var i = 0; i< data.length; i++){
      x.push(data[i][0])
      y.push(data[i][1])
    }
    return {x:x,y:y}
  }
  //change an unix epoch time to a date
   this.epoch = function(epoch){
    return new Date(epoch);
  }
  //set the parameters for the graph passed to the graph function
  this.configure = function(){
    this.config = config;
    this.config.width = this.config.width ? this.config.width : 600;
    this.config.height = this.config.height ? this.config.height : 360;
    this.config.xAxis = this.config.width * (0.9);
    this.config.yAxis = this.config.height * (5/6);
    this.config.marginTop = this.config.height * (1/6);
    this.config.marginLeft = this.config.width * (0.1);
    //update rate in ms
    this.config.updateRate = this.config.updateRate? this.config.updateRate : 6000
  }
  //call the configuration of the graph

  this.configure();
  //create the body selector for the graph to be drawn on
  this.body = d3.select("#canvas")
                .append("svg")
                .attr('width', this.config.width)
                .attr('height', this.config.height);


  this.update = function(parameters){
    //calls the update function from with update with new parameters
    function recurse(scroll){

       pathData.shift();
       if(scroll){
         oldPathData.shift()
       }
       var newParams = parameters;
       newParams.oldData = oldPathData;
       newParams.data = pathData;
       newParams.xscale = xScale;
       newParams.yscale = yScale;
       newParams.linegen = genLine;
       self.update(newParams);
     }
    //creates a point from a given data x and y and calls pulse animation
    function makePoint(points,scroll,callback){

       var nodes = self.body.selectAll('circle').data(points).enter();

        nodes.append('circle')
               .attr('class', function(d){return 'node' + d[0].toString()})
               .attr('cx', function(d){return xScale(self.epoch(d[0]))})
               .attr('cy', function(d){return yScale(d[1])})
               .attr('r', 3)
               .attr('fill', 'red')
               .attr('stroke', 'red')

     callback('node' + points[points.length-1][0].toString())
    }

    //gets next point for the live graph
    function getNext(){
     return [Date.now(), Math.random()*Math.random()*50]

   }
   //pulse animation for new point could be reworked to be smoother
   function pulse(clss,scroll){
        var point = self.body.select('.' + clss)
        point.transition()
             .ease(d3.easeBounce)
             .duration(750)
             .attr('r', 2.5*point.attr('r'))
             .attr('fill', "#ff8484")
             .attr('stroke',"#ff8484")
             .transition()
             .duration(500)
             .ease(d3.easeLinear)
             .attr('fill', 'red')
             .attr('stroke', 'red')
             .attr('r', point.attr('r'))
             .on('end', function(){recurse(scroll)})
   }
    if(parameters){
    var xScale = parameters.xscale;
    var yScale = parameters.yscale;
    var pathData = parameters.data;
    var oldPathData = parameters.oldData;
    var genLine = parameters.linegen;
    var point = getNext();
    pathData.push(point)

    //resize the xScale using a smooth path transition to keep y steady
    if(this.epoch(point[0]) > xScale.domain()[1]){
    //Need to figure this out!!!!!
    }
    //resize the yScale
    else if(point[1] > yScale.domain()[0] || point[1] < yScale.domain()[1]){
      //check if new point is bigger or smaller than the domain
      if(point[1] < 0){
        var max = yScale.domain()[0];
        yScale.domain([max, point[1]])
      }
      else{
        yScale.domain([point[1],0])
      }

      //resize the yAxis
      this.body.select('.yAxis')
               .transition()
               .duration(750)
               .call(d3.axisLeft(yScale));
     //move the points on the chart with the yAxis
     var points = this.body.selectAll('circle')
                           .data(oldPathData)
                           .transition()
                           .duration(750)
                           .attr('cy', function(d){return yScale(d[1])});
      //create a new line generator for the new yscale
      genLine = d3.line().curve(d3.curveLinear)
         .x(function(d){ return xScale(self.epoch(d[0]))})
         .y(function(d){ return yScale(d[1])});
     //remove the old path generated with the old scale
     this.body.selectAll('.stroke').remove();
      //redraw the old path
     this.body.append('path')
              .attr('class', 'stroke')
              .transition()
              .duration(750)
              .attr('d',genLine(oldPathData))
              .attr('fill', 'none')
              .attr('stroke-width', 2)
              .attr('stroke', 'blue');
     //draw the new path to the new point
     this.path = this.body.append('path')
                        .attr('class', 'stroke')
                        .attr('d', genLine(pathData))
                        .attr('fill', 'none')
                        .attr('stroke-width', 2)
                        .attr('stroke', 'blue');

     var totalLength = this.path.node().getTotalLength();

     //add the new point to oldData
     oldPathData.push(point)
     //animate the drawing of a path
     this.path
        .attr("stroke-dasharray", totalLength + " " + totalLength)
        .attr("stroke-dashoffset", totalLength)
        .transition()
          .duration(2000)
          .ease(d3.easeLinear)
          .attr("stroke-dashoffset", 0)
          .on('end', function(){makePoint(oldPathData,false, pulse)} )

    }
   //plot next graph point without resizing
   else{
    oldPathData.push(point)



     this.path = this.body.append('path')
                        .attr('class', 'stroke')
                        .attr('d', genLine(pathData))
                        .attr('fill', 'none')
                        .attr('stroke-width', 2)
                        .attr('stroke', 'blue');

     var totalLength = this.path.node().getTotalLength();
     //animate the drawing of a path

     this.path
        .attr("stroke-dasharray", totalLength + " " + totalLength)
        .attr("stroke-dashoffset", totalLength)
        .transition()
          .duration(2000)
          .ease(d3.easeLinear)
          .attr("stroke-dashoffset", 0)
          .on('end', function(){makePoint(oldPathData,false, pulse)} )



   }
    }
    //for non live update takes new data and plots it
    else{console.log("TODO nonlive")}



    }


  //render first frame of the graph live or stored
  this.render = function(newPoint){
    //if given data assume stroed graph
    if(this.config.data){
    this.displayData = this.config.data;
     //flatten data for min and max calculation
     var flatData = this.flatten(this.displayData);
      //xScale for stored graph
      this.xScale = d3.scaleTime().domain([self.epoch(flatData.x[0]), self.epoch(flatData.x[flatData.x.length-1])]).range([this.config.marginLeft,this.config.xAxis]);
      //yScale for stored graph
     this.yScale = d3.scaleLinear().domain([ Math.max(...flatData.y) ,0]).range([this.config.marginTop, this.config.yAxis]);
   //line Generator
   this.genLine = d3.line().curve(d3.curveLinear)
         .x(function(d){ return self.xScale(self.epoch(d[0]))})
         .y(function(d){ return self.yScale(d[1])});
   //draw xAxis
   this.xAxis = this.body.append('g')
                         .attr('class', 'xAxis')
                         .call(d3.axisBottom(this.xScale))
                         .attr('transform', 'translate(0,'+(this.config.yAxis)+')');

   //draw yaxis
   this.yAxis = this.body.append('g')
                         .attr('class', 'yAxis')
                         .call(d3.axisLeft(this.yScale))
                         .attr('transform', 'translate('+this.config.marginLeft+',0)');


   //draw points of the stored grpah
   this.body.selectAll('circle')
            .data(this.displayData)
            .enter()
            .append('circle')
            .attr('cx', function(d){return self.xScale(self.epoch(d[0]))})
            .attr('cy', function(d){return self.yScale(d[1])})
            .attr('r', 3)
            .attr('fill', 'red')
            .attr('stroke', 'red');
    //draw path of the stored graph
    this.body.append('path')
             .attr('stroke-width', 1)
             .attr('stroke', 'blue')
             .attr('fill', 'none')
             .attr('d', this.genLine(this.displayData))
             .on('end', function(){self.update(self.params)})

    }
    else{
      //xscale for live graph intial point is always at 20% of the xScale
     this.xScale = d3.scaleTime().domain([self.epoch(newPoint[0] - this.config.updateRate), self.epoch(newPoint[0] + (4*this.config.updateRate))]).range([this.config.marginLeft,this.config.xAxis]);
      //yscale for the live graph intial point is always at 25% of the yScale
    this.yScale = d3.scaleLinear().domain([newPoint[1]*3,0 ]).range([this.config.marginTop,this.config.yAxis]);
    //line generator
    this.genLine = d3.line().curve(d3.curveLinear)
         .x(function(d){ return self.xScale(self.epoch(d[0]))})
         .y(function(d){ return self.yScale(d[1])});
    //draw live graph x axis
    this.xAxis = this.body.append('g')
                         .attr('class', 'xAxis')
                         .call(d3.axisBottom(this.xScale))
                         .attr('transform', 'translate(0,'+(this.config.yAxis)+')');

   //draw live graph y axis
   this.yAxis = this.body.append('g')
                         .attr('class', 'yAxis')
                         .call(d3.axisLeft(this.yScale))
                         .attr('transform', 'translate('+this.config.marginLeft+',0)');
   //make newPoint into an array called pathData
   //to hold the two points the line is being drawn between.
   var pathData = [newPoint]
   //to hold all of the previuos path data
   var oldPathData = [newPoint]


   //create the intial point
   this.point = self.body.append('circle')
               .attr('cx', self.xScale(self.epoch(newPoint[0])))
               .attr('cy', self.yScale(newPoint[1]))
               .attr('r', 3)
               .attr('fill', 'red')
               .attr('stroke', 'red');
      //params to be passed to update after pulse
      this.params = {oldData: oldPathData ,data: pathData, xscale: this.xScale, yscale: this.yScale, linegen: this.genLine, currentPoint: newPoint}
      //pulse animation for intial point calls update as a callback
      this.pulse = function(point){
        point.transition()
             .ease(d3.easeBounce)
             .duration(750)
             .attr('r', 2.5*point.attr('r'))
             .attr('fill', "#ff8484")
             .attr('stroke',"#ff8484")
             .transition()
             .duration(500)
             .ease(d3.easeLinear)
             .attr('fill', 'red')
             .attr('stroke', 'red')
             .attr('r', point.attr('r'))
             .on('end', function(){self.update(self.params)} )

       }
       //call pulse
       this.point.call(this.pulse);


      }






   }
}


function genData(pairs){
  var data = [];
  for(var i = 0; i < pairs; i++){
    data.push([Date.now()+(i*200),Math.random()*i]);
  }
  return data

}
var data = genData(120);


var config = {updateRate: 6000}
var graph = new Graph('test', config);
graph.render([Date.now(), Math.round(Math.random()*20)]);
