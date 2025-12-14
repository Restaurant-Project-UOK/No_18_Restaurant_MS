import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { TableProvider } from "./context/TableContext";

import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Profile from "./pages/auth/Profile";
import TableSelection from "./pages/TableSelection";
import Menu from "./pages/menu/Menu";
import Order from "./pages/order/Order";

export default function App() {
  return (
    <Router>
      <TableProvider>
        <Routes>
          <Route path="/" element={<TableSelection />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/order" element={<Order />} />
        </Routes>
      </TableProvider>
    </Router>
  );
}
