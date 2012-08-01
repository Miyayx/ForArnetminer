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
	       canvas.width =790
		       canvas.height = $(window).height()*0.95
		       sys.screen({size:{width:canvas.width, height:canvas.height}})
		       _vignette = null
		       that.redraw()
       },
redraw:function(){
	       gfx.clear();
	       sys.eachEdge(function(edge, p1, p2){
			       if (edge.source.data.alpha * edge.target.data.alpha == 0) return
			       gfx.line(p1, p2, {stroke:"#23a4ff", width:edge.data.width})
			       });
	       sys.eachNode(function(node, pt){
			       var w = Math.max(20, 20+gfx.textWidth(node.name));
			       if (node.data.alpha===0) return
			       if (node.data.type=='image'){
			       var image = new Image();

			       var label = node.name;
			       var size;
			       if(node.data.main){
			       node.fixed = true;
			       node.p.x = node.data.xx;
			       node.p.y = node.data.yy;
			       size = 60;
			       } else 
			       size = node.data.img.size;

			       image.src = node.data.img.url;
			       label = node.data.name.substr(0,10);
			       if (node.data.name.length > 10) label += '...';

			       ctx.drawImage(image, pt.x-size/2, pt.y-size/2,image.width*size/image.height,size);

			       ctx.fillStyle = '#00f';
			       ctx.font = 'italic 10px sans-serif';
			       ctx.textBaseline = 'top';
			       measure = ctx.measureText(label); 
			       ctx.fillText(label, pt.x - measure.width/2, pt.y + 20);
			       // gfx.text(label, pt.x-measure.width/2, pt.y+20, {color:"#00f", align:"center", font:"Arial", size:12})
			       }else if(node.data.type == 'detail'){
				       gfx.rect(pt.x-w/2, pt.y-8, w, 20, 4, {fill:node.data.color, alpha:node.data.alpha});
				       gfx.text(node.name, pt.x, pt.y+9, {color:"white", align:"center", font:"Arial", size:12});
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

addDetails:function(name){
		   var node = sys.getNode(name);
		   var details = node.data.details.split('\n');
		   for(var i=0; i<details.length;i++){
			   data = {type:"detail",alpha:1,color:"#23a4ff"}
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


_initMouseHandling:function(){
			   // no-nonsense drag and drop (thanks springy.js)
			   selected = null;
			   nearest = null;
			   var dragged = null;
			   var oldmass = 1

				   var _section = null

				   var handler = {
clicked:function(e){
		var pos = $(canvas).offset();
		_mouseP = arbor.Point(e.pageX-pos.left, e.pageY-pos.top)
			nearest = dragged = sys.nearest(_mouseP);

	if(dragged && dragged.node !== null){
			dragged.node.fixed = true
				nodeData = dragged.node.data;

			if (nodeData.type == 'image') {
				edgesFrom = sys.getEdgesFrom(dragged.node);
				$.each(edgesFrom, function(index, edge) {
						edge.data.width = 6;
						});
				if (nearest.node.name!=_section){
					if(_section!==null){
						edgesFrom = sys.getEdgesFrom(sys.getNode(_section));
						$.each(edgesFrom, function(index, edge) {
								edge.data.width = 2;
								});
						that.removeDetails(_section);
					}
				}

				_section = nearest.node.name;
				that.addDetails(_section);
			}
		}

		$(canvas).unbind('mousemove', handler.moved);
		$(canvas).bind('mousemove', handler.dragged)
			$(window).bind('mouseup', handler.dropped)

			return false
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
			if (dragged.node !== null) dragged.node.fixed = false
				dragged.node.tempMass = 1000
					dragged = null;
		// selected = null
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
		 var CLR = {
branch:"#b2b19d",
code:"orange",
doc:"#922E00",
demo:"#a7af00"
}

var theUI = {
nodes:{"arbor.js":{color:"red", shape:"dot", alpha:1}, 

demos:{color:CLR.branch, shape:"dot", alpha:1}, 
halfviz:{color:CLR.demo, alpha:0, link:'/halfviz'},
atlas:{color:CLR.demo, alpha:0, link:'/atlas'},
echolalia:{color:CLR.demo, alpha:0, link:'/echolalia'},

docs:{color:CLR.branch, shape:"dot", alpha:1}, 
reference:{color:CLR.doc, alpha:0, link:'#reference'},
introduction:{color:CLR.doc, alpha:0, link:'#introduction'},

code:{color:CLR.branch, shape:"dot", alpha:1},
github:{color:CLR.code, alpha:0, link:'https://github.com/samizdatco/arbor'},
".zip":{color:CLR.code, alpha:0, link:'/js/dist/arbor-v0.92.zip'},
".tar.gz":{color:CLR.code, alpha:0, link:'/js/dist/arbor-v0.92.tar.gz'}
      },
edges:{
	      "arbor.js":{
demos:{length:.8},
      docs:{length:.8},
      code:{length:.8}
	      },
demos:{halfviz:{},
	      atlas:{},
	      echolalia:{}
      },
docs:{reference:{},
	     introduction:{}
     },
code:{".zip":{},
	     ".tar.gz":{},
	     "github":{}
     }
      }
}


	var sys = arbor.ParticleSystem()
sys.parameters({stiffness:900, repulsion:2000, gravity:true, dt:0.015})
	sys.renderer = Renderer("#sitemap")
sys.graft(changeJson())

	})
})(this.jQuery)
