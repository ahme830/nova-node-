export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  vendor: string;
  vendorId: string;
  rating: number;
  reviews: number;
  stock: number;
  description: string;
  featured?: boolean;
}

export interface Order {
  id: string;
  date: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total: number;
  items: OrderItem[];
  customer?: string;
  customerId?: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  image: string;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Vendor {
  id: string;
  name: string;
  email: string;
  status: 'pending' | 'approved' | 'rejected';
  revenue: number;
  products: number;
  orders: number;
}

export const categories = [
  { id: '1', name: 'PC & Laptops', key: 'home.category.pc', icon: 'Monitor', count: 234 },
  { id: '2', name: 'Composants', key: 'home.category.components', icon: 'Cpu', count: 456 },
  { id: '3', name: 'Périphériques', key: 'home.category.peripherals', icon: 'Mouse', count: 189 },
  { id: '4', name: 'Gaming', key: 'home.category.gaming', icon: 'Gamepad2', count: 167 },
  { id: '5', name: 'Stockage', key: 'home.category.storage', icon: 'HardDrive', count: 98 },
  { id: '6', name: 'Audio', key: 'home.category.audio', icon: 'Headphones', count: 145 },
];

export const mockProducts: Product[] = [
  {
    id: '1',
    name: 'MacBook Pro 16" M3 Pro',
    price: 2999,
    originalPrice: 3299,
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&h=500&fit=crop',
    category: 'PC & Laptops',
    vendor: 'TechStore Pro',
    vendorId: 'v1',
    rating: 4.8,
    reviews: 234,
    stock: 12,
    description: 'Le MacBook Pro 16 pouces avec puce M3 Pro offre des performances exceptionnelles pour les professionnels créatifs.',
    featured: true,
  },
  {
    id: '2',
    name: 'Dell XPS 15 4K',
    price: 1899,
    image: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=500&h=500&fit=crop',
    category: 'PC & Laptops',
    vendor: 'ComputerWorld',
    vendorId: 'v2',
    rating: 4.6,
    reviews: 189,
    stock: 8,
    description: 'Un ordinateur portable puissant avec un écran 4K époustouflant et des performances de premier ordre.',
    featured: true,
  },
  {
    id: '3',
    name: 'NVIDIA RTX 4090',
    price: 1799,
    originalPrice: 1999,
    image: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=500&h=500&fit=crop',
    category: 'Composants',
    vendor: 'GamersParadise',
    vendorId: 'v3',
    rating: 4.9,
    reviews: 567,
    stock: 5,
    description: 'La carte graphique la plus puissante pour les gamers et créateurs de contenu exigeants.',
    featured: true,
  },
  {
    id: '4',
    name: 'Logitech MX Master 3S',
    price: 99,
    image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500&h=500&fit=crop',
    category: 'Périphériques',
    vendor: 'PeripheralHub',
    vendorId: 'v1',
    rating: 4.7,
    reviews: 423,
    stock: 45,
    description: 'Souris ergonomique premium avec précision exceptionnelle et batterie longue durée.',
  },
  {
    id: '5',
    name: 'Samsung 49" Odyssey G9',
    price: 1499,
    image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500&h=500&fit=crop',
    category: 'Gaming',
    vendor: 'GamersParadise',
    vendorId: 'v3',
    rating: 4.8,
    reviews: 298,
    stock: 7,
    description: 'Écran gaming ultra-large incurvé 240Hz pour une immersion totale.',
    featured: true,
  },
  {
    id: '6',
    name: 'SSD Samsung 990 PRO 2To',
    price: 249,
    image: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=500&h=500&fit=crop',
    category: 'Stockage',
    vendor: 'StorageKing',
    vendorId: 'v2',
    rating: 4.9,
    reviews: 712,
    stock: 34,
    description: 'SSD NVMe ultra-rapide avec vitesses de lecture jusqu\'à 7450 MB/s.',
  },
  {
    id: '7',
    name: 'Sony WH-1000XM5',
    price: 399,
    image: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=500&h=500&fit=crop',
    category: 'Audio',
    vendor: 'AudioElite',
    vendorId: 'v1',
    rating: 4.9,
    reviews: 1024,
    stock: 23,
    description: 'Casque sans fil avec réduction de bruit leader du marché et qualité audio exceptionnelle.',
  },
  {
    id: '8',
    name: 'AMD Ryzen 9 7950X',
    price: 699,
    originalPrice: 799,
    image: 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?w=500&h=500&fit=crop',
    category: 'Composants',
    vendor: 'TechStore Pro',
    vendorId: 'v1',
    rating: 4.8,
    reviews: 445,
    stock: 15,
    description: 'Processeur haute performance 16 cœurs pour les workstations et gaming extrême.',
  },
  {
    id: '9',
    name: 'Razer BlackWidow V4 Pro',
    price: 229,
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&h=500&fit=crop',
    category: 'Gaming',
    vendor: 'GamersParadise',
    vendorId: 'v3',
    rating: 4.7,
    reviews: 356,
    stock: 28,
    description: 'Clavier mécanique gaming premium avec switches optiques et RGB personnalisable.',
  },
  {
    id: '10',
    name: 'ASUS ROG Strix G16',
    price: 1699,
    image: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=500&h=500&fit=crop',
    category: 'Gaming',
    vendor: 'GamersParadise',
    vendorId: 'v3',
    rating: 4.6,
    reviews: 189,
    stock: 11,
    description: 'Ordinateur portable gaming avec RTX 4070 et écran 240Hz pour performances maximales.',
  },
  {
    id: '11',
    name: 'Corsair Vengeance 32GB DDR5',
    price: 159,
    image: 'https://images.unsplash.com/photo-1562976540-1502c2145186?w=500&h=500&fit=crop',
    category: 'Composants',
    vendor: 'ComputerWorld',
    vendorId: 'v2',
    rating: 4.8,
    reviews: 523,
    stock: 67,
    description: 'Mémoire DDR5 haute performance 6000MHz pour gaming et création de contenu.',
  },
  {
    id: '12',
    name: 'iPad Pro 12.9" M2',
    price: 1299,
    image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500&h=500&fit=crop',
    category: 'PC & Laptops',
    vendor: 'TechStore Pro',
    vendorId: 'v1',
    rating: 4.9,
    reviews: 678,
    stock: 19,
    description: 'Tablette professionnelle avec puce M2, écran Liquid Retina XDR et compatibilité Apple Pencil.',
  },
];

export const mockOrders: Order[] = [
  {
    id: 'ORD-2024-001',
    date: '2026-02-25',
    status: 'delivered',
    total: 2999,
    items: [
      { productId: '1', productName: 'MacBook Pro 16" M3 Pro', quantity: 1, price: 2999, image: mockProducts[0].image }
    ],
    customer: 'Jean Dupont',
    customerId: 'c1',
  },
  {
    id: 'ORD-2024-002',
    date: '2026-02-26',
    status: 'shipped',
    total: 1898,
    items: [
      { productId: '3', productName: 'NVIDIA RTX 4090', quantity: 1, price: 1799, image: mockProducts[2].image },
      { productId: '4', productName: 'Logitech MX Master 3S', quantity: 1, price: 99, image: mockProducts[3].image }
    ],
    customer: 'Marie Martin',
    customerId: 'c2',
  },
  {
    id: 'ORD-2024-003',
    date: '2026-02-27',
    status: 'processing',
    total: 1499,
    items: [
      { productId: '5', productName: 'Samsung 49" Odyssey G9', quantity: 1, price: 1499, image: mockProducts[4].image }
    ],
    customer: 'Pierre Bernard',
    customerId: 'c3',
  },
  {
    id: 'ORD-2024-004',
    date: '2026-02-27',
    status: 'pending',
    total: 648,
    items: [
      { productId: '6', productName: 'SSD Samsung 990 PRO 2To', quantity: 1, price: 249, image: mockProducts[5].image },
      { productId: '7', productName: 'Sony WH-1000XM5', quantity: 1, price: 399, image: mockProducts[6].image }
    ],
    customer: 'Sophie Dubois',
    customerId: 'c4',
  },
];

export const mockVendors: Vendor[] = [
  {
    id: 'v1',
    name: 'TechStore Pro',
    email: 'contact@techstore.com',
    status: 'approved',
    revenue: 45670,
    products: 23,
    orders: 156,
  },
  {
    id: 'v2',
    name: 'ComputerWorld',
    email: 'info@computerworld.com',
    status: 'approved',
    revenue: 32450,
    products: 18,
    orders: 98,
  },
  {
    id: 'v3',
    name: 'GamersParadise',
    email: 'hello@gamersparadise.com',
    status: 'approved',
    revenue: 56780,
    products: 31,
    orders: 234,
  },
  {
    id: 'v4',
    name: 'NewTech Store',
    email: 'contact@newtech.com',
    status: 'pending',
    revenue: 0,
    products: 0,
    orders: 0,
  },
];

export const salesData = [
  { month: 'Jan', sales: 12400, orders: 145 },
  { month: 'Fév', sales: 19800, orders: 234 },
  { month: 'Mar', sales: 15600, orders: 189 },
  { month: 'Avr', sales: 22300, orders: 267 },
  { month: 'Mai', sales: 18900, orders: 223 },
  { month: 'Jun', sales: 25400, orders: 298 },
];

export const topProductsData = [
  { name: 'MacBook Pro', sales: 245 },
  { name: 'RTX 4090', sales: 189 },
  { name: 'Samsung G9', sales: 156 },
  { name: 'Sony WH-1000XM5', sales: 134 },
  { name: 'Dell XPS 15', sales: 98 },
];
