function autocomplete(input, latInput, lngInput) {
  if (!input) return;
  const dropdown = new google.maps.places.Autocomplete(input);

  dropdown.addListener('place_changed', () => {
    const place = dropdown.getPlace();
    const { lat, lng } = place.geometry.location;
    latInput.value = lat();
    lngInput.value = lng();
  })

  // If someone hits enter on the address field, don't submit the form
  input.on('keydown', e => {
    if (e.keyCode === 13) e.preventDefault();
  });
}

export default autocomplete;