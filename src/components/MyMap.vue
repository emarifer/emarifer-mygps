<template>
  <v-container class="custom-background" fluid>
    <v-alert
      v-model="alert"
      border="left"
      color="pink lighten-4"
      dismissible
      width="100%"
    >
      No puedes subir el track sin conexión!
    </v-alert>

    <v-row justify="center">
      <v-file-input
        ref="fileupload"
        dark
        class="input-track rounded-lg mt-5 mx-8 px-3"
        label="Seleccionar archivo .gpx"
        v-model="track"
      >
      </v-file-input>
      <v-btn class="input-track my-2" rounded small color="primary" dark
        @click="checkConnection"
      >
        <v-icon class="mr-2">mdi-upload</v-icon>
        Mostrar Track en el Mapa
      </v-btn>
    </v-row>

    <v-row class="second-row">
      <div id="map"></div>
    </v-row>

    <v-row align="center">
      <v-col cols="12">
        <v-btn @click="checkLocation" rounded small :color="color" dark block>
          <v-icon class="mr-2">mdi-map-marker-radius</v-icon>
          {{ buttonText }}
        </v-btn>
      </v-col>
    </v-row>

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
    height: 100vh;
    background-color: #1D2125;
  }

  .second-row {
    height: 64vh;
  }

  .input-track {
    width: 80vw;
    background-color: #ffffff2d;
  }

  #map {
    width: 100%;
    height: 100%;
  }
</style>

<script>
  import L from 'leaflet';
  import { Icon } from 'leaflet';
  import '../../node_modules/leaflet-gpx/gpx.js';
  import update from '../mixins/update';

  export default {
    name: 'MyMap',
    data() {
      return {
        map: null,
        track: null,
        locationActive: false,
        buttonText: 'Iniciar Navegación',
        color: 'teal accent-4',
        marker: null,
        circles: null,
        alert: false,
        // bounds: null,
      }
    },
    mixins: [update],
    mounted() {
      delete Icon.Default.prototype._getIconUrl;
      Icon.Default.mergeOptions({
          iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
          iconUrl: require('leaflet/dist/images/marker-icon.png'),
          shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
      });
      
      // this.bounds =  this.getLastBounds();
      this.initMap();
      
      if ('caches' in window) {
        caches.has('cache-track')
          .then((bool) => {
            console.log(bool);
            if(bool) this.displayTrack();
          }).catch((err) => {
            console.log(err);
        });       
      }      
      
      // window.onbeforeunload = (e) => localStorage
      //   .setItem('bounds', JSON.stringify(this.map.getBounds()));
    },
    methods: {
      /* getLastBounds() {
        if(JSON.parse(localStorage.getItem('bounds')) === null) {
          return [[24.9300000311, -19.6], [46.0700000311, 5.6]];
        }
        const customBounds = JSON.parse(localStorage.getItem('bounds'));
        const { _southWest, _northEast } = customBounds;
        return [[_southWest.lat, _southWest.lng], [_northEast.lat, _northEast.lng]];
      }, */
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
      checkConnection() {
        if (!navigator.onLine) {
          this.alert = true;
          setTimeout(() => {
            this.alert = false;
          }, 3000);
        } else {
          this.uploadTrack();
        }
      },
      uploadTrack() {
        
        let formData = new FormData();
        formData.append('track', this.track);

        fetch(process.env.VUE_APP_UPLOAD, { // http://localhost:3000/upload
              method: 'POST',
              body: formData // FormData parsea los elementos del formulario
          })
              .then(res => res.ok ? res.json() : Promise.reject(res))
              .then(json => {
                  console.log(json.message);
                  if ('caches' in window) {
                    caches.delete('cache-track')
                      .then((bool) => {
                        console.log(bool, 'clear cache operation') // true
                        this.displayTrack();
                        this.track = null; // reset input file
                      })
                      .catch((err) => {
                        console.log(err);
                      });
                  }
              });
      },
      displayTrack() {

        fetch(process.env.VUE_APP_DOWNLOAD)
          .then(res => res.ok ? res.text() : Promise.reject(res))
          .then(data => { // VER NOTA-1 ABAJO
            // console.log(data);

            new L.GPX(data, {
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
                this.map.fitBounds(e.target.getBounds());
            }).addTo(this.map);
          })
          .catch(err => console.log(err.message));
      },
      checkLocation() {
        if (!this.locationActive) {
          this.locationActive = true;
          this.buttonText = 'Detener Navegación';
          this.color = 'red darken-1';
          this.initializeLocator();
        } else {
          this.locationActive = false;
          this.buttonText = 'Iniciar Navegación';
          this.color = 'teal accent-4';
          this.map.stopLocate();
          if (this.map.hasLayer(this.circles) && this.map.hasLayer(this.marker)) {
              this.map.removeLayer(this.circles);
              this.map.removeLayer(this.marker);
          }
        }
      },
      onLocationFound(e) {

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
    },
  }
</script>

<!-- 
  NOTA-1: LA PETICION FETCH "OBLIGA", CUANDO LA CACHE HA SIDO ELIMINADA, A GUARDAR EN CACHE EL RESULTADO DE LA PETICION (REQUEST) -RECORDEMOS QUE LA CACHE DE TRACKS USA LA ESTRATEGIA "CACHEFIRST" EN EL SERVICE-WORKER CON IDEA DE QUE NO SE MUESTRE NUNCA LO QUE ESTA ALMACENADO EN EL SERVIDOR Y SIEMPRE SE HAGA LA RESPUESTA A LA PETICION CON LO QUE ESTA EN CACHE-. PERO CUANDO SE SUBE UN FICHERO DE TRACK, PREVIAMENTE SE HA ELIMINADO LA CACHE DE TRACKS CON LO QUE SE BAJA INMEDIATAMENTE LO QUE SE HA SUBIDO AL SERVIDOR, QUE POR ESTE MECANISMO MENCIONADO DE COMBINACION DE CACHEFIRST Y ELIMINACION INMEDIATA DE LA CACHE ANTES DE LA PETICION, LOS USUARIOS SOLO VERAN LOS TRACKS QUE ELLOS SUBAN O NINGUNO SI NO HA SUBIDO NINGUN ARCHIVO.
 -->

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