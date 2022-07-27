// Initialise la communication websocket et ses événements
function setupWebsocket() {	
	var wsUri = 'ws://'+location.host+':1880/websocket'; // adresse de l'application fournissant les mesures
	ws = new WebSocket(wsUri); 
		
	ws.onopen = function(e) {
		log("Client en ligne, requête JSON pour capteur BME280 selon l'endroit");
		log("SELECT * FROM \"mesures\" WHERE \"LIEU\" = '" +endroit()+"' ORDER BY time DESC limit 1 tz('America/Montreal')");
		
		// requête pour la dernière mesure
		ws.send("SELECT * FROM \"mesures\" WHERE \"LIEU\" = '" +endroit()+"' ORDER BY time DESC limit 1 tz('America/Montreal')");
	}

	// Événement de fermeteure de la communication
	ws.onclose = function(e) {
		log("Client parti: " + e.reason);
	}

	// Événement d'erreur de communication
	ws.onerror = function(e) {
		log("Error ");
	}

	// Événement de réception d'un message
	ws.onmessage = function(e) {
		log("Message Rx: " + e.data);
		
		if (typeof e.data === "string") {
			// Transformer le message en objet JSON
			try {
				var jsonObject = JSON.parse(e.data);

				if(jsonObject.length >0){ // si le message contient une mesure
					// si la mesure provient du bon endroit	et du bon capteur		
					if(jsonObject[0].LIEU == endroit() && jsonObject[0].Capteur=="BME280"){ 

						var ts = new Date(jsonObject[0].time);
						if(ts=="" || ts == undefined)ts=new Date();

						// affiche le temps de la mesure
						document.getElementById("time").innerHTML = ts;			

						// mise à jour des jauges 
						var gaugeT = document.gauges.get('bme-t');
						gaugeT.value = jsonObject[0].Temperature;
		
						var gaugeRH = document.gauges.get('bme-h');
						gaugeRH.value = jsonObject[0].Humidity;
						
						var gaugeP= document.gauges.get('bme-p');
						gaugeP.value = jsonObject[0].Pression;

					}
				}
				else { // Le message ne contient pas de mesure
					noData(true); // mettre les jauges à minimum
				}	
			} catch (error) {
				log("data pas JSON");	
				noData(true);
			}
		}
		else {
			log("data pas une String");
			noData(true);
		}
	}

	/* ********************************************************* */

	// Mettre les jauges à minimum
	function noData(flag){
		if(flag==true){
			document.getElementById("time").innerHTML = "No Data"	;
			//document.body.style.backgroundColor = 'rgb(66,0,0)';
			var gaugeT = document.gauges.get('bme-t');
			gaugeT.value = -50;

			var gaugeRH = document.gauges.get('bme-h');
			gaugeRH.value = 0;
			
			var gaugeP= document.gauges.get('bme-p');
			gaugeP.value = 90;
		}
	}

	// Pour transmettre un message à l'application
	function sendMessage(msg){
		ws.send(msg);
		log("Message transmis");
	}

	// Quel endroit est sélectiionné par les boutons radios
	function endroit() { 
		if(document.getElementById('Maison').checked) {
			return "Maison";
		}
		else if(document.getElementById('Garage').checked) {
			return "Garage";
		}
		else if(document.getElementById('Sous-sol').checked) {
			return "Sous-sol"; 
		}
	}

	// Diminutif pour console.log
	function log(s) {
		console.log(s);
	}

	/* ********************************************************* */
}
