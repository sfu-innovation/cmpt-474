
# Locations

 - Vancouver (49°15′N 123°6′W)
 - Toronto (43°42′N 79°24′W)
 - Los Angeles (34°03′N 118°15′W)
 - New York (40°40.2′N 73°56.4′W)
 - Boston
 - England
 - Beijing
 - Hong kong
 - Shanghai
 - Tokyo 35°41′22.22″N 139°41′30.12″E
 - Moscow
 - São Paulo
 - Mexico city
 - Berlin

Latency between data centers is computed using speed of light, standard haversine and some sensible "processing" latency.

```javascript
function haversine(from, to) {
	var a = to.latitude - from.latitude, 
		b = to.longitude - from.longitude,
		c = Math.sin(a/2) * Math.sin(a/2)
		    + Math.sin(b/2) * Math.sin(b/2) 
		    * Math.cos(from.latitude) * Math.cos(to.latitude);
	return (2 * Math.atan2(Math.sqrt(c), Math.sqrt(1-c))) * 6371;
}

function latency(from, to) {
	return haversine(from, to) / 299792.458 * 6.7;
}

//Test latency from Vancouver to New York (~89ms)
//Actual: ping 72.229.28.185 ~100ms
latency(
	{ latitude: 49.15/180*Math.PI, longitude: 123.6/180*Math.PI },
	{ latitude: 40.40/180*Math.PI, longitude: 73.56/180*Math.PI }
)

//Test latency from Vancouver to Los Angeles (~39ms)
//Actual: ping 208.79.89.243 ~41ms
latency(
	{ latitude: 49.15/180*Math.PI, longitude: 123.6/180*Math.PI },
	{ latitude: 34.03/180*Math.PI, longitude: 118.15/180*Math.PI }
)

//Test latency from Vancouver to Tokyo (~169ms)
//Actual: ping 117.104.139.221 ~135ms
latency(
	{ latitude: 49.15/180*Math.PI, longitude: 123.6/180*Math.PI },
	{ latitude: 35.41/180*Math.PI, longitude: -139.41/180*Math.PI }
)

