import { useEffect, useState } from "react";
import { fetchMenu, MenuItem as APIItem } from "../../api/menu";
import { useCart } from "../../context/CartContext";

interface MenuItem {
  id: number;
  name: string;
  price: number;
  description?: string;
}

export default function Menu() {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const { addToCart } = useCart();

  useEffect(() => {
    fetchMenu().then((items: APIItem[]) => setMenu(items || []));
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">Menu</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {menu.map((item) => (
          <div key={item.id} className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg p-4 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">{item.name}</h3>
              <p className="text-sm text-gray-500 mt-2">{item.description || "Delicious and freshly prepared."}</p>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="text-lg font-semibold text-green-600">රු {item.price}</div>
              <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded" onClick={() => addToCart(item as APIItem, 1)}>Add</button>
            </div>
          </div>
        ))}

        {menu.length === 0 && <p className="text-gray-600">Loading menu...</p>}
      </div>
    </div>
  );
}
