var data =[
{
	"keyword":10,
		"links":[[11],[12]]
},
{
	"keyword":11,
	"links":[[10],[17]]
},{
	"keyword":12,
	"links":[[10],[13],[14]]
},{
	"keyword":13,
	"links":[[15],[12]]
},{
	"keyword":14,
	"links":[[16],[12]]
},{
	"keyword":15,
	"links":[[13],[16],[17]]
},{
	"keyword":16,
	"links":[[14],[15],[17]]
},{
	"keyword":17,
	"links":[[11],[15],[16]]
}
]


var allPaths = new Array();
function changeJson(){
	//var original = new Array(32); 
	//	var queried = [963489,1120181,397055,74831,412623,666565]; 
	//var queried = [963489,1120181,397055,74831,412623]; 
	//	var queried = [963489,1120181,397055,74831]; 
	var queried = [10,13,17]; 
	//	var queried = [10,17]; 
	//	var queried = [1120181]; 
	var original = data;
	var site = {};
	site.nodes = {};
	site.edges = {};
	var mainNodes = new Array();

	for(var i = 0;i < original.length;i++)
	{
		var current = original[i];
		site.nodes[current.keyword] = {};
		if(queried.contains(original[i].keyword)){
			site.nodes[current.keyword].main = true;
			mainNodes.push(current);
		}
		site.nodes[current.keyword].keyword = current.keyword;
		site.nodes[current.keyword].name = current.name;
		site.nodes[current.keyword].paths = new Array();

		site.edges[current.keyword] = {};
		for(var j = 0;j < current.links.length;j++){
			site.edges[current.keyword][current.links[j][0]] = {};
			site.edges[current.keyword][current.links[j][0]].length = 0.8;
			site.edges[current.keyword][current.links[j][0]].width = 2;
		}

	}
	for(var m=0;m<mainNodes.length;m++){
		for(var n=m+1;n<mainNodes.length;n++){
			findPathsBetweenTwoNodes(site,new Array(),mainNodes[m],mainNodes[n]);
		}
	}
	//	return eval("("+JSON.stringify(site)+")");
	alert(allPaths);
}

Array.prototype.contains = function (element) {    
	for (var i = 0; i < this.length; i++) {    
		if (this[i] == element) {    
			return true;    
		}    
	}    
	return false;    
} 

function findPathsBetweenTwoNodes(site,cPathStack,startNode,endNode){
	if(startNode ==null || endNode == null)return;
	if(startNode != endNode){
		cPathStack.push(startNode.keyword);
		for(var i=0;i<startNode.links.length;i++){
			var nextKey = startNode.links[i][0];
			if(cPathStack.contains(nextKey))
				continue;
			if(nextKey!= endNode.keyword&&site.nodes[nextKey].main) continue;
			else{
				findPathsBetweenTwoNodes(site,cPathStack,getNode(startNode.links[i][0]),endNode);
			}
		}
		cPathStack.pop();
	}else{
		cPathStack.push(startNode.keyword);
		allPaths[allPaths.length]=cPathStack.slice();
		cPathStack.pop();
		for(var i=0;i< cPathStack.length;i++){
			site.nodes[cPathStack[i]].paths.push(allPaths.length);
		}
	}

}
function getNode(keyword){
	for(var i = 0;i < data.length;i++)
	{
		if(data[i].keyword==keyword)
			return data[i]
	}
}
