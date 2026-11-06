// Direction 3 visual slice: independently loaded artwork with canvas fallbacks.
(function () {
  'use strict';
  const files = {
    city: 'art_prototypes/production_sample/city.webp',
    pilot: 'art_prototypes/production_sample/pilot.webp',
    moth: 'art_prototypes/production_sample/moth.webp'
  };
  const images = {};
  if (typeof Image !== 'undefined') {
    Object.keys(files).forEach(name => {
      const image = new Image();
      image.src = files[name];
      images[name] = image;
    });
  }
  window.kaijuArt = {
    get(name) {
      const image = images[name];
      return image && image.complete && image.naturalWidth > 0 ? image : null;
    }
  };
})();
