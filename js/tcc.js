$(function(){

	var map;
	var heatmap; 
	var bairros = []; // Array de Bairros
	var dados = {};	
	var nomes_bairros = [];
	var peso_renda = 0;

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

	//Classe Bairro
	Bairro = function(nome){
		this.nome = nome;
		this.nome_reduzido = nome.replace(/\s/g,'_').toLowerCase();
		this.poligono = null;
		this.renda = 0; //Float
		this.populacao = 0; //Float
	}
	//Atualizar Cor do Bairro
	Bairro.prototype.updateColor = function(media) {
			var cores = getHeatMapColor(media);
			this.poligono.fillColor = cores;
			this.poligono.setMap(map);
	}


	$('#slider-renda').slider({
		min:1,
		max:10,
		step:0.5,
		change: function(event,ui){
			var peso_renda = $('#slider-renda').slider('value')
			var peso_populacao = $('#slider-populacao').slider('value');
			if(bairros) {
				tamanho = nomes_bairros.length;
				for(var i=0;i<tamanho;++i){
					media = (bairros[nomes_bairros[i]].renda * peso_renda + bairros[nomes_bairros[i]].populacao * peso_populacao) / (peso_populacao + peso_renda);
					if(media){
						bairros[nomes_bairros[i]].updateColor(media);
					}
				}
			}
		}
	});

	$('#slider-populacao').slider({
		min:0.5,
		max:10,
		step:0.5,
		change: function(event,ui){
			var peso_renda = $('#slider-renda').slider('value')
			var peso_populacao = $('#slider-populacao').slider('value');
			if(bairros) {
				tamanho = nomes_bairros.length;
				for(var i=0;i<tamanho;++i){
					media = (bairros[nomes_bairros[i]].renda * peso_renda + bairros[nomes_bairros[i]].populacao * peso_populacao) / (peso_populacao + peso_renda);
					if(media){
						bairros[nomes_bairros[i]].updateColor(media);
					}
				}
			}
		}
	});

	$('#slider-empresasti').slider({
		min:0,
		max:10,
		step:0.5,
		change: function(event,ui){
			var peso_empresas = $(this).slider('value');
			heatmap.heatmap.set('radius',peso_empresas)
			heatmap.setDataSet(testData);
		}
	});

	function getHeatMapColor(value){
		var NUM_COLORS = 4;
		var color = [ [0,255,255], [0,255,0], [255,255,0], [255,0,0] ];
		// a static array of 4 colors:  ( cyan,  green,  yellow,  red) using {r,g,b} for each

		var idx1;        // |-- our desired color will be between these two indexes in "color"
		var idx2;        // |
		var fractBetween = 0;  // fraction between "idx1" and "idx2" where our value is

		if(value <= 0){  
			idx1 = idx2 = 0;
		}    // accounts for an input <=0
		else if(value >= 1) { 
			idx1 = idx2 = NUM_COLORS-1; 
		}    // accounts for an input >=0
		else {
			value = value * (NUM_COLORS-1);        // will multiply value by 2
			idx1  = Math.floor(value);                  // our desired color will be after this index
			idx2  = idx1+1;                        // ... and before this index (inclusive)
			fractBetween = value - parseFloat(idx1);    // distance between the two indexes (0-1)
		}

		red   = ((color[idx2][0] - color[idx1][0])*fractBetween + color[idx1][0]).toFixed(0);
		green = ((color[idx2][1] - color[idx1][1])*fractBetween + color[idx1][1]).toFixed(0);
		blue  = ((color[idx2][2] - color[idx1][2])*fractBetween + color[idx1][2]).toFixed(0);

		return  ['rgb(',red,',',green,',',blue,')'].join('');

	}

	function loadBairros(callback){
		$.ajax({
	        type: "GET",
			url: "dados/belo_horizonte.kml",
			dataType: "xml",
			success: function(xml) {
				$(xml).find('Placemark').each(function(){
					var nome = $(this).find('description').text()
					var li = $(nome).find('li')[0]
					//pega o nome do bairro
					var nome_bairro = $(li).find('span').eq(1).text();
					var nome_bairro_slug = nome_bairro.replace(/\s/g,'_').toLowerCase();

					bairros[nome_bairro_slug] = new Bairro(nome_bairro);
					bairros[nome_bairro_slug].nome_reduzido = nome_bairro_slug;
				
					var coordenadas = $(this).find('LinearRing').find('coordinates');
					coordenadas = $(coordenadas).text().split(" ");
					var tamanho = coordenadas.length;
				
					var poligono = [];
					for (i=0;i<=tamanho;i++) {
						if($.trim(coordenadas[i]).replace(/\s/g,"") != "") {
							coord = $.trim(coordenadas[i]).split(',');	
							poligono.push(new google.maps.LatLng(coord[1],coord[0]));
						}
					}

					bairros[nome_bairro_slug].poligono = new google.maps.Polygon({
							paths: poligono,
							strokeColor: "#FF0000",
							strokeOpacity: 0.8,
							strokeWeight: 2,
							fillColor: '#ffffff',
							fillOpacity: 0.7,
					});

					google.maps.event.addListener(bairros[nome_bairro_slug].poligono, 'click', function() {
					    var infoWindow = new google.maps.InfoWindow();
					    infoWindow.setContent("Bairro: " + bairros[nome_bairro_slug].nome);
					    infoWindow.setPosition(poligono[0]);     
					    infoWindow.open(map);
					});

					bairros[nome_bairro_slug].poligono.setMap(map);
					nomes_bairros.push(nome_bairro_slug);
				});
			}
		}).done(callback);
	}

	function loadHeatMapData(){
		$.ajax({
	        type: "GET",
			url: "dados/belo_horizonte_renda_normalizada.json",
			dataType: "json",
			success: function(json) {
				tamanho = json.length;
				for(var i=0;i<tamanho;++i){
						nome_bairro = json[i][0].bairro_sem_acento.replace(/\s/g,'_').toLowerCase();
						if(bairros[nome_bairro]) {
							bairros[nome_bairro].renda = json[i][1]['renda'];
							bairros[nome_bairro].populacao = json[i][1]['populacao'];
							bairros[nome_bairro].nome = json[i][0].bairro;
						}

				}
			}
		});
	}
});