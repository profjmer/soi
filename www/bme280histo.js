// Initialisation de la communication websocket et ses événements
function setupWebsocket() {
	// créer le contexte pour dessiner dans le canva dans le fureteur
	var ctx = document.getElementById('canvas').getContext('2d');
	
	// adresse de l'application avec laquelle on désire communiquer
	var wsUri = 'ws://'+location.host+':1880/websocket'; // pour nodered sur le même PC
	ws = new WebSocket(wsUri); // crée le websocket
	
	const qtePoints =50; // quantité maximum désirée de points dans le graphe
	
	// Événement d'ouverture websocket
	ws.onopen = function(e) {
		console.log("Client en ligne, requête pour dernières valeurs du capteur BME280");
		log("SELECT * FROM \"mesures\" WHERE \"LIEU\" = '" +endroit()+"' ORDER BY time DESC limit "+ qtePoints +"  tz('America/Montreal')");
		
		// Requête Influx pour obtenir l'historique des mesures lors du rafraichissement du fureteur
		ws.send("SELECT * FROM \"mesures\" WHERE \"LIEU\" = '" +endroit()+"' ORDER BY time DESC limit "+ qtePoints +" tz('America/Montreal')");
	}

	// Événement de fermeture du websocket
	ws.onclose = function(e) {
		log("WS hors ligne : " + e.reason);
	}

	// Événement d'erreur de communication
	ws.onerror = function(e) {
		log("Erreur ");
	}

	// Messages de l'application Nodered
	ws.onmessage = function(e) {
		log("Message: " + e.data);	// afficher le message dans la console
		
		if (typeof e.data === "string") {	// pour les messages de type String
			
			if(e.data=="[]"){ // si Influx ne contient pas de données pour la requête effectuée
				effaceHistorique(); // effacer les données du graphe existant
			}
			
			// Traitement des données reçues par websocket
			try {			
				// Crée un objet  JSON
				var jsonObject = JSON.parse(e.data);		
				
				// Le message contient seulement une entrée de mesures provenant du LIEU et Capteur BME280
				if(jsonObject.length == 1 && jsonObject[0].LIEU == endroit() && jsonObject[0].Capteur=="BME280"){		
					// Extraire les valeurs des clés
					var temp = jsonObject[0].Temperature;
					var humidity = jsonObject[0].Humidity;
					var pression = jsonObject[0].Pression;		
					var time = jsonObject[0].time;
					if(time=="" || time == undefined)ts=new Date();							
					
					// Pour chacun des datasets
 					for (i = 0; i < lineChartData.datasets.length; i++) {
						// si le graphe contient suffisamment de points
						if (lineChartData.datasets[ i ].data.length >= qtePoints) {
							lineChartData.datasets[ i ].data.pop(); // retirer le point le plus anciens
						}
					} 
					// Insérer les nouvelles mesures au début de chacun des datasets
					lineChartData.datasets[0].data.unshift({x:time,y:temp});
					lineChartData.datasets[1].data.unshift({x:time,y:humidity});
					lineChartData.datasets[2].data.unshift({x:time,y:pression});
					
					// mise à jour du graphe
					window.myLine.update();		
				} 
				
				// Le message contient plusieurs entrées de mesures provenant du LIEU et Capteur BME280 
				else if(jsonObject.length > 1 && jsonObject[0].LIEU == endroit() && jsonObject[0].Capteur=="BME280"){	
				
					effaceHistorique();	// Effacer le graphe	

					// copier les valeurs de mesures dans les datasets
					for(i=0;i<jsonObject.length;i++){
							lineChartData.datasets[0].data[i]={"x":jsonObject[i].time,"y":jsonObject[i].Temperature};
							lineChartData.datasets[1].data[i]={"x":jsonObject[i].time,"y":jsonObject[i].Humidity};
							lineChartData.datasets[2].data[i]={"x":jsonObject[i].time,"y":jsonObject[i].Pression};
					}
					// mise à jour du graphe
					window.myLine.update();	
				}

			} catch (error) {
				log("data pas JSON");			
			}
		}
	}


	/* **********************************************************************************/
	
	function effaceHistorique(){ // Effacer les points des datasets
		while(lineChartData.datasets[0].data.length>0)	lineChartData.datasets[0].data.pop();
		while(lineChartData.datasets[1].data.length>0)	lineChartData.datasets[1].data.pop();
		while(lineChartData.datasets[2].data.length>0)	lineChartData.datasets[2].data.pop();
		
		window.myLine.update();	// mise à jour du graphe
	}

	// Retourne l'endroit sélectionné par les boutons radios
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

	// Afin d'utiliser log au lieu de console.log
	function log(s) {
		console.log(s);
	}
	/* ************************************************************************************/
}