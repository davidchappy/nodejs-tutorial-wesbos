import axios from 'axios';
import { $ } from './bling';

let map;

// Get user's coordinates and update map
// navigator.geolocation.getCurrentPosition((posObject) => {
//   if (!map) return;

//   const lat = posObject.coords.latitude;
//   const lng = posObject.coords.longitude;

//   loadPlaces(map, lat, lng);
// });

const mapOptions = {
  center: { lat: 43.2, lng: -79.8 },
  zoom: 8
}

function loadPlaces(map, lat = 20, lng = 20) {
  axios.get(`/api/stores/near?lat=${lat}&lng=${lng}`)
    .then(res => {
      const places = res.data;
      if (!places.length) {
        // alert('no places found!');
        return;
      }

      const bounds = new google.maps.LatLngBounds();
      const infoWindow = new google.maps.InfoWindow();

      const markers = places.map(place => {
        const [placeLng, placeLat] = place.location.coordinates;
        const position = { lat: placeLat, lng: placeLng };
        bounds.extend(position);
        const marker = new google.maps.Marker({ map, position });
        marker.place = place;
        return marker;
      });

      // whenb someone clicks on a marker show the details of that place
      markers.forEach(marker => marker.addListener('click', function() {
        const html = `
          <div class="popup">
            <a href="/stores/${this.place.slug}">
              <img src="/uploads/${this.place.photo || 'store.png'}" alt="${this.place.name}" />
              <p>${this.place.name} - ${this.place.location.address}</p>
            </a>
          </div>
        `;
        infoWindow.setContent(html);
        infoWindow.open(map, this);
      }));

      // then zoom map to markers
      map.setCenter(bounds.getCenter());
      map.fitBounds(bounds);
    });
}

function makeMap(mapDiv) {
  if (!mapDiv) return;
  // make our map
  map = new google.maps.Map(mapDiv, mapOptions);
  loadPlaces(map, mapOptions.center.lat, mapOptions.center.lng);
  const input = $('[name="geolocate"]');
  const autocomplete = new google.maps.places.Autocomplete(input);

  autocomplete.addListener('place_changed', () => {
    const place = autocomplete.getPlace();
    loadPlaces(map, place.geometry.location.lat(), place.geometry.location.lng());
  });
}

export default makeMap;

