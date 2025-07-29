const $pkmname = document.getElementById('pokemon-name');
const $canvas = document.getElementById('canvas-preview');
const $palette = document.getElementById('palette');
const $typelist = document.getElementById('type-list');

const $previewcover = document.getElementById('preview-cover');
const $guesscontainer = document.getElementById('guess-container');
const $guessinput = document.getElementById('guess-input');
const $guessbtn = document.getElementById('guess-btn');
const $newbtn = document.getElementById('new-btn');

const $config = document.getElementById('config');

const CONFIG = {
  colorPercentage: true,
  pokemonType: true,
  generations: [0, 1, 2, 3, 4, 5, 6, 7, 8]
}

let response = null;
let guesses = 0;
const genRanges = [151, 100, 135, 107, 156, 72, 88, 96, 120];

function guess() {
  if(!$guessinput.value) return;
  const guesselement = document.getElementsByClassName('guess')[guesses++];
  guesselement.classList.add($guessinput.value == response.name? 'right': 'wrong');
  guesselement.innerHTML = $guessinput.value;

  if($guessinput.value == response.name || guesses >= 5) stopGame();
}

function stopGame() {
  $pkmname.innerHTML = response.name;
  $previewcover.style.opacity = 0;
  $guessinput.setAttribute('disabled', true);
  $guessbtn.setAttribute('disabled', true);
  $newbtn.disabled = false;
}

function loadConfig() {
  const config_cp = (localStorage.getItem('config-color-percentage') == 'true') ?? CONFIG.colorPercentage;
  if(CONFIG.colorPercentage !== config_cp) {
    CONFIG.colorPercentage = config_cp;
    document.getElementById('color-percentage-input').checked = config_cp;
    if(response) {
      renderPalette(response.sprite.default);
    }
  }
  
  const config_pt = (localStorage.getItem('config-pokemon-type') == 'true') ?? CONFIG.pokemonType;
  if(CONFIG.pokemonType !== config_pt) {
    CONFIG.pokemonType = config_pt;
    $typelist.setAttribute('visible', config_pt);
    document.getElementById('pokemon-type-input').checked = config_pt;
  }
  
  const config_ge = localStorage.getItem('config-generation');
  if(config_ge !== null && CONFIG.generations !== config_ge.split(',').filter(g => g).map(g => Number(g))) {
    CONFIG.generations = config_ge.split(',').filter(g => g).map(g => Number(g));
  }
}

function closeConfig() {
  $config.setAttribute('disabled', true);

  const config_cp = document.getElementById('color-percentage-input').checked;
  localStorage.setItem('config-color-percentage', config_cp);
  const config_pt = document.getElementById('pokemon-type-input').checked;
  localStorage.setItem('config-pokemon-type', config_pt);

  const $genlist = document.getElementById('generation-list');
  let genlist = [];
  [...$genlist.querySelectorAll('.config-toggle')].forEach(genElement => {
    if(genElement.hasAttribute('enabled')) genlist.push(genElement.dataset.gen);
  });
  localStorage.setItem('config-generation', genlist.join(','));

  loadConfig();
}

function openConfig() {
  $config.removeAttribute('disabled');
}

function getPalette(imgData) {
  const palette = {};
  const MAXDARK = 20;
  for(let i=0; i < imgData.length; i += 4) {
    if(imgData[i+3] == 0) continue;
    if(imgData[i] <= MAXDARK && imgData[i+1] <= MAXDARK && imgData[i+2] <= MAXDARK) continue;

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

  image.onerror = load;
  image.onload = () => {
    $canvas.width = image.width;
    $canvas.height = image.height;
    const ctx = $canvas.getContext("2d");
    ctx.drawImage(image, 0, 0);

    const palette = getPalette(ctx.getImageData(0, 0, $canvas.width, $canvas.height).data);

    let gradientacc = 0;
    const gradient = Object.keys(palette).map(color => {
      let acc = CONFIG.colorPercentage? palette[color]: 100 / Object.keys(palette).length
      gradientacc += acc;
      return `${color} ${gradientacc - acc + 0.01}%, ${color} ${gradientacc}%`;
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
  $guesscontainer.setAttribute('disabled', true);
  
  let rnd_pokemon = null;
  while(!rnd_pokemon) {
    try {
      const maxuid = genRanges.filter((_, g) => CONFIG.generations.includes(g)).reduce((a, b) => a + b, 0);
      if(maxuid <= 0) rnd_pokemon = PokemonAPI.getMissingNo();
      else {
        let rnd_number = Math.floor(Math.random() * (maxuid - 1)) + 1;
        if(maxuid != PokemonAPI.getPokemonCount()) {
          let acc = 0;
          for(let gen in genRanges) {
            let range = genRanges[gen];
            if(!CONFIG.generations.includes(Number(gen))) rnd_number += range;
            else if(rnd_number < (range + acc)) break;
            acc += range;
          }
        }
        rnd_pokemon = await PokemonAPI.getPokemon(rnd_number);
      }
    }
    catch {}
  }

  $guessinput.removeAttribute('disabled');
  $guessbtn.removeAttribute('disabled');
  $guesscontainer.removeAttribute('disabled');
  $previewcover.style.opacity = 1;
  $pkmname.innerHTML = '';

  guesses = 0;
  [...document.getElementsByClassName('guess')].forEach(e => {
    e.innerHTML = '';
    e.classList.remove('right', 'wrong');
  });

  response = rnd_pokemon;
  renderPalette(rnd_pokemon.sprite.default);
  fillTypes(rnd_pokemon.typeBadges);

  $newbtn.disabled = false;
}

function fillDatalist() {
  const $datalist = document.getElementById('pokemonlist');
  POKEMONNAMES.forEach(pkm => {
    const option = document.createElement('OPTION');
    option.value = pkm;
    option.innerHTML = pkm;
    $datalist.appendChild(option);
  });
}

function fillGenerations() {
  const $genlist = document.getElementById('generation-list');
  ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX'].forEach((gen, index) => {
    const genOption = document.createElement('SPAN');

    genOption.classList.add('config-toggle');
    if(CONFIG.generations.includes(index)) genOption.setAttribute('enabled', true);
    genOption.innerHTML = `Gen ${gen}`;
    genOption.dataset.gen = index;

    genOption.onclick = () => {
      genOption.toggleAttribute('enabled');
    }

    $genlist.appendChild(genOption);
  });
}

loadConfig();

fillDatalist();
fillGenerations();

load();