interface MenuItem {
  id: number;
  name: string;
  price: number;
}

export async function fetchMenu(): Promise<MenuItem[]> {
  return [
    { id: 1, name: "Pizza", price: 1200 },
    { id: 2, name: "Burger", price: 800 },
    { id: 3, name: "Pasta", price: 1000 },
  ];
}
