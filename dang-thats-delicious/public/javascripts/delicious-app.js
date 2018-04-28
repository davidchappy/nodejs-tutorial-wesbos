import '../sass/style.scss';

import { $, $$ } from './modules/bling';
import autocomplete from './modules/autocomplete';

document.addEventListener('DOMContentLoaded', function(event) {
  autocomplete( $('#address'), $('#lat'), $('#lng') );
});
