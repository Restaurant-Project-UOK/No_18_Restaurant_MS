import { useEffect, useState } from "react";
import { fetchMenu } from "../../api/menu";

export default function Menu() {
  const [menu, setMenu] = useState([]);

  useEffect(() => {
    fetchMenu().then(setMenu);
  }, []);

  return (
    <div>
      <h2>Menu (Dummy)</h2>
      <ul>
        {menu.map(item => (
          <li key={item.id}>{item.name} - රු {item.price}</li>
        ))}
      </ul>
    </div>
  );
}
