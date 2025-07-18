import type { Person } from '@/types'

export const data: Person[] = [
  // Root ancestor (only node without parents - our test case)
  {
    id: 'patriarch',
    rels: {
      spouses: ['matriarch'],
      children: ['john', 'william'],
    },
    data: {
      firstName: 'Richard',
      lastName: 'Smith',
      birthDay: '1920',
      deathDay: '1995',
      gender: 'M',
      avatar: 'https://randomuser.me/api/portraits/men/5.jpg',
    },
  },
  {
    id: 'matriarch',
    rels: {
      spouses: ['patriarch'],
      children: ['john', 'william'],
    },
    data: {
      firstName: 'Elizabeth',
      lastName: 'Smith',
      birthDay: '1925',
      deathDay: '1998',
      gender: 'F',
      avatar: 'https://randomuser.me/api/portraits/women/5.jpg',
    },
  },

  // Second generation
  {
    id: 'john',
    rels: {
      spouses: ['mary'],
      children: ['alice', 'bob'],
      father: 'patriarch',
      mother: 'matriarch',
    },
    data: {
      firstName: 'John',
      lastName: 'Smith',
      birthDay: '1950',
      deathDay: '2000',
      gender: 'M',
      avatar: 'https://randomuser.me/api/portraits/men/10.jpg',
    },
  },
  {
    id: 'mary',
    rels: {
      spouses: ['john'],
      children: ['alice', 'bob'],
      father: 'mary-father',
      mother: 'mary-mother',
    },
    data: {
      firstName: 'Mary',
      lastName: 'Johnson',
      birthDay: '1952',
      gender: 'F',
      avatar: 'https://randomuser.me/api/portraits/women/11.jpg',
    },
  },
  {
    id: 'alice',
    rels: {
      spouses: ['michael'],
      children: ['charlie'],
      father: 'john',
      mother: 'mary',
    },
    data: {
      firstName: 'Alice',
      lastName: 'Smith',
      birthDay: '1975',
      gender: 'F',
      avatar: 'https://randomuser.me/api/portraits/women/20.jpg',
    },
  },
  {
    id: 'bob',
    rels: {
      spouses: ['julia', 'emma'], // Multiple marriages (divorce scenario)
      father: 'john',
      mother: 'mary',
      children: ['lucas', 'mia', 'noah'], // Children from different marriages
    },
    data: {
      firstName: 'Bob',
      lastName: 'Smith',
      birthDay: '1978',
      gender: 'M',
      avatar: 'https://randomuser.me/api/portraits/men/21.jpg',
    },
  },

  // Alice's family
  {
    id: 'michael',
    rels: {
      spouses: ['alice', 'sarah'], // Michael was married before Alice
      children: ['charlie', 'david'], // David from previous marriage
    },
    data: {
      firstName: 'Michael',
      lastName: 'Johnson',
      birthDay: '1973',
      gender: 'M',
      avatar: 'https://randomuser.me/api/portraits/men/30.jpg',
    },
  },
  {
    id: 'charlie',
    rels: {
      father: 'michael',
      mother: 'alice',
    },
    data: {
      firstName: 'Charlie',
      lastName: 'Johnson',
      birthDay: '2000',
      gender: 'M',
      avatar: 'https://randomuser.me/api/portraits/men/40.jpg',
    },
  },

  // Michael's first wife and child from previous marriage
  {
    id: 'sarah',
    rels: {
      spouses: ['michael'],
      children: ['david'],
    },
    data: {
      firstName: 'Sarah',
      lastName: 'Williams',
      birthDay: '1970',
      gender: 'F',
      avatar: 'https://randomuser.me/api/portraits/women/70.jpg',
    },
  },
  {
    id: 'david',
    rels: {
      father: 'michael',
      mother: 'sarah',
    },
    data: {
      firstName: 'David',
      lastName: 'Johnson',
      birthDay: '1995',
      gender: 'M',
      avatar: 'https://randomuser.me/api/portraits/men/71.jpg',
    },
  },

  // Bob's first wife and child
  {
    id: 'julia',
    rels: {
      spouses: ['bob'],
      children: ['lucas'],
    },
    data: {
      firstName: 'Julia',
      lastName: 'Davis',
      gender: 'F',
      birthDay: '1980',
      avatar: 'https://randomuser.me/api/portraits/women/50.jpg',
    },
  },
  {
    id: 'lucas',
    rels: {
      father: 'bob',
      mother: 'julia',
    },
    data: {
      firstName: 'Lucas',
      lastName: 'Smith',
      birthDay: '2010',
      gender: 'M',
      avatar: 'https://randomuser.me/api/portraits/men/60.jpg',
    },
  },

  // Bob's second wife and children
  {
    id: 'emma',
    rels: {
      spouses: ['bob'],
      children: ['mia', 'noah'],
    },
    data: {
      firstName: 'Emma',
      lastName: 'Brown',
      gender: 'F',
      birthDay: '1985',
      avatar: 'https://randomuser.me/api/portraits/women/51.jpg',
    },
  },
  {
    id: 'mia',
    rels: {
      father: 'bob',
      mother: 'emma',
    },
    data: {
      firstName: 'Mia',
      lastName: 'Smith',
      birthDay: '2012',
      gender: 'F',
      avatar: 'https://randomuser.me/api/portraits/women/61.jpg',
    },
  },
  {
    id: 'noah',
    rels: {
      father: 'bob',
      mother: 'emma',
    },
    data: {
      firstName: 'Noah',
      lastName: 'Smith',
      birthDay: '2015',
      gender: 'M',
      avatar: 'https://randomuser.me/api/portraits/men/62.jpg',
    },
  },
  // William's branch (second son of patriarch/matriarch)
  {
    id: 'william',
    rels: {
      spouses: ['grace'],
      children: ['ethan', 'sophie'],
      father: 'patriarch',
      mother: 'matriarch',
    },
    data: {
      firstName: 'William',
      lastName: 'Smith',
      birthDay: '1948',
      gender: 'M',
      avatar: 'https://randomuser.me/api/portraits/men/90.jpg',
    },
  },
  {
    id: 'grace',
    rels: {
      spouses: ['william'],
      children: ['ethan', 'sophie'],
    },
    data: {
      firstName: 'Grace',
      lastName: 'Anderson',
      birthDay: '1950',
      gender: 'F',
      avatar: 'https://randomuser.me/api/portraits/women/91.jpg',
    },
  },
  {
    id: 'ethan',
    rels: {
      spouses: ['jane'],
      children: ['adopted-child'],
      father: 'william',
      mother: 'grace',
    },
    data: {
      firstName: 'Ethan',
      lastName: 'Smith',
      birthDay: '1975',
      gender: 'M',
      avatar: 'https://randomuser.me/api/portraits/men/92.jpg',
    },
  },
  {
    id: 'jane',
    rels: {
      spouses: ['ethan'],
      children: ['adopted-child'],
    },
    data: {
      firstName: 'Jane',
      lastName: 'Smith',
      birthDay: '1978',
      gender: 'F',
      avatar: 'https://randomuser.me/api/portraits/women/95.jpg',
    },
  },

  // Sophie - single mother case (William's daughter)
  {
    id: 'sophie',
    rels: {
      children: ['alex'], // Single mother, father unknown
      father: 'william',
      mother: 'grace',
    },
    data: {
      firstName: 'Sophie',
      lastName: 'Miller',
      birthDay: '1980',
      gender: 'F',
      avatar: 'https://randomuser.me/api/portraits/women/80.jpg',
    },
  },
  {
    id: 'alex',
    rels: {
      mother: 'sophie', // Only mother known
    },
    data: {
      firstName: 'Alex',
      lastName: 'Miller',
      birthDay: '2008',
      gender: 'M',
      avatar: 'https://randomuser.me/api/portraits/men/81.jpg',
    },
  },

  // Ryan - single father case (Mary's brother who married into family)
  {
    id: 'ryan',
    rels: {
      children: ['olivia'],
      spouses: ['mary-sister'], // Was married but spouse died
    },
    data: {
      firstName: 'Ryan',
      lastName: 'Taylor',
      birthDay: '1955',
      gender: 'M',
      avatar: 'https://randomuser.me/api/portraits/men/82.jpg',
    },
  },
  {
    id: 'mary-sister',
    rels: {
      spouses: ['ryan'],
      children: ['olivia'],
      father: 'mary-father',
      mother: 'mary-mother',
    },
    data: {
      firstName: 'Susan',
      lastName: 'Johnson',
      birthDay: '1958',
      deathDay: '2010', // Deceased - creating single father scenario
      gender: 'F',
      avatar: 'https://randomuser.me/api/portraits/women/84.jpg',
    },
  },
  {
    id: 'olivia',
    rels: {
      father: 'ryan',
      mother: 'mary-sister', // Both parents known but mother deceased
    },
    data: {
      firstName: 'Olivia',
      lastName: 'Taylor',
      birthDay: '2005',
      gender: 'F',
      avatar: 'https://randomuser.me/api/portraits/women/83.jpg',
    },
  },

  // Mary's parents (connecting Ryan's family to main tree)
  {
    id: 'mary-father',
    rels: {
      spouses: ['mary-mother'],
      children: ['mary', 'mary-sister'],
    },
    data: {
      firstName: 'Robert',
      lastName: 'Johnson',
      birthDay: '1925',
      deathDay: '1995',
      gender: 'M',
      avatar: 'https://randomuser.me/api/portraits/men/85.jpg',
    },
  },
  {
    id: 'mary-mother',
    rels: {
      spouses: ['mary-father'],
      children: ['mary', 'mary-sister'],
    },
    data: {
      firstName: 'Dorothy',
      lastName: 'Johnson',
      birthDay: '1928',
      deathDay: '2000',
      gender: 'F',
      avatar: 'https://randomuser.me/api/portraits/women/86.jpg',
    },
  },

  // Adopted child scenario (Ethan and Jane's adopted child)
  {
    id: 'adopted-child',
    rels: {
      father: 'ethan', // Adoptive father
      mother: 'jane', // Adoptive mother
    },
    data: {
      firstName: 'Sam',
      lastName: 'Smith',
      birthDay: '2000',
      gender: 'M',
      avatar: 'https://randomuser.me/api/portraits/men/96.jpg',
    },
  },
]
