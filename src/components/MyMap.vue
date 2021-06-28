<template>
  <v-container class="custom-background" fluid>
    <v-row justify="center">
      <v-file-input
        ref="fileupload"
        dark
        class="input-track rounded-lg mt-2 mx-8"
        label="Seleccionar un archivo de track"
        v-model="track"
      >
      </v-file-input>
      <v-btn class="input-track my-2" rounded small color="primary" dark
        @click="uploadTrack"
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
        <v-btn @click="checkLocation" rounded :color="color" dark block>
          <v-icon class="mr-2">mdi-map-marker-radius</v-icon>
          {{ buttonText }}
        </v-btn>
      </v-col>
    </v-row>
    <v-snackbar bottom right :value="updateExists" :timeout="-1" color="grey darken-3">
      Actualización disponible!! 😀
      <v-btn @click="refreshApp" color="lime darken-1" class="ml-2">
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
    height: 62vh;
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
        bounds: null,
        track: null,
        locationActive: false,
        buttonText: 'Iniciar Navegación',
        color: 'teal accent-4',
        marker: null,
        circles: null,
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
      
      this.bounds =  this.getLastBounds();
      this.initMap();
      this.displayTrack();
      
      window.onbeforeunload = (e) => localStorage
        .setItem('bounds', JSON.stringify(this.map.getBounds()));
    },
    methods: {
      getLastBounds() {
        if(JSON.parse(localStorage.getItem('bounds')) === null) {
          return [[24.9300000311, -19.6], [46.0700000311, 5.6]];
        }
        const customBounds = JSON.parse(localStorage.getItem('bounds'));
        const { _southWest, _northEast } = customBounds;
        return [[_southWest.lat, _southWest.lng], [_northEast.lat, _northEast.lng]];
      },
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
        }).fitBounds(this.bounds);

        L.control.layers(baseMaps).addTo(this.map);
        L.control.scale({ options: { position: 'bottomleft', metric: true } }).addTo(this.map);
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
                  this.displayTrack();
                  this.track = null; // reset input file
                  // localStorage.setItem('track_caching', 'true');
              });
      },
      displayTrack() {
        
        let data;
        fetch(process.env.VUE_APP_DOWNLOAD)
          .then(res => res.ok ? res.text() : Promise.reject(res))
          .then(data => {
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
          this.buttonText = 'Inciar Navegación';
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
  https://vuetifyjs.com/en/styles/spacing/#how-it-works
  https://stackoverflow.com/questions/51038082/vuetify-js-how-to-get-full-width-of-v-container

  VUE CLEAR LOCALSTORAGE DATA WHEN CLOSING BROWSER WINDOW. VER:
  https://www.programmersought.com/article/7251252162/
 -->