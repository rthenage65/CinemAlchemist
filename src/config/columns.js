import { lowerToTitle } from '../utils/movieUtils';

// eslint-disable-next-line
String.prototype.replaceAt = function(index, replacement) {
  return this.substring(0, index) + replacement + this.substring(index + replacement.length);
};

const afiTypes = [
  "animation",
  "courtroom_drama",
  "epic",
  "fantasy",
  "gangster",
  "mystery",
  "romantic_comedy",
  "science_fiction",
  "sports",
  "western",
  "musicals",
  "scores",
  "heroes",
  "villains",
  "cheers",
  "laughs",
  "passions",
  "quotes",
  "songs",
  "thrills",
].map(type=>`afi_${type}_rank`);

const Columns = {
  poster_path: {
    displayName: 'Image',
    quantifiable: false,
    weighable: false,
    type: "image",
  },
  title: {
    displayName: 'Title',
    quantifiable: false,
    weighable: false,
    type: "string",
    bold: true,
  },
  release_date: {
    displayName: 'Year',
    quantifiable: false,
    weighable: true,
    type: "number",
    date:true,
    subType: "ambiguous", // means that there may be specific target ranges that are desired, not just a high or low number
    defaultWeights: [
      {breakpoint: "lowest", weight: 3},
      {breakpoint: "highest", weight: 3},
    ],
  },
  watched: {
    displayName: 'Watched Year (or 0)',
    quantifiable: false,
    weighable: true,
    inPersonalSettings: true,
    type: "number",
    date:true,
    subType: "ambiguous", // means that there may be specific target ranges that are desired, not just a high or low number
    defaultWeights: [
      {breakpoint: 0, weight: 0},
      {breakpoint: 2013, weight: -0.1},
      {breakpoint: 2017, weight: -1},
      {breakpoint: 2019, weight: -3},
      {breakpoint: 2020, weight: -6},
      {breakpoint: 2021, weight: -12},
      {breakpoint: 2022, weight: -25},
      {breakpoint: 2023, weight: -50},
      {breakpoint: 2024, weight: -100},
    ],
  },
  runtime: {
    displayName: 'Runtime',
    quantifiable: false,
    weighable: true,
    type: "number",
    minutes:true,
    subType: "ambiguous", // means that there may be specific target ranges that are desired, not just a high or low number
    defaultWeights: [
      {breakpoint: "lowest", weight: 3},
      {breakpoint: "highest", weight: 3},
    ],
  },
  genres: {
    displayName: 'Genre',
    quantifiable: false,
    weighable: true,
    type: "list",
    subType: "enum",
    defaultWeights: [
    ],
  },
  vote_average: {
    displayName: 'Rating',
    quantifiable: true,
    weighable: true,
    type: "number",
    defaultWeights: [
      {breakpoint: 0, weight: 0},
      {breakpoint: 10, weight: 0.5},
    ],
  },
  vote_count: {
    displayName: 'Vote Count',
    quantifiable: true,
    weighable: true,
    type: "number",
    thousandsComma:true,
    defaultWeights: [
      {breakpoint: 0, weight: 0},
      {breakpoint: "highest", weight: 0.5},
    ],
  },
  vote_average_imdb: {
    displayName: 'IMdB Rating',
    quantifiable: true,
    weighable: true,
    type: "number",
    defaultWeights: [
      {breakpoint: 0, weight: 0},
      {breakpoint: 10, weight: 5},
    ],
  },
  vote_count_imdb: {
    displayName: 'IMdB Vote Count',
    quantifiable: true,
    weighable: true,
    type: "number",
    thousandsComma:true,
    defaultWeights: [
      {breakpoint: 0, weight: 0},
      {breakpoint: "highest", weight: 4},
    ],
  },
  oscar_wins: {
    displayName: 'Oscar Wins',
    quantifiable: true,
    weighable: true,
    type: "number",
    defaultWeights: [
      {breakpoint: 0, weight: 0},
      {breakpoint: "highest", weight: 3},
    ],
  },
  oscar_nominations: {
    displayName: 'Oscar Nominations',
    quantifiable: true,
    weighable: true,
    type: "number",
    defaultWeights: [
      {breakpoint: 0, weight: 0},
      {breakpoint: "highest", weight: 3},
    ],
  },
  nfr_induction_year: {
    displayName: 'NFR',
    quantifiable: false,
    weighable: true,
    type: "number",
    date:true,
    subType: "ambiguous", // means that there may be specific target ranges that are desired, not just a high or low number
    defaultWeights: [
      {breakpoint: 0, weight: 0},
      {breakpoint: "lowest", weight: 3},
      {breakpoint: "highest", weight: 3},
    ],
  },
  afi_rank: {
    displayName: 'AFI',
    quantifiable: false,
    weighable: true,
    type: "number",
    defaultWeights: [
      {breakpoint: 0, weight: 0},
      {breakpoint: "lowest", weight: 3},
      {breakpoint: "highest", weight: 2},
    ],
  },
  ...afiTypes.reduce((acc, propName)=>({
    ...acc, 
    [propName]: {
      displayName: 'AFI '+lowerToTitle(propName.replaceAll("afi_", "").replaceAll("_rank", "").replaceAll("_", " ")),
      quantifiable: false,
      weighable: true,
      type: "number",
      defaultWeights: [
        {breakpoint: 0, weight: 0},
        {breakpoint: "lowest", weight: 3},
        {breakpoint: "highest", weight: 2},
      ],
    }
  }), {}),
  budget: {
    displayName: 'Budget',
    quantifiable: true,
    weighable: true,
    type: "number",
    thousandsComma:true,
    dollarSign:true,
    defaultWeights: [
      {breakpoint: 0, weight: 0},
      {breakpoint: "highest", weight: 3},
    ],
  },
  revenue: {
    displayName: 'Revenue',
    quantifiable: true,
    weighable: true,
    type: "number",
    thousandsComma:true,
    dollarSign:true,
    defaultWeights: [
      {breakpoint: 0, weight: 0},
      {breakpoint: "highest", weight: 3},
    ],
  },
  original_language: {
    displayName: 'Language',
    quantifiable: false,
    weighable: true,
    type: "string",
    subType: "enum",
    defaultWeights: [
    ],
  },
  production_companies: {
    displayName: 'Studios',
    quantifiable: false,
    weighable: true,
    type: "list",
    subType: "enum",
    defaultWeights: [
    ],
  },
  production_countries: {
    displayName: 'Countries',
    quantifiable: false,
    weighable: true,
    type: "list",
    subType: "enum",
    defaultWeights: [
    ],
  },
};

export const mostlyUnwatchedColumnWeights = [
  {"breakpoint": 0, "weight": 0},
  {"breakpoint": 2013, "weight": -0.1},
  {"breakpoint": 2017, "weight": -1},
  {"breakpoint": 2019, "weight": -3},
  {"breakpoint": 2020, "weight": -6},
  {"breakpoint": 2021, "weight": -12},
  {"breakpoint": 2022, "weight": -25},
  {"breakpoint": 2023, "weight": -50},
  {"breakpoint": 2024, "weight": -100}
];

export default Columns;