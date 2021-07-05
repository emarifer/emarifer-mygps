<template>
  <v-container class="custom-background" fluid>

    <!-- Dialog: data track -->
    <v-dialog v-model="dialog" width="400">
      <v-card>
        <v-toolbar color="purple darken-3" dark dense flat>
          <v-toolbar-title class="text-body-2">
            <v-icon class="mr-2">mdi-information-outline</v-icon>
            Track Info
          </v-toolbar-title>
        </v-toolbar>
          
        <v-card-text class="mt-4">
          <ul v-if="gpxLoaded">
            <li><strong>Nombre: </strong>{{ name }}</li>
            <li><strong>Distancia: </strong>{{ distance }}</li>
            <li><strong>Máxima elevación: </strong>{{ maxElevation }}</li>
            <li><strong>Duración: </strong>{{ time }}</li>
          </ul>
          <p v-else class="ml-4"><strong>No hay Track cargado!! 🙁</strong></p>
        </v-card-text>
        
        <v-card-actions class="px-10">
          <v-spacer/>
          <v-icon large @click="dialog = false">
            mdi-close-box
          </v-icon>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog: saving track -->
    <v-dialog v-model="savingDialog" width="400">
      <v-card>
        <v-toolbar color="purple darken-3" dark dense flat>
          <v-toolbar-title class="text-body-2">
            <v-icon class="mr-2">mdi-content-save</v-icon>
            ¿Deseas guardar el Track?
          </v-toolbar-title>
        </v-toolbar>
        
        <v-card-text class="mt-4">
          <v-text-field label="Nombre del Track" v-model="nameTrack" ref="autofocus"></v-text-field>
        </v-card-text>
        <v-divider />
        <v-card-actions class="px-10">
          <v-btn @click="saveData" small color="light-blue darken-2" text>Guardar</v-btn>
          <v-spacer/>
          <v-btn small @click="savingDialog = false" color="pink" text>No</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog: data track in progress -->
    <v-dialog v-model="trackInProgressDialog" width="400">
      <v-card>
        <v-toolbar color="purple darken-3" dark dense flat>
          <v-toolbar-title class="text-body-2">
            <v-icon class="mr-2">mdi-information-outline</v-icon>
            Datos del Track en curso
          </v-toolbar-title>
        </v-toolbar>

        <v-card-text class="mt-4">
          <ul v-if="polyline">
            <li><strong>Distancia recorrida: </strong>{{ lengthTrackInProgress }} km</li>
            <li><strong>Tiempo transcurrido: </strong>{{ timeElapsed }}</li>
          </ul>
          <p v-else class="ml-4"><strong>No hay Track grabándose!! 🙁</strong></p>
        </v-card-text>
    
        <v-card-actions>
          <v-spacer/>
          <v-icon large @click="trackInProgressDialog = false">
            mdi-close-box
          </v-icon>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog: remove cache map -->
    <v-dialog v-model="removeCacheDialog" width="400">
      <v-card>
        <v-toolbar color="purple darken-3" dark dense flat>
          <v-toolbar-title class="text-body-2">
            <v-icon class="mr-2">mdi-map</v-icon>
            Deseas borrar la caché de Mapas?
          </v-toolbar-title>
        </v-toolbar>

        <v-card-text class="mt-4">
          <p class="ml-2"><strong>Si no tienes red no podrás ver mapas!! 🙁</strong></p>
        </v-card-text>
        <v-divider />
        <v-card-actions class="px-10">
          <v-btn @click="removeCacheMap" small color="pink" text>Borrar</v-btn>
          <v-spacer/>
          <v-btn small @click="removeCacheDialog = false" color="light-blue darken-2" text>No</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Alert: no connection -->
    <v-alert
      v-model="alert"
      border="left"
      color="pink lighten-4"
      dismissible
      width="100%"
    >
      El nombre del track es necesario!! 🙁
    </v-alert>

    <v-row justify="center" class="my-3 px-6" align="center">
      <label for="input-track">
        <v-icon class="mr-1" color="white">mdi-paperclip</v-icon>
        Seleccionar Track...
      </label>
      <input ref="fileuploader" type="file" accept="application/gpx+xml" @click="resetFileUploader" @change="openFile" id="input-track">
      <v-icon @click="removeTrack" class="ml-3" color="white">mdi-delete</v-icon>
    </v-row>

    <v-row justify="center" align="center" class="my-3">
      <v-icon class="mr-10" color="blue lighten-1" dark @click="dialog=true">mdi-information</v-icon>
      <v-icon class="mr-10" :color="colorNavigation" @click="checkLocation" dark>mdi-map-marker-radius</v-icon>
      <v-icon class="mr-10" :color="color" dark @click="startTrackAcquisition">mdi-navigation</v-icon>
      <v-icon class="mr-10" color="orange lighten-1" dark @click="getLengthOfTrackBeingRecorded">mdi-map-marker-distance</v-icon>
      <v-btn class="sizeFab" fab color="pink" dark @click="removeCacheDialog = true">
        <v-icon small>mdi-cached</v-icon>
        <v-icon small>mdi-map</v-icon>
      </v-btn>
    </v-row>
    
    <v-row class="map-row">
      <div id="map"></div>
    </v-row>

    <!-- snackbar: update notice -->
    <v-snackbar bottom right :value="updateExists" :timeout="-1" color="grey darken-3">
      Actualización disponible!! 😀
      <v-btn @click="refreshApp" color="lime darken-3" class="ml-3">
        <v-icon>mdi-refresh</v-icon>
      </v-btn>
    </v-snackbar>

  </v-container>
</template>

<style scoped>

  .custom-background {
    height: 100%;
    background-color: #1D2125;
  }

  .map-row {
    height: 80vh;
  }

  #input-track {
   opacity: 0;
   position: absolute;
   z-index: -1;
  }

  label {
    color: white;
    background-color: #ffffff80;
    border-radius: 10px;
    padding: 10px;
    cursor: pointer;
  }

  #map {
    width: 100%;
    height: 100%;
    z-index: 1;
  }

  .sizeFab {
    width: 2.75rem !important;
    height: 2.75rem !important;
  }

  .text-info {
    font-size: 0.8rem;
    margin-top: 1rem;
  }
</style>

<script>
  import L from 'leaflet';
  import { Icon } from 'leaflet';
  import '../../node_modules/leaflet-gpx/gpx.js';
  import update from '../mixins/update';
  import track from '../track.js';
  import { saveAs } from 'file-saver';

  export default {
    name: 'MyMap',
    data() {
      return {
        map: null,
        track: null,
        locationActive: false,
        buttonText: 'Iniciar Navegación',
        colorNavigation: 'teal accent-4',
        color: 'teal accent-4',
        marker: null,
        circles: null,
        alert: false,
        dialog: false,
        savingDialog: false,
        trackInProgressDialog: false,
        removeCacheDialog: false,
        nameTrack: '',
        name: '',
        distance: '',
        maxElevation: '',
        time: '',
        isNavigating: false,
        gpxLoaded: null,
        polyline: null,
        firstTime: 0,
        lastTime: 0,
        dataTrack: '',
        lengthTrackInProgress: 0,
      }
    },
    computed: {
      timeElapsed: function() { // En las arrow function no existe el "this"
        
        const hours = Math.round(((this.lastTime - this.firstTime) / 3600000) * 100) / 100;
        const minutes = Math.ceil((hours - Math.floor(hours)) * 60);
        return `${Math.floor(hours)} horas y ${minutes} minutos`;
      },
    },
    mixins: [update],
    mounted() {
      // console.log(this.dataTrack);
      delete Icon.Default.prototype._getIconUrl;
      Icon.Default.mergeOptions({
          iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
          iconUrl: require('leaflet/dist/images/marker-icon.png'),
          shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
      });

      window.onbeforeunload = (e) => {
        if (this.polyline.getLatLngs().length !== 0) {
          localStorage.setItem('polyline', JSON.stringify(this.polyline.getLatLngs()));
          localStorage.setItem('gpxinprogress', this.dataTrack);
        }
      }
      
      this.initMap();
      
      const data = window.localStorage.getItem('gpx');
      if (data && data.length !== 0) {
        this.displayTrack(data);
      };

      const arrayPolyline = JSON.parse(window.localStorage.getItem('polyline'));
      const dataTrack = window.localStorage.getItem('gpxinprogress');
      if (arrayPolyline
          && arrayPolyline.length !== 0
          && dataTrack
          && dataTrack.length !== 0) {
        console.log('Enrique');
        this.startTrackAcquisition(arrayPolyline, dataTrack);
      };
    },
    methods: {
      data: track.data,
      initMap() {
        const Spain_MapasrasterIGN = L.tileLayer.wms('http://www.ign.es/wms-inspire/mapa-raster', {
          layers: 'mtn_rasterizado',
          format: 'image/png',
          transparent: false,
          continuousWorld: true,
          attribution: '© <a href="http://www.ign.es/ign/main/index.do" target="_blank">Instituto Geográfico Nacional de España</a> contributors'
        });

        const Spain_PNOA_Ortoimagen = L.tileLayer.wms('http://www.ign.es/wms-inspire/pnoa-ma', {
          layers: 'OI.OrthoimageCoverage',
          format: 'image/png',
          transparent: false,
          continuousWorld: true,
          attribution: 'PNOA cedido por © <a href="http://www.ign.es/ign/main/index.do" target="_blank">Instituto Geográfico Nacional de España</a> contributors'
        });

        const baseMaps = {
          "Spain_MapasrasterIGN": Spain_MapasrasterIGN,
          "Spain_PNOA_Ortoimagen": Spain_PNOA_Ortoimagen
        };

        this.map = L.map('map', {
          layers: [
            Spain_MapasrasterIGN,
          ]
        }).fitBounds([[24.9300000311, -19.6], [46.0700000311, 5.6]]);

        L.control.layers(baseMaps).addTo(this.map);
        L.control.scale({ options: { position: 'bottomleft', metric: true } }).addTo(this.map);
      },
      removeCacheMap() {
        if ('caches' in window) {
          caches.delete('cache-map')
            .then((bool) => {
              console.log(bool, 'clear cache operation') // true
            })
            .catch((err) => {
              console.log(err);
            });
        }
        this.removeCacheDialog = false;
      },
      removeTrack() {
        if (this.gpxLoaded && this.map.hasLayer(this.gpxLoaded)) {
          this.map.removeLayer(this.gpxLoaded);
          this.gpxLoaded = null;
        }
        this.name = '';
        this.distance = '';
        this.maxElevation = '';
        this.time = '';
        window.localStorage.removeItem('gpx');
      },
      resetFileUploader() {
        this.$refs.fileuploader.value = '';
      },
      openFile(e) {
        
        this.removeTrack();
        const input = e.target;
        const reader = new FileReader();

        reader.onload = () => {

            const data = reader.result;
            this.displayTrack(data);
        };
        reader.readAsText(input.files[0]);
      },
      displayTrack(data) {

        this.gpxLoaded = new L.GPX(data, {
          async: true,
          marker_options: {
              wptIconUrls: {
                  '': 'markers/pin-icon-wpt.png',
              },
              startIconUrl: 'markers/pin-icon-start.png',
              endIconUrl: 'markers/pin-icon-end.png',
              shadowUrl: 'markers/pin-shadow.png'
          }
        }).on('loaded', (e) => {

          const gpx = e.target;
          this.name = `${gpx.get_name()}`;
          this.distance = `${Math.round((gpx.get_distance() / 1000) * 100) / 100} km`;
          this.maxElevation = `${Math.round(gpx.get_elevation_max() * 100) / 100} m`;
          const hours = Math.round((gpx.get_total_time() / 3600000) * 100) / 100;
          const minutes = Math.ceil((hours - Math.floor(hours)) * 60);
          this.time = `${Math.floor(hours)} horas y ${minutes} minutos`;

          this.map.fitBounds(gpx.getBounds());
        }).addTo(this.map);

        window.localStorage.setItem('gpx', data);
      },
      checkLocation() {
        if (!this.locationActive) {
          this.locationActive = true;
          this.colorNavigation = 'red darken-1';
          this.initializeLocator();
        } else {
          this.locationActive = false;
          this.colorNavigation = 'teal accent-4';
          this.map.stopLocate();
          if (this.map.hasLayer(this.circles) && this.map.hasLayer(this.marker)) {
              this.map.removeLayer(this.circles);
              this.map.removeLayer(this.marker);
          }
        }
      },
      onLocationFound(e) { // Adquisicion de la altitud y el tiempo:
// https://leafletjs.com/reference-1.7.1.html#locationevent-altitude

          let radius = e.accuracy / 2;
          if (this.map.hasLayer(this.circles) && this.map.hasLayer(this.marker)) {
              this.map.removeLayer(this.circles);
              this.map.removeLayer(this.marker);
          }
          this.marker = new L.Marker(e.latlng, { draggable: true });
          this.circles = new L.circle(e.latlng, radius);
          this.circles
              .bindPopup(`You are less than ${radius} meters from this point`)
              .openPopup();
          this.map.addLayer(this.marker);
          this.map.addLayer(this.circles);
          // console.log('time:', new Date(e.timestamp).toISOString());
          // console.log('elevation', e.altitude);
          // console.log(`Lat: ${e.latlng.lat}, Lng: ${e.latlng.lng}`);
          if (this.isNavigating) {
            this.polyline.addLatLng(e.latlng);
            this.lastTime = e.timestamp;
            this.addPointToTrack(e.latlng, e.altitude, new Date(e.timestamp).toISOString());
            // console.log(this.dataTrack);
          }
      },
      initializeLocator() {

        this.map.locate({
            // setView: true,
            // maxZoom: 16,
            watch: true,
            timeout: 5000
        });
        
        this.map.on('locationfound', this.onLocationFound);
      },
      startTrackAcquisition(arrayPolyline = [], dataTrack = '') {

        if (!this.isNavigating) {
          this.isNavigating = true;
          this.color = 'red darken-1';

          if (dataTrack && dataTrack.length !== 0) {
            this.polyline = L.polyline(arrayPolyline, { color: 'red' }).addTo(this.map);
            this.dataTrack = dataTrack;

            const myRegEx = /.*<time>(.*)<\/time>/ig;
            let myMatch = myRegEx.exec(this.dataTrack);
            myMatch[1];
            myMatch = myRegEx.exec(this.dataTrack);
            this.firstTime = Date.parse(myMatch[1]);
            
          } else {
            this.polyline = L.polyline([], { color: 'red' }).addTo(this.map);
            this.dataTrack = track.data();
            this.firstTime = Date.now();
          }

          this.initializeLocator();
        } else {
          this.savingDialog = true;
          this.inputFocus();
        }        
      },
      addPointToTrack(latlng, ele, time) {
        this.dataTrack +=  `
          <trkpt lat="${latlng.lat}" lon="${latlng.lng}">
            <ele>${ele}</ele>
            <time>${time}</time>
          </trkpt>
    `;
      },
      saveData() {
        if(this.nameTrack.length === 0) {
          this.savingDialog = false;
          this.alert = true;
          setTimeout(() => {
            this.alert = false;
          }, 3000);
          return;
        }
        this.isNavigating = false;
        this.color = 'teal accent-4';
        this.map.stopLocate();
        if (
          this.map.hasLayer(this.circles)
          && this.map.hasLayer(this.marker)
          && this.map.hasLayer(this.polyline)) {
            this.map.removeLayer(this.circles);
            this.map.removeLayer(this.marker);
            this.map.removeLayer(this.polyline);
            this.polyline = null;
            this.arrayPolyline = [],
            this.firstTime = 0;
            this.lastTime = 0;
            this.lengthTrackInProgress = 0;
            window.localStorage.removeItem('polyline');
            window.localStorage.removeItem('gpxinprogress');
        }
        this.savingDialog = false;
        this.download();
      },
      download() {
        this.dataTrack += `
        </trkseg>
      </trk>
    </gpx>`;

        const positionName = this.dataTrack.indexOf('</name>');
        this.dataTrack = [
          this.dataTrack.slice(0, positionName),
          this.nameTrack,
          this.dataTrack.slice(positionName)
        ].join('');

        const time = new Date().toISOString();
        const positionTime = this.dataTrack.indexOf('</time>');
        this.dataTrack = [
          this.dataTrack.slice(0, positionTime),
          time,
          this.dataTrack.slice(positionTime)
        ].join('');
        
        const blob = new Blob([this.dataTrack], { type: "application/gpx+xml;charset=utf-8" });
        saveAs(blob, `${this.nameTrack.replace(/\s+/g, '_')}.gpx`);
        this.dataTrack = '';
      },
      getLengthOfTrackBeingRecorded() {
        if(!this.polyline) {
          this.trackInProgressDialog = true;
          return;
        };

        let length = 0,  coords = null, coordsArray = this.polyline.getLatLngs();

        for (let i = 0; i < coordsArray.length - 1; i++) {
          coords = coordsArray[i];
          length += coords.distanceTo(coordsArray[i + 1]);
        }
        
        this.lengthTrackInProgress = Math.round((length / 1000) * 100) / 100;
        this.trackInProgressDialog = true;
      },
      inputFocus() {
        setTimeout(() => {          
          this.$refs.autofocus.focus();
        }, 300);
      },
    },
  }
</script>

<!-- 
  LEER FICHERO DESDE EL INPUT EN VUEJS. VER:
  https://stackoverflow.com/questions/54124977/vuejs-input-file-selection-event-not-firing-upon-selecting-the-same-file#54125788
 -->

<!-- 
  CARGAR FICHERO SIN SUBIR AL SEVIDOR. VER:
  https://stackoverflow.com/questions/14446447/how-to-read-a-local-text-file#29176118

  INTRODUCTION TO THE CACHE STORAGE (A NEW BROWSER CACHE) PWA API. VER:
  https://blog.bitsrc.io/introduction-to-the-cache-storage-a-new-browser-cache-pwa-api-a5d7426a2456
 -->

<!-- 
  DAR ESTILO A IN INPUT TYPE=FILE. VER:
  https://stackoverflow.com/questions/5813344/how-to-customize-input-type-file#5813384
 -->

<!-- DIBUJAR UNA POLILINEA SIGUIENDO EL MARCADOR DE POSICION. VER:
  https://stackoverflow.com/questions/46972528/draw-a-polyline-that-follows-moving-marker-in-leaflet
-->

<!-- 
  CREACIÓN DE UNA APLICACIÓN DE MAPAS DE FOLLETOS PARA GENERAR TRACKS GPX: MARCADORES Y POLILÍNEAS. VER:
  https://peter-thomson.com/leaflet-map-tutorial/tutorial-creating-a-leaflet-maps-application-to-generate-gpx-tracks-markers-and-polylines.html
 -->

<!-- 
  CREAR Y GUARDAR UN FICHERO EN JAVASCRIPT. VER:
  https://stackoverflow.com/questions/13405129/javascript-create-and-save-file

  https://stackoverflow.com/questions/2897619/using-html5-javascript-to-generate-and-save-a-file
  https://stackoverflow.com/questions/12718210/how-to-save-file-from-textarea-in-javascript-with-a-name
-->

<!-- 
  EXPORTACION DE MODULOS Y SUS PROBLEMAS. VER:
  https://stackoverflow.com/questions/36261225/why-is-export-default-const-invalid
 -->

 <!-- 
   INSERTING STRING AT POSITION X OF ANOTHER STRING. VER:
   https://stackoverflow.com/questions/4364881/inserting-string-at-position-x-of-another-string/4364902

   HOW TO GET LEAFLET POLYLINE SEGMENT LENGTH?. VER:
   https://gis.stackexchange.com/questions/261702/how-to-get-leaflet-polyline-segment-length

   GETLATLONS. VER:
   https://leafletjs.com/reference-1.7.1.html#polyline-getlatlngs

   MEDIDA DE LA LONGITUD DE UNA POLINEA. VER:
   https://github.com/danimt/Leaflet.PolylineMeasuredDistance/blob/master/L.Polyline.measuredDistance.js

   HOW TO REPLACE WHITE SPACE INSIDE A STRING IN JAVASCRIPT. VER:
   https://flaviocopes.com/how-to-replace-whitespace-javascript/#:~:text=The%20%5Cs%20meta%20character%20in,occurrence%20of%20the%20white%20space.
  -->
 
<!-- ############################################################################# -->

<!-- 
  https://vuetifyjs.com/en/styles/spacing/#how-it-works
  https://stackoverflow.com/questions/51038082/vuetify-js-how-to-get-full-width-of-v-container

  VUE CLEAR LOCALSTORAGE DATA WHEN CLOSING BROWSER WINDOW. VER:
  https://www.programmersought.com/article/7251252162/

  INTRODUCTION TO THE CACHE STORAGE (A NEW BROWSER CACHE) PWA API. VER:
  https://blog.bitsrc.io/introduction-to-the-cache-storage-a-new-browser-cache-pwa-api-a5d7426a2456
 -->

 <!-- 
  LIMITAR EL NUMERO DE ENTRADAS DE UNA CACHE. VER:
  https://pablomagaz.com/blog/escribiendo-service-workers-con-workbox
  -->

<!-- 
  FileSaver.js. VER:
  https://github.com/eligrey/FileSaver.js/

  https://stackoverflow.com/questions/3665115/how-to-create-a-file-in-memory-for-user-to-download-but-not-through-server
  https://stackoverflow.com/questions/13405129/javascript-create-and-save-file
  https://stackoverflow.com/questions/2897619/using-html5-javascript-to-generate-and-save-a-file
 -->
 
<!-- ############################################################################# -->

<!-- 
  NOTA-1: LA PETICION FETCH "OBLIGA", CUANDO LA CACHE HA SIDO ELIMINADA, A GUARDAR EN CACHE EL RESULTADO DE LA PETICION (REQUEST) -RECORDEMOS QUE LA CACHE DE TRACKS USA LA ESTRATEGIA "CACHEFIRST" EN EL SERVICE-WORKER CON IDEA DE QUE NO SE MUESTRE NUNCA LO QUE ESTA ALMACENADO EN EL SERVIDOR Y SIEMPRE SE HAGA LA RESPUESTA A LA PETICION CON LO QUE ESTA EN CACHE-. PERO CUANDO SE SUBE UN FICHERO DE TRACK, PREVIAMENTE SE HA ELIMINADO LA CACHE DE TRACKS CON LO QUE SE BAJA INMEDIATAMENTE LO QUE SE HA SUBIDO AL SERVIDOR, QUE POR ESTE MECANISMO MENCIONADO DE COMBINACION DE CACHEFIRST Y ELIMINACION INMEDIATA DE LA CACHE ANTES DE LA PETICION, LOS USUARIOS SOLO VERAN LOS TRACKS QUE ELLOS SUBAN O NINGUNO SI NO HA SUBIDO NINGUN ARCHIVO.
 -->