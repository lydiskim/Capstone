"use strict";

jQuery(document).ready(function() {

  var data_temper = [0];
  var data_co2 = [0];
  var data_api = [0];
  /* Graph Related Variables */
  var color = d3.scale.category10();
  color.domain(['Sensor']);
  var series = color.domain().map(function(name){
    return {
      name : 'Sensor',
      values : data_temper
    };
  });
  var MAX_DATA = 60;
  var x = null;
  var y = null;
  var line = null;
  var graph = null;
  var xAxis = null;
  var yAxis = null;
  var ld = null;
  var path = null;
  var recent_ri = 0;
  var container_name = 'myContainer';
  getConfig( function(err,config) {
    if(data) container_name = config.containerName;
  });

  function createGraph(id) {
    color.domain('Sensor');
    var width = document.getElementById("graph").clientWidth;
    var height = document.getElementById("graph").clientHeight;
    var margin = {top: 10, right: 50, bottom: 20, left: 10};
 
    width = width - margin.left - margin.right;
    height = height - margin.top - margin.bottom;

    // create the graph object
    graph = d3.select(id).append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    x = d3.scale.linear()
      .domain([0, MAX_DATA])
      .range([width, 0]);
    y = d3.scale.linear()
      .domain([
        d3.min(series, function(l) { return d3.min(l.values, function(v) { return v*0.75; }); }),
        d3.max(series, function(l) { return d3.max(l.values, function(v) { return v*1.25; }); })
      ])
      .range([height, 0]);
    //add the axes labels
    graph.append("text")
        .attr("class", "axis-label")
        .style("text-anchor", "end")
        .attr("x", 20)
        .attr("y", height)
        .text('Date');



    line = d3.svg.line()
      .x(function(d, i) { return x(i); })
      .y(function(d) { return y(d); });

    xAxis = graph.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.svg.axis().scale(x).orient("bottom"));

    yAxis = graph.append("g")
      .attr("class", "y axis")
      .attr("transform", "translate(" + width + ",0)")
      .call(d3.svg.axis().scale(y).orient("right"));

    ld = graph.selectAll(".series")
      .data(series)
      .enter().append("g")
      .attr("class", "series");

    // display the line by appending an svg:path element with the data line we created above
    path = ld.append("path")
      .attr("class", "line")
      .attr("d", function(d) { return line(d.values); })
      .style("stroke", function(d) { return color(d.name); });
  }

  function updateGraph() {
    // static update without animation
    y.domain([
      d3.min(series, function(l) { return d3.min(l.values, function(v) { return v*0.75; }); }),
      d3.max(series, function(l) { return d3.max(l.values, function(v) { return v*1.25; }); })
    ]);
    yAxis.call(d3.svg.axis().scale(y).orient("right"));

    path
      .attr("d", function(d) { return line(d.values); })
  }

  function getConfig(cb) {
    var url = '/config';
    $.get(url, function(data, status){
      if(status == 'success'){
        cb(null, data);
      }
      else {
        console.log('[Error] /config API return status :'+status);
        cb({error: status}, null);
      }
    });
  }

  function getData(container, cb) {
    var url = '/data/' + container;
    $.get(url, function(data, status){
      if(status == 'success'){
        var value = data.con;       // createCententInstance의 body에 con이라는 멤버변수
        var ri = parseInt(data.ri.slice(2, data.ri.length));
        if(ri > recent_ri){
          recent_ri = ri;
        }
        cb(null, value);
      }
      else {
        console.log('[Error] /data API return status :'+status);
        cb({error: status}, null);
      }
    });
  }

  function displayData() {
    $('#temp_value')[0].innerText = data_temper[0];
    $('#co2_value')[0].innerText = data_co2[0];
    $('#api_value')[0].innerText = data_api[0];
    $('#temp_time')[0].innerText = new Date().toLocaleString();
    if(data_temper[0] >= 35 && data_co2[0] >= 2000){
        $('#current_status')[0].innerText = "위험";
    }
    else{
        $('#current_status')[0].innerText = "정상";
    }
  }
  function insertNewData(value){
    if(data_temper.length == MAX_DATA){
      data_temper.pop();
      data_co2.pop();
      data_api.pop();
    }
    data_temper.splice(0,0,JSON.parse(value)['temp']);
    data_co2.splice(0,0,JSON.parse(value)['co2']);
    data_api.splice(0,0,JSON.parse(value)['api_value']);
  }

  function initToastOptions(){
    toastr.options = {
      "closeButton": true,
      "debug": false,
      "newestOnTop": false,
      "progressBar": true,
      "positionClass": "toast-bottom-full-width",
      "preventDuplicates": false,
      "onclick": null,
      "showDuration": "3000",
      "hideDuration": "10000",
      "timeOut": "2000",
      "extendedTimeOut": "1000",
      "showEasing": "swing",
      "hideEasing": "linear",
      "showMethod": "fadeIn",
      "hideMethod": "fadeOut"
    }
  }

  initToastOptions();
  createGraph('#graph'); 
  setInterval(function(){
    getData(container_name, function(err,data){
      insertNewData(data);  // data in here is cb's data (cb : function의 정체)
    });
    displayData();
    updateGraph();
  }, 1000);

  /*
  $('#ac_on_btn').on('click', function(event) {
    $.post('/control', {cmd:'on'}, function(data,status){
      toastr.success('Aircon On');
      console.log(data);
    });
  });
  $('#ac_off_btn').on('click', function(event) {
    $.post('/control', {cmd:'off'}, function(data,status){
      toastr.info('Aircon Off');
      console.log(data);
    });
  });
  */

});
