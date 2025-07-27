const $pkmname = document.getElementById('pokemon-name');
const $canvas = document.getElementById('canvas-preview');
const $palette = document.getElementById('palette');
const $typelist = document.getElementById('type-list');

const $previewcover = document.getElementById('preview-cover');
const $guesscontainer = document.getElementById('guess-container');
const $guessinput = document.getElementById('guess-input');
const $newbtn = document.getElementById('new-btn');

let response = '';
let guesses = 0;

function guess() {
  if(!$guessinput.value) return;
  const guesselement = document.getElementsByClassName('guess')[guesses++];
  guesselement.classList.add($guessinput.value == response? 'right': 'wrong');
  guesselement.innerHTML = $guessinput.value;

  if($guessinput.value == response || guesses >= 5) stopGame();
}

function stopGame() {
  $pkmname.innerHTML = response;
  $previewcover.style.opacity = 0;
  $guesscontainer.setAttribute('disabled', true);
  $newbtn.disabled = false;
}

function getPalette(imgData) {
  const palette = {};
  const MAXDARK = 50;
  for(let i=0; i < imgData.length; i += 4) {
    if(imgData[i+3] == 0 || (imgData[i] <= MAXDARK && imgData[i+1] <= MAXDARK && imgData[i+2] <= MAXDARK)) continue;

    const r = imgData[i].toString(16).padStart(2, '0');
    const g = imgData[i+1].toString(16).padStart(2, '0');
    const b = imgData[i+2].toString(16).padStart(2, '0');
    const color = '#' + r + g + b;
    if(color in palette) palette[color]++;
    else palette[color] = 1;
  }

  const pcount = Object.values(palette).reduce((a, b) => a + b);
  return Object.values(palette)
    // .sort((a, b) => a-b)
    .reduce((acc, val) => {
      const percentage = Number((val / pcount * 100).toFixed(0));
      const color = Object.keys(palette)[Object.values(palette).indexOf(val)];
      delete palette[color];
      if(percentage <= 1) return acc;
      return {...acc, ...{[color]: percentage}};
    }, {});
}

function renderPalette(imgsrc) {
  const image = new Image();
  image.crossOrigin = 'Anonymous';
  image.src = imgsrc;

  image.onload = () => {
    $canvas.width = image.width;
    $canvas.height = image.height;
    const ctx = $canvas.getContext("2d");
    ctx.drawImage(image, 0, 0);

    const palette = getPalette(ctx.getImageData(0, 0, $canvas.width, $canvas.height).data);

    let gradientacc = 0;
    const gradient = Object.keys(palette).map(color => {
      gradientacc += palette[color];
      return `${color} ${gradientacc-palette[color]+0.01}%, ${color} ${gradientacc}%`;
    }).join(', ');
    $palette.style.background = `linear-gradient(to right, ${gradient})`;
  }
}

function fillTypes(typeUrl) {
  $typelist.innerHTML = '';
  typeUrl.forEach(turl => {
    const badge = document.createElement('IMG');
    badge.src = turl;
    $typelist.appendChild(badge);
  });
}

async function load() {
  $newbtn.disabled = true;
  $pkmname.innerHTML = ' ';
  
  let rnd_pokemon = null;
  while(!rnd_pokemon) {
    try {
      const maxuid = await PokemonAPI.getPokemonCount();
      rnd_pokemon = await PokemonAPI.getPokemon(Math.floor(Math.random() * maxuid));
    }
    catch {}
  }

  $guesscontainer.removeAttribute('disabled');
  $previewcover.style.opacity = 1;

  guesses = 0;
  [...document.getElementsByClassName('guess')].forEach(e => {
    e.innerHTML = '';
    e.classList.remove('right', 'wrong');
  });

  response = rnd_pokemon.name;
  renderPalette(rnd_pokemon.sprite.default);
  fillTypes(rnd_pokemon.typeBadges);

  $newbtn.disabled = false;
}

function fillDatalist() {
  const $datalist = document.getElementById('pokemonlist');
  POKEMONNAMES.forEach(pkm => {
    const option = document.createElement('option');
    option.value = pkm;
    option.innerHTML = pkm;
    $datalist.appendChild(option);
  });
}

fillDatalist();
load();