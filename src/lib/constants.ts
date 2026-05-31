export interface Book {
  id: string;
  title: string;
  author: string;
  description: string;
  coverUrl: string;
  category: string;
  stock: number;
  availableStock: number;
  rating: number;
  progress?: number;
  status: "Available" | "Borrowed" | "Reading" | "Saved";
  dueContent?: string; // e.g. "Due in 5 days"
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  bookCount: number;
  colorClass: string;
  iconName: string;
}

export const MOCK_CATEGORIES: Category[] = [
  {
    id: "cat-1",
    name: "Science Fiction",
    slug: "science-fiction",
    bookCount: 234,
    colorClass: "bg-blue-500 text-white dark:bg-blue-600",
    iconName: "Rocket",
  },
  {
    id: "cat-2",
    name: "Romance",
    slug: "romance",
    bookCount: 189,
    colorClass: "bg-purple-500 text-white dark:bg-purple-600",
    iconName: "Heart",
  },
  {
    id: "cat-3",
    name: "Business",
    slug: "business",
    bookCount: 156,
    colorClass: "bg-amber-500 text-white dark:bg-amber-600",
    iconName: "Briefcase",
  },
  {
    id: "cat-4",
    name: "Education",
    slug: "education",
    bookCount: 298,
    colorClass: "bg-emerald-500 text-white dark:bg-emerald-600",
    iconName: "GraduationCap",
  },
  {
    id: "cat-5",
    name: "Fiction",
    slug: "fiction",
    bookCount: 445,
    colorClass: "bg-rose-500 text-white dark:bg-rose-600",
    iconName: "Drama",
  },
  {
    id: "cat-6",
    name: "Technology",
    slug: "technology",
    bookCount: 167,
    colorClass: "bg-indigo-500 text-white dark:bg-indigo-600",
    iconName: "Cpu",
  },
];

export const MOCK_BOOKS: Book[] = [
  // Continue Reading
  {
    id: "book-1",
    title: "The Midnight Library",
    author: "Matt Haig",
    description: "Between life and death there is a library, and within that library, the shelves go on forever. Every book provides a chance to try another life you could have lived.",
    coverUrl: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=600&h=900&fit=crop",
    category: "Fiction",
    stock: 5,
    availableStock: 3,
    rating: 4.5,
    progress: 34,
    status: "Reading",
  },
  {
    id: "book-2",
    title: "Atomic Habits",
    author: "James Clear",
    description: "No matter your goals, Atomic Habits offers a proven framework for improving—every day. James Clear, one of the world's leading experts on habit formation, reveals practical strategies.",
    coverUrl: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=600&h=900&fit=crop",
    category: "Business",
    stock: 12,
    availableStock: 8,
    rating: 4.8,
    progress: 75,
    status: "Reading",
  },

  // Featured Books
  {
    id: "book-3",
    title: "Project Hail Mary",
    author: "Andy Weir",
    description: "Ryland Grace is the sole survivor on a desperate, last-chance mission—and if he fails, humanity and the earth itself will perish. Except that right now, he doesn't know that.",
    coverUrl: "https://images.unsplash.com/photo-1440778303588-435521a205bc?q=80&w=600&h=900&fit=crop",
    category: "Science Fiction",
    stock: 3,
    availableStock: 3,
    rating: 4.9,
    status: "Available",
  },
  {
    id: "book-4",
    title: "The Seven Husbands of Evelyn Hugo",
    author: "Taylor Jenkins Reid",
    description: "Aging and reclusive Hollywood movie icon Evelyn Hugo is finally ready to tell the truth about her glamorous and scandalous life. But when she chooses unknown magazine reporter Monique...",
    coverUrl: "https://images.unsplash.com/photo-1518375246756-34b594d6a221?q=80&w=600&h=900&fit=crop",
    category: "Romance",
    stock: 4,
    availableStock: 2,
    rating: 4.7,
    status: "Available",
  },
  {
    id: "book-5",
    title: "Educated",
    author: "Tara Westover",
    description: "An unforgettable memoir about a young girl who, kept out of school, leaves her survivalist family and goes on to earn a PhD from Cambridge University.",
    coverUrl: "https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?q=80&w=600&h=900&fit=crop",
    category: "Biography",
    stock: 6,
    availableStock: 6,
    rating: 4.6,
    status: "Available",
  },
  {
    id: "book-6",
    title: "The Silent Patient",
    author: "Alex Michaelides",
    description: "Alicia Berenson's life is seemingly perfect. A famous painter married to an in-demand fashion photographer, she lives in a grand house with big windows overlooking a park in one of London's most desirable areas.",
    coverUrl: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?q=80&w=600&h=900&fit=crop",
    category: "Thriller",
    stock: 2,
    availableStock: 0,
    rating: 4.4,
    status: "Borrowed",
    dueContent: "Due in 5 days",
  },

  // Trending Now
  {
    id: "book-7",
    title: "Tomorrow, and Tomorrow, and Tomorrow",
    author: "Gabrielle Zevin",
    description: "On a bitter-cold day, in the December of his junior year at Harvard, Sam Masur exits a subway car and sees, amidst the hordes of people waiting on the platform, Sadie Green.",
    coverUrl: "https://images.unsplash.com/photo-1476275466078-4007374efbbe?q=80&w=600&h=900&fit=crop",
    category: "Fiction",
    stock: 5,
    availableStock: 4,
    rating: 4.7,
    status: "Available",
  },
  {
    id: "book-8",
    title: "Spare",
    author: "Prince Harry",
    description: "It was one of the most searing images of the twentieth century: two young boys, two princes, walking behind their mother's coffin as the world watched in sorrow and horror.",
    coverUrl: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=600&h=900&fit=crop",
    category: "Biography",
    stock: 8,
    availableStock: 5,
    rating: 4.3,
    status: "Available",
  },
  {
    id: "book-9",
    title: "The Wager",
    author: "David Grann",
    description: "A page-turning story of shipwreck, survival, and savagery, culminating in a court martial that reveals a deeper truth about the nature of empire.",
    coverUrl: "https://images.unsplash.com/photo-1495640388908-05fa85288e61?q=80&w=600&h=900&fit=crop",
    category: "History",
    stock: 3,
    availableStock: 1,
    rating: 4.8,
    status: "Available",
  },
  {
    id: "book-10",
    title: "Happy Place",
    author: "Emily Henry",
    description: "Harriet and Wyn have been the perfect couple since they met in college—they go together like salt and pepper, honey and tea, lobster and rolls. Except, now—for reasons they're still not discussing—they don't.",
    coverUrl: "https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=600&h=900&fit=crop",
    category: "Romance",
    stock: 5,
    availableStock: 5,
    rating: 4.5,
    status: "Available",
  },
];
