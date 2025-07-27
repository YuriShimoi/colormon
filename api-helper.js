class PokemonClass {
  constructor(raw) {
    this.raw = raw;
  }

  get name() {
    return this.raw.name;
  }

  get sprite() {
    let defaultsprite = this.raw.sprites['front_default'];
    if('generation-v' in this.raw.sprites.versions
    && 'black-white' in this.raw.sprites.versions['generation-v']
    && 'front_default' in this.raw.sprites.versions['generation-v']['black-white']
    && this.raw.sprites.versions['generation-v']['black-white']['front_default'] !== null) {
      defaultsprite = this.raw.sprites.versions['generation-v']['black-white']['front_default'];
    }
    let animatedsprite = '';
    if('generation-v' in this.raw.sprites.versions
    && 'black-white' in this.raw.sprites.versions['generation-v']
    && 'animated' in this.raw.sprites.versions['generation-v']['black-white']) {
      animatedsprite = this.raw.sprites.versions['generation-v']['black-white']['animated']['front_default']??defaultsprite;
    }
    let iconsprite = '';
    if('generation-vii' in this.raw.sprites.versions
    && 'icons' in this.raw.sprites.versions['generation-vii']
    && 'front_default' in this.raw.sprites.versions['generation-vii']['icons']) {
      iconsprite = this.raw.sprites.versions['generation-vii']['icons']['front_default'];
    }
    let drawsprite = '';
    if('official-artwork' in this.raw.sprites.other
    && 'front_default' in this.raw.sprites.other['official-artwork']) {
      drawsprite = this.raw.sprites.other['official-artwork']['front_default'];
    }
    let svgsprite = '';
    if('dream_world' in this.raw.sprites.other
    && 'front_default' in this.raw.sprites.other['dream_world']) {
      svgsprite = this.raw.sprites.other['dream_world']['front_default'];
    }
    let sprite3D = '';
    if('home' in this.raw.sprites.other
    && 'front_default' in this.raw.sprites.other['home']) {
      sprite3D = this.raw.sprites.other['home']['front_default'];
    }
    let sprite3Danimated = '';
    if('showdown' in this.raw.sprites.other
    && 'front_default' in this.raw.sprites.other['showdown']) {
      sprite3Danimated = this.raw.sprites.other['showdown']['front_default'];
    }
    return {
      'default': defaultsprite,
      'animated': animatedsprite,
      'icon': iconsprite,
      'draw': drawsprite,
      'svg': svgsprite,
      '3d': sprite3D,
      '3d_animated': sprite3Danimated
    }
  }

  get types() {
    return this.raw.types.map(t => t.type.name);
  }

  get typeBadges() {
    return this.raw.types.map(t => {
      const tnumber = t.type.url.split('/').at(-2);
      return `${PokemonAPI.TYPEBASEURL}${tnumber}.png`;
    });
  }

  get stats() {
    return this.raw.stats.map((s, i) => ({
      'name': s.stat.name,
      'base': s.base_stat,
      'effort': s.effort,
      'id': Number(i)
    }));
  }

  colorPalette(sprite=this.sprite.default) {
    return sprite;
  }
}

class PokemonAPI {
  static TYPEBASEURL = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/types/generation-vii/lets-go-pikachu-lets-go-eevee/';

  static async getPokemon(uid) {
    return await fetch(`https://pokeapi.co/api/v2/pokemon/${uid}`, {
      method: 'GET'
    }).then(res => {
      return res.json();
    }).then(info => {
      return new PokemonClass(info);
    });
  }

  static async getList(offset=0, limit=100) {
    return await fetch(`https://pokeapi.co/api/v2/pokemon?offset=${offset}&limit=${limit}`, {
      method: 'GET'
    }).then(res => {
      return res.json();
    });
  }

  static async getPokemonCount() {
    return 1302;
    // the code below works, but for optimizations with the pokemon name list it is abandoned

    // return await fetch('https://pokeapi.co/api/v2/pokemon/', {
    //   method: 'GET'
    // }).then(res => {
    //   return res.json();
    // }).then(info => {
    //   return info.count;
    // });
  }
}
