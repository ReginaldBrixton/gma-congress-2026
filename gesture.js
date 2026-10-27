/* Shared photo transform mathematics: canvas coordinates, independent of input device. */
(function(root){
 function limit(v,min,max){return Math.max(min,Math.min(max,v));}
 function pair(points){const [a,b]=points;return {x:(a.x+b.x)/2,y:(a.y+b.y)/2,d:Math.hypot(b.x-a.x,b.y-a.y)};}
 function pinch(start,points,box,base){const p=pair(points),ratio=p.d/Math.max(start.pair.d,1);const zoom=limit(start.zoom*ratio,1,5),factor=zoom/start.zoom;return {zoom,dx:p.x-(start.pair.x-(box.x+box.w/2+start.dx))*factor-(box.x+box.w/2),dy:p.y-(start.pair.y-(box.y+box.h/2+start.dy))*factor-(box.y+box.h/2)};}
 const api={limit,pair,pinch};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.PhotoGesture=api;
})(typeof window!=='undefined'?window:this);
