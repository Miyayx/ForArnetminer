//
// site.js
//
// the arbor.js website
//
(function($){
 // var trace = function(msg){
 //   if (typeof(window)=='undefined' || !window.console) return
 //   var len = arguments.length, args = [];
 //   for (var i=0; i<len; i++) args.push("arguments["+i+"]")
 //   eval("console.log("+args.join(",")+")")
 // }  

 var Renderer = function(elt){
 var dom = $(elt)
 var canvas = dom.get(0)
 var ctx = canvas.getContext("2d");
 var gfx = arbor.Graphics(canvas)
 var sys = null

 var _vignette = null
 var selected = null,
 nearest = null,
 _mouseP = null;

 var addP = {};
 var removeP = {};

 var nodeBoxes = {};
var edgeBoxes;

 var intersect_line_node = function(p1, p2, boxTuple)
 {
	 var r = boxTuple[2];
	 var d = Math.sqrt(Math.pow(p2.y-p1.y,2)+Math.pow(p2.x-p1.x,2));
	 var arc = Math.asin(Math.abs(p2.y-p1.y)/d);
	 var offsetY=(r+3)*Math.sin(arc);
	 var offsetX=(r+3)*Math.cos(arc);      	   

	 if(p1.x > p2.x&&p1.y > p2.y)
		 return {x:p1.x-offsetX,y:p1.y-offsetY};
	 else if(p1.x<p2.x&&p1.y>p2.y)
		 return {x:p1.x+offsetX,y:p1.y-offsetY};
	 else if(p1.x>p2.x&&p1.y<p2.y)
		 return {x:p1.x-offsetX,y:p1.y+offsetY};
	 else
		 return {x:p1.x+offsetX,y:p1.y+offsetY};

 }

 var that = {
init:function(pSystem){
	     sys = pSystem;
	     sys.screen({size:{width:dom.width(), height:dom.height()},
			     padding:[36,60,36,60]});
	     $(window).resize(that.resize);
	     that.resize();
	     that._initMouseHandling();
     },
resize:function(){
	       canvas.width =790;
	       canvas.height = $(window).height()*0.95;
	       sys.screen({size:{width:canvas.width, height:canvas.height}})
		       _vignette = null
		       that.redraw()
       },
redraw:function(){

	       // color identify
	       var lineColor = '#23a4ff',
	       imgLineColor =  '#23a4ff',
	       mainImgLineColor = '#ffa500',
	       detailColor = '#23a4ff';
	       gfx.clear();
	       // $("canvas").empty();


	       sys.eachEdge(function(edge, p1, p2){
			       if (edge.source.data.alpha * edge.target.data.alpha == 0) return;
			       if(edge.data.directed&&nodeBoxes.hasOwnProperty(edge.source.name)
				       &&nodeBoxes.hasOwnProperty(edge.target.name) ){

			       // find the start point
			       var tail = intersect_line_node(p1, p2, nodeBoxes[edge.source.name]);
			       var head = intersect_line_node(p2, p1, nodeBoxes[edge.target.name]);
			       ctx.save();
			       ctx.fillStyle = lineColor;			      
			       ctx.lineWidth = edge.data.width;
			       ctx.moveTo(tail.x,tail.y);
			       ctx.lineTo(head.x,head.y);
			       ctx.stroke();
			       //move to the head position of the edge we just drew
			       var wt = ctx.lineWidth
			       var arrowLength = 6 + wt
			       var arrowWidth = 2 + wt
			       ctx.translate(head.x, head.y);
			       ctx.rotate(Math.atan2(head.y - tail.y, head.x - tail.x));

			       // delete some of the edge that's already there (so the point isn't hidden)
			       //   ctx.clearRect(-arrowLength/2,-wt/2, arrowLength/2,wt);
			       // draw the chevron
			       ctx.beginPath();
			       ctx.moveTo(-arrowLength, arrowWidth);
			       ctx.lineTo(0, 0);
			       ctx.lineTo(-arrowLength, -arrowWidth);
			       ctx.lineTo(-arrowLength * 0.8, -0);
			       ctx.closePath();
			       ctx.fill();
			       ctx.restore();
			       }else
				       gfx.line(p1, p2, {stroke:lineColor, width:edge.data.width});
	       })

	       sys.eachNode(function(node, pt){
			       var w = Math.max(20, 20+gfx.textWidth(node.name));
			       if (node.data.alpha===0) return
			       if (node.data.type=='image'){
			       var image ;
			       if(nodeBoxes.hasOwnProperty(node.name)){
			       image = nodeBoxes[node.name].img;
			       }else{
			       image = new Image();
			       image.src = node.data.img.url;
			       nodeBoxes[node.name] = {};
			       nodeBoxes[node.name].img = image;
			       }

			       var label = node.name;
			       var size;
			       if(node.data.main){
			       node.p.x = node.data.xx;
			       node.p.y = node.data.yy;
			       node.fixed = true;
			       size = 90;
			       ctx.strokeStyle = mainImgLineColor;
			       } else{
				       node.fixed = false 
					       ctx.strokeStyle = imgLineColor;
				       size = node.data.img.size;
			       }
			       //
			       //			       image.onerror = function(){
			       //				       this.src = "http://pic.aminer.org/picture/images/no_photo.jpg";
			       //			       }
			       label = node.data.name.substr(0,10);
			       if (node.data.name.length > 10) label += '...';

			       var imgHeight = size,imgWidth = image.width*size/image.height;
			       var radius = Math.min(imgWidth/2,imgHeight/2);
			       if(node.data.moved){
				       ctx.save();
				       ctx.beginPath();
				       ctx.arc(pt.x,pt.y,radius,0, Math.PI * 2, true);
				       ctx.clip();
				       ctx.closePath();
				       ctx.drawImage(image, pt.x-radius,pt.y-size/2,imgWidth,imgHeight);
				       ctx.lineWidth =10; 
				       ctx.stroke();
				       ctx.restore();
				       //ctx.beginPath();
				       //ctx.rect(pt.x-imgWidth/2, pt.y-imgHeight/2, imgWidth, imgHeight);
				       //ctx.closePath();
				       //  ctx.lineWidth = 8;
				       //ctx.stroke();
				       if(node.data.details){
					       var details = node.data.details.split('\n');
					       //var detailPositions= new Array();
					       //detailPositions[1]={x:pt.x-imgWidth/2-gfx.textWidth(details[1])-2,y:pt.y-10};
					       //detailPositions[0]={x:pt.x-gfx.textWidth(details[0])/2,y:pt.y+imgHeight/2+2};
					       //detailPositions[2]={x:pt.x+imgWidth/2+2,y:pt.y-10};

					       //for(var i=0;i<details.length;i++){
					       //        var textLen = gfx.textWidth(details[i]);
					       //        gfx.rect(detailPositions[i].x, detailPositions[i].y, textLen, 20, 4, {fill:ctx.strokeStyle, alpha:node.data.alpha});
					       //        gfx.text(details[i], detailPositions[i].x+textLen/2, detailPositions[i].y+15, {color:"white", align:"center", font:"Arial", size:12});
					       //}
					       var textLen = Math.max(gfx.textWidth(details[0],Math.max(gfx.textWidth(details[1],gfx.textWidth(details[2])))))+20;
					       //var textLen = 80;				       
					       ctx.beginPath();
					       ctx.moveTo(pt.x+radius,pt.y+3);
					       ctx.lineTo(pt.x+radius+8,pt.y);
					       ctx.lineTo(pt.x+radius+textLen,pt.y);
					       ctx.lineTo(pt.x+radius+textLen,pt.y+3*14);
					       ctx.lineTo(pt.x+radius+8,pt.y+3*14);
					       ctx.lineTo(pt.x+radius+8,pt.y+6);
					       ctx.lineTo(pt.x+radius,pt.y+3);
					       ctx.closePath();
					       ctx.fillStyle = ctx.strokeStyle;
					       ctx.fill();
					       ctx.stroke();
					       for(var i=0;i<details.length;i++)
						       gfx.text(details[i],pt.x+radius+3+textLen/2,pt.y+i*14+14,{color:'white',align:'center',font:'Arial',size:12});
				       }

				       var removeImage = new Image();
				       removeImage.src = 'remove.png';
				       removeP.x = pt.x-imgWidth/2;
				       removeP.y = pt.y-imgHeight/2;
				       ctx.drawImage(removeImage,removeP.x,removeP.y);
				       var addImage = new Image();
				       addImage.src = 'add.png';
				       addP.x = pt.x+imgWidth/2-addImage.width;
				       addP.y = pt.y-imgHeight/2;
				       ctx.drawImage(addImage,addP.x,addP.y);
			       }else{
				       nodeBoxes[node.name].x=pt.x;
				       nodeBoxes[node.name].y=pt.y;
				       nodeBoxes[node.name].radius=radius;
				       ctx.save();
				       ctx.beginPath();
				       ctx.arc(pt.x,pt.y,radius,0, Math.PI * 2, true);
				       ctx.clip();
				       ctx.closePath();
				       ctx.drawImage(image, pt.x-radius,pt.y-size/2,imgWidth,imgHeight);
				       ctx.lineWidth = 5;
				       ctx.stroke();
				       ctx.restore();

				       ctx.fillStyle = '#27408b';
				       ctx.font = '13px Arial bold';
				       ctx.textBaseline = 'top';
				       measure = ctx.measureText(label); 
				       ctx.fillText(label, pt.x - measure.width/2, pt.y+radius+2 );
				       //  gfx.text(label, pt.x-measure.width/2, pt.y+20, {color:"#00f", align:"center", font:"Arial", size:12,textBaseline:"top"});
			       };
			       }else if(node.data.type == 'detail'){
				       gfx.rect(pt.x-w/2, pt.y-8, w, 20, 4, {fill:node.data.color, alpha:node.data.alpha});
				       gfx.text(node.name, pt.x, pt.y+9, {color:"white", align:"center", font:"Arial", size:12});
			       }
	       }
	       )

       },

switchMode:function(e){
		   if (e.mode=='hidden'){
			   dom.stop(true).fadeTo(e.dt,0, function(){
					   if (sys) sys.stop()
					   $(this).hide()
					   })
		   }else if (e.mode=='visible'){
			   dom.stop(true).css('opacity',0).show().fadeTo(e.dt,1,function(){
					   that.resize()
					   })
			   if (sys) sys.start()
		   }
	   },

addNewNode:function(name){
		   var node = sys.getNode(name);
		   data = {type:"image",name:name+'_newNode',img:{url:'./pic/no_photo.png',size:50}};
		   var newNode = sys.addNode(name+'_newNode',data);
		   newNode._p.x = node._p.x + .05*Math.random() - .025;
		   newNode._p.y = node._p.y + .05*Math.random() - .025;
		   newNode.tempMass = .001;
		   sys.addEdge(node,newNode,{length:0.1});
	   },

addDetails:function(name){
		   var node = sys.getNode(name);
		   var details = node.data.details.split('\n');
		   for(var i=0; i<details.length;i++){
			   data = {type:"details",alpha:1,color:"#23a4ff"}
			   var newNode = sys.addNode(details[i],data);
			   newNode._p.x = node._p.x + .05*Math.random() - .025;
			   newNode._p.y = node._p.y + .05*Math.random() - .025;
			   newNode.tempMass = .001;
			   sys.addEdge(node,newNode,{length:0.1});

		   }
	   },
removeDetails:function(name){
		      var node = sys.getNode(name);
		      var children = $.map(sys.getEdgesFrom(name), function(edge){
				      return edge.target
				      })
		      for(var i=0;i<children.length;i++){
			      if(children[i].data.type == 'detail')
				      sys.pruneNode(children[i].name)
		      }
	      },

addMoved:function(name){
		 var node = sys.getNode(name);
		 node.data.moved = true;
	 },
removeMoved:function(name){
		    var node = sys.getNode(name);
		    node.data.moved = false;
	    },

_initMouseHandling:function(){
			   // no-nonsense drag and drop (thanks springy.js)
			   selected = null;
			   nearest = null;
			   var dragged = null;
			   var oldmass = 1;

			   var _section = null;

			   var handler = {
moved:function(e){
	      var pos = $(canvas).offset();
	      _mouseP = arbor.Point(e.pageX-pos.left, e.pageY-pos.top)
		      nearest = sys.nearest(_mouseP);

	      if (!nearest.node)
		      return false;

	      if (nearest.node.data.type=='image'){
		      if (nearest.node.name!=_section){
			      if(_section!==null){
				      edgesFrom = sys.getEdgesFrom(sys.getNode(_section));
				      $.each(edgesFrom, function(index, edge) {
						      edge.data.width = 2;
						      });
				      that.removeMoved(_section);
			      }

			      _section = nearest.node.name;
			      that.addMoved(_section);
		      }
	      }
	      that.redraw();
	      return false;
      },
clicked:function(e){
		var pos = $(canvas).offset();
		_mouseP = arbor.Point(e.pageX-pos.left, e.pageY-pos.top);
		nearest = dragged = sys.nearest(_mouseP);

		if(dragged && dragged.node !== null){
			//	dragged.node.fixed = true;
			nodeData = dragged.node.data;
			if(_mouseP.x >= removeP.x&&_mouseP.x <= removeP.x+16&&_mouseP.y >= removeP.y && _mouseP.y <= removeP.y+16){
				sys.pruneNode(nearest.node.name);
				nodeBoxes[nearest.node.name]= undefined;
				_section = null;
				return false;
			}else if(_mouseP.x >= addP.x&&_mouseP.x <= addP.x+16&&_mouseP.y >= removeP.y&&_mouseP.y <= removeP.y+16){
				that.addNewNode(nearest.node.name);
			}else	if (nodeData.type == 'image') {
				edgesFrom = sys.getEdgesFrom(dragged.node);
				$.each(edgesFrom, function(index, edge) {
if(edge.source.data.maim||edge.target.data.main)
						edge.data.width = 5;
						});
				if (nearest.node.name!=_section){
					if(_section!==null){
						edgesFrom = sys.getEdgesFrom(sys.getNode(_section));
						$.each(edgesFrom, function(index, edge) {
								edge.data.width = 2;
								});
						//	that.removeDetails(_section);
					}
				}

				_section = nearest.node.name;
				//	that.addDetails(_section);
			}
		}

		$(canvas).unbind('mousemove', handler.moved);
		$(canvas).bind('mousemove', handler.dragged);
		$(window).bind('mouseup', handler.dropped);

		return false;
	},
dragged:function(e){
		var pos = $(canvas).offset();
		var s = arbor.Point(e.pageX-pos.left, e.pageY-pos.top)

			if (!nearest) return
				if (dragged !== null && dragged.node !== null){
					var p = sys.fromScreen(s)
						dragged.node.p = p
				}

		return false
	},

dropped:function(e){
		if (dragged===null || dragged.node===undefined) return
			if (dragged.node !== null) dragged.node.fixed = false;
		dragged.node.tempMass = 1000;
		dragged = null;

		selected = null;
		$(canvas).unbind('mousemove', handler.dragged)
			$(window).unbind('mouseup', handler.dropped)
			$(canvas).bind('mousemove', handler.moved);
		_mouseP = null
			return false
	}
			   }

			   $(canvas).mousedown(handler.clicked);
			   $(canvas).mousemove(handler.moved);

		   }
 }

 return that
 }


 $(document).ready(function(){

		 var sys = arbor.ParticleSystem()
		 sys.parameters({stiffness:1300, repulsion:2000, gravity:true,dt:0.008});
		 sys.renderer = Renderer("#sitemap")
		 sys.graft(changeJson())

		 })
})(this.jQuery)
