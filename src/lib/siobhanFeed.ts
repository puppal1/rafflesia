// created: 2026-11-24T13:10:00-08:00 — local educational science news for Siobhan Daily (manga feed)

export type SiobhanArticle = {
  // created: 2026-11-24T13:10:00-08:00
  id: string
  tag: string
  emoji: string
  title: string
  blurb: string
  place: string
  funFact: string
}

/** created: 2026-11-24T13:10:00-08:00 — Oak Park / science club vibe stubs */
export const SIOBHAN_FEED: SiobhanArticle[] = [
  {
    id: 's1',
    tag: 'Local',
    emoji: '🌳',
    title: 'Oak Park trees are secret air filters',
    blurb:
      'Street trees around campus catch dust and cool sidewalks on hot days. Next walk to school: count how many leaves you see moving in the wind.',
    place: 'Oak Park · campus walk',
    funFact: 'One big tree can drink dozens of gallons of water in a summer day!',
  },
  {
    id: 's2',
    tag: 'Space',
    emoji: '🌙',
    title: 'Moon phases this week (look up tonight)',
    blurb:
      'The Moon is not a flashlight — sunlight bounces off it. Sketch the shape you see from your window and compare tomorrow.',
    place: 'Sky over OPUSD',
    funFact: 'We always see the same face of the Moon from Earth.',
  },
  {
    id: 's3',
    tag: 'Lab',
    emoji: '🧪',
    title: 'Kitchen science: density layers',
    blurb:
      'Honey, water, and oil stack because denser liquids sink. Ask a grown-up before you try — then draw the layers like a manga panel.',
    place: 'Home lab (supervised)',
    funFact: 'Density = how much “stuff” is packed into a space.',
  },
  {
    id: 's4',
    tag: 'Earth',
    emoji: '🌋',
    title: 'Why California feels “alive” underfoot',
    blurb:
      'Plate edges slowly grind and slip. That’s why we practice Drop, Cover, Hold On — science + safety are teammates.',
    place: 'Southern California',
    funFact: 'Earthquakes release energy as waves, like ripples in a pond.',
  },
  {
    id: 's5',
    tag: 'Bio',
    emoji: '🦋',
    title: 'Pollinator patrol near Rafflesia Club',
    blurb:
      'Bees and butterflies move pollen so plants can make seeds. Quiet gardens beat loud mowers for bug friends.',
    place: 'School garden / neighborhood',
    funFact: 'Some flowers “advertise” with UV patterns humans can’t see.',
  },
  {
    id: 's6',
    tag: 'Weather',
    emoji: '☁️',
    title: 'Cloud spotting: fluff vs sheet',
    blurb:
      'Puffy cumulus often mean fair weather; flat stratus can mean gray days. Keep a 3-day cloud diary for Siobhán Daily.',
    place: 'Oak Park skies',
    funFact: 'Clouds are tiny water droplets (or ice) floating together.',
  },
  {
    id: 's7',
    tag: 'Energy',
    emoji: '☀️',
    title: 'Sunshine math on the playground',
    blurb:
      'Dark benches heat up faster than light ones. Touch-test with care after recess — that’s absorption in real life.',
    place: 'Playground science',
    funFact: 'Dark colors absorb more light energy as heat.',
  },
  {
    id: 's8',
    tag: 'Water',
    emoji: '💧',
    title: 'Where does sidewalk water go?',
    blurb:
      'After rain, water runs to gutters, then bigger drains. Litter rides along — club cleanup = cleaner creeks.',
    place: 'Neighborhood storm drains',
    funFact: 'Most storm drains lead toward rivers or the ocean, not a magic void.',
  },
]
