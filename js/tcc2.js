var map;
var heatmap; 
var bairros = Array();
var dados = new Object();	
var nomes_bairros = Array();
var peso_renda = 0;

function generateHeatColor(value,n){
	// Define the ending colour, which is green
	xr = 0; // Red value
	xg = 255; // Green value
	xb = 0; // Blue value
	
	// Define the starting colour #f32075
	yr = 255; // Red value
	yg = 0; // Green value
	yb = 0; // Blue value

	// Calculate a specific colour point
	// pos – calculated in the earlier code identifies where on the scale the data point is
	red = parseInt((xr + (( value * (yr - xr)) / (n-0.1))).toFixed(0));
	green = parseInt((xg + (( value * (yg - xg)) / (n-0.1))).toFixed(0));
	blue = parseInt((xb + (( value * (yb - xb)) / (n-0.1))).toFixed(0));
	// Once we have our RGB values we combine them to create our CSS code
	return  'rgb('+red+','+green+', '+blue+')';
}
$(function(){

	$('#slider-renda').slider({
		min:0,
		max:10,
		step:0.5,
		slide: function(event,ui){
			peso_renda = $(this).slider('value')
			if(bairros) {
				tamanho = nomes_bairros.length;
				for(var i=0;i<tamanho;++i){
					cores = generateHeatColor(bairros[nomes_bairros[i]][1].valor * peso_renda / 5, 1 );
					bairros[nomes_bairros[i]][1].fillColor = cores;
					bairros[nomes_bairros[i]][1].setMap(map);
				}
			}
			//console.log(peso_renda);
		}
	});

	$('#slider-empresasti').slider({
		min:1,
		max:20,
		step:0.5,
		slide: function(event,ui){
			peso_empresas = $(this).slider('value');
			heatmap.heatmap.set('radius',peso_empresas)
			heatmap.setDataSet(testData);
		}
	});

	var myLatlng = new google.maps.LatLng(-19.9167,-43.9333);

	var myOptions = {
	  zoom: 12,
	  center: myLatlng,
	  mapTypeId: google.maps.MapTypeId.ROADMAP,
	  disableDefaultUI: false,
	  scrollwheel: true,
	  draggable: true,
	  navigationControl: true,
	  mapTypeControl: false,
	  scaleControl: true,
	  disableDoubleClickZoom: false
	};

	map = new google.maps.Map(document.getElementById("heatmapArea"), myOptions);
	heatmap = new HeatmapOverlay(map, {"radius":1, "visible":true, "opacity":60});
	// this is important, because if you set the data set too early, the latlng/pixel projection doesn't work
	google.maps.event.addListenerOnce(map, "idle", function(){
		heatmap.setDataSet(testData);
		carregaHeatMap('renda');
	});

	$('#renda').on('click',function(){
		carregaHeatMap('renda');
	});

	$('#populacao').on('click',function(){
		carregaHeatMap('populacao');
	});

	function carregaHeatMap(dado,callback){
		$.ajax({
	        type: "GET",
			url: "dados/belo_horizonte_renda_normalizada.json",
			dataType: "json",
			beforeSend: function(){
				if(bairros) {
					tamanho = nomes_bairros.length;
					for(var i=0;i<tamanho;++i){
						bairros[nomes_bairros[i]][1].setMap(null);
					}
				}
			},
			success: function(json) {
				tamanho = json.length;
				for(var i=0;i<tamanho;++i){
						nome_bairro = json[i][0].bairro.replace(/\s/g,'_').toLowerCase();
						dados[nome_bairro] = new Object();
						dados[nome_bairro] = (json[i][1][dado]);
				}
			}
		}).done(function(){
			$.ajax({
		        type: "GET",
				url: "dados/belo_horizonte.kml",
				dataType: "xml",
				success: function(xml) {
					$(xml).find('Placemark').each(function(){
						nome = $(this).find('description').text()
						li = $(nome).find('li')[0]
						//pega o nome do bairro
						nome_bairro = $(li).find('span').eq(1).text()
						nome_bairro = nome_bairro.replace(/\s/g,'_').toLowerCase();
						bairros[nome_bairro] = Array(nome_bairro);
						coordenadas = $(this).find('LinearRing').find('coordinates');
						coordenadas = $(coordenadas).text().split(" ");
						tamanho = coordenadas.length;
						poligono = Array()
						for (i=0;i<=tamanho;i++) {
							if($.trim(coordenadas[i]).replace(/\s/g,"") != "") {
								coord = $.trim(coordenadas[i]).split(',');	
								poligono.push(new google.maps.LatLng(coord[1],coord[0]));
							}
						}
						cores = generateHeatColor(dados[nome_bairro]*peso_renda,1);
						if(dados[nome_bairro]) {
							bairros[nome_bairro].push(new google.maps.Polygon({
								paths: poligono,
								strokeColor: "#FF0000",
								strokeOpacity: 0.8,
								strokeWeight: 2,
								fillColor: cores,
								fillOpacity: 0.5,
								valor: dados[nome_bairro]
							}));
							bairros[nome_bairro][1].setMap(map);
						} else {
							bairros[nome_bairro].push(new google.maps.Polygon({
								paths: poligono,
								strokeColor: "#FF0000",
								strokeOpacity: 0.8,
								strokeWeight: 2,
								fillColor: '#FFF',
								fillOpacity: 0,
								valor:0
							}));
							bairros[nome_bairro][1].setMap(map);
						}
						nomes_bairros.push(nome_bairro);
					});
				}
			})
			.done(callback);
		});
	}
});