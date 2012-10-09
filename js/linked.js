$(function(){
	var query = "select * where { { <http://dbpedia.org/resource/Belo_Horizonte> <http://www.w3.org/2000/01/rdf-schema#comment> ?valor filter(lang(?valor) = 'pt') } union { <http://dbpedia.org/resource/Belo_Horizonte> <http://dbpedia.org/property/populationTotal> ?valor }}";
	$.ajax({
		type: "GET",
		url: "http://dbpedia.org/sparql?default-graph-uri=http%3A%2F%2Fdbpedia.org&query="+encodeURIComponent(query)+"&debug=on&timeout=&format=application%2Fsparql-results%2Bjson&save=display&fname=",
		dataType: "json",
		success: function(json) {
			//var tamanho = json.results.bindings.length;
			resultado = json.results.bindings;
			$('#dados-bh').append('<p><strong>População:</strong> '+resultado[0].valor.value+'<p>')
			$('#dados-bh').append('<p><strong>Sobre:</strong> '+resultado[1].valor.value+'<p>')
		}
	});

});


