$(function(){

var map;
var heatmap; 
var bairros = Array();
var dados = new Object();	
var nomes_bairros = Array();
var peso_renda = 0;

function generateHeatColor(value,n){
	// Define the ending colour, which is green
	var xr = 0; // Red value
	var xg = 255; // Green value
	var xb = 0; // Blue value
	
	// Define the starting colour #f32075
	var yr = 255; // Red value
	var yg = 0; // Green value
	var yb = 0; // Blue value

	// Calculate a specific colour point
	// pos – calculated in the earlier code identifies where on the scale the data point is
	var red = parseInt((xr + (( value * (yr - xr)) / (n-0.1))).toFixed(0));
	var green = parseInt((xg + (( value * (yg - xg)) / (n-0.1))).toFixed(0));
	var blue = parseInt((xb + (( value * (yb - xb)) / (n-0.1))).toFixed(0));
	// Once we have our RGB values we combine them to create our CSS code

	if(red > 255)
		red = 255;
	else if (red < 0)
		red = 0;
	if(green > 255)
		green = 255;
	else if (green < 0)
		green = 0;
	if(blue > 255)
		blue = 255;
	else if (blue < 0)
		blue = 0;

	return  'rgb('+red+','+green+', '+blue+')';
}

	$('#slider-renda').slider({
		min:0,
		max:10,
		step:0.5,
		change: function(event,ui){
			var peso_renda = $('#slider-renda').slider('value')
			var peso_populacao = $('#slider-populacao').slider('value');
			if(bairros) {
				tamanho = nomes_bairros.length;
				for(var i=0;i<tamanho;++i){
					media = (bairros[nomes_bairros[i]][1].valorRenda * peso_renda + bairros[nomes_bairros[i]][1].valorPopulacao * peso_populacao) / (peso_populacao + peso_renda);
					if(media){
						cores = generateHeatColor(media, 1 );
						bairros[nomes_bairros[i]][1].fillColor = cores;
						bairros[nomes_bairros[i]][1].setMap(map);
					}
				}
			}
		}
	});

	$('#slider-populacao').slider({
		min:0,
		max:10,
		step:0.5,
		slide: function(event,ui){
			var peso_renda = $('#slider-renda').slider('value')
			var peso_populacao = $('#slider-populacao').slider('value');
			if(bairros) {
				tamanho = nomes_bairros.length;
				for(var i=0;i<tamanho;++i){
					media = (bairros[nomes_bairros[i]][1].valorRenda * peso_renda + bairros[nomes_bairros[i]][1].valorPopulacao * peso_populacao) / (peso_populacao + peso_renda);
					if(media){
						cores = generateHeatColor(media, 1 );
						bairros[nomes_bairros[i]][1].fillColor = cores;
						bairros[nomes_bairros[i]][1].setMap(map);
					}
				}
			}
		}
	});

	$('#slider-empresasti').slider({
		min:1,
		max:20,
		step:0.5,
		slide: function(event,ui){
			var peso_empresas = $(this).slider('value');
			heatmap.heatmap.set('radius',peso_empresas)
			heatmap.setDataSet(testData);
		}
	});

	//central coordinates of belo horizonte
	var myLatlng = new google.maps.LatLng(-19.9167,-43.9333);

	//google maps initial options
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
	//google maps instance
	map = new google.maps.Map(document.getElementById("heatmapArea"), myOptions);

	//heatmap.js default layter
	heatmap = new HeatmapOverlay(map, {"radius":1, "visible":true, "opacity":60});
	
	//Somente carregar os bairros após mapa totalmente carregado
	google.maps.event.addListenerOnce(map, "idle", function(){
		loadBairros(loadHeatMapData);
	});


	function loadBairros(callback){
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
					coordenadas = $(this).find('LinearRing').find('coordinates');
					coordenadas = $(coordenadas).text().split(" ");
					tamanho = coordenadas.length;
					poligono = Array();
					bairros[nome_bairro] = Array(nome_bairro);
					cores = generateHeatColor(0,1);

					for (i=0;i<=tamanho;i++) {
						if($.trim(coordenadas[i]).replace(/\s/g,"") != "") {
							coord = $.trim(coordenadas[i]).split(',');	
							poligono.push(new google.maps.LatLng(coord[1],coord[0]));
						}
					}

					bairros[nome_bairro].push(new google.maps.Polygon({
							paths: poligono,
							strokeColor: "#FF0000",
							strokeOpacity: 0.8,
							strokeWeight: 2,
							fillColor: cores,
							fillOpacity: 0.5,
					}));

					bairros[nome_bairro][1].setMap(map);
					nomes_bairros.push(nome_bairro);
				});
			}
		}).done(callback);
	}

	function loadHeatMapData(){
		$.ajax({
	        type: "GET",
			url: "dados/belo_horizonte_renda_normalizada.json",
			dataType: "json",
			beforeSend: function(){
				if(bairros) {
					tamanho = nomes_bairros.length;
					for(var i=0;i<tamanho;++i){
						//bairros[nomes_bairros[i]][1].setMap(null);
					}
				}
			},
			success: function(json) {
				tamanho = json.length;
				for(var i=0;i<tamanho;++i){
						nome_bairro = json[i][0].bairro.replace(/\s/g,'_').toLowerCase();
						if(bairros[nome_bairro]) {
							bairros[nome_bairro][1]['valorRenda'] = json[i][1]['renda'];
							bairros[nome_bairro][1]['valorPopulacao'] = json[i][1]['populacao'];
						}

				}
			}
		});
	}
});